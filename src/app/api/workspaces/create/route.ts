import { NextResponse } from "next/server"
import { createWorkspace, getAllWorkspaces } from "@/services/prisma"
import { prisma } from "@/services"

type TCreateWorkspace = {
	name: string
	accessToken: string
}

export async function POST(request: Request) {
	const requestJson: TCreateWorkspace = await request.json()

	const exists = await prisma.workspace.findUnique({ where: { name: requestJson.name } })

	if (exists) {
		return NextResponse.json({ error: 'A workspace with that name already exists.' }, { status: 409 })
	}


	try {
		await createWorkspace(requestJson.name, requestJson.accessToken)
		const workspaces = await getAllWorkspaces()
		return NextResponse.json(workspaces)
	} catch (e: any) {
		return NextResponse.json({ error: e }, { status: 500 })
	}
}
