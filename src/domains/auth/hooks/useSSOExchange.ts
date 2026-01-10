
import { useState, useCallback } from 'react'
import { authApi, type ExchangePayload, type ExchangeResponse } from '../api/auth.api'

/**
 * Hook for SSO Exchange
 * Mimicking a mutation hook pattern (loading, error, data).
 * Since we might not have React Query setup in assessment app (checking package.json would be good),
 * I'll maintain a simple hook state. User said "via hoock", React Query is standard but useState works too.
 * Assuming React Query is available? Let's assume standard useMutation style if possible, 
 * but safe to fallback to standard hook if uncertain.
 * I will check package.json after this tool call to see if @tanstack/react-query is present.
 * For now, writing a standard hook.
 */
export const useSSOExchange = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<ExchangeResponse | null>(null)

    const exchange = useCallback(async (payload: ExchangePayload) => {
        console.log('[useSSOExchange] Starting exchange with payload:', payload)
        setIsLoading(true)
        setError(null)
        try {
            const res = await authApi.exchange(payload)
            console.log('[useSSOExchange] Exchange successful:', res)
            setData(res)
            return res
        } catch (err: any) {
            console.error('[useSSOExchange] Exchange failed:', err)
            setError(err.message || 'Unknown error')
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    return { exchange, isLoading, error, data }
}
