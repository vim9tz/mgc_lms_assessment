import type { DefaultSession } from 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    token?: string // Add custom token property
    role: string | null;
    userData: any;
    // Add any other custom properties here
  }

  interface Session {
    user: {
      id: string;
      accessToken?: string;
      role: string | null;
      userData: any;
    } & DefaultSession["user"];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accessToken?: string
    role: string | null;
    userData: any;
    // Add any other custom properties here
  }
}
