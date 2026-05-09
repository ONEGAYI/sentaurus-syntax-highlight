'use strict';

function mockDoc(uri, version, text) {
    return {
        uri: { toString: () => uri },
        version,
        getText: () => text,
    };
}

module.exports = { mockDoc };
