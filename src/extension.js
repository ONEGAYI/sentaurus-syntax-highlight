const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const defs = require('./definitions');
const { registerSdeProviders } = require('./register-sde-providers');
const { registerTclProviders } = require('./register-tcl-providers');
const { registerCompletionProviders, loadDocsJson } = require('./register-completion-providers');
const expressionConverter = require('./commands/expression-converter');
const tclParserWasm = require('./lsp/tcl-parser-wasm');
const astUtils = require('./lsp/tcl-ast-utils');
const undefVarDiagnostic = require('./lsp/providers/undef-var-diagnostic');
const unitAutoClose = require('./lsp/providers/unit-auto-close-provider');
const quoteAutoDelete = require('./lsp/providers/quote-auto-delete-provider');
const variableReferenceProvider = require('./lsp/providers/variable-reference-provider');
const { SchemeParseCache, TclParseCache } = require('./lsp/parse-cache');
const { DOC_LABELS } = require('./docs-loader');
const { registerSnippetCommand } = require('./commands/snippet-picker');
const envVarManager = require('./commands/env-var-manager');
const { createParIndexService } = require('./lsp/sdevicepar/par-index-service');
const { fileURLToPath } = require('url');

/** @type {SchemeParseCache} */
let schemeCache;
/** @type {TclParseCache} */
let tclCache;
let sdeviceStProvider;
/** @type {ReturnType<typeof createParIndexService> | null} */
let parIndexService = null;
/** @type {Map<string, NodeJS.Timeout>} */
let parDebounceTimers = new Map();

