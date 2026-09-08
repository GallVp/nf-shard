import { prisma } from "@/services/prisma/prisma"
import { Prisma, Task } from "@prisma/client"
import { MIN_TASK_SEARCH_LENGTH } from "@/common"

interface BigInt {
	/** Convert to BigInt to string form in JSON.stringify */
	toJSON: () => string
}

// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
	return this.toString()
}

export const WorkflowById = async (id: string, includeWorkspace?: boolean) => {
	const workflow = await prisma.workflow.findUnique({
		where: {
			id: id,
		},
		include: {
			progress: true,
			workspace: includeWorkspace ?? false,
		},
	})

	return workflow
}

const TASK_SEARCH_FIELDS = ["status", "process", "tag", "hash", "name", "container", "nativeId"] as const

const taskSearchCondition = (term: string) => {
	const pattern = `%${term}%`

	return Prisma.sql`(${Prisma.join(
		TASK_SEARCH_FIELDS.map((field) => Prisma.sql`(data ->> ${field}) ILIKE ${pattern}`),
		" OR "
	)})`
}

export const TasksByWorkflowId = async (
	workflowId: string,
	opts?: { skip?: number; take?: number; search?: string }
) => {
	const skip = opts?.skip ?? 0
	const take = opts?.take ?? 25
	const term = opts?.search?.trim()

	if (!term || term.length < MIN_TASK_SEARCH_LENGTH) {
		const where: Prisma.TaskWhereInput = { workflowId }

		const [tasks, totalCount] = await Promise.all([
			prisma.task.findMany({
				where,
				orderBy: { taskId: "asc" },
				skip,
				take,
			}),
			prisma.task.count({ where }),
		])

		return { tasks, totalCount }
	}

	const condition = taskSearchCondition(term)

	const [tasks, countRows] = await Promise.all([
		prisma.$queryRaw<Task[]>(Prisma.sql`
			SELECT * FROM "Task"
			WHERE "workflowId" = ${workflowId} AND ${condition}
			ORDER BY "taskId" ASC
			LIMIT ${take} OFFSET ${skip}
		`),
		prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
			SELECT COUNT(*) AS count FROM "Task"
			WHERE "workflowId" = ${workflowId} AND ${condition}
		`),
	])

	return { tasks, totalCount: Number(countRows[0]?.count ?? 0) }
}

export type TaskAggregate = {
	cpuTimeHours: number
	totalMemory: number
	storageRead: number
	storageWrite: number
	memoryEfficiencyPct: number
	cpuEfficiencyPct: number
	completedTaskCount: number
	totalTaskCount: number
}

export const TaskAggregateByWorkflowId = async (workflowId: string): Promise<TaskAggregate> => {
	const rows = await prisma.$queryRaw<
		Array<{
			cpuTimeMs: number | null
			totalMemory: number | null
			storageRead: number | null
			storageWrite: number | null
			memoryReq: number | null
			memoryRss: number | null
			cpuTimeEffMs: number | null
			cpuLoadMs: number | null
			completedCount: bigint
			totalCount: bigint
		}>
	>(Prisma.sql`
		SELECT
			COALESCE(SUM((data ->> 'cpus')::float8 * COALESCE((data ->> 'realtime')::float8, 0)), 0) AS "cpuTimeMs",
			COALESCE(SUM((data ->> 'rss')::float8), 0) AS "totalMemory",
			COALESCE(SUM((data ->> 'rchar')::float8), 0) AS "storageRead",
			COALESCE(SUM((data ->> 'wchar')::float8), 0) AS "storageWrite",
			COALESCE(
				SUM((data ->> 'memory')::float8)
					FILTER (WHERE (data ->> 'memory') IS NOT NULL AND (data ->> 'peakRss') IS NOT NULL),
				0
			) AS "memoryReq",
			COALESCE(
				SUM((data ->> 'peakRss')::float8)
					FILTER (WHERE (data ->> 'memory') IS NOT NULL AND (data ->> 'peakRss') IS NOT NULL),
				0
			) AS "memoryRss",
			COALESCE(
				SUM((data ->> 'cpus')::float8 * COALESCE((data ->> 'realtime')::float8, 0))
					FILTER (
						WHERE (data ->> 'cpus') IS NOT NULL AND (data ->> 'realtime') IS NOT NULL AND (data ->> 'pcpu') IS NOT NULL
					),
				0
			) AS "cpuTimeEffMs",
			COALESCE(
				SUM((data ->> 'pcpu')::float8 / 100 * COALESCE((data ->> 'realtime')::float8, 0))
					FILTER (
						WHERE (data ->> 'cpus') IS NOT NULL AND (data ->> 'realtime') IS NOT NULL AND (data ->> 'pcpu') IS NOT NULL
					),
				0
			) AS "cpuLoadMs",
			COUNT(*) FILTER (WHERE data ->> 'status' = 'COMPLETED') AS "completedCount",
			COUNT(*) AS "totalCount"
		FROM "Task"
		WHERE "workflowId" = ${workflowId}
	`)

	const row = rows[0]

	const memoryReq = row?.memoryReq ?? 0
	const cpuTimeEffMs = row?.cpuTimeEffMs ?? 0
	const totalTaskCount = Number(row?.totalCount ?? 0)

	return {
		cpuTimeHours: (row?.cpuTimeMs ?? 0) / (3600 * 1000),
		totalMemory: row?.totalMemory ?? 0,
		storageRead: row?.storageRead ?? 0,
		storageWrite: row?.storageWrite ?? 0,
		memoryEfficiencyPct: memoryReq === 0 ? 0 : ((row?.memoryRss ?? 0) / memoryReq) * 100,
		cpuEfficiencyPct: cpuTimeEffMs === 0 ? 0 : ((row?.cpuLoadMs ?? 0) / cpuTimeEffMs) * 100,
		completedTaskCount: Number(row?.completedCount ?? 0),
		totalTaskCount,
	}
}

export const GetWorkflows = async (skip?: number, workspace_id?: number) => {
	const workflows = await prisma.workflow.findMany({
		take: 20,
		skip: skip,
		orderBy: {
			updatedAt: "desc",
		},
		where: {
			workspaceId: workspace_id,
		},
	})

	return workflows
}

export const DeleteWorkflow = async (id: string) => {
	await prisma.workflow.delete({
		where: {
			id: id,
		},
	})
}
