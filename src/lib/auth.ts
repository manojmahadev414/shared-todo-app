import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendAuthEmail } from "@/lib/email";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "Shared To-Do",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "mysql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail(user.email, "Reset your Shared To-Do password", url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail(user.email, "Verify your Shared To-Do email", url);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendAuthEmail(user.email, `Confirm your email change to ${newEmail}`, url);
      },
    },
  },
  socialProviders: googleClientId && googleClientSecret ? {
    google: { clientId: googleClientId, clientSecret: googleClientSecret },
  } : {},
  plugins: [username({
    maxUsernameLength: 32,
    usernameValidator: (value) => /^[a-zA-Z0-9_.]{3,32}$/.test(value),
  })],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.taskList.create({
            data: { name: "My Tasks", ownerId: user.id, isDefault: true },
          });
        },
      },
    },
  },
});
