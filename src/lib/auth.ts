import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { getPrismaSingleton } from "./db"

const prisma = getPrismaSingleton()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: (process.env.GOOGLE_CLIENT_ID ?? "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET ?? "").trim(),
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000", "https://*.vercel.app"],
})

export type Session = typeof auth.$Infer.Session
