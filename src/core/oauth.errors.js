function TokenExpiredError(status, message) {
  this.status = status;
  this.message = message;

  if ("captureStackTrace" in Error) Error.captureStackTrace(this, TokenExpiredError);
  else this.stack = new Error().stack;
}

TokenExpiredError.prototype = Object.create(Error.prototype);
TokenExpiredError.prototype.name = "TokenExpiredError";
TokenExpiredError.prototype.constructor = TokenExpiredError;

module.exports = { TokenExpiredError };
