# Production deployment

The application uses standard MySQL through Prisma, so the database can be hosted independently of Vercel and reused if the app moves to a VPS. Choose a managed MySQL service that provides TLS and a connection endpoint suitable for short-lived serverless functions. Keep the production database separate from local and preview databases.

## Vercel

1. Import this Git repository as a Next.js project in Vercel. Keep the detected Next.js build settings; the project build command is `npm run build`.
2. Provision a production MySQL database, create a least-privilege application user, and allow TLS connections from the deployment. Put its MySQL connection URI in Vercel's **Production** `DATABASE_URL` variable. Use separate credentials for Preview if previews need database access.
3. Add these variables to the Vercel Production environment:
   - `BETTER_AUTH_URL`: the canonical public app origin, such as `https://tasks.example.com`.
   - `BETTER_AUTH_SECRET`: a fresh, long random secret used only by production.
   - `DATABASE_URL`: the production MySQL URI.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: a real transactional mail account.
   - `APP_TIME_ZONE`: the timezone used to define Today, for example `Asia/Kolkata`.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` when Google sign-in is enabled.
4. In the Google OAuth client, register `https://<production-host>/api/auth/callback/google` as an authorized redirect URI. Also register the local callback for development. Do not use production credentials in preview deployments.
5. Apply the checked-in Prisma migrations to the production database with `DATABASE_URL` set to that database: `npm run db:deploy`. Review the target database before running this command.
6. Deploy from Vercel. Add the final Vercel URL or custom domain to the OAuth provider and update `BETTER_AUTH_URL` if it changed, then redeploy so the new environment values are active.
7. Verify sign-up email delivery, email verification, password recovery, Google sign-in, dashboard access, and list sharing against the production URL.

Set Vercel environment variables in Project Settings and redeploy after changing them. Never put secrets in `NEXT_PUBLIC_*` variables or commit them to Git.

## VPS portability

Build and run the same Node application on a supported Node.js host. Supply the same environment variables through the host's secret manager, install dependencies with `npm ci`, generate Prisma with `npm run db:generate`, apply migrations with `npm run db:deploy`, and run `npm run build` followed by `npm run start`. Point `BETTER_AUTH_URL` and the Google redirect URI at the VPS domain. Keep MySQL external or run a standard MySQL server; no Vercel-specific database adapter is required.

Production database vendor, OAuth client, SMTP account, Vercel project, and domain must be provisioned in their respective provider accounts. Those credentials are deliberately not stored in this repository.
