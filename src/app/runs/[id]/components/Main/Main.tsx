"use client"

import { toast } from "react-hot-toast"
import { ProcessKeys, Progress, Task, Workflow, Workspace } from "@prisma/client"
import {
	AggregateStats,
	CodeText,
	Configuration,
	DataViewer,
	General,
	MentionedResources,
	MetricsOverview,
	Processes,
	Status,
	TaskDetails,
	TasksTable,
	Utilisation,
	WorkflowDetails,
} from ".."
import { Tabs } from "@/app/components/Tabs/Tabs"
import { RunResponse } from "@/app/api/runs/[id]/types"
import { RunAggregateResponse } from "@/app/api/runs/[id]/aggregate/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SlideOver, Spinner } from "@/app/components"
import { workflowStatus } from "@/common/index"
import { LogsContainer } from "@/app/components/LogsContainer/LogsContainer"
import { useSubscription } from "urql"
import { Log, StreamLogsDocument } from "@/generated/graphql/graphql"
import { TaskAggregate } from "@/services/prisma"

const DEFAULT_TASK_PAGE_SIZE = 25

type MetricsStatus = "idle" | "loading" | "loaded"

type PageProps = {
	workflow: Workflow
	tasks: Task[]
	taskCount: number
	progress?: Progress | null
	workspace?: Workspace | null
	processsKey?: ProcessKeys | null
}

