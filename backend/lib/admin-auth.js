import { createHash, timingSafeEqual } from "node:crypto";

export function getConfiguredAdminCredentials() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (Boolean(email) !== Boolean(password)) {
        throw new Error("Set both ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.");
    }
    return email && password ? { email, password } : null;
}

export function isConfiguredAdminUser(user, credentials = getConfiguredAdminCredentials()) {
    if (!credentials || !user) {
        return false;
    }
    return (user.emailNormalized ?? user.email)?.trim().toLowerCase() === credentials.email;
}

export function matchesConfiguredAdminPassword(password, expectedPassword) {
    const actualHash = createHash("sha256").update(password).digest();
    const expectedHash = createHash("sha256").update(expectedPassword).digest();
    return timingSafeEqual(actualHash, expectedHash);
}

export function isConfiguredAdminSession(user, session) {
    return user?.role === "admin"
        && session?.authMethod === "env-admin"
        && isConfiguredAdminUser(user);
}
