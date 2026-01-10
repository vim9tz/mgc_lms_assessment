
import { httpClient } from '@/lib/httpClient'
import { authEndpoints } from './auth.endpoints'

export interface ExchangePayload {
  code: string
  code_verifier?: string | null
}

export interface ExchangeResponse {
  success: boolean
  token?: string
  error?: string
}

export const authApi = {
  exchange: async (payload: ExchangePayload): Promise<ExchangeResponse> => {
    // Calling the Next.js API route via shared wrapper if we want to proxy.
    // BUT user said "like frontend". Frontend usually calls valid endpoints.
    // If we want to call our OWN Next.js API route (src/app/api/sso/exchange), 
    // we can use httpClient with a relative path.
    // httpClient defaults to Laravel API. If we want to call Next.js API, 
    // we should override baseURL or just use relative path if same domain.
    // However, the previous code called `/api/sso/exchange` (local Next.js API).
    // Let's stick to calling the local Next.js API route for now to keep the flow intact,
    // but using the axios instance (which might have a baseURL set to Laravel...).
    
    // WAIT: Frontend httpClient sets baseURL to Laravel API by default.
    // UseApi hook in assessment also distinguishes between guest/local.
    // If I use `httpClient`, it will try to hit Laravel.
    // But `src/app/api/sso/exchange` is the Next.js route I created to PROXY the request and set the cookie.
    // If I bypass the proxy and hit Laravel directly from the client, I lose the ability to set the cookie (via Next.js headers). 
    // But maybe that's fine if we use localStorage as fallback?
    // User requested "setup in the assesment" and "like frontend".
    // Frontend uses `httpClient` which hits Laravel mostly.
    
    // CRITICAL DECISION:
    // The `LaunchPage` calls `/api/sso/exchange`. This is a LOCAL API route.
    // If I change `authApi` to use `httpClient` configured with `LARAVEL_API_URL`, it initiates a CORS request to Laravel directly.
    // `AssessmentLaunchController` allows CORS from 3000/3001. 3002 is also allowed (I checked context earlier).
    // BUT the Next.js API route was doing the `cookieStore.set` logic.
    // If I go direct to Laravel, I lose the HttpOnly cookie setting (on the server side).
    // The user's goal with "Secure SSO" usually implies cookies.
    
    // HOWEVER, the user said "dont call direct fetch like in frntend also use the httpclient like that".
    // Frontend calls Laravel directly via `httpClient`.
    // I will switch to calling Laravel directly via `httpClient` because the user wants consistency.
    // I will handle the token storage in `LaunchPage` (it already does localStorage).
    // Losing the HttpOnly cookie for now is a trade-off for following the "like frontend" instruction, or I can try to set cookie in client JS (not httpOnly).
    // Actually, `LaunchPage` uses `localStorage` for compatibility.
    
    // Let's try to call the LOCAL API route using axios, but we need to ensure baseURL doesn't conflict.
    // If I pass a full URL to axios, it ignores baseURL.
    // So I will call `/api/sso/exchange` relative, but if baseURL is set to Laravel, `axios.post('/api/sso/exchange')` becomes `LARAVEL/api/sso/exchange`.
    // Laravel has `api/sso/exchange` route! I added it in step 528.
    // So hitting Laravel directly is VALID and actually cleaner than the proxy loop for the token exchange itself, 
    // EXCEPT for the cookie part. 
    // The proxy route `src/app/api/sso/exchange` was specifically setting the cookie.
    
    // Let's assume hitting Laravel directly is the desired path for "like frontend".
    // Frontend hits Laravel.
    
    const response = await httpClient.post(authEndpoints.exchange, payload)
    return response.data
  }
}

