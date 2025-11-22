import type { AxiosError } from 'axios'

export type OrganizedError = {
    message: string
    status?: number
    code?: string
    validation?: Record<string, string[]>
    raw?: unknown
}

export const organizeError = (err: unknown): OrganizedError => {
    const fallback: OrganizedError = { message: 'Something went wrong', raw: err }

    
    const ax = err as AxiosError<any>
    if (ax && ax.isAxiosError) {
        const status = ax.response?.status
        const data = ax.response?.data as any
        const code = data?.code || data?.errorCode
        const message = data?.message || data?.error || ax.message || fallback.message
        const validation = data?.errors || data?.validation || undefined
        return { message, status, code, validation, raw: err }
    }

    
    if (err instanceof Error) {
        return { message: err.message || fallback.message, raw: err }
    }

    
    return fallback
}

export const getHumanMessage = (e: OrganizedError): string => {
    if (e.validation) return 'Please fix the highlighted fields.'
    if (e.status === 401) return 'Please sign in to continue.'
    if (e.status === 403) return 'You do not have permission to perform this action.'
    if (e.status === 404) return 'Not found.'
    if (e.status && e.status >= 500) return 'Server error. Try again later.'
    return e.message || 'Something went wrong.'
}


