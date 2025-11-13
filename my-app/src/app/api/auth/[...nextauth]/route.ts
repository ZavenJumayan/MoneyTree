import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "../../../../../prisma/client";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = (await prisma.user.findUnique({
                    where: { email },
                })) as User | null;

                if (!user || !user.password) return null;
                if (!user.emailVerified) return null;

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.username ?? user.email,
                };
            },
        }),
    ],
    session: { strategy: "database" as const },
    pages: {
        signIn: "/sign-in",
        newUser: "/account",
    },
    callbacks: {
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {

            if (url.startsWith("/")) return `${baseUrl}${url}`;
            return `${baseUrl}/account`;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",

};

const { handlers } = NextAuth(authOptions);


export const GET = handlers.GET;
export const POST = handlers.POST;
