const logger = console;

const info = op => logger.info(op);

const debug = op => logger.log(op);

const warn = op => logger.warn(op);

const error = op => logger.error(op);

export default {
  info,
  debug,
  warn,
  error
};
