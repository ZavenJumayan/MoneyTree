import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding trips...");

    // Clear existing trips (optional - comment out if you want to keep existing data)
    await prisma.trip.deleteMany({});
    console.log("Cleared existing trips");

    // Seed trips with different moods
    const trips = [
        {
            name: "Patagonia Adventure Trek",
            description: "Experience the rugged beauty of Patagonia with glacier hikes, mountain climbing, and breathtaking landscapes. Perfect for thrill-seekers and nature enthusiasts.",
            location: "Argentina & Chile",
            imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=00",
            moods: ["adventure"],
        },
        {
            name: "Bali Wellness Retreat",
            description: "Rejuvenate your mind and body with yoga sessions, spa treatments, and peaceful beachside accommodations. A perfect escape for relaxation.",
            location: "Bali, Indonesia",
            imageUrl: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800",
            moods: ["relax"],
        },
        {
            name: "Thailand Boxing & Fitness Camp",
            description: "Channel your stress into intense Muay Thai training. Build strength, discipline, and release tension through structured workouts.",
            location: "Phuket, Thailand",
            imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
            moods: ["angry/stressed"],
        },
        {
            name: "Kyoto Temple Meditation",
            description: "Find peace in Japan's ancient temples. Quiet gardens, tea ceremonies, and mindful walking tours to help heal and reflect.",
            location: "Kyoto, Japan",
            imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800",
            moods: ["sad", "relax"],
        },
        {
            name: "European City Explorer",
            description: "Discover museums, local cafes, and charming neighborhoods at your own pace. A balanced journey through culture and everyday life.",
            location: "Various European Cities",
            imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
            moods: ["neutral"],
        },
        {
            name: "Iceland Northern Lights Adventure",
            description: "Chase the aurora borealis, explore ice caves, and soak in geothermal hot springs. An exhilarating journey through Iceland's wonders.",
            location: "Iceland",
            imageUrl: "https://images.unsplash.com/photo-1531161339393-26ab7447776d?w=800",
            moods: ["adventure", "relax"],
        },
        {
            name: "Santorini Sunset Escape",
            description: "Unwind on white-washed cliffs overlooking the Aegean Sea. Enjoy leisurely meals, wine tasting, and stunning sunsets.",
            location: "Santorini, Greece",
            imageUrl: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800",
            moods: ["relax"],
        },
        {
            name: "Costa Rica Rainforest Challenge",
            description: "Zip-lining, white-water rafting, and wildlife spotting in the dense rainforest. Push your limits in nature's playground.",
            location: "Costa Rica",
            imageUrl: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800",
            moods: ["adventure"],
        },
        {
            name: "Norwegian Fjords Cruise",
            description: "Sail through serene fjords, visit quaint villages, and enjoy the calm majesty of Norway's natural beauty.",
            location: "Norway",
            imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            moods: ["sad", "relax", "neutral"],
        },
        {
            name: "Morocco Desert Adventure",
            description: "Camel trekking, sandboarding, and camping under the stars in the Sahara Desert. An unforgettable high-energy experience.",
            location: "Morocco",
            imageUrl: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800",
            moods: ["adventure"],
        },
    ];

    for (const trip of trips) {
        const created = await prisma.trip.create({
            data: trip,
        });
        console.log(`✅ Created trip: ${created.name}`);
    }

    console.log(`\n✨ Successfully seeded ${trips.length} trips!`);
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

