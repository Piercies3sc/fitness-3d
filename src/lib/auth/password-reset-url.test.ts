import { describe, expect, it } from 'vitest'
import { buildPasswordResetRedirectUrl, PRODUCTION_SITE_URL } from './password-reset-url'

describe('buildPasswordResetRedirectUrl', () => {
  it('uses the configured production site URL', () => {
    expect(buildPasswordResetRedirectUrl(PRODUCTION_SITE_URL, true)).toBe(
      'https://fitness-3d-peach.vercel.app/auth/callback?next=%2Freset-password'
    )
  })

  it('does not allow a localhost configuration to override the production URL', () => {
    expect(buildPasswordResetRedirectUrl('http://localhost:3000', true)).toBe(
      'https://fitness-3d-peach.vercel.app/auth/callback?next=%2Freset-password'
    )
  })

  it('defaults to production when the environment variable is missing', () => {
    expect(buildPasswordResetRedirectUrl(undefined, false)).toBe(
      'https://fitness-3d-peach.vercel.app/auth/callback?next=%2Freset-password'
    )
  })

  it('permits a local URL only when explicitly configured outside production', () => {
    expect(buildPasswordResetRedirectUrl('http://localhost:3000', false)).toBe(
      'http://localhost:3000/auth/callback?next=%2Freset-password'
    )
  })
})
