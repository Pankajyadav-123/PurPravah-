import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "smart_nagarik_session";
export const ADMIN_SESSION_COOKIE = "smart_nagarik_admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function createSessionToken() {
    return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token) {
    return createHash("sha256").update(token).digest("hex");
}

export function getSessionToken(req, cookieName = SESSION_COOKIE) {
    const cookieHeader = req.headers.cookie ?? "";
    const pair = cookieHeader
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${cookieName}=`));
    if (!pair) {
        return null;
    }
    try {
        return decodeURIComponent(pair.slice(cookieName.length + 1));
    } catch {
        return null;
    }
}

export function setSessionCookie(res, token, cookieName = SESSION_COOKIE) {
    const production = process.env.NODE_ENV === "production";
    const secure = production ? "; Secure" : "";
    const sameSite = production ? "None" : "Lax";
    res.setHeader(
        "Set-Cookie",
        `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`,
    );
}

export function clearSessionCookie(res, cookieName = SESSION_COOKIE) {
    const production = process.env.NODE_ENV === "production";
    const secure = production ? "; Secure" : "";
    const sameSite = production ? "None" : "Lax";
    res.setHeader(
        "Set-Cookie",
        `${cookieName}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`,
    );
}
