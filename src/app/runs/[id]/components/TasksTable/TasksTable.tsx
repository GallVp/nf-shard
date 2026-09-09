import React, { useEffect, useMemo, useState } from "react"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table"
import { Container, TaskStatusTag } from "@/app/components"
import { formatDuration, fullDateTime, MIN_TASK_SEARCH_LENGTH } from "@/common"
import { Task } from "@prisma/client"
import bytes from "bytes"

type TasksTableProps = {
	tasks: Task[]
	taskCount: number
	pageIndex: number
	pageSize: number
	search: string
	onPageChange: (pageIndex: number) => void
	onPageSizeChange: (pageSize: number) => void
	onSearchChange: (search: string) => void
	className?: string
	onTaskClick: (task: Task) => void
}

const columnHelper = createColumnHelper<Task>()

const columns = [
	columnHelper.accessor((row) => row.data.status, {
		id: "status",
		header: "Status",
		cell: (info) => <TaskStatusTag status={info.getValue().toLowerCase()} />,
	}),
	columnHelper.accessor((row) => row.data.process, {
		id: "process",
		header: "Process",
	}),
	columnHelper.accessor((row) => row.data.duration, {
		id: "duration",
		header: "Duration",
		cell: (info) => formatDuration(info.getValue(), "ms"),
	}),
	columnHelper.accessor((row) => row.data.realtime, {
		id: "realtime",
		header: "Realtime",
		cell: (info) => formatDuration(info.getValue(), "ms"),
	}),
	columnHelper.accessor((row) => row.data.pcpu, {
		id: "pcpu",
		header: "% CPU",
	}),
	columnHelper.accessor((row) => row.data.pmem, {
		id: "pmem",
		header: "% Memory",
	}),
	columnHelper.accessor((row) => row.data.tag, {
		id: "tag",
		header: "Tag",
	}),
	columnHelper.accessor("id", {
		header: "Task Id",
	}),
	columnHelper.accessor((row) => row.data.hash, {
		id: "hash",
		header: "Hash",
	}),
	columnHelper.accessor((row) => row.data.exit, {
		id: "exit",
		header: "Exit",
	}),
	columnHelper.accessor((row) => row.data.container, {
		id: "container",
		header: "Container",
	}),
	columnHelper.accessor((row) => row.data.nativeId, {
		id: "nativeId",
		header: "Native Id",
	}),
	columnHelper.accessor((row) => row.data.submit, {
		id: "submit",
		header: "Submitted",
		cell: (info) => fullDateTime(info.getValue()),
	}),
	columnHelper.accessor((row) => row.data.peakRss, {
		id: "peakRss",
		header: "Peak RSS",
		cell: (info) => bytes(info.getValue() ?? 0),
	}),
	columnHelper.accessor((row) => row.data.peakVmem, {
		id: "peakVmem",
		header: "Peak VMEM",
		cell: (info) => bytes(info.getValue() ?? 0),
	}),
	columnHelper.accessor((row) => row.data.rchar, {
		id: "rchar",
		header: "rchar",
		cell: (info) => bytes(info.getValue()),
	}),
	columnHelper.accessor((row) => row.data.wchar, {
		id: "wchar",
		header: "wchar",
		cell: (info) => bytes(info.getValue()),
	}),
	columnHelper.accessor((row) => row.data.volCtxt, {
		id: "volCtxt",
		header: "vol_ctxt",
	}),
	columnHelper.accessor((row) => row.data.invCtxt, {
		id: "invCtxt",
		header: "inv_ctxt",
	}),
]

export const TasksTable = ({
	tasks,
	taskCount,
	pageIndex,
	pageSize,
	search,
	onPageChange,
	onPageSizeChange,
	onSearchChange,
	className,
	onTaskClick,
}: TasksTableProps) => {
	const data = useMemo(() => tasks, [tasks])
	const [searchInput, setSearchInput] = useState(search)
	const [sorting, setSorting] = useState<SortingState>([])

	useEffect(() => {
		setSearchInput(search)
	}, [search])

	useEffect(() => {
		const term = searchInput.trim()

		if (term === search.trim() || (term.length > 0 && term.length < MIN_TASK_SEARCH_LENGTH)) {
			return
		}

		const timeoutId = setTimeout(() => {
			onSearchChange(term)
		}, 300)

		return () => clearTimeout(timeoutId)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchInput])

	const pageCount = Math.max(Math.ceil(taskCount / pageSize), 1)

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
		manualFiltering: true,
		pageCount,
		state: {
			pagination: { pageIndex, pageSize },
			sorting,
		},
		onSortingChange: setSorting,
	})

	const isSearchTooShort = searchInput.trim().length > 0 && searchInput.trim().length < MIN_TASK_SEARCH_LENGTH

	return (
		<Container
			sectionName="Tasks"
			className={className}
			headerChildren={
				<div>
					<div className="relative">
						<input
							id="search"
							name="search"
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder={`Search status, process, tag (min ${MIN_TASK_SEARCH_LENGTH} letters)`}
							className="peer block w-64 border-0 bg-gray-50 py-1.5 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6"
						/>
						<div
							aria-hidden="true"
							className="absolute inset-x-0 bottom-0 border-t border-gray-300 peer-focus:border-t-2 peer-focus:border-indigo-600"
						/>
					</div>
					{isSearchTooShort && (
						<div className="text-xs text-gray-400 pt-1">Type at least {MIN_TASK_SEARCH_LENGTH} letters to search</div>
					)}
				</div>
			}
		>
			<div className="overflow-x-auto">
				<table className="table-auto w-full text-black">
					<thead className="text-xs font-semibold uppercase text-gray-400 bg-gray-50">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="p-2 whitespace-nowrap">
										{header.isPlaceholder ? null : (
											<div
												className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
												onClick={header.column.getToggleSortingHandler()}
												title={
													header.column.getCanSort()
														? header.column.getNextSortingOrder() === "asc"
															? "Sort ascending"
															: header.column.getNextSortingOrder() === "desc"
															? "Sort descending"
															: "Clear sort"
														: undefined
												}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
												{{
													asc: " ▲",
													desc: " ▼",
												}[header.column.getIsSorted() as string] ?? null}
											</div>
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="text-sm divide-y divide-gray-100">
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onTaskClick(row.original)}>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="p-2 whitespace-nowrap">
										<div className={cell.column.id === "process" ? "text-left" : "text-center"}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</div>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="flex items-center justify-between pt-3 text-xs text-gray-500">
				<div>
					Showing{" "}
					{taskCount === 0 ? 0 : pageIndex * pageSize + 1}
					{"-"}
					{Math.min((pageIndex + 1) * pageSize, taskCount)} of {taskCount} tasks
				</div>

				<div className="flex items-center gap-2">
					<select
						value={pageSize}
						onChange={(e) => onPageSizeChange(Number(e.target.value))}
						className="border-gray-300 rounded text-xs"
					>
						{[25, 50, 100, 250].map((size) => (
							<option key={size} value={size}>
								{size} / page
							</option>
						))}
					</select>

					<button
						className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
						onClick={() => onPageChange(pageIndex - 1)}
						disabled={pageIndex <= 0}
					>
						Previous
					</button>

					<span>
						Page {pageIndex + 1} of {pageCount}
					</span>

					<button
						className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
						onClick={() => onPageChange(pageIndex + 1)}
						disabled={pageIndex + 1 >= pageCount}
					>
						Next
					</button>
				</div>
			</div>
		</Container>
	)
}
