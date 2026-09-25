import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateClient, mockCookies, mockRedirect, mockVerifyOtp, mockExchangeCodeForSession } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCookies: vi.fn(),
  mockRedirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`) }),
  mockVerifyOtp: vi.fn(),
  mockExchangeCodeForSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))
vi.mock('next/headers', () => ({ cookies: mockCookies }))
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))

import { confirmRecovery } from './actions'

const cookieStore = { set: vi.fn() }

function recoveryForm(tokenHash?: string) {
  const formData = new FormData()
  if (tokenHash !== undefined) formData.set('token_hash', tokenHash)
  return formData
}

describe('confirmRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NODE_ENV', 'test')
    mockCookies.mockResolvedValue(cookieStore)
    mockCreateClient.mockResolvedValue({ auth: {
      verifyOtp: mockVerifyOtp,
      exchangeCodeForSession: mockExchangeCodeForSession,
    } })
    mockVerifyOtp.mockResolvedValue({ data: { session: { access_token: 'mock-token' } }, error: null })
  })

  it('rejects a missing token without contacting Supabase', async () => {
    await expect(confirmRecovery(recoveryForm())).rejects.toThrow('redirect:/auth/recovery?error=invalid')
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('verifies the recovery token without a PKCE exchange and redirects with an SSR recovery marker', async () => {
    await expect(confirmRecovery(recoveryForm('recovery-token-hash'))).rejects.toThrow('redirect:/reset-password')
    expect(mockVerifyOtp).toHaveBeenCalledExactlyOnceWith({
      token_hash: 'recovery-token-hash',
      type: 'recovery',
    })
    expect(cookieStore.set).toHaveBeenCalledWith('fitness-3d-password-recovery', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/reset-password',
    })
    expect(mockCookies).toHaveBeenCalledOnce()
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('marks the recovery cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    await expect(confirmRecovery(recoveryForm('recovery-token-hash'))).rejects.toThrow('redirect:/reset-password')
    expect(cookieStore.set).toHaveBeenCalledWith('fitness-3d-password-recovery', '1',
      expect.objectContaining({ httpOnly: true, secure: true }))
  })

  it('shows the invalid-link state after a failed verification', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { session: null }, error: { message: 'expired' } })
    await expect(confirmRecovery(recoveryForm('expired-token'))).rejects.toThrow('redirect:/auth/recovery?error=invalid')
    expect(cookieStore.set).not.toHaveBeenCalled()
  })

  it('shows the invalid-link state if verification throws', async () => {
    mockVerifyOtp.mockRejectedValue(new Error('network failure'))
    await expect(confirmRecovery(recoveryForm('recovery-token-hash'))).rejects.toThrow('redirect:/auth/recovery?error=invalid')
    expect(cookieStore.set).not.toHaveBeenCalled()
  })
})
