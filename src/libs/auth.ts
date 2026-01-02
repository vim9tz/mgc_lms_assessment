import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  providers: [
    CredentialsProvider({
      name: 'Token Login',
      credentials: {
        Temptoken: { label: 'Temptoken', type: 'text' }, // calls /authorize
        Token: { label: 'Token', type: 'text' } // direct signin
      },
      async authorize(credentials) {
        if (credentials?.Token) {
          // 🔓 Direct token login (e.g., from OTP)
          const res = await fetch(`${process.env.LARAVEL_API_URL}/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${credentials.Token}`
            }
          })
          const data = await res.json()

          try {
            return {
              id: data.user.id || 'guest',
              name: data.user.name || 'Guest User',
              email: data.user.email || 'guest@devhub.com',
              token: credentials.Token,
              role: 'guest',
              userData: data.user || null // store JWT payload if needed
            }
          } catch {
            return null
          }
        }

        if (credentials?.Temptoken) {
          // 🔐 Call API to authorize
          try {
            const res = await fetch(`${process.env.LARAVEL_API_URL}/authorize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: credentials.Temptoken })
            })

            const data = await res.json()

            if (res.ok && data.user) {
              return {
                id: String(data.user.id),
                name: data.user.name,
                email: data.user.email,
                token: data.token,
                role: data.user?.role || null,
                userData: data.user
              }
            }
          } catch {
            return null
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.NEXTAUTH_SESSION_MAX_AGE || '86400', 10)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.accessToken = user.token
        token.role = user.role
        token.userData = user.userData
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        accessToken: token.accessToken,
        role: token.role,
        userData: token.userData
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl
    }
  },
  pages: {
    signIn: '/'
  }
}
