// import { betterAuth } from "better-auth";
// import { MongoClient } from "mongodb";
// import { mongodbAdapter } from "better-auth/adapters/mongodb";

// const client = new MongoClient(process.env.MONGODB_URL!);
// const db = client.db();

// export const auth = betterAuth({
//   database: mongodbAdapter(db), // ✅ remove client
//   emailAndPassword: {
//     enabled: true,
//     autoSignIn: false,
//   },
//   session: {
//     freshAge: 60 * 5,
//   },
// });



import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL, // e.g. http://localhost:3000
  database: mongodbAdapter(db), // (standalone Mongo: client မပေးတာ safe)

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // optional: always ask account selection
      prompt: "select_account",
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,

    // ✅ forgot/reset password email sender
    sendResetPassword: async ({ user, url }) => {
      // TODO: Resend / Nodemailer / SES နဲ့ email ပို့
      console.log("RESET PASSWORD URL:", user.email, url);
    },
  },

  // ✅ session behavior
  session: {
    freshAge: 60 * 5,
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh expiry every 1 day of activity

    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min cookie cache
      refreshCache: true, // auto refresh before expiry
    },
  },

  // If you ever use Better Auth APIs inside Server Actions, this helps set cookies automatically. :contentReference[oaicite:3]{index=3}
  plugins: [nextCookies()],
});
