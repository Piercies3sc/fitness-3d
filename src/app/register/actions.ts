'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import {
  RATE_LIMIT_MESSAGE,
  isRateLimitError,
  isUserAlreadyExistsError,
} from '../../lib/auth/verification'

export async function resendVerification(email: string) {
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanEmail) {
    return { error: 'Geçerli bir e-posta adresi girin.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
  })

  if (error) {
    if (isRateLimitError(error)) {
      return {
        error: RATE_LIMIT_MESSAGE,
        rateLimited: true,
      }
    }
    return { error: 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.' }
  }

  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    return { error: 'Geçerli bir e-posta adresi girin.' }
  }

  if (password !== passwordConfirm) {
    return { error: 'Şifreler eşleşmiyor.' }
  }

  const data = {
    email,
    password,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    if (isRateLimitError(error)) {
      return {
        error: RATE_LIMIT_MESSAGE,
        rateLimited: true,
        email,
      }
    }

    if (isUserAlreadyExistsError(error)) {
      return {
        existingUser: true,
        email,
        error: 'Bu e-posta adresiyle zaten bir hesap var.',
      }
    }

    return { error: error.message }
  }

  // If a session exists, user was auto-confirmed
  if (authData?.session) {
    revalidatePath('/', 'layout')
    redirect('/home')
  }

  // When session is null, email confirmation is required
  return {
    success: true,
    needsVerification: true,
    email,
  }
}

