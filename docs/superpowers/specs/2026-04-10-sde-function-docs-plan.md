# SDE 函数文档添加计划

> **状态：已完成** — 2026-04-10
>
> KEYWORD1 覆盖率：**400/400 (100%)**，文档总条目：**405**（含 5 个额外 sdeio 函数）
>
> 输出文件：`syntaxes/sde_function_docs.json`

## 目标

为 SDE 的 KEYWORD1（400 个 API 函数）添加函数签名、参数说明和示例代码，
同时支持 **Hover 悬停提示** 和 **Completion 补全文档**。

## 数据源

- 参考文档：`references/sense_ug_N-2017.09.pdf.md`
- 关键词列表：`syntaxes/all_keywords.json` → `sde.KEYWORD1`
- 输出文件：`syntaxes/sde_function_docs.json`

## 范围说明

| 类别 | 数量 | 是否处理 |
|------|------|---------|
| KEYWORD1（SDE API 函数） | 400 | **已完成** ✅ |
| FUNCTION（Scheme 内置） | 204 | 否（见下方分析） |
| 其他类别 | 2442 | 否 |

## FUNCTION 内置函数分析

SDE 的 204 个 FUNCTION 是 **Scheme 语言内置函数**（`define`、`lambda`、`if`、`map` 等），
而 sprocess/inspect/sinterconnect/spptcl 的 FUNCTION 是 **Tcl 内置函数**
（`proc`、`while`、`glob`、`switch` 等）——两种语言完全不同，**不可复用**。

仅 10 个函数名在所有 5 种语言中同时存在：
`append`, `catch`, `else`, `eval`, `exit`, `if`, `list`, `load`, `read`, `string`

但这些同名函数在 Scheme 和 Tcl 中的语法和语义完全不同（例如 Scheme 的 `if` 是 S-expression
`(if test then else)`，Tcl 的是命令式 `if {test} {body} {else}`），因此**文档不能跨语言复用**。

Scheme 内置函数属于通用编程知识，无需从 Sentaurus 文档提取。如需添加，应引用
Scheme 语言标准文档（R5RS/R7RS），而非 Sentaurus 特定参考。

## 分批计划（共 7 批）

### Batch 1 — sdegeo:create-* + 基础几何 (25 个)

> 已完成 `sdegeo:create-rectangle` 作为格式验证

- `sdegeo:create-circle`, `sdegeo:create-cone`, `sdegeo:create-cuboid`,
  `sdegeo:create-cylinder`, `sdegeo:create-ellipse`, `sdegeo:create-ellipsoid`,
  `sdegeo:create-linear-edge`, `sdegeo:create-ot-ellipsoid`,
  `sdegeo:create-ot-sphere`, `sdegeo:create-polygon`,
  `sdegeo:create-polyline-wire`, `sdegeo:create-prism`,
  `sdegeo:create-pyramid`, `sdegeo:create-reg-polygon`,
  `sdegeo:create-ruled-region`, `sdegeo:create-sphere`,
  `sdegeo:create-spline-wire`, `sdegeo:create-torus`,
  `sdegeo:create-triangle`, `sdegeo:create-rectangle` ✅

- 额外基础操作：`sdegeo:extrude`, `sdegeo:revolve`, `sdegeo:reflect`,
  `sdegeo:mirror`, `sdegeo:rotate`

### Batch 2 — sdegeo: 布尔与编辑操作 (~50 个)

- Boolean: `sdegeo:bool-*` (3), `sdegeo:chop-*`, `sdegeo:check-overlap`
- Delete: `sdegeo:delete-*` (13)
- Set/Get: `sdegeo:set-*` (13), `sdegeo:get-*` (7)
- Transform: `sdegeo:move-*` (3), `sdegeo:translate-*` (2),
  `sdegeo:scale-*` (2), `sdegeo:align-*` (5)
- Edit: `sdegeo:fillet-*` (2), `sdegeo:chamfer-*` (2), `sdegeo:sweep-*` (2),
  `sdegeo:split-*` (2)

