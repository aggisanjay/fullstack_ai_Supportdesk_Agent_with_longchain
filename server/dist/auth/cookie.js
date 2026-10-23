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
exports.cookieOptions = cookieOptions;
exports.setSessionCookie = setSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
exports.readSessionCookie = readSessionCookie;
const jwt = __importStar(require("jsonwebtoken"));
function cookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
    };
}
function setSessionCookie(res, user) {
    const secret = process.env.SESSION_JWT_SECRET || "default_dev_secret_jwt_key_32bytes!";
    const cookieName = process.env.SESSION_COOKIE_NAME || "session";
    const token = jwt.sign(user, secret, {
        algorithm: "HS256",
        expiresIn: "7d",
    });
    res.cookie(cookieName, token, {
        ...cookieOptions(),
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
function clearSessionCookie(res) {
    const cookieName = process.env.SESSION_COOKIE_NAME || "session";
    res.clearCookie(cookieName, cookieOptions());
}
function readSessionCookie(req) {
    const cookieName = process.env.SESSION_COOKIE_NAME || "session";
    const token = req.cookies?.[cookieName];
    if (!token)
        return null;
    try {
        const secret = process.env.SESSION_JWT_SECRET || "default_dev_secret_jwt_key_32bytes!";
        const decoded = jwt.verify(token, secret);
        return decoded;
    }
    catch {
        return null;
    }
}
