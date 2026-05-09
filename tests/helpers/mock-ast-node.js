'use strict';

function makeNode(type, text, children, startRow, startCol, endRow, endCol) {
    return {
        type, text,
        children: children || [],
        childCount: (children || []).length,
        startPosition: { row: startRow || 0, column: startCol || 0 },
        endPosition: { row: endRow || 0, column: endCol || 0 },
        hasError: false,
        child(i) { return this.children[i]; },
    };
}

function makeProcNode(name, paramsText, bodyChildren, startRow, endRow) {
    const argsChildren = paramsText
        ? paramsText.split(/\s+/).map(p => makeNode('argument', p, [], startRow, 0, startRow, p.length))
        : [];
    const argsEndCol = startRow !== undefined ? 8 + name.length + paramsText.length : 0;
    return makeNode('procedure', `proc ${name} {${paramsText}} { ... }`, [
        makeNode('simple_word', 'proc', [], startRow, 0, startRow, 4),
        makeNode('simple_word', name, [], startRow, 5, startRow, 5 + name.length),
        makeNode('arguments', paramsText, argsChildren, startRow, 6 + name.length, startRow, argsEndCol),
        makeNode('braced_word', '{ ... }', bodyChildren || [], startRow, argsEndCol + 1, endRow || startRow, 1),
    ], startRow, 0, endRow || startRow, 1);
}

function makeSetNode(varName, valueText, startRow) {
    return makeNode('set', `set ${varName} ${valueText}`, [
        makeNode('simple_word', 'set', [], startRow, 0, startRow, 3),
        makeNode('id', varName, [], startRow, 4, startRow, 4 + varName.length),
        makeNode('simple_word', valueText, [], startRow, 5 + varName.length, startRow, 5 + varName.length + valueText.length),
    ], startRow, 0, startRow, 5 + varName.length + valueText.length);
}

module.exports = { makeNode, makeProcNode, makeSetNode };
