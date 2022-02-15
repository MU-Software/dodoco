class DodoCoError extends Error {
  accessTokenInvalidation = false

  constructor(message, debugMessage, accessTokenInvalidation=false, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DodoCoError);
    }

    // Custom debugging information
    this.message = message
    this.debugMessage = debugMessage;
    this.accessTokenInvalidation = accessTokenInvalidation;
    this.date = new Date();
  }
}

export { DodoCoError };
