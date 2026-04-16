import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BFF_INTERNAL_URL = "http://bff:3000";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id");
  const bffUrl = process.env.BFF_INTERNAL_URL ?? DEFAULT_BFF_INTERNAL_URL;

  const headers: Record<string, string> = {};
  if (requestId) {
    headers["x-request-id"] = requestId;
  }

  try {
    const response = await fetch(`${bffUrl}/auth/google/start`, {
      method: "GET",
      headers,
      redirect: "manual",
      cache: "no-store",
    });

    const location = response.headers.get("location");
    if (!location) {
      return NextResponse.json(
        {
          code: "missing_redirect_location",
          message: "BFF did not return a redirect location",
        },
        { status: 502 },
      );
    }

    return NextResponse.redirect(location, 302);
  } catch {
    return NextResponse.json(
      {
        code: "bff_unreachable",
        message: "Unable to reach BFF service",
      },
      { status: 502 },
    );
  }
}
