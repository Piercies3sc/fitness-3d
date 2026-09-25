'use server'

import { createClient } from '@/lib/supabase/server'
import { buildPasswordResetRedirectUrl } from '../../lib/auth/password-reset-url'

export type ForgotPasswordResult =
  | { success: true }
  | { error: string }

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function requestPasswordReset(emailValue: string): Promise<ForgotPasswordResult> {
  const email = emailValue?.trim().toLowerCase()
  if (!email || !isValidEmail(email)) {
    return { error: 'Geçerli bir e-posta adresi gir.' }
  }

  const redirectTo = buildPasswordResetRedirectUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NODE_ENV === 'production'
  )

  try {
    const supabase = await createClient()
    // Keep the response identical for registered, unregistered, and rate-limited addresses.
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  } catch {
    // Do not reveal account existence or backend details in the public response.
  }

  return { success: true }
}
