"use client";

import "../globals.css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthLayout({
                                       children,
                                   }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    const [title, setTitle] = useState("Auth Page");

    useEffect(() => {
        if (pathname.includes("sign-in")) setTitle("Sign In");
        else if (pathname.includes("sign-up")) setTitle("Sign Up");
    }, [pathname]);

    return (
        <html lang="en">
        <head>
            <title>{title}</title>
        </head>
        <body className="bg-black">{children}</body>
        </html>
    );
}
