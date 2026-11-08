"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTokens = setTokens;
exports.getAccessToken = getAccessToken;
exports.clearTokens = clearTokens;
const headers_1 = require("next/headers");
async function setTokens(accessToken, refreshToken) {
    (await (0, headers_1.cookies)()).set("accessToken", accessToken, { httpOnly: true });
    (await (0, headers_1.cookies)()).set("refreshToken", refreshToken, { httpOnly: true });
}
async function getAccessToken() {
    var _a, _b;
    return (_b = (_a = (await (0, headers_1.cookies)()).get("accessToken")) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null;
}
async function clearTokens() {
    (await (0, headers_1.cookies)()).delete("accessToken");
    (await (0, headers_1.cookies)()).delete("refreshToken");
}
