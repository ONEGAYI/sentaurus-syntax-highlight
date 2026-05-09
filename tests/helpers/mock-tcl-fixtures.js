'use strict';

const { makeNode } = require('./mock-ast-node');

function makeGlobalSet(varName, value, startRow) {
    return makeNode('set', `set ${varName} ${value}`, [
        makeNode('simple_word', 'set', [], startRow, 0, startRow, 3),
        makeNode('id', varName, [], startRow, 4, startRow, 4 + varName.length),
        makeNode('simple_word', value, [], startRow, 5 + varName.length, startRow, 5 + varName.length + String(value).length),
    ], startRow, 0, startRow, 5 + varName.length + String(value).length);
}

function makeEmptyProc(name, bodyChildren, startRow, endRow) {
    return makeNode('procedure', `proc ${name} {} { ... }`, [
        makeNode('simple_word', 'proc', [], startRow, 0, startRow, 4),
        makeNode('simple_word', name, [], startRow, 5, startRow, 5 + name.length),
        makeNode('arguments', '', [], startRow, 6 + name.length, startRow, 8 + name.length),
        makeNode('braced_word', '{ ... }', bodyChildren || [], startRow, 9 + name.length, endRow || startRow, 1),
    ], startRow, 0, endRow || startRow, 1);
}

function makeProcWithArgs(name, args, bodyChildren, startRow, endRow) {
    const argsText = args.join(' ');
    const argsChildren = args.map(a =>
        makeNode('argument', a, [], startRow, 0, startRow, a.length)
    );
    return makeNode('procedure', `proc ${name} {${argsText}} { ... }`, [
        makeNode('simple_word', 'proc', [], startRow, 0, startRow, 4),
        makeNode('simple_word', name, [], startRow, 5, startRow, 5 + name.length),
        makeNode('arguments', argsText, argsChildren, startRow, 6 + name.length, startRow, 8 + name.length + argsText.length),
        makeNode('braced_word', '{ ... }', bodyChildren || [], startRow, 9 + name.length + argsText.length, endRow || startRow, 1),
    ], startRow, 0, endRow || startRow, 1);
}

module.exports = { makeGlobalSet, makeEmptyProc, makeProcWithArgs };
