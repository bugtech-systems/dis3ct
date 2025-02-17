import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl.pathname;

    // Increase limit only for specific API routes
    if (url.startsWith("/api/contacts/bulk/area")) {
        req.headers.set("Content-Length", "10mb"); // Set 10MB limit
    }

    return NextResponse.next();
}
