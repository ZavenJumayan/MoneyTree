import prisma from "../../../prisma/client";


export interface TripDTO {
    id: string;
    name: string;
    description: string;
    location?: string | null;
    imageUrl?: string | null;
    moods: string[];
}

export async function generateTrips(mood: string): Promise<TripDTO[]> {
    try {
        const trips = await prisma.trip.findMany({
            where: { moods: { has: mood } },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        return trips as unknown as TripDTO[];
    } catch {
        return [];
    }
}

