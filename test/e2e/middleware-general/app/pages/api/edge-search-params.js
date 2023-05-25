import { NextResponse } from 'next/server'

export const config = { runtime: 'edge' }

/**
 * @param {import('next/server').NextRequest}
 */
export default (req) => {
  return NextResponse.json(Object.fromEntries(req.nextUrl.searchParams))
}
