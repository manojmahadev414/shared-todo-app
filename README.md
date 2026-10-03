# Shared To-Do App

A multi-user task app with private lists and opt-in sharing. Users can register with email/password and a unique username; Google sign-in is enabled when OAuth credentials are configured.

## Current foundation

- Next.js App Router with TypeScript
- Better Auth with its Prisma adapter and username plugin
- MySQL data model managed by Prisma
- Email/password sign-up and sign-in screens
- Email verification, password recovery, and editable account settings
- New accounts receive a private default list
- Authenticated dashboard with list creation and full task create/edit/complete/delete
- Task descriptions, due dates, and low/normal/high priority
- Cross-list Today and Upcoming task views (set `APP_TIME_ZONE` to the timezone used to define “today”)
- Username invitations with accept/decline, role selection, and owner member controls
- Signed-in profile page with avatar, username, email, name, and join date
- Server actions check owner/editor access before task changes
- Responsive landing page

## Local setup

1. Use Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and set a reachable MySQL `DATABASE_URL`, `BETTER_AUTH_URL`, and a random `BETTER_AUTH_SECRET`. Configure the `SMTP_*` values to send account verification, email change, and password recovery links. When SMTP is not set in local development, links are printed to the Next.js terminal; production requires SMTP configuration.
3. Install dependencies with `npm install`.
4. Validate and generate the Prisma client: `npm run db:validate && npm run db:generate`.
5. Apply checked-in migrations to the database: `npm run db:deploy`. For local schema development, create a migration with `npm run db:migrate -- --name <migration-name>`.
6. Start the app with `npm run dev`.

## Browser automation

The Playwright suite runs against a local development server and the configured MySQL database. Install its browser once with `npx playwright install chromium`, then run `npm run test:e2e`. E2E setup creates and removes test accounts and starts a local SMTP capture server so verification and recovery links are tested without sending email externally.

To enable Google sign-in, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with credentials whose redirect URI is `${BETTER_AUTH_URL}/api/auth/callback/google`. Keep all secrets in local or deployment environment variables; never commit them.

See [docs/deployment.md](docs/deployment.md) for production Vercel deployment and VPS setup.

## Product and security notes

- Invitations are by username and require acceptance before list access is granted.
- List roles are owner, editor, and viewer. Every list read or change must enforce membership and role on the server.
- Prisma migrations are checked in; apply them to a configured database with `npm run db:deploy`.
- Google OAuth remains optional and requires provider credentials.
