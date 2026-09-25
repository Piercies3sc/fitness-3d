import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateClient, mockCookies, mockGetUser, mockUpdateUser, mockRedirect } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCookies: vi.fn(),
  mockGetUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockRedirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`) }),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))
vi.mock('next/headers', () => ({ cookies: mockCookies }))
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))

import { updatePassword } from './actions'

const recoveryCookie = { value: '1' }
const cookieStore = { get: vi.fn(), set: vi.fn() }

describe('updatePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cookieStore.get.mockReturnValue(recoveryCookie)
    mockCookies.mockResolvedValue(cookieStore)
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    mockUpdateUser.mockResolvedValue({ error: null })
    mockCreateClient.mockResolvedValue({ auth: { getUser: mockGetUser, updateUser: mockUpdateUser } })
  })

  it('rejects mismatched passwords before checking or updating auth', async () => {
    await expect(updatePassword('new-one', 'new-two')).resolves.toEqual({ error: 'Şifreler eşleşmiyor.' })
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('rejects password updates without the recovery marker', async () => {
    cookieStore.get.mockReturnValue(undefined)
    await expect(updatePassword('new-password', 'new-password')).resolves.toEqual({
      error: 'Bağlantının süresi dolmuş veya geçersiz.',
      invalidRecovery: true,
    })
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('updates the password only for a valid recovery session, clears its marker, then redirects to success', async () => {
    await expect(updatePassword('new-password', 'new-password')).rejects.toThrow('redirect:/reset-password/success')
    expect(mockGetUser).toHaveBeenCalledOnce()
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-password' })
    expect(cookieStore.set).toHaveBeenCalledWith('fitness-3d-password-recovery', '', {
      path: '/reset-password',
      maxAge: 0,
    })
    expect(mockRedirect).toHaveBeenCalledExactlyOnceWith('/reset-password/success')
  })

  it('shows the invalid-link state when the recovery session has expired', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } })
    await expect(updatePassword('new-password', 'new-password')).resolves.toMatchObject({ invalidRecovery: true })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('maps Supabase password policy errors to Turkish', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Password should be at least 8 characters', code: 'weak_password' } })
    await expect(updatePassword('short', 'short')).resolves.toEqual({
      error: 'Bu şifre hesap güvenlik gerekliliklerini karşılamıyor. Daha güçlü bir şifre dene.',
    })
    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('returns a Turkish service error if the password update request fails', async () => {
    mockUpdateUser.mockRejectedValue(new Error('network failure'))
    await expect(updatePassword('new-password', 'new-password')).resolves.toEqual({
      error: 'Şifre güncellenemedi. Lütfen daha sonra tekrar dene.',
    })
    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('keeps a failed password update on the form even when Supabase reports an expired session', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Session not found', code: 'session_not_found', status: 401 } })

    await expect(updatePassword('new-password', 'new-password')).resolves.toEqual({
      error: 'Oturumun süresi doldu. Lütfen yeni bir sıfırlama bağlantısı iste.',
    })
    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
