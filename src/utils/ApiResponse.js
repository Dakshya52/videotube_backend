class ApiResponse{
    constructor(statusCode, data = null ,message = "Success") {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode <400;
    }
}
// The ApiResponse class is designed to standardize the structure of API responses in an application. It encapsulates the status code, message, data, and success status, making it easier to send consistent responses from the server to the client. This helps in maintaining a uniform response format across different endpoints and simplifies error handling and response parsing on the client side.

export {ApiResponse};