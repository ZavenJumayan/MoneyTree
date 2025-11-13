import { NextResponse } from "next/server";
import prisma from "../../../../prisma/client";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }


    const record = await prisma.verificationToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!record) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
        return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }


    await prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
    });


    await prisma.verificationToken.delete({
        where: { token },
    });


    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/sign-in`);
}
