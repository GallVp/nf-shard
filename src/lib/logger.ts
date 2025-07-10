export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	NONE = 'none',
}

const currentLevel: LogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel ?? LogLevel.INFO

const levelOrder = {
	[LogLevel.DEBUG]: 1,
	[LogLevel.INFO]: 2,
	[LogLevel.WARN]: 3,
	[LogLevel.ERROR]: 4,
	[LogLevel.NONE]: 5,
}

function shouldLog(level: LogLevel) {
	return levelOrder[level] >= levelOrder[currentLevel]
}

export const logger = {
	debug: (...args: any[]) => {
		if (shouldLog(LogLevel.DEBUG)) console.debug(`[DEBUG][${new Date().toISOString()}]`, ...args)
	},
	info: (...args: any[]) => {
		if (shouldLog(LogLevel.INFO)) console.info(`[INFO][${new Date().toISOString()}]`, ...args)
	},
	warn: (...args: any[]) => {
		if (shouldLog(LogLevel.WARN)) console.warn(`[WARN][${new Date().toISOString()}]`, ...args)
	},
	error: (...args: any[]) => {
		if (shouldLog(LogLevel.ERROR)) console.error(`[ERROR][${new Date().toISOString()}]`, ...args)
	},
}