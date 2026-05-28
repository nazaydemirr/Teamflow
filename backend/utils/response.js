function sendError(res, statusCode, code, message, details) {
  const body = { code, message };
  if (details !== undefined) body.details = details;
  res.status(statusCode).json(body);
}

module.exports = { sendError };
