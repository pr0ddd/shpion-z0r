export class ApiError extends Error {
    public statusCode: number;

    // TODO: fix any
    constructor(statusCode: number, message: any) {
        super(message);
        this.statusCode = statusCode;

        // Helps in correctly identifying the instance type
        Object.setPrototypeOf(this, ApiError.prototype);
    }
} 