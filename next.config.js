/** @type {import('next').NextConfig} */

const nextConfig = {
	distDir: "build",
	output: "standalone",

	// https://github.com/aws-amplify/amplify-hosting/issues/1987
	env: {
		POSTGRES_URI: process.env.POSTGRES_URI,
		LOG_LEVEL: process.env.LOG_LEVEL,
	},
}

module.exports = nextConfig
