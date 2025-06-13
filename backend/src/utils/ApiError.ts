export class ApiError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;

        // Helps in correctly identifying the instance type
        Object.setPrototypeOf(this, ApiError.prototype);
    }
} 