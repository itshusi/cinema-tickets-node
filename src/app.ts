import express from "express";
import type { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";
import ticketRoutes from "./routes/tickets.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get("/health", (_request: Request, response: Response): void => {
  response.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "cinema-tickets-api",
    version: "1.0.0",
  });
});

// Default route
app.get("/", (_request: Request, response: Response): void => {
  response.json({
    message: "Cinema Tickets API",
    endpoints: {
      health: "/health",
      tickets: "/tickets/purchase",
      docs: "/api-docs",
    },
  });
});

// API routes
app.use("/tickets", ticketRoutes);

// Swagger documentation
try {
  const swaggerPath = path.join(__dirname, "docs/openapi.yaml");
  console.log("Looking for Swagger docs at:", swaggerPath);
  console.log("__dirname:", __dirname);
  console.log("File exists:", fs.existsSync(swaggerPath));

  if (fs.existsSync(swaggerPath)) {
    const swaggerYaml = fs.readFileSync(swaggerPath, "utf8");
    const swaggerDocument = yaml.parse(swaggerYaml) as Record<string, unknown>;

    // Handle both /api-docs and /api-docs/ routes
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Cinema Tickets API Documentation",
      })
    );

    app.get("/api-docs/", (_req: Request, res: Response) => {
      res.redirect(301, "/api-docs");
    });

    console.log("Swagger documentation loaded successfully");
  } else {
    console.warn("Swagger documentation file not found at:", swaggerPath);
  }
} catch (error) {
  console.warn("Could not load Swagger documentation:", error);
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response): void => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: {
      type: "INTERNAL_ERROR",
      code: "UNEXPECTED_ERROR",
      message: "An internal server error occurred",
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      type: "NOT_FOUND",
      code: "ENDPOINT_NOT_FOUND",
      message: `Endpoint ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    },
  });
});

const DEFAULT_PORT = Number(process.env["PORT"] ?? 3000);
const HOST: string | undefined = process.env["HOST"];

function startServer(port: number): void {
  const onListening = (): void => {
    const bind = HOST ?? "::";
    console.log(`Cinema Tickets API is running on ${bind}:${port}`);
    console.log(`API Documentation: http://localhost:${port}/api-docs`);
    console.log(`Health Check: http://localhost:${port}/health`);
  };

  const server = (HOST ? app.listen(port, HOST, onListening) : app.listen(port, onListening)).on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      const nextPort = port + 1;
      if (nextPort <= DEFAULT_PORT + 10) {
        console.warn(`Port ${port} in use. Trying next port ${nextPort}...`);
        setTimeout(() => startServer(nextPort), 250);
      } else {
        console.error(`Could not find a free port between ${DEFAULT_PORT}-${DEFAULT_PORT + 10}`);
        process.exit(1);
      }
    } else {
      console.error("Server failed to start:", err);
      process.exit(1);
    }
  });

  // Ensure server closes gracefully on exit
  const shutdown = (): void => {
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer(DEFAULT_PORT);

export default app;
