import { NextResponse } from "next/server";

export default function () {
  const response = NextResponse.next();
  response.headers.set("X-From-Src-Middleware-TS", "true");
  return response;
}
