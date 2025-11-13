"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSignUp = async () => {
        setLoading(true);
        setMessage("");

        if (!name || !email || !password || !confirmPassword) {
            setMessage("Please fill in all fields.");
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Registration failed.");
            } else {
                setMessage(data.message || "Check your email to confirm your account.");
            }
        } catch (err) {
            console.error(err);
            setMessage("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1120] via-[#030712] to-black px-6">
            <Card className="bg-[#0b1120] rounded-xl shadow-lg max-w-md w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-white">Sign Up</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 px-4 py-2 rounded-md bg-[#0a0f1c] text-white border border-gray-700 focus:border-cyan-400 outline-none w-full"
                        />
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 px-4 py-2 rounded-md bg-[#0a0f1c] text-white border border-gray-700 focus:border-cyan-400 outline-none w-full"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 px-4 py-2 rounded-md bg-[#0a0f1c] text-white border border-gray-700 focus:border-cyan-400 outline-none w-full"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            placeholder="Repeat Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 px-4 py-2 rounded-md bg-[#0a0f1c] text-white border border-gray-700 focus:border-cyan-400 outline-none w-full"
                        />
                    </div>
                </CardContent>

                <CardContent className="p-5">
                    <Button
                        variant="secondary"
                        size="lg"
                        disabled={loading}
                        className="w-full"
                        onClick={handleSignUp}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </Button>
                    {message && (
                        <p className="text-center text-sm mt-3 text-cyan-300">{message}</p>
                    )}
                </CardContent>

                <CardContent className="flex flex-col gap-3 px-5">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => signIn("google", { callbackUrl: "/account" })}
                    >
                        <FcGoogle /> Sign Up with Google
                    </Button>
                    <Separator />
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => signIn("facebook", { callbackUrl: "/account" })}
                    >
                        <FaFacebook /> Sign Up with Facebook
                    </Button>
                </CardContent>

                <CardContent className="px-5 text-center">
                    <p className="text-gray-400 text-sm">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-cyan-400">
                            Sign In
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
