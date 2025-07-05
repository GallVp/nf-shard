import { SignJWT, jwtVerify, JWTPayload } from "jose"
import { logger } from "./logger"
import sha256 from 'crypto-js/sha256'

export const defaultTokenSecret = process.env.DEFAULT_ACCESS_TOKEN
const appSecretKey = new TextEncoder().encode(process.env.APP_SECRET_KEY)
const appSecretAlgorithm = "HS256"
const userName = process.env.APP_USERNAME || "nf-shard"
const userPassword = process.env.APP_PASSWORD

export async function verifyAPIToken(base64APIToken: string, address: string, workspaceId: string | null) {

	if (!defaultTokenSecret) {
		logger.warn('The default access token is not defined in the environment. Rejecting token verification!')
		return null
	}

	if (!workspaceId) {
		logger.debug('No workspaceId provided, using default access token for verification')
		const shaOfToken = sha256(defaultTokenSecret).toString()
		return verifyAPITokenAgainstTarget(base64APIToken, shaOfToken)
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

export async function verifyAPITokenAgainstTarget(base64APIToken: string, shaOfTargetToken: string) {
	try {
		const decodedToken = Buffer.from(base64APIToken.trim(), 'base64').toString('utf-8').trim().replace("@token:", "")
		const shaOfDecodedToken = sha256(decodedToken).toString()
		return shaOfDecodedToken === shaOfTargetToken
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

	// Empty tokens are not supported by jwtVerify
	// Error: DataError: Zero-length key is not supported
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

	if (!userPassword) {
		logger.warn('User password is not defined in the environment. Rejecting credential verification!')
		return false
	}

	return username === userName && password === userPassword
}

