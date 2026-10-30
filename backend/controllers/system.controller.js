import { GetSetupStatusResponse, HealthCheckResponse, } from "../schemas/api.schema.js";
import { isCloudinaryConfigured, isMongoConfigured } from "../lib/mongo.js";
export const getHealth = (_req, res) => {
    res.json(HealthCheckResponse.parse({ status: "ok" }));
};
export const getSetupStatus = (_req, res) => {
    const mongoConfigured = isMongoConfigured();
    const cloudinaryConfigured = isCloudinaryConfigured();
    const missing = [
        ...(!mongoConfigured ? ["MONGODB_URI"] : []),
        ...(!cloudinaryConfigured ? ["CLOUDINARY_URL"] : []),
    ];
    const instructions = [
        ...(!mongoConfigured ? ["Set MONGODB_URI in backend/.env."] : []),
        ...(!cloudinaryConfigured
            ? ["Set CLOUDINARY_URL or CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET_KEY in backend/.env."]
            : []),
    ];
    res.json(GetSetupStatusResponse.parse({
        ready: missing.length === 0,
        mongoConfigured,
        cloudinaryConfigured,
        missing,
        message: missing.length === 0
            ? "MongoDB and Cloudinary are configured."
            : instructions.join(" "),
    }));
};
