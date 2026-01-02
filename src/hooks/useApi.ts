'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type PendingRequest = {
  endpoint: string;
  method: HttpMethod;
  body?: any;
  resolve: (value: any) => void;
};

const useApi = (guest = false) => {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    if (!guest && status === 'authenticated' && pendingRequests.length > 0) {
      console.log(`🔄 Retrying ${pendingRequests.length} delayed API requests...`);
      pendingRequests.forEach(({ endpoint, method, body, resolve }) => {
        fetchFromBackend(endpoint, method, body).then(resolve);
      });
      setPendingRequests([]);
    }
  }, [status, pendingRequests, guest]);

  const fetchFromBackend = async (
    endpoint: string,
    method: HttpMethod,
    body?: any
  ): Promise<any> => {
    try {
      if (!guest && status === 'loading') {
        console.warn(`⚠️ Session loading. Delaying API request: ${endpoint}`);
        return new Promise((resolve) => {
          setPendingRequests((prev) => [...prev, { endpoint, method, body, resolve }]);
        });
      }

      if (!guest && !token) {
        console.error('❌ Unauthorized: No token found, signing out...');
        signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' });
        return { error: 'Unauthorized', status: 401 };
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (!guest && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add guest=true as query param if guest request
      const url = guest ? `/api${endpoint}?guest=true` : `/api${endpoint}`;

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const textResponse = await response.text();
      try {
        const jsonData = JSON.parse(textResponse);

        if (!guest && response.status === 401) {
          console.error('❌ Unauthorized: Redirecting to login...');
          signOut({ callbackUrl: process.env.NEXT_PUBLIC_APP_URL || '/' });
          return { error: 'Unauthorized', status: 401 };
        }

        if (!response.ok) {
          return {
            error: `❌ Request failed with status ${response.status}`,
            details: jsonData,
            status: response.status,
          };
        }

        return jsonData;
      } catch (jsonError) {
        console.error('❌ Invalid JSON response:', textResponse);
        return { error: 'Invalid JSON response', status: 500 };
      }
    } catch (error) {
      console.error('❌ API Error:', error);
      return { error: 'Internal Server Error', status: 500 };
    }
  };

  return { fetchFromBackend, session, status };
};

export default useApi;
