import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { HttpError } from "./lib/mongo.js";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
const app = express();
const trustedOrigins = new Set(
    (process.env.FRONTEND_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
);
app.use(pinoHttp({
    logger,
    serializers: {
        req(req) {
            return {
                id: req.id,
                method: req.method,
                url: req.url?.split("?")[0],
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },
}));
app.use(cors({
    credentials: true,
    origin(origin, callback) {
        callback(null, !origin || trustedOrigins.has(origin));
    },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", (req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        next();
        return;
    }
    const origin = req.get("origin");
    if (!origin || trustedOrigins.has(origin)) {
        next();
        return;
    }
    res.status(403).json({ error: "This request origin is not allowed." });
});
app.use("/api", router);
const apiErrorHandler = (error, req, res, _next) => {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError
        ? error.message
        : "The request could not be completed. Please try again.";
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown", status }, "API request failed");
    res.status(status).json({ error: message });
};
app.use(apiErrorHandler);
export default app;
