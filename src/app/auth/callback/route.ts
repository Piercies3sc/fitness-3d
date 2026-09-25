import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const resetPath = '/reset-password'

  if (!code) {
    return NextResponse.redirect(new URL(`${resetPath}?error=invalid-link`, request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL(`${resetPath}?error=invalid-link`, request.url))
  }

  const cookieStore = await cookies()
  cookieStore.set('fitness-3d-password-recovery', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/reset-password',
  })

  return NextResponse.redirect(new URL(resetPath, request.url))
}
