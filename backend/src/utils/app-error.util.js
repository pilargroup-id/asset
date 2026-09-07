function appError(message, statusCode = 400, code = 'REQUEST_FAILED', errors = null) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (errors) err.errors = errors;
  return err;
}
module.exports = { appError };
