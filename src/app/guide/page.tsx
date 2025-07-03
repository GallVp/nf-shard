import { Main } from "./components"
import { Workspace } from "@prisma/client"
import { getAllWorkspaces } from "@/services/prisma"
import { defaultTokenSecret } from "@/lib/secrets"

export default async function Page() {
	const props = await getData()
	return <Main workspaces={props.workspaces} />
}

const getData = async () => {
	let workspaces: Workspace[] = []

	try {
		workspaces = await getAllWorkspaces()
	} catch (e) {
		console.error(e)
	}

	return {
		workspaces: [{ id: 0, name: "Default", accessToken: defaultTokenSecret || 'Token is not set. The default workspace is locked!' }, ...workspaces],
	}
}

export const fetchCache = "force-no-store"
export const revalidate = 0
