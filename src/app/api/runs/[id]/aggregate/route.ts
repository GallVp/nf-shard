import { NextResponse } from "next/server"
import { TaskAggregateByWorkflowId } from "@/services/prisma"

export async function GET(request: Request, { params }: any) {
	const id = params.id as string

	try {
		const taskAggregate = await TaskAggregateByWorkflowId(id)

		return NextResponse.json({ taskAggregate })
	} catch (e: any) {
		console.log(e)
		return NextResponse.json({ error: e }, { status: 500 })
	}
}
