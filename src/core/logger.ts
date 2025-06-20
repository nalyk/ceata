export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

const envLevel = process.env.DEBUG;
if (envLevel) {
  const normalized = envLevel.toLowerCase();
  if (normalized === 'true') currentLevel = 'debug';
  else if (['debug', 'info', 'warn', 'error'].includes(normalized)) {
    currentLevel = normalized as LogLevel;
  }
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel];
}

function log(level: LogLevel, ...args: any[]): void {
  if (!shouldLog(level)) return;
  const method =
    level === 'debug'
      ? console.debug
      : level === 'info'
      ? console.info
      : level === 'warn'
      ? console.warn
      : console.error;
  method(`[${level.toUpperCase()}]`, ...args);
}

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
  setLevel(level: LogLevel) {
    if (level in LEVELS) currentLevel = level;
  },
  getLevel(): LogLevel {
    return currentLevel;
  },
};
