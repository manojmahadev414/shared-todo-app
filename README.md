# Shared To-Do App

A multi-user task app with private lists and opt-in sharing. Users can register with email/password and a unique username; Google sign-in is enabled when OAuth credentials are configured.

## Current foundation

- Next.js App Router with TypeScript
- Better Auth with its Prisma adapter and username plugin
- MySQL data model managed by Prisma
- Email/password sign-up and sign-in screens
- New accounts receive a private default list
- Responsive landing page

## Local setup

1. Use Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and set a reachable MySQL `DATABASE_URL`, `BETTER_AUTH_URL`, and a random `BETTER_AUTH_SECRET`.
3. Install dependencies with `npm install`.
4. Validate and generate the Prisma client: `npm run db:validate && npm run db:generate`.
5. Create the first migration against your development database: `npm run db:migrate -- --name init`.
6. Start the app with `npm run dev`.

To enable Google sign-in, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with credentials whose redirect URI is `${BETTER_AUTH_URL}/api/auth/callback/google`. Keep all secrets in local or deployment environment variables; never commit them.

## Product and security notes

- Invitations are by username and require acceptance before list access is granted.
- List roles are owner, editor, and viewer. Every list read or change must enforce membership and role on the server.
- The initial schema is validated, but migrations have not been applied because no development database has been configured.
- Authorization, task CRUD, invitations, list management, and production deployment are still to be implemented.
