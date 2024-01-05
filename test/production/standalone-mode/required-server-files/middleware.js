import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";

export async function middleware(req) {
  console.log("middleware", req.url);
  if (req.nextUrl.pathname === "/a-non-existent-page/to-test-with-middleware") {
    return new ImageResponse(<div>Hello world</div>, {
      width: 1200,
      height: 600,
    });
  }
  return NextResponse.next();
}
