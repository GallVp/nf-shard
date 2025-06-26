import { NextRequest, NextResponse } from 'next/server'
import { verifyBasicToken } from '@/lib/secrets'
import { logger } from '@/lib/logger'

export async function middleware(req: NextRequest) {

	const ip = req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'
  const referer = req.headers.get('referer') ?? 'unknown'
  const host = req.headers.get('host') ?? 'unknown'
  const proto = req.headers.get('x-forwarded-proto') ?? 'unknown'
	const sourceInfo = `IP=${ip} Host=${host} Proto=${proto} Referer=${referer} UA="${userAgent}"`

	const { pathname } = req.nextUrl
	const authHeader = req.headers.get('authorization')
	const tokenType = authHeader?.split(' ')[0]
	const token = authHeader?.split(' ')[1]

	logger.debug(`Middleware received path: ${pathname}, tokenType: ${tokenType}`)

	if (!token) {
		logger.warn(`Middleware received a request without a token from: ${sourceInfo}`)
		return NextResponse.json({ error: 'Missing token' }, { status: 401 })
	}

	if (tokenType?.toLocaleLowerCase() != 'basic') {
		logger.warn(`Middleware received non-Basic token from: ${sourceInfo}`)
		return NextResponse.json({ error: 'Unauthorized! Only Basic tokens are supported' }, { status: 401 })
	}

	const result = verifyBasicToken(token)
	if (!result) {
		logger.warn(`Middleware received a bad token from: ${sourceInfo}`)
		return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/api/trace/:path*']
}
