'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import {
  RATE_LIMIT_MESSAGE,
  UNVERIFIED_LOGIN_MESSAGE,
  isRateLimitError,
} from '../../lib/auth/verification'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'E-posta ve şifre zorunludur.' }
  }

  const data = {
    email,
    password,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const msg = error.message?.toLowerCase() || ''
    const isUnverified =
      error.code === 'email_not_confirmed' ||
      msg.includes('email not confirmed') ||
      msg.includes('not confirmed')

    if (isUnverified) {
      return {
        error: UNVERIFIED_LOGIN_MESSAGE,
        unverified: true,
        email,
      }
    }

    if (isRateLimitError(error)) {
      return {
        error: RATE_LIMIT_MESSAGE,
        rateLimited: true,
      }
    }

    return { error: 'E-posta veya şifre hatalı.' }
  }

  revalidatePath('/', 'layout')
  redirect('/home')
}

