import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/prisma/db.ts";
import {passkey} from "@better-auth/passkey";

const prisma = db;
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID as string,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
            // Optional
            tenantId: 'common',
            authority: "https://login.microsoftonline.com", // Authentication authority URL
            prompt: "select_account", // Forces account selection
        },
    },
    plugins: [
        passkey(),
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                if (type === "sign-in") {
                    // Send the OTP for sign in
                } else if (type === "email-verification") {
                    // Send the OTP for email verification
                } else {
                    // Send the OTP for password reset
                }
            },
        })
    ]
});