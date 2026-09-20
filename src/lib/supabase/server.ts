import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dns').setDefaultResultOrder('ipv4first');
}

export async function createClient() {
  const cookieStore = await cookies()

  const customFetch = typeof window === 'undefined' 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (...args: any[]) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nf = require('node-fetch');
        const fetchFn = nf.default || nf;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const https = require('https');
        const agent = new https.Agent({ family: 4 });
        return fetchFn(args[0], { ...args[1], agent });
      }
    : globalThis.fetch;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder',
    {
      global: { fetch: customFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}
