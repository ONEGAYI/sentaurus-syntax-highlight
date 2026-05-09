'use strict';

const SYMBOL_TABLE = {
    'sdegeo:create-rectangle': {
        symbolParams: [
            { index: 2, role: 'def', type: 'material' },
            { index: 3, role: 'def', type: 'region' },
        ],
    },
    'sdegeo:define-contact-set': {
        symbolParams: [
            { index: 0, role: 'def', type: 'contact' },
        ],
    },
    'sdedr:define-refinement-region': {
        symbolParams: [
            { index: 2, role: 'ref', type: 'region' },
        ],
    },
    'sde:hide-region': {
        symbolParams: [
            { index: 0, role: 'ref', type: 'region' },
        ],
    },
};

const CUBOID_TABLE = {
    'sdegeo:create-cuboid': {
        symbolParams: [
            { index: 2, role: 'def', type: 'material' },
            { index: 3, role: 'def', type: 'region' },
        ],
    },
};

const OFFSET_INTERFACE_MODES = {
    'sdedr:offset-interface': {
        argIndex: 0,
        modes: {
            region: { params: ['region1', 'region2'] },
            material: { params: ['material1', 'material2'] },
        },
    },
};

const OFFSET_BLOCK_MODES = {
    'sdedr:offset-block': {
        argIndex: 0,
        modes: {
            region: { params: ['region'] },
            material: { params: ['material'] },
        },
    },
};

module.exports = { SYMBOL_TABLE, CUBOID_TABLE, OFFSET_INTERFACE_MODES, OFFSET_BLOCK_MODES };
