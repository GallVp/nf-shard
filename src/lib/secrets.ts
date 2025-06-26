const key = "032e6cde-c4a539f8-57e4aea1-95ea67f1"

export function verifyBasicToken(token: string) {
	try {
		const decodedToken = Buffer.from(token.trim(), 'base64').toString('utf-8').trim()
		return decodedToken == key || decodedToken == `@token:${key}`
	} catch (e) {
		return null
	}
}
