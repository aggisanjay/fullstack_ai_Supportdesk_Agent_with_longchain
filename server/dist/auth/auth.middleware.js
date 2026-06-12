"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const cookie_1 = require("./cookie");
function requireAuth(req, res, next) {
    const user = (0, cookie_1.readSessionCookie)(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthenticated" });
    }
    req.user = user;
    next();
}