export const MainRun = (props: PageProps) => {
	const [workflow, setWorkflow] = useState<Workflow>(props.workflow)
	const [tasks, setTasks] = useState<Task[]>(props.tasks)
	const [taskCount, setTaskCount] = useState<number>(props.taskCount)
	const [taskAggregate, setTaskAggregate] = useState<TaskAggregate>()
	const [metricsStatus, setMetricsStatus] = useState<MetricsStatus>("idle")
	const [progress, setProgress] = useState<Progress | undefined | null>(props.progress)
	const [taskPageIndex, setTaskPageIndex] = useState(0)
	const [taskPageSize, setTaskPageSize] = useState(DEFAULT_TASK_PAGE_SIZE)
	const [taskSearch, setTaskSearch] = useState("")
	const [showMetricsGraph, setShowMetricsGraph] = useState(false)
	const tasksRef = useRef<Task[]>()
	const shouldPoll = useRef<boolean>(true)
	const [selectedTask, setselectedTask] = useState<Task | undefined>()
	const [newLogSub] = useSubscription({
		query: StreamLogsDocument,
		variables: { runName: workflow.runName },
	})
	const [logs, setLogs] = useState<Log[]>([])

	const status = useMemo(() => {
		return workflowStatus(workflow)
	}, [workflow])

	const loadTasks = useCallback(
		async (opts: { pageIndex: number; pageSize: number; search: string }) => {
			const params = new URLSearchParams({
				taskSkip: String(opts.pageIndex * opts.pageSize),
				taskTake: String(opts.pageSize),
			})

			if (opts.search) {
				params.set("taskSearch", opts.search)
			}

			const response = await fetch(`/api/runs/${workflow.id}?${params.toString()}`, {
				cache: "no-store",
			})
			const result: RunResponse = await response.json()

			setWorkflow(result.workflow)
			setTasks(result.tasks)
			setTaskCount(result.taskCount)
			setProgress(result.progress)
			setTaskPageIndex(opts.pageIndex)
			setTaskPageSize(opts.pageSize)
			setTaskSearch(opts.search)

			if (result.workflow.complete) {
				shouldPoll.current = false
			}
		},
		[workflow.id]
	)

	const onTaskPageChange = (pageIndex: number) => {
		loadTasks({ pageIndex, pageSize: taskPageSize, search: taskSearch })
	}

	const onTaskPageSizeChange = (pageSize: number) => {
		loadTasks({ pageIndex: 0, pageSize, search: taskSearch })
	}

	const onTaskSearchChange = (search: string) => {
		loadTasks({ pageIndex: 0, pageSize: taskPageSize, search })
	}

	const loadTaskAggregate = useCallback(async () => {
		const response = await fetch(`/api/runs/${workflow.id}/aggregate`, {
			cache: "no-store",
		})
		const result: RunAggregateResponse = await response.json()

		setTaskAggregate(result.taskAggregate)
	}, [workflow.id])

	const onShowMetrics = async () => {
		setMetricsStatus("loading")
		await loadTaskAggregate()
		setMetricsStatus("loaded")
	}

	useEffect(() => {
		const intervalId = setInterval(() => {
			if (shouldPoll.current && !workflow.complete) {
				loadTasks({ pageIndex: taskPageIndex, pageSize: taskPageSize, search: taskSearch })

				if (metricsStatus === "loaded") {
					loadTaskAggregate()
				}
			}
		}, 5000)

		return () => {
			clearInterval(intervalId)
		}
	}, [loadTasks, loadTaskAggregate, metricsStatus, taskPageIndex, taskPageSize, taskSearch, workflow.complete])

	useEffect(() => {
		const previousTasks = tasksRef.current
		if (previousTasks) {
			const previousTasksById = new Map(previousTasks.map((t) => [t.id, t]))

			tasks.forEach((currentTask) => {
				const prevTask = previousTasksById.get(currentTask.id)

				if (!prevTask) {
					return
				}

				if (prevTask.data.status === "RUNNING" && currentTask.data.status === "COMPLETED") {
					toast.success(<div className="text-xs font-medium">{currentTask.data.name} completed</div>, {
						duration: 6000,
					})
				}
			})
		}

		tasksRef.current = tasks
	}, [tasks])

	useEffect(() => {
		console.log("sub", newLogSub)
		if (newLogSub.data) {
			const log = newLogSub.data.streamLogs
			setLogs((prev) => [...prev, log])
			console.log(log.message)
		}
	}, [newLogSub, workflow.runName])

	const tabs = [
		{
			name: "Command",
			content: <CodeText code={workflow?.commandLine || ""} />,
		},
		{
			name: "Parameters",
			content: <DataViewer data={workflow?.params || ""} />,
		},
		{
			name: "Configuration",
			content: <Configuration files={workflow?.configFiles || []} configText={workflow?.configText || ""} />,
		},
		{
			name: "Resources",
			content: <MentionedResources data={workflow?.params} />,
		},
		{
			name: "Logs",
			content: <LogsContainer logs={logs} />,
		},
	]
	return (
		<>
			<SlideOver
				open={!!selectedTask}
				setOpen={function (status: Boolean): void {
					setselectedTask(undefined)
				}}
			>
				<>{selectedTask && <TaskDetails task={selectedTask} />}</>
			</SlideOver>

			<WorkflowDetails
				runName={workflow?.manifest.description || ""}
				workflowName={workflow?.runName || ""}
				projectName={workflow.projectName}
				className="mb-12"
				status={status}
				errorMessage={workflow.errorMessage}
				exitStatus={workflow.exitStatus}
				errorReport={workflow.errorReport}
				processKey={props.processsKey}
			/>

			<Tabs tabs={tabs} className="py-5 px-5" panelClassName="max-h-96" />

			<div className="md:grid md:grid-cols-2 md:gap-4 pt-8 grid-cols-1">
				{progress && <Status progress={progress} />}
				{metricsStatus === "loaded" && taskAggregate ? (
					<AggregateStats aggregate={taskAggregate} completedAt={workflow.complete} startedAt={workflow.start} />
				) : (
					<div className="flex flex-col items-center justify-center gap-3 rounded-md bg-white px-4 py-8 shadow">
						{metricsStatus === "loading" ? (
							<>
								<Spinner />
								<p className="text-sm text-gray-500">Loading metrics...</p>
							</>
						) : (
							<button
								type="button"
								onClick={onShowMetrics}
								className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
							>
								Show Usage Stats
							</button>
						)}
					</div>
				)}
			</div>

			<div className="md:grid md:grid-cols-2 md:gap-4 pt-8 grid-cols-1">
				<div>
					<General workflow={workflow} workspace={props.workspace} />
				</div>
				{metricsStatus === "loaded" && taskAggregate && (
					<div>
						<Utilisation
							aggregate={taskAggregate}
							peakCpus={workflow?.stats?.peakCpus ?? 0}
							loadCpus={workflow?.stats?.loadCpus ?? 0}
						/>
					</div>
				)}
			</div>

			<div className="pt-8">
				<div>{progress && <Processes processes={progress.processes} />}</div>
			</div>

			{(taskCount > 0 || taskSearch.length > 0) && (
				<TasksTable
					tasks={tasks}
					taskCount={taskCount}
					pageIndex={taskPageIndex}
					pageSize={taskPageSize}
					search={taskSearch}
					onPageChange={onTaskPageChange}
					onPageSizeChange={onTaskPageSizeChange}
					onSearchChange={onTaskSearchChange}
					className="mt-8"
					onTaskClick={setselectedTask}
				/>
			)}

			{workflow.metrics.length > 0 &&
				(showMetricsGraph ? (
					<MetricsOverview className="mt-8 h-full" metrics={workflow.metrics} />
				) : (
					<div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-md bg-white px-4 py-8 shadow">
						<button
							type="button"
							onClick={() => setShowMetricsGraph(true)}
							className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
						>
							Show Metrics
						</button>
					</div>
				))}
		</>
	)
}
