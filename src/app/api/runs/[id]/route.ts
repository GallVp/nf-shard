import { NextResponse } from "next/server"
import { WorkflowById, DeleteWorkflow, TasksByWorkflowId } from "@/services/prisma"

export async function GET(request: Request, { params }: any) {
	const id = params.id as string
	const { searchParams } = new URL(request.url)

	const taskSkip = Number(searchParams.get("taskSkip") ?? 0)
	const taskTake = Number(searchParams.get("taskTake") ?? 25)
	const taskSearch = searchParams.get("taskSearch") ?? undefined

	try {
		const workflow = await WorkflowById(id)
		const { tasks, totalCount } = await TasksByWorkflowId(id, {
			skip: taskSkip,
			take: taskTake,
			search: taskSearch,
		})

		return NextResponse.json({
			workflow: workflow,
			tasks: tasks,
			taskCount: totalCount,
			progress: workflow?.progress,
		})
	} catch (e: any) {
		console.log(e)
		return NextResponse.json({ error: e }, { status: 500 })
	}
}

export async function DELETE(request: Request, { params }: any) {
	const id = params.id as string
	try {
		await DeleteWorkflow(id)
		return NextResponse.json({ success: true })
	} catch (e: any) {
		console.log(e)
		return NextResponse.json({ error: e }, { status: 500 })
	}
}
