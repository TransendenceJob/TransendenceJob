"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
    onLogin: () => void;
};

export default function SearchHandler({ onLogin }: Props) {
    const searchParams = useSearchParams();
    const showLogin = searchParams.get("showLogin");

    useEffect(() => {
        if (showLogin === "true") {
            onLogin();
        }
    }, [showLogin, onLogin]);

    return null;
}