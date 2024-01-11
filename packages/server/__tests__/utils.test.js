"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const utils_1 = require("../utils");
(0, vitest_1.describe)('utils', () => {
    (0, vitest_1.test)('isDownloadText', () => {
        const result = (0, utils_1.isDownloadText)(` openssh-server:~$ download test.txt
    `);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot(`undefined`);
    });
    (0, vitest_1.test)('importReplace', () => {
        const result = (0, utils_1.importReplace)(` import("./_app/immutable/entry/start.wIM6_Zsc.js"),`, (path) => {
            return path;
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot(`" import("./_app/immutable/entry/start.wIM6_Zsc.js"),"`);
    });
});
