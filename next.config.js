/** @type {import('next').NextConfig} */

const nextConfig = {
	distDir: "build",
	output: "standalone",

	// https://github.com/aws-amplify/amplify-hosting/issues/1987
	env: {
		POSTGRES_URI: process.env.POSTGRES_URI,
		LOG_LEVEL: process.env.LOG_LEVEL,
		APP_SECRET_KEY: process.env.APP_SECRET_KEY,
		APP_USERNAME: process.env.APP_USERNAME,
		APP_PASSWORD: process.env.APP_PASSWORD,
		DEFAULT_ACCESS_TOKEN: process.env.DEFAULT_ACCESS_TOKEN
	},
}

module.exports = nextConfig
