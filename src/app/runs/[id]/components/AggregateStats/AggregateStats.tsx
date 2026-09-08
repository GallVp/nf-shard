"use client"

import { clsx } from "clsx"
import { formatDifference } from "@common/utils/index"
import { TimerDisplayDynamic } from "@/app/components"
import { TaskAggregate } from "@/services/prisma"
const bytes = require("bytes")

type AggregateStatsProps = {
	aggregate: TaskAggregate
	startedAt?: Date | null
	completedAt?: Date | null
	className?: string
}

const AVERAGE_COST_PER_CPU_HOUR_USD = 0.1

export const AggregateStats: React.FC<AggregateStatsProps> = ({
	aggregate,
	completedAt,
	startedAt,
	className,
}: AggregateStatsProps) => {
	const costEstimate = aggregate.cpuTimeHours * AVERAGE_COST_PER_CPU_HOUR_USD

	return (
		<div>
			<dl className={clsx(className, "grid grid-cols-3 gap-5 px-4 md:px-0 mt-8 md:mt-0")}>
				<div className="overflow-hidden rounded-md bg-white px-4 py-5 shadow h-24">
					<dt className="truncate text-sm font-medium text-gray-500">Wall Time</dt>
					<dd className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
						{completedAt && <div>{formatDifference(startedAt, completedAt)}</div>}
						{!completedAt && <TimerDisplayDynamic startedAt={startedAt} />}
					</dd>
				</div>
				<div className="overflow-hidden rounded-md bg-white px-4 py-5 shadow h-24">
					<dt className="truncate text-sm font-medium text-gray-500">CPU time</dt>
					<dd className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
						{aggregate.cpuTimeHours.toFixed(2)} h
					</dd>
				</div>
				<div className="overflow-hidden rounded-md bg-white px-4 py-5 shadow h-24">
					<dt className="truncate text-sm font-medium text-gray-500">Total Memory</dt>
					<dd className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
						{bytes(aggregate.totalMemory, { unitSeparator: " " })}
					</dd>
				</div>
				<div className="overflow-hidden rounded-md bg-white px-4 py-5 shadow h-24">
					<dt className="truncate text-sm font-medium text-gray-500">Storage Read</dt>
					<dd className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
						{bytes(aggregate.storageRead, { unitSeparator: " " })}
					</dd>
				</div>
				<div className="overflow-hidden rounded-md bg-white px-4 py-5 shadow h-24">
					<dt className="truncate text-sm font-medium text-gray-500">Storage Write</dt>
					<dd className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
						{bytes(aggregate.storageWrite, { unitSeparator: " " })}
					</dd>
				</div>
				<div className="overflow-hidden rounded-md bg-white px-4 py-5 shadow h-24">
					<dt className="truncate text-sm font-medium text-gray-500">Estimated Cost</dt>
					<dd className="mt-1 text-xl font-semibold tracking-tight text-gray-900">$ {costEstimate.toFixed(3)}</dd>
				</div>
			</dl>
		</div>
	)
}
