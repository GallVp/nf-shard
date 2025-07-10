import { NextResponse } from 'next/server'
import { verifyAPITokenAgainstTarget } from '@/lib/secrets'
import { GetWorkspaceById } from '@/services/prisma'

export async function POST(req: Request) {
	const { workspaceId, base64APIToken } = await req.json()

	if (!workspaceId || !base64APIToken) {
		return NextResponse.json({ error: 'workspaceId and base64APIToken are required' }, { status: 400 })
	}

	const workspaceIdInt = parseInt(workspaceId)

	const workspace = await GetWorkspaceById(workspaceIdInt)

	if (!workspace) {
		return NextResponse.json({ error: 'workspaceId not found' }, { status: 401 })
	}

	const shaOfTargetToken = workspace.accessToken
	if (await verifyAPITokenAgainstTarget(base64APIToken, shaOfTargetToken)) {
		return NextResponse.json({ ok: true })
	}

	return NextResponse.json({ error: 'Bad token' }, { status: 401 })
}
