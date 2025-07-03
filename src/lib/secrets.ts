import { SignJWT, jwtVerify, JWTPayload } from "jose"

const defaultTokenSecret = "032e6cde-c4a539f8-57e4aea1-95ea67f1"
const appSecretKey = new TextEncoder().encode(process.env.APP_SECRET_KEY)
const appSecretAlgorithm = "HS256"
const userName = process.env.APP_USERNAME || "nf-shard"
const userPassword = process.env.APP_PASSWORD || "nf-shard"


export async function verifyAPIToken(base64APIToken: string, address: string, workspaceId: string | null) {

	if (!workspaceId) {
		
		return verifyAPITokenAgainstTarget(base64APIToken, defaultTokenSecret)
	}

	const res = await fetch(`${address}/api/auth`, {
		body: JSON.stringify({ workspaceId: workspaceId, base64APIToken: base64APIToken }),
		method: "POST",
		cache: "no-store",
	})

	if (res.ok) {
		return true
	}

	return null
}

export async function verifyAPITokenAgainstTarget(base64APIToken: string, targetToken: string) {
	try {
		const decodedToken = Buffer.from(base64APIToken.trim(), 'base64').toString('utf-8').trim()
		return decodedToken == targetToken || decodedToken == `@token:${targetToken}`
	} catch (e) {
		return null
	}
}

export async function createJWTFromCredentials(payload: JWTPayload): Promise<string> {

	return new SignJWT(payload)
		.setProtectedHeader({ alg: appSecretAlgorithm })
		.setIssuedAt()
		.setExpirationTime("1h")
		.sign(appSecretKey)
}

export async function verifyJWT(token: string): Promise<any> {
	try {
		const { payload } = await jwtVerify(token, appSecretKey, {
			algorithms: [appSecretAlgorithm],
		})
		return payload
	} catch (error) {
		return null
	}

}

export function verifyCredentials(username: string, password: string): boolean {
	return username === userName && password === userPassword
}

