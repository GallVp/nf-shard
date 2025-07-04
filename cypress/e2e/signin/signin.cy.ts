/// <reference types="cypress" />

describe('Signin flow', () => {

	it('enters wrong credentials and fails to login', () => {
		cy.visit('/')

		cy.url().should('include', '/signin')

		const username = Cypress.env('APP_USERNAME')
		const password = 'APP_PASSWORD'

		cy.window().then((win) => {
			cy.stub(win, 'alert').as('alert')
		})

		cy.get('[data-cy=username]').type(username)
		cy.get('[data-cy=password]').type(password)
		cy.get('[data-cy=submit]').click()

		cy.get('@alert').should('have.been.calledWith', 'Invalid credentials')
	})

	it('logs in successfully and retrieves the default workspace accessToken', () => {
		cy.visit('/')

		cy.url().should('include', '/signin')

		const username = Cypress.env('APP_USERNAME')
		const password = Cypress.env('APP_PASSWORD')
		const accessToken = Cypress.env('DEFAULT_ACCESS_TOKEN')

		cy.get('[data-cy=username]').type(username)
		cy.get('[data-cy=password]').type(password)
		cy.get('[data-cy=submit]').click()

		cy.url().should('include', '/runs')

		cy.visit('/guide')

		cy.get('pre span ').get('[class="token string"]').first().contains(accessToken)
	})
})
