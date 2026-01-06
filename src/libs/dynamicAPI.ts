import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';
import { apiEndpoints } from '@/libs/apiConfig';
import test from 'node:test';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const fetchFromLaravel = async (
  key: keyof typeof apiEndpoints,
  method: HttpMethod,
  params?: Record<string, string | number>,
  body?: any,
  guest: boolean = false,
  accessToken?: string | null
) => {
  try {
    let token: string | null = accessToken ?? null;

    if (!guest && !token) {
      const session = await getServerSession(authOptions);
      token = session?.user?.accessToken || null;
      if (!token) {
        return { error: 'Unauthorized', status: 401 };
      }
    }

    const endpointConfig = apiEndpoints[key]?.[method];
    if (!endpointConfig) {
      return { error: 'Invalid API method', status: 400 };
    }

    let apiUrl = endpointConfig.url;
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        apiUrl = apiUrl.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (!guest && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = process.env.LARAVEL_API_URL || 'http://localhost:8001/api';
    const response = await fetch(`${baseUrl}${apiUrl}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && !guest) {
      return { error: 'Unauthorized', status: 401 };
    }
    
    if (!response.ok) {
      return {
        error: await response.json(),
        status: response.status,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Internal Server Error', status: 500 };
  }
};
