/// <reference types="cypress" />

describe('Workspace create and use flow', () => {

	beforeEach(() => {
		cy.task('resetWorkspace')
	})

	it('logs in, creates a workspace, copies token, and authenticates API with it', () => {

		cy.visit('/')
		cy.url().should('include', '/signin')

		const username = Cypress.env('APP_USERNAME')
		const password = Cypress.env('APP_PASSWORD')

		cy.get('[data-cy=username]').type(username)
		cy.get('[data-cy=password]').type(password)
		cy.get('[data-cy=submit]').click()
		cy.url().should('include', '/runs')

		cy.visit('/workspaces')

		cy.contains('button', 'Add Workspace').click()

		cy.get('input[name="company"]').type('test')

		cy.get('input[name="token"]').invoke('val').then((token) => {
			expect(token).to.be.a('string').and.not.be.empty

			const tokenBase64 = Buffer.from(token as string).toString('base64')
			return tokenBase64

		}).as('tokenBase64')

		cy.contains('button', 'Create').click()

		cy.contains('td', 'test').parent('tr').get('td').eq(1).invoke('text').as('workspaceId').then(function () {

			return cy.request({
				method: 'GET',
				url: `/api/health?workspaceId=${this.workspaceId.trim()}`,
				failOnStatusCode: false,
				headers: {
					Authorization: `Bearer ${this.tokenBase64}`,
					'Content-Type': 'application/json',
				},
			})
		}).then((resp) => {
			expect(resp.status).to.eq(200)
			expect(resp.body.success).to.eq(true)
		})
	})

	it('logs in, creates a workspace, forgets to copy token, and fails to authenticate API', () => {

		cy.visit('/')
		cy.url().should('include', '/signin')

		const username = Cypress.env('APP_USERNAME')
		const password = Cypress.env('APP_PASSWORD')

		cy.get('[data-cy=username]').type(username)
		cy.get('[data-cy=password]').type(password)
		cy.get('[data-cy=submit]').click()
		cy.url().should('include', '/runs')

		cy.visit('/workspaces')

		cy.contains('button', 'Add Workspace').click()

		cy.get('input[name="company"]').type('test')

		const token = 'DummyToken'
		const tokenBase64 = Buffer.from(token as string).toString('base64')

		cy.contains('button', 'Create').click()

		cy.contains('td', 'test').parent('tr').get('td').eq(1).invoke('text').as('workspaceId').then(function () {

			return cy.request({
				method: 'GET',
				url: `/api/health?workspaceId=${this.workspaceId.trim()}`,
				failOnStatusCode: false,
				headers: {
					Authorization: `Bearer ${tokenBase64}`,
					'Content-Type': 'application/json',
				},
			})
		}).then((resp) => {
			expect(resp.status).to.eq(401)
			expect(resp.statusText).to.eq('Unauthorized')
			expect(resp.body.error).to.eq('Invalid or expired API token')
		})
	})

})
