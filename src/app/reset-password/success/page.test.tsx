import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ResetPasswordSuccessPage from './page'

describe('ResetPasswordSuccessPage', () => {
  it('shows the completed state with a login link and no invalid-link state', () => {
    const html = renderToStaticMarkup(<ResetPasswordSuccessPage />)

    expect(html).toContain('Şifren güncellendi')
    expect(html).toContain('Yeni şifren başarıyla kaydedildi. Artık yeni şifrenle giriş yapabilirsin.')
    expect(html).toContain('href="/login"')
    expect(html).toContain('Giriş Yap')
    expect(html).not.toContain('Bağlantı geçersiz')
  })
})
