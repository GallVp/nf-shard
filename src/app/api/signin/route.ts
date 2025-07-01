import { NextResponse } from 'next/server'
import { createJWTFromCredentials, verifyCredentials } from '@/lib/secrets'

export async function POST(req: Request) {
	const { username, password } = await req.json()

	if (!username || !password) {
		return NextResponse.json({ error: 'username and password are required' }, { status: 400 })
	}

	if (verifyCredentials(username, password)) {
		const token = await createJWTFromCredentials({ username })

		const res = NextResponse.json({ ok: true })
		res.cookies.set('token', token, {
			httpOnly: true,
			path: '/',
			maxAge: 60 * 60, // 1 hour
		})

		return res
	}

	return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
