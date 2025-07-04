import { defineConfig } from "cypress";
import { resetWorkspace } from "cypress/e2e/tasks/resetDB";

export default defineConfig({
	e2e: {
		setupNodeEvents(on, config) {
			// implement node event listeners here
			on("task", { resetWorkspace: resetWorkspace })
		},
		supportFile: false
	},
	defaultCommandTimeout: 20000,
	requestTimeout: 20000
});
