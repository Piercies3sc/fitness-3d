'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const INVALID_LINK_PATH = '/auth/recovery?error=invalid'

export async function confirmRecovery(formData: FormData): Promise<never> {
  const tokenHash = formData.get('token_hash')
  if (typeof tokenHash !== 'string' || !tokenHash || tokenHash.length > 256) {
    redirect(INVALID_LINK_PATH)
  }

  let verified = false
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })
    verified = !error && Boolean(data.session)
  } catch {
    // A failed exchange must show the same invalid-link state.
  }

  if (!verified) {
    redirect(INVALID_LINK_PATH)
  }

  const cookieStore = await cookies()
  cookieStore.set('fitness-3d-password-recovery', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/reset-password',
  })

  redirect('/reset-password')
}
