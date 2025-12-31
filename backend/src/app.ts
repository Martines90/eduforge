import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import * as path from "path";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { swaggerSpec } from "./config/swagger.config";

export function createApp(): Application {
  const app: Application = express();

  // Security middleware - Configure helmet to allow Swagger UI
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:"],
        },
      },
    })
  );

  // CORS middleware
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Logging middleware
  if (config.nodeEnv === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Body parsing middleware - increased limit for PDF uploads (up to 10MB)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Swagger documentation
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "EduForge API Documentation",
      customfavIcon: "/favicon.ico",
    })
  );

  // Swagger JSON endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Serve static files from storage directory
  app.use(
    "/storage",
    express.static(path.join(config.storageDir), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".png") || filePath.endsWith(".jpg")) {
          res.set("Content-Type", "image/png");
        } else if (filePath.endsWith(".md")) {
          res.set("Content-Type", "text/markdown");
        }
      },
    })
  );

  // API routes
  app.use("/", routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
