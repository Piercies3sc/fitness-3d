export const RATE_LIMIT_MESSAGE =
  'Çok kısa sürede birden fazla doğrulama e-postası istendi. Bir süre bekleyip tekrar deneyebilirsin.'

export const UNVERIFIED_LOGIN_MESSAGE =
  'E-posta adresini henüz doğrulamadın. Gelen kutundaki doğrulama bağlantısına tıklayıp tekrar giriş yap.'

export function isRateLimitError(
  error: { message?: string; status?: number; code?: string } | null | undefined
): boolean {
  if (!error) return false
  const msg = error.message?.toLowerCase() || ''
  return (
    msg.includes('rate limit') ||
    error.status === 429 ||
    error.code === 'over_email_send_rate_limit' ||
    error.code === '429'
  )
}

export function isUserAlreadyExistsError(
  error: { message?: string; status?: number; code?: string } | null | undefined
): boolean {
  if (!error) return false
  const msg = error.message?.toLowerCase() || ''
  return (
    error.code === 'user_already_exists' ||
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('user already exists')
  )
}