function activate(context) {
    const keywordsPath = path.join(__dirname, '..', 'syntaxes', 'all_keywords.json');
    let allKeywords;

    try {
        allKeywords = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
    } catch (err) {
        console.error('Sentaurus TCAD: failed to load keywords', err);
        return;
    }

    const builtinMaterials = new Set(allKeywords.MATERIAL || []);

    // ── 解析缓存初始化 ──────────────────────────
    schemeCache = new SchemeParseCache();
    tclCache = new TclParseCache();

    // ── Tcl WASM 解析器初始化 ─────────────────────
    const tclWasmChannel = vscode.window.createOutputChannel('Sentaurus Tcl WASM');
    tclParserWasm.init(context, tclWasmChannel).then(() => {
        vscode.window.showInformationMessage('Sentaurus: Tcl WASM 解析器初始化成功!');
        undefVarDiagnostic.refreshAll();
    }).catch(err => {
        tclWasmChannel.appendLine(`[ERROR] Tcl WASM 初始化失败: ${err.message}`);
        vscode.window.showWarningMessage(`Sentaurus: Tcl WASM 初始化失败 - ${err.message}`);
    });

    // ── 文件关闭时清理缓存 ──────────────────────────
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            const uri = doc.uri.toString();
            defs.invalidateDefinitionCache(uri);
            schemeCache.invalidate(uri);
            tclCache.invalidate(uri);
            if (sdeviceStProvider) sdeviceStProvider.invalidate(uri);
            if (parIndexService) parIndexService.onFileClosed(uri);
            // Clear pending debounce timer for this document
            const pending = parDebounceTimers.get(uri);
            if (pending) { clearTimeout(pending); parDebounceTimers.delete(uri); }
        })
    );

    // Per-uri debounced pre-heat for sdevicepar ParIndexService
    parDebounceTimers = new Map(); // uri → timer
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.languageId !== 'sdevicepar' || !parIndexService) return;
            const uri = e.document.uri.toString();
            const old = parDebounceTimers.get(uri);
            if (old) clearTimeout(old);
            parDebounceTimers.set(uri, setTimeout(() => {
                parDebounceTimers.delete(uri);
                try { parIndexService.parseCurrentFile(e.document); }
                catch (_) { /* ignore parse errors during debounce */ }
            }, 200));
        })
    );

    // Pre-heat on document open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (doc.languageId !== 'sdevicepar' || !parIndexService) return;
            try { parIndexService.parseCurrentFile(doc); }
            catch (_) { /* ignore */ }
        })
    );

    // 注册测试命令：解析当前文档
    context.subscriptions.push(
        vscode.commands.registerCommand('sentaurus.testTclWasm', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('请先打开一个文件');
                return;
            }

            const langId = editor.document.languageId;

            tclWasmChannel.appendLine(`\n${'='.repeat(60)}`);
            tclWasmChannel.appendLine(`[testTclWasm] 解析文档: ${editor.document.fileName}`);
            tclWasmChannel.appendLine(`  语言: ${langId}`);
            tclWasmChannel.appendLine(`  是否为 Tcl 语言: ${tclParserWasm.isReady() && astUtils.TCL_LANGS.has(langId)}`);
            tclWasmChannel.appendLine(`  解析器状态: ${tclParserWasm.isReady() ? '就绪' : '未初始化'}`);

            if (!tclParserWasm.isReady()) {
                vscode.window.showErrorMessage('Tcl WASM 解析器未初始化，请检查 Output 面板的错误信息');
                return;
            }

            const text = editor.document.getText();
            const result = tclParserWasm.parseWithDebug(text);

            if (result) {
                const statEntries = Object.entries(result.stats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => `${k}(${v})`);
                tclWasmChannel.appendLine(`  解析结果: ${result.rootType}, ${result.childCount} 子节点, 错误: ${result.hasError}`);
                tclWasmChannel.appendLine(`  节点统计: ${statEntries.join(', ')}`);

                if (result.hasError) {
                    vscode.window.showWarningMessage('解析完成但有错误 — 查看详情请打开 Output 面板');
                } else {
                    vscode.window.showInformationMessage(`解析成功! 根节点: ${result.rootType}, ${result.childCount} 子节点`);
                }
                result.tree.delete();
            } else {
                vscode.window.showErrorMessage('解析失败 — 查看 Output 面板');
            }

            tclWasmChannel.show(true);
        })
    );

    // Detect locale for i18n
    const useZh = vscode.env.language.startsWith('zh');
    if (useZh) {
        DOC_LABELS.parameters = '**参数：**';
        DOC_LABELS.example = '**示例：**';
        DOC_LABELS.section = '节：';
        DOC_LABELS.keywords = '关键词：';
    }

    // Unit 自动配对（SPROCESS only）
    unitAutoClose.activate(context);

    // 空引号对自动删除（所有语言）
    quoteAutoDelete.activate(context);

    // ── Tcl Providers ──────────────────────────
    const tclProviderResult = registerTclProviders(context, { tclCache, loadDocsJson });
    sdeviceStProvider = tclProviderResult.sdeviceStProvider;
    const sdeviceLowerToCanon = tclProviderResult.sdeviceLowerToCanon;

    // ── ParIndexService（sdevicepar 上下文补全）──────────────
    parIndexService = createParIndexService({
        extensionPath: context.extensionPath,
        workspaceFolders: vscode.workspace.workspaceFolders || [],
    });

    // PAR 状态栏（必须提前创建，loadConfiguredMaterialDb 和 workspace scan 都需要）
    const parStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
    context.subscriptions.push(parStatusBar);

    // MaterialDB 目录 watcher + existence poller（随配置变更反复创建/销毁）
    let materialDbWatcher = null;
    let materialDbRefreshTimer = null;
    let materialDbPoller = null;          // setInterval ID for existence polling
    let materialDbPollerPath = '';        // 当前轮询的配置路径
    let materialDbPollerExists = false;   // 上一次轮询时路径是否存在
    // Early cleanup: ensure watcher+poller is disposed even if activate() throws later
    context.subscriptions.push({ dispose: () => disposeMaterialDbWatcher() });

    function disposeMaterialDbWatcher() {
        if (materialDbWatcher) {
            materialDbWatcher.dispose();
            materialDbWatcher = null;
        }
        if (materialDbRefreshTimer) {
            clearTimeout(materialDbRefreshTimer);
            materialDbRefreshTimer = null;
        }
        stopExistencePoller();
    }

    function stopExistencePoller() {
        if (materialDbPoller) {
            clearInterval(materialDbPoller);
            materialDbPoller = null;
        }
        materialDbPollerPath = '';
        materialDbPollerExists = false;
    }

    /**
     * 启动低频轮询，检测配置路径的存在性变化。
     * missing → existing: 全量重载 + 创建 watcher
     * existing → missing: dispose watcher + fallback builtin
     */
    function startExistencePoller(dbPath) {
        stopExistencePoller();
        materialDbPollerPath = dbPath;
        // 检测初始状态
        try {
            materialDbPollerExists = fs.statSync(dbPath).isDirectory();
        } catch (_) {
            materialDbPollerExists = false;
        }
        console.log('[SentaurusSyntax][MaterialDB] startExistencePoller — path:', JSON.stringify(dbPath), 'exists:', materialDbPollerExists);

        materialDbPoller = setInterval(() => {
            if (!parIndexService || !materialDbPollerPath) {
                stopExistencePoller();
                return;
            }
            let nowExists;
            try {
                nowExists = fs.statSync(materialDbPollerPath).isDirectory();
            } catch (_) {
                nowExists = false;
            }

            if (nowExists && !materialDbPollerExists) {
                // missing → existing
                console.log('[SentaurusSyntax][MaterialDB] poller detected: missing → existing → reload');
                materialDbPollerExists = true;
                loadConfiguredMaterialDb();
            } else if (!nowExists && materialDbPollerExists) {
                // existing → missing
                console.log('[SentaurusSyntax][MaterialDB] poller detected: existing → missing → fallback builtin');
                materialDbPollerExists = false;
                if (materialDbWatcher) {
                    materialDbWatcher.dispose();
                    materialDbWatcher = null;
                }
                parIndexService.clearMaterialDb();
                parIndexService.loadBuiltinMaterialDb();
                debouncedMaterialDbRefresh();
            }
        }, 7000);
    }

    // ── Phase 2.3: MaterialDB 加载 ────────────────────────────

    const MATERIALDB_CONFIG_CHANGE_KEY = '__materialdb_config_change__';
    const MAX_MATERIALDB_FILES = 200;

    // 加载 MaterialDB（配置路径或内置占位）—— 必须在 preheat 之前，
    // 以确保补全时 materialdb symbols 已就绪
    loadConfiguredMaterialDb();

    // Pre-heat already-open sdevicepar documents at activation
    for (const doc of vscode.workspace.textDocuments) {
        if (doc.languageId === 'sdevicepar' && parIndexService) {
            try { parIndexService.parseCurrentFile(doc); }
            catch (_) { /* ignore */ }
        }
    }

    function loadConfiguredMaterialDb() {
        if (!parIndexService) return;
        disposeMaterialDbWatcher();       // dispose watcher + poller first
        parIndexService.clearMaterialDb(); // then clear index safely

        const materialDbPath = vscode.workspace.getConfiguration('sentaurus').get('materialDbPath', '');
        console.log('[SentaurusSyntax][MaterialDB] loadConfiguredMaterialDb — path:', JSON.stringify(materialDbPath));

        if (materialDbPath) {
            // 非空路径：始终启动 existence poller
            startExistencePoller(materialDbPath);

            try {
                const stat = fs.statSync(materialDbPath);
                console.log('[SentaurusSyntax][MaterialDB] stat succeeded — isDirectory:', stat.isDirectory());
                if (!stat.isDirectory()) {
                    parIndexService.loadBuiltinMaterialDb();
                    return;
                }
                // Normalize path casing on Windows to avoid map key divergence
                const realDbPath = fs.realpathSync(materialDbPath);
                const entries = fs.readdirSync(realDbPath);
                let loaded = 0;
                for (const entry of entries) {
                    if (loaded >= MAX_MATERIALDB_FILES) break;
                    if (!entry.toLowerCase().endsWith('.par')) continue;
                    try {
                        const fullPath = path.join(realDbPath, entry);
                        const text = fs.readFileSync(fullPath, 'utf8');
                        parIndexService.addMaterialDbFile(fullPath, text);
                        if (parIndexService.getMaterialDbFileCount() > loaded) {
                            loaded++;
                        }
                    } catch (_) { /* skip unreadable files */ }
                }
                console.log('[SentaurusSyntax][MaterialDB] loaded files:', loaded);
                if (loaded === 0) {
                    parIndexService.loadBuiltinMaterialDb();
                } else {
                    if (parStatusBar) {
                        parStatusBar.text = `$(database) ${vscode.l10n.t('statusBar.materialdb.loaded', loaded)}`;
                        parStatusBar.show();
                        setTimeout(() => { try { if (parStatusBar) parStatusBar.hide(); } catch(_) {} }, 4000);
                    }
                    // 创建目录内 .par watcher（非递归，增量更新）
                    createMaterialDbWatcher(realDbPath);
                }
            } catch (e) {
                // 路径不存在 — fallback 到 builtin，poller 会持续检测
                console.log('[SentaurusSyntax][MaterialDB] stat FAILED — fallback builtin, poller watching. error:', e.message);
                parIndexService.loadBuiltinMaterialDb();
            }
        } else {
            // 空路径：builtin，无 poller
            console.log('[SentaurusSyntax][MaterialDB] empty path — loading builtin');
            parIndexService.loadBuiltinMaterialDb();
        }
    }

    /**
     * 创建 MaterialDB 目录的 FileSystemWatcher（目录已存在）。
     * 监听 dirPath 下的 *.par 文件增删改，增量更新索引。
     */
    function createMaterialDbWatcher(dirPath) {
        console.log('[SentaurusSyntax][MaterialDB] createMaterialDbWatcher — dirPath:', JSON.stringify(dirPath));

        materialDbWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(dirPath, '*.par')
        );
        materialDbWatcher.onDidCreate(uri => {
            console.log('[SentaurusSyntax][MaterialDB] onDidCreate fired — uri:', uri.toString());
            if (!parIndexService) return;
            try {
                const fp = uriToFsPath(uri);
                const text = fs.readFileSync(fp, 'utf8');
                parIndexService.addMaterialDbFile(fp, text);
                debouncedMaterialDbRefresh();
            } catch (_) {}
        });
        materialDbWatcher.onDidChange(uri => {
            console.log('[SentaurusSyntax][MaterialDB] onDidChange fired — uri:', uri.toString());
            if (!parIndexService) return;
            try {
                const fp = uriToFsPath(uri);
                const text = fs.readFileSync(fp, 'utf8');  // read FIRST
                parIndexService.removeMaterialDbFile(fp);    // then remove
                parIndexService.addMaterialDbFile(fp, text); // then add
                debouncedMaterialDbRefresh();
            } catch (_) {}
        });
        materialDbWatcher.onDidDelete(uri => {
            console.log('[SentaurusSyntax][MaterialDB] onDidDelete fired — uri:', uri.toString());
            if (!parIndexService) return;
            parIndexService.removeMaterialDbFile(uriToFsPath(uri));
            debouncedMaterialDbRefresh();
        });
    }

    function debouncedMaterialDbRefresh() {
        if (materialDbRefreshTimer) clearTimeout(materialDbRefreshTimer);
        materialDbRefreshTimer = setTimeout(() => {
            if (parIndexService) {
                parIndexService.onFileChanged(MATERIALDB_CONFIG_CHANGE_KEY);
                preheatOpenParDocuments();
            }
        }, 500);
    }


    // ── Phase 2.2: Workspace .par 文件扫描 ──────────────────

    function uriToFsPath(uri) {
        try {
            return uri.fsPath;
        } catch (_) {
            try { return fileURLToPath(uri.toString()); }
            catch (_) { return uri.toString(); }
        }
    }

    function preheatOpenParDocuments() {
        for (const doc of vscode.workspace.textDocuments) {
            if (doc.languageId === 'sdevicepar' && parIndexService) {
                try { parIndexService.parseCurrentFile(doc); }
                catch (_) { /* 静默：不阻塞 watcher 处理 */ }
            }
        }
    }

    async function scanWorkspaceParFiles() {
        if (!vscode.workspace.workspaceFolders || !parIndexService) return;
        parIndexService.setWorkspaceScanning(true);
        if (parStatusBar) {
            parStatusBar.text = `$(sync~spin) ${vscode.l10n.t('statusBar.scanning')}`;
            parStatusBar.show();
        }
        try {
            const parFiles = await vscode.workspace.findFiles('**/*.par');
            for (const fileUri of parFiles) {
                try {
                    const text = fs.readFileSync(uriToFsPath(fileUri), 'utf8');
                    parIndexService.addWorkspaceFile(fileUri.toString(), text);
                } catch (e) {
                    // skip unreadable files
                }
            }
        } catch (_) { /* findFiles failed */ }
        parIndexService.setWorkspaceScanning(false);
        if (parStatusBar) {
            const fileCount = parIndexService.getWorkspaceFileCount();
            const missed = parIndexService.consumeWorkspaceCompletionMissed();
            if (missed) {
                parStatusBar.text = `$(info) ${vscode.l10n.t('statusBar.ready.missed')}`;
                parStatusBar.backgroundColor = undefined;
                setTimeout(() => { try { if (parStatusBar) parStatusBar.hide(); } catch(_) {} }, 6000);
            } else {
                parStatusBar.text = `$(check) ${vscode.l10n.t('statusBar.ready.count', fileCount)}`;
                setTimeout(() => { try { if (parStatusBar) parStatusBar.hide(); } catch(_) {} }, 4000);
            }
        }
    }

    // Fire-and-forget: 不阻塞 activate；.catch 防止 unhandled rejection
    scanWorkspaceParFiles().catch(() => {
        parIndexService.setWorkspaceScanning(false);
        if (parStatusBar) parStatusBar.hide();
    });

    // FileSystemWatcher: workspace .par 文件增量更新
    // 使用 500ms debounce 防止批量文件操作（如 git checkout）导致 O(N×M) preheat
    let watcherDebounceTimer = null;
    function debouncedPreheat() {
        if (watcherDebounceTimer) clearTimeout(watcherDebounceTimer);
        watcherDebounceTimer = setTimeout(() => {
            if (parIndexService) preheatOpenParDocuments();
        }, 500);
    }

    const parWatcher = vscode.workspace.createFileSystemWatcher('**/*.par');
    parWatcher.onDidCreate(uri => {
        if (!parIndexService) return;
        try {
            const text = fs.readFileSync(uriToFsPath(uri), 'utf8');
            parIndexService.addWorkspaceFile(uri.toString(), text);
            // 新建文件也可能使已有 #include 从 unresolved 变为 resolved，
            // 因此需要清 currentFileCache 并刷新打开文档。
            parIndexService.onFileChanged(uri.toString());
            debouncedPreheat();
        } catch (_) { /* readFileSync 失败 → 不执行 onFileChanged/preheat */ }
    });
    parWatcher.onDidChange(uri => {
        if (!parIndexService) return;
        try {
            const text = fs.readFileSync(uriToFsPath(uri), 'utf8');
            parIndexService.addWorkspaceFile(uri.toString(), text);
            // onFileChanged 同时清 includeRawCache + currentFileCache
            parIndexService.onFileChanged(uri.toString());
            // 刷新已打开的 .par 文档缓存
            debouncedPreheat();
        } catch (_) { /* readFileSync 失败 → 不执行 onFileChanged/preheat */ }
    });
    parWatcher.onDidDelete(uri => {
        if (!parIndexService) return;
        parIndexService.removeWorkspaceFile(uri.toString());
        // onFileChanged 处理 include 链失效
        parIndexService.onFileChanged(uri.toString());
        debouncedPreheat();
    });
    context.subscriptions.push(parWatcher);

    // 配置变更监听：sentaurus.materialDbPath 变化时重新加载 MaterialDB
    // 不清空 workspaceIndex，只影响 materialDbIndex + current cache
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('sentaurus.materialDbPath')) {
                loadConfiguredMaterialDb();
                if (parIndexService) {
                    parIndexService.onFileChanged(MATERIALDB_CONFIG_CHANGE_KEY);
                    preheatOpenParDocuments();
                }
            }
        })
    );


    // ── Completion/Hover/Definition Providers ──────────────────
    // Must come before registerSdeProviders — builds modeDispatchTable/symbolParamsTable
    // and calls schemeCache.setSymbolConfig internally.
    const completionResult = registerCompletionProviders(context, {
        allKeywords,
        schemeCache,
        tclCache,
        builtinMaterials,
        sdeviceStProvider,
        sdeviceLowerToCanon,
        useZh,
        parIndexService,
    });

    // ── SDE Providers ──────────────────────────
    registerSdeProviders(context, {
        schemeCache,
        modeDispatchTable: completionResult.modeDispatchTable,
        langFuncDocs: completionResult.langFuncDocs,
        builtinMaterials,
    });

    // 未定义变量诊断
    undefVarDiagnostic.activate(context, schemeCache, tclCache);

    // Find All References — 用户自定义变量（全部 6 种语言）
    variableReferenceProvider.activate(context, schemeCache, tclCache, vscode);

    // === Snippet QuickPick Command ===
    context.subscriptions.push({ dispose: () => {
        if (parIndexService) { parIndexService.dispose(); parIndexService = null; }
    } });
    context.subscriptions.push({ dispose: () => {
        for (const t of parDebounceTimers.values()) clearTimeout(t);
        parDebounceTimers.clear();
    } });
    registerSnippetCommand(context);

    // ── 环境变量管理命令 ──────────────────────────
    envVarManager.activateAutoSort(context);
    envVarManager.registerAddEnvVarsCommand(context);
    envVarManager.registerRemoveEnvVarsCommand(context);
    envVarManager.registerExportEnvVarsCommand(context);
    envVarManager.registerImportEnvVarsCommand(context);

    // ── 表达式转换命令 ──────────────────────────
    const HISTORY_KEYS = {
        'sentaurus.scheme2infix': 'convertHistory.s2i',
        'sentaurus.infix2scheme': 'convertHistory.i2s',
    };
    const convertHistories = {};
    for (const [cmd, key] of Object.entries(HISTORY_KEYS)) {
        convertHistories[cmd] = context.globalState.get(key, []);
    }

    async function insertResult(editor, result) {
        if (editor) {
            const cursor = editor.selection.active;
            const success = await editor.edit(builder => {
                builder.insert(cursor, result);
            });
            if (success) {
                const startPos = cursor;
                const endPos = cursor.translate(0, result.length);
                editor.selection = new vscode.Selection(startPos, endPos);
            }
        } else {
            await vscode.env.clipboard.writeText(result);
            vscode.window.showInformationMessage(`已复制到剪贴板: ${result}`);
        }
    }

    function registerConvertCommand(commandId, convertFn, promptText, placeHolder) {
        return vscode.commands.registerCommand(commandId, async () => {
            const editor = vscode.window.activeTextEditor;
            const selection = editor ? editor.selection : null;
            const selectedText = selection && !selection.isEmpty ? editor.document.getText(selection) : '';

            if (selectedText) {
                const { result, error } = convertFn(selectedText);
                if (error) {
                    vscode.window.showErrorMessage(`转换失败: ${error}`);
                    return;
                }
                editor.edit(builder => {
                    builder.replace(selection, result);
                });
                return;
            }

            const history = convertHistories[commandId];
            const isSde = editor && editor.document.languageId === 'sde';
            const userVars = isSde
                ? defs.getDefinitions(editor.document, 'sde')
                    .filter(d => d.kind === 'variable' || d.kind === 'parameter')
                : [];

            const qp = vscode.window.createQuickPick();
            qp.title = promptText;
            qp.placeholder = placeHolder;
            qp.matchOnDescription = false;
            qp.matchOnDetail = false;

            const tracker = new expressionConverter.CursorTracker();
            let _updatingValue = false;
            let _lastWordInfo = null;
            const historyTitle = useZh
                ? `${promptText}  —  !N 精确选中 | ! 文本 模糊过滤`
                : `${promptText}  —  !N select by # | ! text fuzzy filter`;

            function updateItems(value) {
                if (_updatingValue) return;
                const items = [];
                const histParsed = expressionConverter.parseHistoryInput(value);

                if (histParsed) {
                    _lastWordInfo = null;
                    if (qp.title !== historyTitle) qp.title = historyTitle;
                    if (history.length > 0) {
                        items.push({ label: '历史记录', kind: vscode.QuickPickItemKind.Separator });
                        for (let i = 0; i < history.length; i++) {
                            const entry = history[i];
                            if (histParsed.index !== null) {
                                if (i + 1 === histParsed.index) {
                                    items.push({ label: entry, description: `#${i + 1}`, alwaysShow: true, _historyIndex: i });
                                }
                            } else {
                                const filter = histParsed.filter.toLowerCase();
                                if (!filter || entry.toLowerCase().includes(filter)) {
                                    items.push({ label: entry, description: `#${i + 1}`, alwaysShow: true, _historyIndex: i });
                                }
                            }
                        }
                    }
                } else {
                    if (qp.title !== promptText) qp.title = promptText;
                    const cursor = tracker.update(value);
                    _lastWordInfo = expressionConverter.getWordAtPosition(value, cursor);
                    const prefix = _lastWordInfo ? _lastWordInfo.prefix.toLowerCase() : '';

                    if (userVars.length > 0 && prefix) {
                        const variables = userVars.filter(d => d.kind === 'variable' && d.name.toLowerCase().startsWith(prefix));
                        const parameters = userVars.filter(d => d.kind === 'parameter' && d.name.toLowerCase().startsWith(prefix));
                        const shown = [...variables, ...parameters];
                        if (shown.length > 0) {
                            items.push({ label: '用户变量', kind: vscode.QuickPickItemKind.Separator });
                            for (const v of shown) {
                                items.push({
                                    label: v.name,
                                    description: `${v.kind}, 第${v.line}行`,
                                    detail: v.definitionText ? v.definitionText.substring(0, 80) : undefined,
                                    alwaysShow: true,
                                    _varName: v.name,
                                });
                            }
                        }
                    }

                }

                if (!histParsed && value.trim()) {
                    items.push({ label: useZh ? '确认输入' : 'Confirm Input', kind: vscode.QuickPickItemKind.Separator });
                    const preview = convertFn(value);
                    const desc = preview.error
                        ? `⚠ ${preview.error}`
                        : (useZh ? '按 Enter 确认' : 'Press Enter to confirm');
                    items.push({
                        label: value,
                        description: desc,
                        detail: preview.result || undefined,
                        alwaysShow: true,
                        _confirmInput: true,
                    });
                }

                qp.items = items;
            }

            qp.onDidChangeValue(updateItems);
            updateItems('');

            qp.onDidAccept(() => {
                const selected = qp.selectedItems[0];
                let finalValue;

                if (selected && selected._varName) {
                    _updatingValue = true;
                    let insertText;
                    const varName = selected._varName;
                    const hasHyphen = /[-]/.test(varName);

                    if (_lastWordInfo) {
                        if (_lastWordInfo.inAngleBrackets) {
                            const replacement = _lastWordInfo.bracketClosed ? varName : `${varName}>`;
                            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, replacement);
                        } else if (hasHyphen) {
                            const replacement = `<${varName}>`;
                            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, replacement);
                        } else {
                            insertText = expressionConverter.replaceWordAtPosition(qp.value, _lastWordInfo, varName);
                        }
                    } else {
                        insertText = hasHyphen ? qp.value + `<${varName}>` : qp.value + varName;
                    }

                    const newVal = insertText;
                    qp.value = newVal;
                    tracker.sync(newVal);
                    _updatingValue = false;
                    updateItems(newVal);
                    return;
                }

                if (selected && selected._confirmInput) {
                    finalValue = qp.value.trim();
                } else if (selected && selected._historyIndex !== undefined) {
                    finalValue = history[selected._historyIndex];
                } else {
                    const raw = qp.value;
                    const histParsed = expressionConverter.parseHistoryInput(raw);
                    finalValue = histParsed ? raw.slice(1).trim() : raw.trim();
                }

                qp.hide();

                if (!finalValue) return;

                const { result, error } = convertFn(finalValue);
                if (error) {
                    vscode.window.showErrorMessage(`转换失败: ${error}`);
                    return;
                }

                const idx = history.indexOf(finalValue);
                if (idx !== -1) history.splice(idx, 1);
                history.unshift(finalValue);
                if (history.length > 20) history.pop();
                context.globalState.update(HISTORY_KEYS[commandId], history);

                insertResult(editor, result);
            });

            qp.onDidHide(() => {
                tracker.reset();
                qp.dispose();
            });
            qp.show();
        });
    }

    context.subscriptions.push(
        registerConvertCommand(
            'sentaurus.scheme2infix',
            expressionConverter.prefixToInfix,
            '输入 Scheme 前缀表达式，转换为中缀格式',
            '输入 ! 浏览历史 | 例: (+ (/ W 2) (/ L 2))'
        ),
        registerConvertCommand(
            'sentaurus.infix2scheme',
            expressionConverter.infixToPrefix,
            '输入中缀表达式，转换为 Scheme 前缀格式',
            '输入 ! 浏览历史 | <连字符变量> | 例: (<W-doping>/2 + <L-length>/2)'
        ),
    );

    // ── 表达式帮助命令 ──────────────────────────
    const helpDisposable = vscode.commands.registerCommand('sentaurus.exprHelp', async () => {
        const categories = expressionConverter.getSupportedOperators();
        const items = [];
        for (const cat of categories) {
            items.push({ label: cat.category, kind: vscode.QuickPickItemKind.Separator });
            for (const item of cat.items) {
                items.push({
                    label: `${item.scheme} ↔ ${item.infix}`,
                    description: item.description,
                    detail: `示例: ${item.example_scheme} ↔ ${item.example_infix}`,
                });
            }
        }
        items.push({ label: '格式说明', kind: vscode.QuickPickItemKind.Separator });
        items.push({
            label: '算术运算 → 中缀',
            description: '符号前置 → 符号居中',
            detail: '(+ a b) → a + b,  (* a b) → a * b,  (expt a b) → a ^ b',
        });
        items.push({
            label: '数学函数 → 函数调用',
            description: '括号前置 → 函数名(参数)',
            detail: '(sin x) → sin(x),  (min a b c) → min(a, b, c)',
        });
        items.push({
            label: '输入增强',
            description: 'SDE 文件变量补全与历史记录',
            detail: 'SDE 文件中输入时自动显示用户变量 | 输入 ! 进入历史模式 | !3 直接选 #3 | ! 文本 过滤历史',
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '支持的运算符和函数 — 选中可插入代码片段',
            matchOnDescription: true,
            matchOnDetail: true,
        });
        if (!selected || selected.kind) return;

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const detail = selected.detail || '';
            const schemeExample = detail.match(/示例: ([^(↔]+)/);
            if (schemeExample) {
                editor.edit(builder => {
                    builder.insert(editor.selection.active, schemeExample[1].trim());
                });
            }
        }
    });
    context.subscriptions.push(helpDisposable);

    // ── 帮助文档命令 ──────────────────────────
    const { register: registerHelpReader } = require('./commands/help-reader');
    registerHelpReader(context);
}

function deactivate() {
    schemeCache.dispose();
    tclCache.dispose();
    if (sdeviceStProvider) sdeviceStProvider.dispose();
    defs.clearDefinitionCache();
    tclParserWasm.dispose();
}

module.exports = { activate, deactivate };
