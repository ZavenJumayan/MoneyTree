"use client"

import {signOut,} from "next-auth/react";

type Message={ sender: "user" | "ai"; text: string; };
interface Trip {
    name: string;
    location?: string;
    description?: string;
}




import {MapPin, Sparkles, User} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useState} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {Input} from "@/components/ui/input";
import { useRouter} from "next/navigation";



export default  function AccountPage() {

    const [showModal, setShowModal] = useState(false);
    const [duration, setDuration] = useState("");
    const [money, setMoney] = useState("");
    const [startDate, setStartDate] = useState("");
    const [moodText, setMoodText] = useState("");
    const [finalInput, setFinalInput] = useState("");
    const[showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [loading, setLoading] = useState(false);



    const handleGenerateClick = () => setShowModal(true);

    const handleSubmit = async () => {
        if (!moodText.trim()) {
            alert("Please describe how you're feeling!");
            return;
        }

        setLoading(true);
        setFinalInput(`Trip for ${duration} days, budget $${money}, starting on ${startDate}`);
        setShowModal(false);
        setShowChat(true);

        // Combine all form data into a message
        let userMessage = moodText;
        if (duration) userMessage += ` for ${duration} days`;
        if (money) userMessage += ` with a budget of $${money}`;
        if (startDate) userMessage += ` starting on ${startDate}`;

        // Add user message to chat
        setChatMessages([{ sender: "user", text: userMessage }]);

        try {
            // Call the recommendation API
            const response = await fetch("/api/reccomend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: userMessage }),
            });

            if (!response.ok) {
                throw new Error("Failed to get recommendations");
            }

            const data = await response.json();

            // Format the AI response with recommendations
            let aiResponse = `🎯 Detected Mood: ${data.mood}\n\n`;
            aiResponse += `📊 Emotional Analysis:\n`;
            aiResponse += `• Positivity: ${(data.vad.valence * 100).toFixed(0)}%\n`;
            aiResponse += `• Energy Level: ${(data.vad.arousal * 100).toFixed(0)}%\n`;
            aiResponse += `• Control: ${(data.vad.dominance * 100).toFixed(0)}%\n\n`;

            if (data.trips && data.trips.length > 0) {
                aiResponse += `🌟 Recommended Trips (${data.trips.length}):\n\n`;
                data.trips.forEach((trip: Trip, index: number) => {
                    aiResponse += `${index + 1}. ${trip.name}`;
                    if (trip.location) aiResponse += ` - ${trip.location}`;
                    aiResponse += `\n   ${trip.description}\n\n`;
                });
            } else {
                aiResponse += `⚠️ No trips found for this mood. Try describing your feelings differently!`;
            }

            setChatMessages((prev) => [
                ...prev,
                { sender: "ai", text: aiResponse },
            ]);
        } catch (error) {
            setChatMessages((prev) => [
                ...prev,
                { sender: "ai", text: `❌ Error: ${error instanceof Error ? error.message : "Failed to get recommendations"}` },
            ]);
        } finally {
            setLoading(false);
        }
    };
    const handleSendMessage = async () => {
        if (!chatInput.trim() || loading) return;

        setChatMessages([...chatMessages, { sender: "user", text: chatInput }]);
        const currentInput = chatInput;
        setChatInput("");
        setLoading(true);

        try {
            // Call API with the chat message
            const response = await fetch("/api/reccomend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: currentInput }),
            });

            if (!response.ok) {
                throw new Error("Failed to get recommendations");
            }

            const data = await response.json();

            let aiResponse = `🎯 Mood: ${data.mood}\n\n`;
            if (data.trips && data.trips.length > 0) {
                aiResponse += `🌟 Recommended Trips:\n\n`;
                data.trips.slice(0, 3).forEach((trip: Trip, index: number) => {
                    aiResponse += `${index + 1}. ${trip.name}`;
                    if (trip.location) aiResponse += ` (${trip.location})`;
                    aiResponse += `\n   ${trip.description}\n\n`;
                });
            } else {
                aiResponse += `No specific trips found, but I understand you're feeling ${data.mood}.`;
            }

            setChatMessages((prev) => [
                ...prev,
                { sender: "ai", text: aiResponse },
            ]);
        } catch (error) {
            setChatMessages((prev) => [
                ...prev,
                { sender: "ai", text: `❌ Error: ${error instanceof Error ? error.message : "Failed to get recommendations"}` },
            ]);
        } finally {
            setLoading(false);
        }
    };
    const router = useRouter();
    return (

        <main className="pt-0">
            <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Link href="/">
                            <span className="text-xl font-semibold text-cyan-400">Wiymood</span>
                        </Link>
                    </div>


                    <div className="flex items-center space-x-3">
                        <Link href="/account">
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-900"
                            >
                                <User className="w-5 h-5" />
                                Account
                            </Button>
                        </Link>
                        <Button
                            onClick={() => {
                                void (async () => {
                                    await signOut({ redirect: false }); // clear session
                                    setTimeout(() => router.replace("/"), 100);
                                })();
                            }}
                            variant="ghost"
                            className="border border-red-500/50 text-red-400 hover:bg-red-900"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="relative min-h-screen flex items-center justify-center px-6 pt-4 bg-gradient-to-b from-[#0b1120] via-[#030712] to-black">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative text-center max-w-4xl mx-auto space-y-8">
                    <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-400/20 rounded-full px-4 py-2 mb-6">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-cyan-300">AI-Powered Travel Planning</span>
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
                    <Link href="/my-app/public">Login</Link>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                        Answer a few quick questions about how you&apos;re feeling and what you&apos;re looking for,
                        and let our AI create a personalized travel itinerary just for you.
                    </p>

                    <div className="pt-6">
                        <Button
                            size="lg"
                            onClick={handleGenerateClick}
                            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-cyan-500/50 transition-all duration-300 hover:shadow-cyan-500/70 hover:scale-105"
                        >
                            <MapPin className="w-5 h-5 mr-2" />
                            Generate Trip
                        </Button>
                    </div>
                    {finalInput && (
                        <div className="mt-6 text-white text-lg">{finalInput}</div>
                    )}

                    <AnimatePresence>
                        {showModal && (
                            <motion.div
                                className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="bg-gradient-to-r from-cyan-800 via-teal-800 to-gray-900 p-8 rounded-xl max-w-md w-full space-y-4 shadow-2xl"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                >
                                    <h2 className="text-xl font-mono text-cyan-400 text-center mb-2">Enter Trip Details</h2>
                                    <textarea
                                        placeholder="How are you feeling? (e.g., I feel excited and energetic, or I'm stressed and need to relax...)"
                                        value={moodText}
                                        onChange={(e) => setMoodText(e.target.value)}
                                        required
                                        className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-24 resize-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Duration (days)"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Budget ($)"
                                        value={money}
                                        onChange={(e) => setMoney(e.target.value)}
                                        className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button onClick={() => setShowModal(false)} className="bg-gray-700 hover:bg-gray-600">
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={handleSubmit} 
                                            disabled={loading || !moodText.trim()}
                                            className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50"
                                        >
                                            {loading ? "Loading..." : "Submit"}
                                        </Button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {showChat && (
                        <section className="fixed inset-0 z-50 flex flex-col bg-gray-900 text-white shadow-2xl rounded-xl max-w-3xl mx-auto mt-12 p-4">
                            <header className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-light text-cyan-400">AI Trip Planner Chat</h2>
                                <Button
                                    onClick={() => setShowChat(false)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                >
                                    Close
                                </Button>
                            </header>
                            {/* Messages area */}
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                {chatMessages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl max-w-[80%] ${
                                            msg.sender === "user" 
                                                ? "bg-cyan-600 ml-auto" 
                                                : "bg-teal-600 mr-auto"
                                        }`}
                                    >
                                        <pre className="whitespace-pre-wrap text-sm font-sans">
                                            {msg.text}
                                        </pre>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="bg-teal-600 p-4 rounded-xl max-w-[80%] mr-auto">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="animate-pulse">●</span>
                                            <span>Analyzing your mood...</span>
                                        </div>
                                    </div>
                                )}
                            </div>


                            <div className="flex gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
                                    placeholder="Type a message or describe your mood..."
                                    disabled={loading}
                                    className="flex-1 bg-gray-800 text-white placeholder-gray-400 focus:ring-cyan-500 disabled:opacity-50"
                                />
                                <Button 
                                    onClick={handleSendMessage} 
                                    disabled={loading || !chatInput.trim()}
                                    className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50"
                                >
                                    {loading ? "..." : "Send"}
                                </Button>
                            </div>
                        </section>
                    )}

                    <footer className="flex flex-wrap justify-center gap-4 pt-5">
                        {['Personalized', 'AI-Powered', 'Instant Results', 'Budget-Friendly'].map((feature) => (
                            <div
                                key={feature}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 backdrop-blur-sm"
                            >
                                {feature}
                            </div>
                        ))}
                    </footer>
                </div>
            </div>
        </main>
    );
}