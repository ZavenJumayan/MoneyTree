"use client";

import { useSession, } from "next-auth/react";
import { MapPin, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
    const { data: session } = useSession();
    const router = useRouter();
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const handleGenerateClick = () => {
        if (!session) {
            setShowLoginDialog(true);
            return;
        }
        router.push("/trip");
    };

    return (
        <main className="pt-0">
            <div className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 bg-gradient-to-b from-[#0b1120] via-[#030712] to-black">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative text-center max-w-4xl mx-auto space-y-8 flex-grow">
                    <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-400/20 rounded-full px-4 py-2 mb-6">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-cyan-300">
              AI-Powered Travel Planning
            </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white">
                        Based on your mood,
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              AI will suggest
            </span>
                        <br />
                        your perfect trip 🌍
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                        Answer a few quick questions about how you&apos;re feeling and what
                        you&apos;re looking for, and let our AI create a personalized travel
                        itinerary just for you.
                    </p>

                    <div className="pt-6">
                        <Button
                            size="lg"
                            onClick={handleGenerateClick}
                            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-cyan-500/50 transition-all duration-300 hover:shadow-cyan-500/70 hover:scale-105"
                        >
                            <MapPin className="w-5 h-5 mr-2" />
                            {session ? "Go to Trip Planner" : "Sign in to Generate Trip"}
                        </Button>
                    </div>
                </div>

                <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                    <DialogContent className="sm:max-w-md bg-[#0b1120] text-white border border-cyan-400/20 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-cyan-400">
                                <LogIn className="w-5 h-5" /> Sign in Required
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Please sign in to access your AI trip planner.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex justify-center gap-3 mt-6">
                            <Button

                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2"
                            >
                               <Link href={"/sign-in"}> Sign In</Link>
                            </Button>
                            <Button
                                onClick={() => setShowLoginDialog(false)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2"
                            >
                                Cancel
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <footer className="relative z-10 flex flex-wrap justify-center gap-4 pt-12 pb-8">
                    {[
                        "Personalized",
                        "AI-Powered",
                        "Instant Results",
                        "Budget-Friendly",
                    ].map((feature) => (
                        <div
                            key={feature}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 backdrop-blur-sm"
                        >
                            {feature}
                        </div>
                    ))}
                </footer>
            </div>
        </main>
    );
}
