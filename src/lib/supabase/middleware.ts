import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import fetch from 'cross-fetch'

export async function updateSession(request: NextRequest) {
  const isMissingEnv = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here'
  
  if (isMissingEnv || isPlaceholder) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Server Configuration Error: Supabase credentials are not configured.', { status: 500 })
    }
    
    // In development, fail closed for protected routes
    if (request.nextUrl.pathname.startsWith('/home') || request.nextUrl.pathname.startsWith('/workout')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    // Allow public routes in development
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { fetch },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  // We use getClaims() per current official Supabase guidance for faster proxy resolution
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  // Protected routes check
  if (
    !claims &&
    (request.nextUrl.pathname.startsWith('/home') || request.nextUrl.pathname.startsWith('/workout'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/register
  if (
    claims &&
    (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
