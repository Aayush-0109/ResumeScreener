
import { z } from 'zod';

export const registerBody = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(100)
});

export const loginBody = z.object({
  email: z.email(),
  password: z.string().min(8).max(72)
});

export const refreshBody = z.object({
  refreshToken: z.string().min(10)
});
export const idParams = z.object({ id: z.string().cuid() });