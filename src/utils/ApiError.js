class ApiError extends Error {
  constructor(statusCode,message = "Something went wrong",errors = [],stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.name = 'ApiError';

    if(stack){
        this.stack = stack;
    } else {
        Error.captureStackTrace(this, this.constructor);
    }
  }
}

// The ApiError class extends the built-in Error class to create a custom error type for API responses. It includes properties for status code, message, data, success status, and errors, allowing for detailed error reporting in API responses. This class is useful for handling errors consistently across an application, providing clear feedback to clients about what went wrong.

export {ApiError};