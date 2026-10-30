import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { Router } from "express";
import { CreateUploadSignatureBody, CreateUploadSignatureResponse, } from "../schemas/api.schema.js";
import { getCurrentUser, requireAuth } from "../lib/current-user.js";
import { getDatabase, HttpError, isCloudinaryConfigured, } from "../lib/mongo.js";
const router = Router();
router.use(requireAuth);
router.post("/uploads/signature", async (req, res) => {
    const parsed = CreateUploadSignatureBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    if (!isCloudinaryConfigured()) {
        throw new HttpError(503, "Cloudinary is not connected yet. Set CLOUDINARY_URL in backend/.env to upload photos.");
    }
    const db = await getDatabase();
    const user = await getCurrentUser(req, db);
    const configuration = cloudinary.config({
        secure: true,
        ...(process.env.CLOUDINARY_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_SECRET_KEY
            ? {
                cloud_name: process.env.CLOUDINARY_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_SECRET_KEY,
            }
            : {}),
    });
    if (!configuration.api_key || !configuration.api_secret || !configuration.cloud_name) {
        throw new HttpError(503, "Cloudinary credentials are incomplete. Check backend/.env.");
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const userKey = createHash("sha256").update(user._id).digest("hex").slice(0, 16);
    const folder = `smart-nagarik/${parsed.data.purpose}/${userKey}`;
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, configuration.api_secret);
    res.json(CreateUploadSignatureResponse.parse({
        cloudName: configuration.cloud_name,
        apiKey: configuration.api_key,
        timestamp,
        signature,
        folder,
    }));
});
export default router;
