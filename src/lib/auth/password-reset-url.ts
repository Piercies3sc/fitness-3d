export const PRODUCTION_SITE_URL = 'https://fitness-3d-peach.vercel.app'

export function buildPasswordResetRedirectUrl(
  configuredSiteUrl: string | undefined,
  isProduction: boolean
): string {
  const configured = configuredSiteUrl?.trim()
  let siteOrigin = PRODUCTION_SITE_URL

  if (configured) {
    try {
      const parsed = new URL(configured)
      const isHttpUrl = parsed.protocol === 'https:' || parsed.protocol === 'http:'
      const isProductionOrigin = parsed.origin === PRODUCTION_SITE_URL

      if (isHttpUrl && (!isProduction || isProductionOrigin)) {
        siteOrigin = parsed.origin
      }
    } catch {
      // Keep the stable production URL for invalid configuration values.
    }
  }

  // The Reset Password email template appends TokenHash to this route.
  const redirectTo = new URL('/auth/recovery', siteOrigin)
  return redirectTo.toString()
}
