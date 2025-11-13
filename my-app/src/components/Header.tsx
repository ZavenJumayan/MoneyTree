"use client"
import {Button} from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";


export const Header=() => {
    return(

        <nav className="fixed top-0 left-0 right-0 z-40 bg-black backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Image src={'/logo.png'} alt={'logo'} width={40} height={40} />
                    <Link href='/'><span className="text-xl font-semibold text-blue-500">AI Trip Planner</span></Link>
                </div>
                <div className="flex items-center space-x-3">
                    <Button asChild  variant="ghost" className="border-white/20 hover:bg-blue-900 text-blue-500">
                        <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button variant="ghost" className="border-cyan-400/50 hover:bg-blue-900 text-blue-500">
                        <Link href="/sign-up">Sign Up</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}