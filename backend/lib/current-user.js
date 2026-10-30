import { getDatabase, HttpError } from "./mongo.js";
import { ADMIN_SESSION_COOKIE, getSessionToken, hashSessionToken, SESSION_COOKIE } from "./auth-session.js";
import { isConfiguredAdminSession } from "./admin-auth.js";

function sessionCookieName(req) {
    return req.originalUrl?.startsWith("/api/admin-api/") ? ADMIN_SESSION_COOKIE : SESSION_COOKIE;
}

export const requireAuth = async (req, _res, next) => {
    const cookieName = sessionCookieName(req);
    const token = getSessionToken(req, cookieName);
    if (!token) {
        throw new HttpError(401, "Sign in to continue.");
    }
    const db = await getDatabase();
    const session = await db.collection("sessions").findOne({
        tokenHash: hashSessionToken(token),
        expiresAt: { $gt: new Date() },
    });
    if (!session) {
        throw new HttpError(401, "Your session has expired. Please sign in again.");
    }
    const user = await db.collection("users").findOne({ _id: session.userId });
    if (!user) {
        throw new HttpError(401, "Your account could not be found. Please sign in again.");
    }
    if (cookieName === ADMIN_SESSION_COOKIE
        ? !isConfiguredAdminSession(user, session)
        : user.role === "admin") {
        throw new HttpError(401, "Sign in with the configured administrator credentials.");
    }
    req.authenticatedUser = user;
    next();
};
export async function getCurrentUser(req, db) {
    if (req.authenticatedUser) {
        return req.authenticatedUser;
    }
    const cookieName = sessionCookieName(req);
    const token = getSessionToken(req, cookieName);
    if (!token) {
        throw new HttpError(401, "Sign in to continue.");
    }
    const session = await db.collection("sessions").findOne({
        tokenHash: hashSessionToken(token),
        expiresAt: { $gt: new Date() },
    });
    if (!session) {
        throw new HttpError(401, "Your session has expired. Please sign in again.");
    }
    const users = db.collection("users");
    const user = await users.findOne({ _id: session.userId });
    if (!user) {
        throw new HttpError(401, "Your account could not be found. Please sign in again.");
    }
    if (cookieName === ADMIN_SESSION_COOKIE
        ? !isConfiguredAdminSession(user, session)
        : user.role === "admin") {
        throw new HttpError(401, "Sign in with the configured administrator credentials.");
    }
    return user;
}
