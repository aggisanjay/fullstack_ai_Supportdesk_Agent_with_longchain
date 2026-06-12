"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const e2e_routes_1 = __importDefault(require("./auth/e2e.routes"));
const support_routes_1 = __importDefault(require("./support/support.routes"));
const auth_middleware_1 = require("./auth/auth.middleware");
async function main() {
    dotenv_1.default.config();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.get("/status", (req, res) => {
        res.json({
            ok: true,
            status: "UP",
        });
    });
    app.use("/auth", auth_routes_1.default);
    app.use("/auth", e2e_routes_1.default);
    //protect
    app.use("/api", auth_middleware_1.requireAuth);
    app.use("/api/support", support_routes_1.default);
    const port = Number(process.env.PORT || 5000);
    app.listen(port, () => {
        console.log("Server is running on port 5000");
    });
}
main().catch((err) => {
    console.error("Server error occured");
    process.exit(1);
});
