const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
};

class Logger {
  constructor() {
    this.logs = [];
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, meta };
    this.logs.push(logEntry);
    
    // In a real app, you might send this to a remote logging service
    const style = {
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      debug: 'color: #a855f7',
    };

    console.log(`%c[${level.toUpperCase()}] ${message}`, style[level], meta);
  }

  info(message, meta) { this.log(LOG_LEVELS.INFO, message, meta); }
  warn(message, meta) { this.log(LOG_LEVELS.WARN, message, meta); }
  error(message, meta) { this.log(LOG_LEVELS.ERROR, message, meta); }
  debug(message, meta) { this.log(LOG_LEVELS.DEBUG, message, meta); }
}

export const logger = new Logger();
