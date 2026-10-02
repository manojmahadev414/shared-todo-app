# Shared To-Do App

Early project foundation for a multi-user task app with shareable lists.

## Product decisions

- Users can register with email/password or Google and choose a unique username.
- Each account has a private default list.
- Users can create additional lists and invite existing users by username.
- Invitations require acceptance before list access is granted.
- List roles: owner, editor, viewer. Invites default to viewer; the sender may choose editor.
- Tasks have title, optional description and due date, completion state, priority (low/normal/high), creator, and timestamps.
- Every server operation must verify list membership and role. Hiding controls in the UI is not an authorization check.
- Vercel hosts the Next.js app initially. MySQL is an external database reachable securely by the app. A later move to a VPS should require configuration changes, not a rewrite.

## Planned stack

- Next.js App Router and TypeScript
- MySQL
- Prisma ORM
- Better Auth for password and Google sign-in, with username support
- Vercel for initial application deployment

## First-release screens

1. Sign up/sign in
2. My tasks, with today/upcoming filters
3. Lists overview and list creation
4. List detail with task CRUD, priority, and due date
5. Invitations inbox (accept/decline)
6. List member management and role selection
7. Account settings

Reminders, recurring tasks, comments, and attachments are deferred until after the core sharing flow works.

## Local setup (once Node.js and a MySQL database are available)

1. Copy `.env.example` to `.env.local` and fill in the database URL, application URL, and auth secrets. Never commit `.env.local`.
2. Install dependencies and generate Prisma client.
3. Apply migrations to the development database.
4. Start the Next.js development server.

The source files and runtime have not yet been installed or verified in this environment. This workspace currently has no Node.js, npm, or Git executable and no application repository connected.
