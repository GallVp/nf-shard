import { ProcessKeyByRunName } from "@/services/prisma/processKeys"
import { MainRun } from "./components/Main/Main"
import { WorkflowById, TasksByWorkflowId } from "@/services/prisma"

const DEFAULT_TASK_PAGE_SIZE = 25

export default async function Page({ params }: { params: { id: string } }) {
	const { workflow, tasks, taskCount, progress, workspace, process } = await getData(params.id)

	if (!workflow) {
		return <p>Missing workflow</p>
	}

	return (
		<MainRun
			workflow={workflow}
			tasks={tasks}
			taskCount={taskCount ?? 0}
			progress={progress}
			workspace={workspace}
			processsKey={process}
		/>
	)
}

const getData = async (id: string) => {
	try {
		const workflow = await WorkflowById(id, true)
		const { tasks, totalCount } = await TasksByWorkflowId(id, { skip: 0, take: DEFAULT_TASK_PAGE_SIZE })

		const process = await ProcessKeyByRunName(workflow?.runName)

		return {
			isLoading: false,
			workflow: workflow,
			tasks: tasks,
			taskCount: totalCount,
			progress: workflow?.progress,
			workspace: workflow?.workspace,
			process: process,
		}
	} catch (e) {
		console.error(e)
	}

	return {
		isLoading: false,
		workflow: undefined,
	}
}
