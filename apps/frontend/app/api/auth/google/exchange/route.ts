import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BFF_INTERNAL_URL = "http://bff:3000";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const requestId = request.headers.get("x-request-id");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (requestId) {
        headers["x-request-id"] = requestId;
    }

    const bffUrl = process.env.BFF_INTERNAL_URL ?? DEFAULT_BFF_INTERNAL_URL;

    try {
        const response = await fetch(`${bffUrl}/auth/google/exchange`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));

        return NextResponse.json(payload, {
            status: response.status,
        });
    } catch {
        return NextResponse.json(
            {
                code: "bff_unreachable",
                message: "Unable to reach BFF service",
            },
            {
                status: 502,
            },
        );
    }
}
