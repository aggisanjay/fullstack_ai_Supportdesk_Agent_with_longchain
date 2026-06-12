"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSessionCookie = setSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
exports.readSessionCookie = readSessionCookie;
const jwt = __importStar(require("jsonwebtoken"));
function cookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    };
}
function setSessionCookie(res, user) {
    const token = jwt.sign(user, process.env.SESSION_JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: "7d",
    });
    res.cookie(process.env.SESSION_COOKIE_NAME, token, {
        ...cookieOptions(),
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
function clearSessionCookie(res) {
    res.clearCookie(process.env.SESSION_COOKIE_NAME, cookieOptions());
}
function readSessionCookie(req) {
    const token = req.cookies?.[process.env.SESSION_COOKIE_NAME];
    if (!token)
        return null;
    try {
        const decoded = jwt.verify(token, process.env.SESSION_JWT_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
}
