"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";

export default function SignInPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCredentialsSignIn() {
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            redirect: false, // prevent automatic redirect
            email,
            password,
        });

        setLoading(false);

        if (res?.error) {
            setError("Invalid email or password.");
        } else {
            router.push("/account");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0b1120] via-[#030712] to-black px-6">
            <Card className="bg-[#0b1120] p-8 rounded-xl shadow-lg max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl text-white text-center">
                        Sign In
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
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

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <Button
                        onClick={handleCredentialsSignIn}
                        disabled={loading}
                        variant="secondary"
                        size="lg"
                        className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300"
                    >
                        {loading ? "Signing In..." : "Sign In with Email"}
                    </Button>
                </CardContent>

                <CardContent className="p-7">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => signIn("google")}
                    >
                        <FcGoogle />
                        Sign In with Google
                    </Button>
                </CardContent>

                <div className="px-7">
                    <Separator />
                </div>

                <CardContent className="p-7">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => signIn("facebook")}
                    >
                        <FaFacebook />
                        Sign In with Facebook
                    </Button>
                </CardContent>

                <div className="px-7">
                    <Separator />
                </div>

                <CardContent className="px-5 text-center">
                    <p className="text-gray-400 text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/sign-up" className="text-cyan-400">
                            Sign Up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
