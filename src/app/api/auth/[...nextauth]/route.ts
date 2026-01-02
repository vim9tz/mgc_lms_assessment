import NextAuth from 'next-auth'

import { authOptions } from '@/libs/auth'

export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
