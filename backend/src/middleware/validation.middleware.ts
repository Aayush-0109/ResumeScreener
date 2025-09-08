import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/ApiError.js';
import type { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    validatedQuery?: any;
  }
}

const fmt = (issues: any[]) =>
  issues.map((e: any) => ({ field: Array.isArray(e.path) ? e.path.join('.') : String(e.path ?? ''), message: e.message }));

export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const r = schema.safeParse(req.body);
    if (!r.success) return next(new ValidationError('Validation failed', fmt(r.error.issues)));
    req.body = r.data;
    next();
  };

export const validateParams =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const r = schema.safeParse(req.params);
    if (!r.success) return next(new ValidationError('Invalid parameters', fmt(r.error.issues)));
    req.params = r.data as any;
    next();
  };

export const validateQuery =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const r = schema.safeParse(req.query);
    if (!r.success) return next(new ValidationError('Invalid query parameters', fmt(r.error.issues)));
    req.validatedQuery = r.data;
    next();
  };