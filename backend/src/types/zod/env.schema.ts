import z from "zod";

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().min(1).max(65535).default(3000),

    DATABASE_URL: z.string().url('Invalid DATABASE_URL'),

    REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
    REDIS_PORT: z.coerce.number().min(1).max(65535),
    REDIS_USERNAME: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),

    ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 chars'),
    REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 chars'),

    AI_SERVICE_URL: z.string().url('Invalid AI_SERVICE_URL'),
}).superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
        if (data.ACCESS_TOKEN_SECRET.includes('dev') || data.ACCESS_TOKEN_SECRET.length < 64) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Production requires strong ACCESS_TOKEN_SECRET (64+ chars)',
                path: ['ACCESS_TOKEN_SECRET']
            })
        }
    }

});
export type Env = z.infer<typeof envSchema>;