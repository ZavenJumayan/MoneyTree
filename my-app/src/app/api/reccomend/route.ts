import { NextResponse } from "next/server";
import { analyzeMood } from "@/lib/ai/moodAnalyzer";
import { generateTrips } from "@/lib/ai/tripGenerator";
import { tokenize } from "@/lib/ai/tokenizer";
import prisma from "../../../../prisma/client";
import { cookies } from "next/headers";

async function getUserIdFromSession(): Promise<string | undefined> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("next-auth.session-token")?.value || 
                            cookieStore.get("__Secure-next-auth.session-token")?.value;
        
        if (!sessionToken) return undefined;

        const session = await prisma.session.findUnique({
            where: { sessionToken },
            include: { user: true },
        });

        if (!session || session.expires < new Date()) return undefined;
        
        return session.userId;
    } catch (error) {
        console.error("Error getting user from session:", error);
        return undefined;
    }
}

async function processRequest(text: string, userId?: string) {
    const tokens = tokenize(text);
    const moodData = await analyzeMood(tokens);
    const trips = await generateTrips(moodData.mood);


    try {
        await prisma.emotion.create({
            data: {
                userId: userId || null,
                inputText: text,
                mood: moodData.mood,
                valence: moodData.vad.valence,
                arousal: moodData.vad.arousal,
                dominance: moodData.vad.dominance,
            },
        });
    } catch (error) {
        // Log error but don't fail the request if saving emotion fails
        console.error("Failed to save emotion to database:", error);
    }

    return NextResponse.json({ mood: moodData.mood, vad: moodData.vad, trips });
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const text = searchParams.get("text");
        
        if (!text) {
            return NextResponse.json(
                { error: "No text provided. Use ?text=your+message or POST with JSON body." },
                { status: 400 }
            );
        }

        // Get user from session if available
        const userId = await getUserIdFromSession();

        return await processRequest(text, userId);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

        // Get user from session if available
        const userId = await getUserIdFromSession();

        return await processRequest(text, userId);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}