const LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
let currentLevel = 'info';
const envLevel = process.env.DEBUG;
if (envLevel) {
    const normalized = envLevel.toLowerCase();
    if (normalized === 'true')
        currentLevel = 'debug';
    else if (['debug', 'info', 'warn', 'error'].includes(normalized)) {
        currentLevel = normalized;
    }
}
function shouldLog(level) {
    return LEVELS[level] >= LEVELS[currentLevel];
}
function log(level, ...args) {
    if (!shouldLog(level))
        return;
    const method = level === 'debug'
        ? console.debug
        : level === 'info'
            ? console.info
            : level === 'warn'
                ? console.warn
                : console.error;
    method(`[${level.toUpperCase()}]`, ...args);
}
export const logger = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
    setLevel(level) {
        if (level in LEVELS)
            currentLevel = level;
    },
    getLevel() {
        return currentLevel;
    },
};
