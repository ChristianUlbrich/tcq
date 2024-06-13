// this patches whatwg-url to "make it work" in node 10 environment...
const replace = require('replace-in-file');
const options = {
    files: './node_modules/whatwg-url/lib/encoding.js',
    from: /"use strict";\nconst utf8Encoder = new TextEncoder\(\);/g,
    to: `"use strict";
const util = require('util');
const { TextEncoder, TextDecoder } = util;
const utf8Encoder = new TextEncoder();`,
};
try {
    const results = replace.sync(options);
    console.log('Replacement results:', results);
}
catch (error) {
    console.error('Error occurred:', error);
}
