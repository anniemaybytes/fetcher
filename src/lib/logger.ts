import * as log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import chalk from 'chalk';

prefix.reg(log);

const colors: any = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};

let logLevel: log.LogLevelDesc = 'debug'; // default
if (process.env.LOG_LEVEL) {
  logLevel = process.env.LOG_LEVEL as log.LogLevelDesc;
} else {
  // eslint-disable-next-line no-console
  console.error(colors.WARN(`Warning: Environment variable LOG_LEVEL is not set and has been defaulted to ${logLevel}`));
}

export function getLogger(name: string) {
  const logger = log.getLogger(name);
  logger.setLevel(logLevel);
  prefix.apply(logger, { format: (level, name, timestamp) => `[${timestamp}] ${colors[level.toUpperCase()](level)} ${name}:` });
  return logger;
}
