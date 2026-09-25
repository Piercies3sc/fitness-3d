import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateClient, mockHeaders, mockResetPasswordForEmail } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockHeaders: vi.fn(),
  mockResetPasswordForEmail: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))
vi.mock('next/headers', () => ({ headers: mockHeaders }))

import { requestPasswordReset } from './actions'

describe('requestPasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://fitness-3d-peach.vercel.app')
    vi.stubEnv('NODE_ENV', 'test')
    mockHeaders.mockResolvedValue(new Headers({ origin: 'http://localhost:3000' }))
    mockCreateClient.mockResolvedValue({
      auth: { resetPasswordForEmail: mockResetPasswordForEmail },
    })
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
  })

  it('rejects malformed addresses without contacting Supabase', async () => {
    await expect(requestPasswordReset('not-an-email')).resolves.toEqual({ error: 'Geçerli bir e-posta adresi gir.' })
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('uses the configured site URL and callback when Supabase reports an address-specific error', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } })

    await expect(requestPasswordReset('  PERSON@example.com ')).resolves.toEqual({ success: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('person@example.com', {
      redirectTo: 'https://fitness-3d-peach.vercel.app/auth/callback?next=%2Freset-password',
    })
  })

  it('keeps the configured production target when the request origin is localhost', async () => {
    await requestPasswordReset('person@example.com')
    expect(mockHeaders).not.toHaveBeenCalled()
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('person@example.com', {
      redirectTo: 'https://fitness-3d-peach.vercel.app/auth/callback?next=%2Freset-password',
    })
  })

  it('uses the same safe success response for rate limits', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { status: 429, message: 'rate limit' } })
    await expect(requestPasswordReset('person@example.com')).resolves.toEqual({ success: true })
  })
})
