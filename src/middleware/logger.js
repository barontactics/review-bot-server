/**
 * Request logging middleware
 * Logs HTTP method, URL, status code, response time, and IP address
 */
const logger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || 'unknown',
  };

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Color-code status based on response code
    const statusColor = getStatusColor(statusCode);
    const methodColor = getMethodColor(req.method);

    console.log(
      `${requestInfo.timestamp} | ` +
      `${methodColor}${req.method.padEnd(7)}${resetColor} | ` +
      `${statusColor}${statusCode}${resetColor} | ` +
      `${duration}ms | ` +
      `${requestInfo.url} | ` +
      `${requestInfo.ip}`
    );
  });

  next();
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

const resetColor = colors.reset;

/**
 * Get color for status code
 */
function getStatusColor(statusCode) {
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  if (statusCode >= 200) return colors.green;
  return colors.reset;
}

/**
 * Get color for HTTP method
 */
function getMethodColor(method) {
  switch (method) {
    case 'GET':
      return colors.blue;
    case 'POST':
      return colors.green;
    case 'PUT':
    case 'PATCH':
      return colors.yellow;
    case 'DELETE':
      return colors.red;
    default:
      return colors.magenta;
  }
}

module.exports = logger;
