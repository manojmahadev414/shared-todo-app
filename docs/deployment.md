# Production deployment

The application uses standard PostgreSQL through Prisma, so the database can be hosted on Vercel's storage integrations or independently and reused if the app moves to a VPS. Keep the production database separate from local and preview databases.

## Vercel

1. Import this Git repository as a Next.js project in Vercel. Vercel runs the `vercel-build` script, which generates the Prisma client, applies pending migrations (`prisma migrate deploy`) and then runs `next build`.
2. In the project's **Storage** tab, create a Prisma Postgres database and connect it to the project so `DATABASE_URL` is injected. Previews that share this connection also share the database; give Preview its own database if that matters.
3. Add these variables to the Vercel Production environment:
   - `BETTER_AUTH_URL`: the canonical public app origin, such as `https://tasks.example.com`.
   - `BETTER_AUTH_SECRET`: a fresh, long random secret used only by production.
   - `DATABASE_URL`: injected by the storage integration.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: a real transactional mail account.
   - `APP_TIME_ZONE`: the timezone used to define Today, for example `Asia/Kolkata`.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` when Google sign-in is enabled.
4. In the Google OAuth client, register `https://<production-host>/api/auth/callback/google` as an authorized redirect URI. Also register the local callback for development. Do not use production credentials in preview deployments.
5. Migrations run automatically during each Vercel build. To apply them by hand instead, run `npm run db:deploy` with `DATABASE_URL` pointing at the target database, after reviewing that target.
6. Deploy from Vercel. Add the final Vercel URL or custom domain to the OAuth provider and update `BETTER_AUTH_URL` if it changed, then redeploy so the new environment values are active.
7. Verify sign-up email delivery, email verification, password recovery, Google sign-in, dashboard access, and list sharing against the production URL.

Set Vercel environment variables in Project Settings and redeploy after changing them. Never put secrets in `NEXT_PUBLIC_*` variables or commit them to Git.

## VPS portability

Build and run the same Node application on a supported Node.js host. Supply the same environment variables through the host's secret manager, install dependencies with `npm ci`, generate Prisma with `npm run db:generate`, apply migrations with `npm run db:deploy`, and run `npm run build` followed by `npm run start`. Point `BETTER_AUTH_URL` and the Google redirect URI at the VPS domain. Keep PostgreSQL external or run a standard PostgreSQL server; no Vercel-specific database adapter is required.

Production database vendor, OAuth client, SMTP account, Vercel project, and domain must be provisioned in their respective provider accounts. Those credentials are deliberately not stored in this repository.
