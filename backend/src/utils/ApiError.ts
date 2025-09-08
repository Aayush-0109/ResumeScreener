export class ApiError extends Error {
    public readonly statusCode  : number;
    public readonly errors;
    public readonly isOperational: boolean;
    public readonly status: string;
    constructor(statusCode : number , message : string , errors? : any, stack? : string   ){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.isOperational = true;
        this.status = statusCode<400 ? 'fail' : 'error';

        if(stack){
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this,this.constructor);
        }
    }
     
}

export class ValidationError extends ApiError{
    constructor(message : string , errors? : any){
        super(400,message,errors);
    }
}
export class NotFoundError extends ApiError{
    constructor(message : string = "Resource not found"){
        super(404,message);
    }
}
export class UnauthorizedError extends ApiError{
    constructor(message : string = "Unauthorized access"){
        super(401,message);
    }
}
export class ForbiddenError extends ApiError{
    constructor(message : string =" Forbidden access"){
        super(403,message);
    }
}
export class ConflictError extends ApiError{
    constructor(message : string = "Resource conflict"){
        super(409,message);
    }
}
export class InternalServerError extends ApiError{
    constructor(message : string = " Internal server error"){
        super(500,message);
    }
}