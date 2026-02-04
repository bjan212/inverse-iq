const fs = require('fs');
const path = require('path');

const DEFAULT_LOG_PATH = path.join(__dirname, '../../data/engine_logs.jsonl');

function ensureLogDir(logPath) {
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function logEngineEvent(type, message, meta = {}, logPath = DEFAULT_LOG_PATH) {
  try {
    ensureLogDir(logPath);
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      meta
    };
    fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`);
  } catch (error) {
    // Avoid crashing app on logging failures
    console.error('Engine logger error:', error.message);
  }
}

function readEngineLogs(limit = 100, logPath = DEFAULT_LOG_PATH) {
  try {
    if (!fs.existsSync(logPath)) {
      return [];
    }

    const data = fs.readFileSync(logPath, 'utf8');
    if (!data.trim()) {
      return [];
    }

    const lines = data.trim().split('\n');
    const recent = lines.slice(-limit).reverse();
    return recent
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return {
            timestamp: new Date().toISOString(),
            type: 'warning',
            message: 'Malformed log entry encountered',
            meta: { raw: line }
          };
        }
      });
  } catch (error) {
    console.error('Engine logger read error:', error.message);
    return [];
  }
}

module.exports = {
  logEngineEvent,
  readEngineLogs
};
