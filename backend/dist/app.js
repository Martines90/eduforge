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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const error_handler_1 = require("./middleware/error-handler");
const swagger_config_1 = require("./config/swagger.config");
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware - Configure helmet to allow Swagger UI
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                ...helmet_1.default.contentSecurityPolicy.getDefaultDirectives(),
                "script-src": ["'self'", "'unsafe-inline'"],
                "style-src": ["'self'", "'unsafe-inline'"],
                "img-src": ["'self'", "data:", "https:"],
            },
        },
    }));
    // CORS middleware
    app.use((0, cors_1.default)({
        origin: config_1.config.corsOrigin,
        credentials: true,
    }));
    // Logging middleware
    if (config_1.config.nodeEnv === "development") {
        app.use((0, morgan_1.default)("dev"));
    }
    else {
        app.use((0, morgan_1.default)("combined"));
    }
    // Body parsing middleware
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Swagger documentation
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "EduForge API Documentation",
        customfavIcon: "/favicon.ico",
    }));
    // Swagger JSON endpoint
    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swagger_config_1.swaggerSpec);
    });
    // Serve static files from storage directory
    app.use("/storage", express_1.default.static(path.join(config_1.config.storageDir), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith(".png") || filePath.endsWith(".jpg")) {
                res.set("Content-Type", "image/png");
            }
            else if (filePath.endsWith(".md")) {
                res.set("Content-Type", "text/markdown");
            }
        },
    }));
    // API routes
    app.use("/", routes_1.default);
    // 404 handler
    app.use(error_handler_1.notFoundHandler);
    // Error handling middleware (must be last)
    app.use(error_handler_1.errorHandler);
    return app;
}
