import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCookies, mockCreateClient } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockCreateClient: vi.fn(),
}))

vi.mock('next/headers', () => ({ cookies: mockCookies }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))
vi.mock('./reset-password-form', () => ({ default: () => <div>Reset password form</div> }))

import ResetPasswordPage from './page'

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) })
  })

  it('shows the invalid-link state for a direct visit without a recovery session', async () => {
    const page = await ResetPasswordPage({ searchParams: Promise.resolve({}) })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Bağlantı geçersiz')
    expect(html).toContain('Bağlantının süresi dolmuş veya geçersiz.')
    expect(html).not.toContain('Reset password form')
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('shows the form for a valid recovery session', async () => {
    mockCookies.mockResolvedValue({ get: vi.fn().mockReturnValue({ value: '1' }) })
    mockCreateClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null }) } })

    const page = await ResetPasswordPage({ searchParams: Promise.resolve({}) })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Reset password form')
    expect(html).not.toContain('Bağlantı geçersiz')
  })
})
