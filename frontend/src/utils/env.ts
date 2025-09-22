import { z } from 'zod';

const EnvSchema = z.object({
    VITE_API_URL: z.string().url()
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
    const parsed = EnvSchema.safeParse(import.meta.env);
    if (!parsed.success) {
        // eslint-disable-next-line no-console
        console.error('Invalid environment variables', parsed.error.flatten());
        throw new Error('Invalid environment variables');
    }
    return parsed.data as unknown as Env;
}


