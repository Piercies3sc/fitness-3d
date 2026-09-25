'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type UpdatePasswordResult = { error: string; invalidRecovery?: boolean }

const INVALID_RECOVERY_MESSAGE = 'Bağlantının süresi dolmuş veya geçersiz.'

function clearRecoveryCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set('fitness-3d-password-recovery', '', { path: '/reset-password', maxAge: 0 })
}

export async function updatePassword(password: string, passwordConfirm: string): Promise<UpdatePasswordResult> {
  if (!password) return { error: 'Yeni şifreni gir.' }
  if (password !== passwordConfirm) return { error: 'Şifreler eşleşmiyor.' }

  const cookieStore = await cookies()
  if (cookieStore.get('fitness-3d-password-recovery')?.value !== '1') {
    return { error: INVALID_RECOVERY_MESSAGE, invalidRecovery: true }
  }

  let supabase: Awaited<ReturnType<typeof createClient>>
  let user: { id: string } | null
  let sessionError: { status?: number } | null
  try {
    supabase = await createClient()
    const result = await supabase.auth.getUser()
    user = result.data.user
    sessionError = result.error
  } catch {
    clearRecoveryCookie(cookieStore)
    return { error: INVALID_RECOVERY_MESSAGE, invalidRecovery: true }
  }

  if (sessionError || !user) {
    clearRecoveryCookie(cookieStore)
    return { error: INVALID_RECOVERY_MESSAGE, invalidRecovery: true }
  }

  let error: { message: string; code?: string; status?: number } | null
  try {
    ({ error } = await supabase.auth.updateUser({ password }))
  } catch {
    return { error: 'Şifre güncellenemedi. Lütfen daha sonra tekrar dene.' }
  }
  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('password should be') || message.includes('weak_password') || error.code === 'weak_password') {
      return { error: 'Bu şifre hesap güvenlik gerekliliklerini karşılamıyor. Daha güçlü bir şifre dene.' }
    }
    if (message.includes('same password') || error.code === 'same_password') {
      return { error: 'Yeni şifren mevcut şifrenle aynı olamaz.' }
    }
    if (error.status === 401 || error.code === 'session_not_found') {
      return { error: 'Oturumun süresi doldu. Lütfen yeni bir sıfırlama bağlantısı iste.' }
    }
    return { error: 'Şifre güncellenemedi. Lütfen daha sonra tekrar dene.' }
  }

  clearRecoveryCookie(cookieStore)
  redirect('/reset-password/success')
}
