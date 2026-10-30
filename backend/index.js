import { existsSync } from "node:fs";
import { getConfiguredAdminCredentials } from "./lib/admin-auth.js";

if (existsSync(new URL(".env", import.meta.url))) {
    process.loadEnvFile(new URL(".env", import.meta.url));
}
getConfiguredAdminCredentials();

const [{ default: app }, { logger }] = await Promise.all([
    import("./app.js"),
    import("./lib/logger.js"),
]);

const rawPort = process.env["PORT"] ?? "5001";
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
}
app.listen(port, (err) => {
    if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
    }
    logger.info({ port }, "Server listening");
});
