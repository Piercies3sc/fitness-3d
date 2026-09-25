import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const { mockConfirmRecovery } = vi.hoisted(() => ({ mockConfirmRecovery: vi.fn() }))
vi.mock('./actions', () => ({ confirmRecovery: mockConfirmRecovery }))

import RecoveryPage from './page'

describe('RecoveryPage', () => {
  it('renders a confirmation form without consuming the token on GET', async () => {
    const page = await RecoveryPage({ searchParams: Promise.resolve({ token_hash: 'mock-token-hash' }) })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Şifreni sıfırla')
    expect(html).toContain('Şifreyi Sıfırla')
    expect(html).toContain('type="hidden" name="token_hash" value="mock-token-hash"')
    expect(mockConfirmRecovery).not.toHaveBeenCalled()
  })

  it('renders a safe invalid state when the token is missing', async () => {
    const page = await RecoveryPage({ searchParams: Promise.resolve({}) })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Bağlantının süresi dolmuş veya geçersiz.')
    expect(html).toContain('Yeni sıfırlama bağlantısı iste')
    expect(html).not.toContain('name="token_hash"')
    expect(mockConfirmRecovery).not.toHaveBeenCalled()
  })

  it('renders the invalid state after verification fails', async () => {
    const page = await RecoveryPage({ searchParams: Promise.resolve({ error: 'invalid' }) })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Bağlantının süresi dolmuş veya geçersiz.')
    expect(html).not.toContain('name="token_hash"')
  })
})
