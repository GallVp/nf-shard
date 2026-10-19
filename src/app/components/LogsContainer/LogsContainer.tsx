"use client"
import { useCallback, useEffect, useState } from "react"
import { Alert } from "@/components/ui/alert"
import { Log } from "@/generated/graphql/graphql"
import type { WorkflowLogsResponse } from "@/app/api/runs/[id]/logs/route"

type TProps = {
	logs?: Log[]
	workflowId?: string
}

export const LogsContainer = ({ logs, workflowId }: TProps) => {
	const [workflowLogs, setWorkflowLogs] = useState<WorkflowLogsResponse | null>(null)
	const [loading, setLoading] = useState<boolean>(false)
	const [activeSource, setActiveSource] = useState<"logFile" | "outFile">("logFile")

	const fetchWorkflowLogs = useCallback(async () => {
		if (!workflowId) {
			return
		}
		setLoading(true)
		try {
			const res = await fetch(`/api/runs/${workflowId}/logs`, {
				cache: "no-store",
			})
			if (res.ok) {
				const data: WorkflowLogsResponse = await res.json()
				setWorkflowLogs(data)
				if (data.logFile?.content) {
					setActiveSource("logFile")
				} else if (data.outFile?.content) {
					setActiveSource("outFile")
				}
			}
		} catch (e) {
			console.error("Failed to fetch workflow logs", e)
		} finally {
			setLoading(false)
		}
	}, [workflowId])

	useEffect(() => {
		fetchWorkflowLogs()
	}, [fetchWorkflowLogs])

	if (workflowId) {
		const selected = workflowLogs ? workflowLogs[activeSource] : null
		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<button
							type="button"
							onClick={() => setActiveSource("logFile")}
							className={`rounded-md px-2.5 py-1 text-xs font-medium ${
								activeSource === "logFile"
									? "bg-indigo-100 text-indigo-700"
									: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							}`}
						>
							.nextflow.log
						</button>
						{workflowLogs?.outFile && (
							<button
								type="button"
								onClick={() => setActiveSource("outFile")}
								className={`rounded-md px-2.5 py-1 text-xs font-medium ${
									activeSource === "outFile"
										? "bg-indigo-100 text-indigo-700"
										: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
								}`}
							>
								Console Output
							</button>
						)}
						{selected?.source && (
							<span className="font-mono text-xs text-gray-400">{selected.source}</span>
						)}
					</div>
					<button
						type="button"
						onClick={fetchWorkflowLogs}
						disabled={loading}
						className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
					>
						{loading ? "Loading..." : "Refresh"}
					</button>
				</div>

				{selected ? (
					<div>
						{selected.truncated && (
							<div className="mb-1 text-xs text-amber-600">
								Showing last 512 KB of {selected.source}
							</div>
						)}
						<Alert className="bg-gray-900 text-gray-100 max-h-80 overflow-auto">
							<pre className="font-mono text-xs whitespace-pre-wrap break-words">
								{selected.content || "(empty log file)"}
							</pre>
						</Alert>
					</div>
				) : (
					<div className="rounded-md bg-gray-50 p-4 text-xs text-gray-500">
						{loading
							? "Loading workflow logs..."
							: "No Nextflow log file found. For remote S3 runs, set TOWER_ALLOW_NEXTFLOW_LOGS=true, NXF_CLOUDCACHE_PATH, and NXF_LOG_FILE so Nextflow checkpoints logs to S3."}
					</div>
				)}
			</div>
		)
	}

	if (!logs || logs.length === 0) {
		return null
	}

	return (
		<Alert className="bg-gray-800 text-gray-100 max-h-96 overflow-auto">
			<div className="font-mono">
				{logs.map((log, index) => (
					<div key={index} className="flex">
						<pre className="flex-1 text-xs typing items-center">{log.message}</pre>
					</div>
				))}
			</div>
		</Alert>
	)
}
