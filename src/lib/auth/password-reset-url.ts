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

  const redirectTo = new URL('/auth/callback', siteOrigin)
  redirectTo.searchParams.set('next', '/reset-password')
  return redirectTo.toString()
}
