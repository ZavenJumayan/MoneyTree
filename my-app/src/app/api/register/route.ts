import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import prisma from "../../../../prisma/client";

export async function POST(req: Request) {
    try {
        const { name, email, password, confirmPassword } = await req.json();


        if (!name || !email || !password || !confirmPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }


        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }


        const hashed = await bcrypt.hash(password, 10);


        const user = await prisma.user.create({
            data: {
                username: name,
                email,
                password: hashed,
                emailVerified: new Date(),
            },
        });

        // 5️⃣ Create verification token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

        await prisma.verificationToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });


        if (process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify?token=${token}`;
            await transporter.sendMail({
                from: `"Wiymood" <${process.env.SMTP_USER}>`,
                to: email,
                subject: "Confirm your Wiymood account",
                html: `<p>Hi ${name},</p>
               <p>Click below to confirm your account:</p>
               <a href="${verifyUrl}">${verifyUrl}</a>`,
            });
        }

        // 7️⃣ Done
        return NextResponse.json({ message: "Account created. Check your email to verify it." });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
