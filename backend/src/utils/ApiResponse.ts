import { paginationMeta } from "../types/general.types.js";
export class ApiResponse<T>{
    public readonly statusCode : number;
    public readonly message : string;
    public readonly data? : T;
    public readonly meta? : paginationMeta
    public success : boolean;

    constructor(statusCode : number , message : string , data ? : T ,meta ? : paginationMeta){
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode>=200 && statusCode <300
        this.meta = meta
    }
}