### Batch 3 — sdegeo: 高级操作 + 边界/接触 (~49 个)

- Imprint/Find: `sdegeo:imprint-*` (5), `sdegeo:find-*` (5)
- Define: `sdegeo:define-*` (4), `sdegeo:skin-*` (4)
- Contact: `sdegeo:contact-*`
- Boundary: `sdegeo:2d-*`, `sdegeo:3d-*`, `sdegeo:body-*`, `sdegeo:face-*`
- Misc: `sdegeo:break-*`, `sdegeo:chull2d-*`, `sdegeo:curve-*`,
  `sdegeo:distance-*`, `sdegeo:dnce-*`, `sdegeo:extend-*`,
  `sdegeo:insert-*`, `sdegeo:point-*`, `sdegeo:polygonal-*`,
  `sdegeo:prune-*`, `sdegeo:ray-*`, `sdegeo:taper-*`, `sdegeo:vsmooth-*`,
  `sdegeo:max-*`, `sdegeo:min-*`, `sdegeo:rename-*`, `sdegeo:average-*`,
  `sdegeo:del-*`

### Batch 4 — sde: 核心 API（set/get/操作）(~70 个)

- Set: `sde:set-*` (15)
- Scmwin: `sde:scmwin-*` (11)
- Show/Hide: `sde:show-*` (9), `sde:hide-*` (8)
- Xshow: `sde:xshow-*` (6)
- Dialog: `sde:dialog-*` (5)
- Get: `sde:get-*` (4)
- 其他单条目操作（save/load/delete/create/check/display 等）

### Batch 5 — sde: 剩余 API (~70 个)

- 剩余 sde:* 函数（view/gui/min/max/fix/window 等）
- 预估约 70 个

### Batch 6 — sdedr:* 网格细化 (62 个)

- 所有 `sdedr:*` 函数

### Batch 7 — 小模块合集 (74 个) ✅

- `sdeicwb:*` (35) — IC 工作台
- `sdepe:*` (18) — 参数提取
- `sdesnmesh:*` (8) — SNMesh
- `sdeio:*` (5+4) — IO 操作（额外提取了 4 个非 KEYWORD1 的 sdeio 函数）
- `sdeepi:*` (4) — EPI
- `sdesp:*` (4) — SP

## 完成记录

| 批次 | 模块 | 新增条目 | 累计 |
|------|------|---------|------|
| Batch 1-5 | sde + sdegeo | 264 | 264 |
| Batch 6 | sdedr:* | 63 | 327 |
| Batch 7 | sdeicwb/sdepe/sdesnmesh/sdeio/sdeepi/sdesp | 78 | **405** |
| **总计** | | **405** | **405** |

KEYWORD1 覆盖率：400/400 (100%)，额外 5 个非 KEYWORD1 条目。

## 每批工作流程

1. 在参考文档中 Grep 当前批次的函数名，提取签名和用法
2. 编写 JSON 条目（signature + description + parameters + example）
3. 追加到 `syntaxes/sde_function_docs.json`
4. 验证 JSON 格式正确

## JSON 条目格式

```json
{
  "sdegeo:create-rectangle": {
    "signature": "(sdegeo:create-rectangle pos1 pos2 material region)",
    "description": "Creates a rectangular region defined by two diagonal corner positions.",
    "parameters": [
      { "name": "pos1", "type": "position", "desc": "First corner position (x y z)" },
      { "name": "pos2", "type": "position", "desc": "Diagonally opposite corner position (x y z)" },
      { "name": "material", "type": "string", "desc": "Material name, e.g. \"Silicon\"" },
      { "name": "region", "type": "string", "desc": "Region name, e.g. \"R.Substrate\"" }
    ],
    "example": "(sdegeo:create-rectangle (position 0 0 0) (position 2 1 0) \"Silicon\" \"R.Substrate\")"
  }
}
```
