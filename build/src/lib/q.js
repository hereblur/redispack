"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueue = void 0;
const Bull = require("bull");
function getQueue(qname) {
    return new Bull(qname, `${process.env.REDIS_URL}`);
}
exports.getQueue = getQueue;
//# sourceMappingURL=q.js.map