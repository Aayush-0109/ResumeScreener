import z from "zod";
import { Env, envSchema } from "../types/zod/env.schema.js";
import { InternalServerError } from "../utils/ApiError.js";

export const validateEnv = () : Env => {
    try {
        return envSchema.parse(process.env);
    }
    catch(error : any){
        if(error instanceof z.ZodError){
            const formatted = error.issues.map(err => 
                `❌ ${err.path.join('.')}: ${err.message}`
              ).join('\n');

              console.error('🚨 Environment validation failed:\n' + formatted);
      process.exit(1);

        }
        throw new InternalServerError('Environment validation failed');
    }
}