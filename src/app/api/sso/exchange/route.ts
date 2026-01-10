
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { code, code_verifier } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        // Server-to-Server Exchange
        const laravelUrl = process.env.LARAVEL_API_URL || 'http://localhost:8001/api';
        
        const exchangeRes = await fetch(`${laravelUrl}/sso/exchange`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ code, code_verifier }),
        });

        const data = await exchangeRes.json();

        if (!exchangeRes.ok) {
            return NextResponse.json(data, { status: exchangeRes.status });
        }

        const { token, expires_in } = data;

        // Set Cookie using the cookie store
        const cookieStore = await cookies();
        
        // We set the cookie for future proxy use, AND return the token for current localStorage use
        cookieStore.set('token', token, {
            httpOnly: false, // Allowing JS access for now to match current architecture
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: expires_in || 900,
        });

        return NextResponse.json({ success: true, token });

    } catch (error: any) {
        console.error('Exchange Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
