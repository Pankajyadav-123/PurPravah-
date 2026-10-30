# Backend

Install dependencies and start the API directly with Node:

```powershell
npm install
node index.js
```

Configure MongoDB, Cloudinary, and the administrator credentials in `.env`.
The API and Vite proxy default to port `5001`; if you use a different API port,
set `API_PROXY_TARGET` for both Vite dev servers (for example,
`http://localhost:5000`). The standalone admin panel runs at
`http://localhost:5174`; include that origin in `FRONTEND_ORIGINS` alongside
the citizen frontend origin. For a deployed frontend hosted on a different
origin, set `FRONTEND_ORIGINS` to its exact origin (or comma-separated
origins); the list is used for credentialed requests and write-request origin
checks. Production cookies use `SameSite=None; Secure` for cross-origin
frontend/API deployments, so always serve the backend over HTTPS.

Accounts use email and password. Passwords are stored as scrypt hashes, and
sessions use HttpOnly cookies that expire after seven days. Citizen and admin
sessions use separate cookies; administrator sign-in is available only through
the admin desk and does not sign the same browser into the citizen frontend.
New registrations receive the citizen role. Configure the sole administrator account with
`ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`; set both values and use a
strong, unique password. The administrator account is provisioned when those
credentials are used to sign in. Its email cannot be registered as a citizen,
and signing in with that email through the citizen frontend is disabled.
Administrator access is managed through these backend environment credentials;
other accounts cannot be promoted to administrator in the app.
