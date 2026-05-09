'use strict';

function generateSchemeCode(lines) {
    const parts = [];
    let i = 0;

    while (i < lines) {
        parts.push(`(define top_var_${i} "value_${i}")`);
        i++;
        if (i >= lines) break;

        const funcLines = Math.min(8, lines - i);
        const funcBody = [];
        for (let j = 0; j < funcLines && i < lines; j++, i++) {
            funcBody.push(`    (sdegeo:create-rectangle "region_${i}" (list ${i}.0 ${i}.0) (list ${i + 10}.0 ${i + 10}.0))`);
        }
        parts.push(`(define (my-func-${parts.length} arg1 arg2)`);
        parts.push(...funcBody);
        parts.push(')');
    }
    return parts.join('\n');
}

module.exports = { generateSchemeCode };
