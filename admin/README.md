# PurPravah Admin

This is a standalone admin web app in the repository root, separate from
`frontend/`. It uses the existing backend API and administrator authentication.

## Run locally

1. Start the backend from `backend/` with `node index.js`.
2. Start the admin app from `admin/`:

   ```powershell
   npm install
   npm run dev
   ```

3. Open <http://localhost:5174> and sign in with an administrator account.

The dev server proxies `/api` to `http://localhost:5000`. If `backend/.env`
defines `FRONTEND_ORIGINS`, include both `http://localhost:5174` and
`http://127.0.0.1:5174` in that comma-separated list for admin API access.

## Admin access

Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured in
`backend/.env`. Admin sign-in uses a separate HttpOnly session from the citizen
frontend; the administrator email cannot sign in through the citizen login or
be registered as a citizen. Administrator access is managed through the
backend environment credentials, not public signup or account promotion.

The dashboard shows report totals, reports awaiting review, current department
workloads, and recent activity. The report list supports status/department
filters, review and department assignment, starting work, and resolving work
with an uploaded completion photo.
