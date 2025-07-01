import { SignJWT, jwtVerify, JWTPayload } from "jose"

const tokenSecret = "032e6cde-c4a539f8-57e4aea1-95ea67f1"
const appSecretKey = new TextEncoder().encode(process.env.APP_SECRET_KEY)
const appSecretAlgorithm = "HS256"
const userName = process.env.APP_USERNAME || "nf-shard"
const userPassword = process.env.APP_PASSWORD || "nf-shard"

export function verifyBasicToken(token: string) {
	try {
		const decodedToken = Buffer.from(token.trim(), 'base64').toString('utf-8').trim()
		return decodedToken == tokenSecret || decodedToken == `@token:${tokenSecret}`
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

