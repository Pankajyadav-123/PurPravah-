import { MongoClient } from "mongodb";
export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }
}
let databasePromise = null;
export function isMongoConfigured() {
    return Boolean(process.env.MONGODB_URI?.trim());
}
export function isCloudinaryConfigured() {
    return Boolean(process.env.CLOUDINARY_URL?.trim()) ||
        Boolean(process.env.CLOUDINARY_NAME?.trim() &&
            process.env.CLOUDINARY_API_KEY?.trim() &&
            process.env.CLOUDINARY_SECRET_KEY?.trim());
}
export async function getDatabase() {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
        throw new HttpError(503, "MongoDB is not connected yet. Set MONGODB_URI in backend/.env to enable issue tracking.");
    }
    if (!databasePromise) {
        databasePromise = (async () => {
            const client = new MongoClient(uri, {
                serverSelectionTimeoutMS: 5000,
                maxPoolSize: 10,
            });
            try {
                await client.connect();
                const db = client.db(process.env.MONGODB_DB_NAME?.trim() || undefined);
                await Promise.all([
                    db.collection("complaints").createIndex({ publicId: 1 }, { unique: true }),
                    db.collection("complaints").createIndex({ category: 1, createdAt: -1 }),
                    db.collection("complaints").createIndex({ reporterId: 1, createdAt: -1 }),
                    db.collection("complaints").createIndex({ department: 1, status: 1 }),
                    db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
                    db.collection("users").createIndex(
                        { emailNormalized: 1 },
                        { unique: true, partialFilterExpression: { emailNormalized: { $type: "string" } } },
                    ),
                    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
                    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
                ]);
                return db;
            }
            catch (error) {
                await client.close().catch(() => undefined);
                throw error;
            }
        })().catch((error) => {
            databasePromise = null;
            throw error;
        });
    }
    return databasePromise;
}
