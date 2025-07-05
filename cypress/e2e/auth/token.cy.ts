/// <reference types="cypress" />

describe('API ⁠— bearer token call', () => {

	it('returns HTTP 401 Invalid or expired API token', () => {
		const token = 'DummyToken'

		const resp = cy.request({
			method: 'GET',
			url: '/api/health',
			failOnStatusCode: false,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		}).then((resp) => {
			expect(resp.status).to.eq(401)
			expect(resp.statusText).to.eq('Unauthorized')
			expect(resp.body.error).to.eq('Invalid or expired API token')
		})

	})

	it('returns HTTP 200 OK', () => {
		const token = Cypress.env('DEFAULT_ACCESS_TOKEN')
		const tokenBase64 =  Buffer.from(token as string).toString('base64')

		cy.request({
			method: 'GET',
			url: '/api/health',
			failOnStatusCode: false,
			headers: {
				Authorization: `Bearer ${tokenBase64}`,
				'Content-Type': 'application/json',
			},
		}).then((resp) => {
			expect(resp.status).to.eq(200)
			expect(resp.statusText).to.eq('OK')
			expect(resp.body.success).to.eq(true)
		})

	})

})
