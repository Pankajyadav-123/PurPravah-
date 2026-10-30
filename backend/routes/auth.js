import { randomUUID, scrypt as scryptCallback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Router } from "express";
import { AuthLoginBody, AuthRegisterBody } from "../schemas/api.schema.js";
import { ADMIN_SESSION_COOKIE, clearSessionCookie, createSessionToken, getSessionToken, hashSessionToken, SESSION_COOKIE, SESSION_TTL_MS, setSessionCookie } from "../lib/auth-session.js";
import { getDatabase, HttpError } from "../lib/mongo.js";
import { userDto } from "../schemas/smart-nagarik.schema.js";
import { getCurrentUser } from "../lib/current-user.js";
import { getConfiguredAdminCredentials, isConfiguredAdminSession, isConfiguredAdminUser, matchesConfiguredAdminPassword } from "../lib/admin-auth.js";

const router = Router();
const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;

async function hashPassword(password) {
    const salt = randomBytes(16);
    const key = await scrypt(password, salt, passwordKeyLength);
    return `${salt.toString("base64url")}:${key.toString("base64url")}`;
}

async function verifyPassword(password, storedHash) {
    const [saltText, keyText] = storedHash.split(":");
    if (!saltText || !keyText) {
        return false;
    }
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(keyText, "base64url");
    if (expected.length !== passwordKeyLength) {
        return false;
    }
    const actual = await scrypt(password, salt, passwordKeyLength);
    return timingSafeEqual(expected, actual);
}

async function startSession(db, user, res, authMethod, cookieName = SESSION_COOKIE) {
    const token = createSessionToken();
    await db.collection("sessions").insertOne({
        tokenHash: hashSessionToken(token),
        userId: user._id,
        ...(authMethod ? { authMethod } : {}),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        createdAt: new Date(),
    });
    setSessionCookie(res, token, cookieName);
    res.json({ authenticated: true, user: userDto(user) });
}

async function getConfiguredAdminUser(db, credentials) {
    const email = credentials.email;
    const users = db.collection("users");
    let user = await users.findOne({
        $or: [{ emailNormalized: email }, { email }],
    });
    const wasAdmin = user?.role === "admin";
    const now = new Date();
    const userId = user?._id ?? randomUUID();
    const passwordHash = await hashPassword(credentials.password);
    const update = {
        $set: {
            email,
            emailNormalized: email,
            name: "Administrator",
            passwordHash,
            role: "admin",
            department: null,
            updatedAt: now,
        },
        ...(!user ? { $setOnInsert: { phone: null, createdAt: now } } : {}),
    };
    try {
        await users.updateOne({ _id: userId }, update, { upsert: true });
    } catch (error) {
        if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 11000) {
            throw error;
        }
        user = await users.findOne({
            $or: [{ emailNormalized: email }, { email }],
        });
        if (!user) {
            throw error;
        }
        await users.updateOne({ _id: user._id }, { $set: update.$set });
    }
    user = await users.findOne({ _id: userId })
        ?? await users.findOne({
            $or: [{ emailNormalized: email }, { email }],
        });
    if (!user || !isConfiguredAdminUser(user, credentials)) {
        throw new Error("The configured administrator account could not be loaded.");
    }
    if (!wasAdmin) {
        await db.collection("sessions").deleteMany({ userId: user._id });
    }
    return user;
}

router.post("/auth/register", async (req, res) => {
    const parsed = AuthRegisterBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }

    const adminCredentials = getConfiguredAdminCredentials();
    if (adminCredentials?.email === parsed.data.email.trim().toLowerCase()) {
        res.status(403).json({ error: "Administrator accounts are configured by the server." });
        return;
    }

    const db = await getDatabase();
    const email = parsed.data.email.trim().toLowerCase();
    const users = db.collection("users");
    const existing = await users.findOne({
        $or: [{ emailNormalized: email }, { email }],
    });
    if (existing) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
    }

    const now = new Date();
    const user = {
        _id: randomUUID(),
        name: parsed.data.name.trim(),
        email,
        emailNormalized: email,
        passwordHash: await hashPassword(parsed.data.password),
        phone: null,
        role: "citizen",
        department: null,
        createdAt: now,
        updatedAt: now,
    };

    try {
        await users.insertOne(user);
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }
        throw error;
    }
    await startSession(db, user, res);
});

router.post("/auth/login", async (req, res) => {
    const parsed = AuthLoginBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    const adminCredentials = getConfiguredAdminCredentials();
    if (adminCredentials?.email === email) {
        res.status(403).json({ error: "Administrator accounts must sign in through the admin desk." });
        return;
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({
        $or: [{ emailNormalized: email }, { email }],
    });
    if (user?.role === "admin"
        || !user?.passwordHash
        || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
        res.status(401).json({ error: "Email or password is incorrect." });
        return;
    }
    await startSession(db, user, res);
});

router.post("/auth/admin/login", async (req, res) => {
    const parsed = AuthLoginBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const credentials = getConfiguredAdminCredentials();
    if (!credentials) {
        res.status(503).json({ error: "Administrator sign-in is not configured." });
        return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    if (credentials.email !== email
        || !matchesConfiguredAdminPassword(parsed.data.password, credentials.password)) {
        res.status(401).json({ error: "Email or password is incorrect." });
        return;
    }

    const db = await getDatabase();
    const user = await getConfiguredAdminUser(db, credentials);
    await startSession(db, user, res, "env-admin", ADMIN_SESSION_COOKIE);
});

router.get("/auth/session", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const token = getSessionToken(req, SESSION_COOKIE);
    if (!token) {
        res.json({ authenticated: false, user: null });
        return;
    }
    const db = await getDatabase();
    try {
        const user = await getCurrentUser(req, db);
        res.json({ authenticated: true, user: userDto(user) });
    } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
            clearSessionCookie(res);
            res.json({ authenticated: false, user: null });
            return;
        }
        throw error;
    }
});

router.get("/auth/admin/session", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const token = getSessionToken(req, ADMIN_SESSION_COOKIE);
    if (!token) {
        res.json({ authenticated: false, user: null });
        return;
    }
    const db = await getDatabase();
    try {
        const session = await db.collection("sessions").findOne({
            tokenHash: hashSessionToken(token),
            expiresAt: { $gt: new Date() },
        });
        const user = session
            ? await db.collection("users").findOne({ _id: session.userId })
            : null;
        if (!user || !isConfiguredAdminSession(user, session)) {
            clearSessionCookie(res, ADMIN_SESSION_COOKIE);
            res.json({ authenticated: false, user: null });
            return;
        }
        res.json({ authenticated: true, user: userDto(user) });
    } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
            clearSessionCookie(res, ADMIN_SESSION_COOKIE);
            res.json({ authenticated: false, user: null });
            return;
        }
        throw error;
    }
});

router.post("/auth/logout", async (req, res) => {
    const token = getSessionToken(req, SESSION_COOKIE);
    if (token) {
        const db = await getDatabase();
        await db.collection("sessions").deleteOne({ tokenHash: hashSessionToken(token) });
    }
    clearSessionCookie(res);
    res.json({ authenticated: false, user: null });
});

router.post("/auth/admin/logout", async (req, res) => {
    const token = getSessionToken(req, ADMIN_SESSION_COOKIE);
    if (token) {
        const db = await getDatabase();
        await db.collection("sessions").deleteOne({ tokenHash: hashSessionToken(token) });
    }
    clearSessionCookie(res, ADMIN_SESSION_COOKIE);
    res.json({ authenticated: false, user: null });
});

export default router;
