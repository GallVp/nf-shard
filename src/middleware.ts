import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from './lib/secrets'
import { verifyAPIToken } from '@/lib/secrets'
import { logger } from '@/lib/logger'

const publicPaths = ['/signin', '/api/signin', '/api/auth']

export async function middleware(req: NextRequest) {

	// Skip public paths
	const { pathname } = req.nextUrl
	if (publicPaths.includes(pathname)) {
		logger.debug(`Middleware skipping public path: ${pathname}`)
		return NextResponse.next()
	}

	const ip = req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
	const userAgent = req.headers.get('user-agent') ?? 'unknown'
	const referer = req.headers.get('referer') ?? 'unknown'
	const host = req.headers.get('host') ?? 'unknown'
	const proto = req.headers.get('x-forwarded-proto') ?? 'unknown'
	const address = `${proto}://${host}`
	const sourceInfo = `IP=${ip} Host=${host} Proto=${proto} Referer=${referer} UA="${userAgent}"`

	const authHeader = req.headers.get('authorization')
	const apiToken = authHeader?.split(' ')[1]
	const sessionToken = req.cookies.get('token')?.value
	const workspaceId = req.nextUrl.searchParams.get('workspaceId')

	logger.debug(`Middleware received path: ${pathname}, apiToken: ${!!apiToken}, sessionToken: ${!!sessionToken} `)


	if (apiToken && !pathname.startsWith('/api/')) {
		logger.warn(`Middleware received an API token on a non-API path: ${sourceInfo}`)
		return NextResponse.json({ error: 'Non-api path accessed with an API token' }, { status: 400 })
	}

	const apiTokenIsValid = apiToken && await verifyAPIToken(apiToken, address, workspaceId)


	if (apiTokenIsValid && pathname.startsWith('/api/')) {
		logger.debug(`Middleware received a valid API token from: ${sourceInfo}`)
		return NextResponse.next()
	}

	if (apiToken && !apiTokenIsValid) {
		logger.warn(`Middleware received an invalid API token from: ${sourceInfo}`)
		return NextResponse.json({ error: 'Invalid or expired API token' }, { status: 401 })
	}

	const sessionTokenIsValid = sessionToken && await verifyJWT(sessionToken)

	if (sessionTokenIsValid) {
		logger.debug(`Middleware received a valid session token from: ${sourceInfo}`)
		return NextResponse.next()
	}

	if (sessionToken && !sessionTokenIsValid) {
		logger.info(`Middleware received an invalid session token from: ${sourceInfo}`)
		logger.info('Redirecting to /signin')
		return NextResponse.redirect(new URL('/signin', req.url))
	}

	logger.debug('No token received, redirecting to /signin')
	return NextResponse.redirect(new URL('/signin', req.url))
}

export const config = {
	matcher: ['/((?!_next|static|favicon.ico|logo.png).*)'],
}

