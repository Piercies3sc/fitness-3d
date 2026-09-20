import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signup, resendVerification } from './actions'
import {
  RATE_LIMIT_MESSAGE,
  UNVERIFIED_LOGIN_MESSAGE,
  isRateLimitError,
  isUserAlreadyExistsError,
} from '../../lib/auth/verification'
import { login } from '../login/actions'
import * as serverSupabase from '../../lib/supabase/server'

vi.mock('../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

describe('Auth Email Verification Flow', () => {
  let mockSupabase: {
    auth: {
      signUp: ReturnType<typeof vi.fn>
      resend: ReturnType<typeof vi.fn>
      signInWithPassword: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        resend: vi.fn(),
        signInWithPassword: vi.fn(),
      },
    }
    vi.mocked(serverSupabase.createClient).mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    )
  })

  describe('isRateLimitError helper', () => {
    it('detects rate limit errors across various formats', () => {
      expect(isRateLimitError({ message: 'email rate limit exceeded' })).toBe(true)
      expect(isRateLimitError({ message: 'Email rate limit exceeded', status: 429 })).toBe(true)
      expect(isRateLimitError({ code: 'over_email_send_rate_limit' })).toBe(true)
      expect(isRateLimitError({ status: 429 })).toBe(true)
      expect(isRateLimitError({ message: 'Invalid login credentials' })).toBe(false)
      expect(isRateLimitError(null)).toBe(false)
    })
  })

  describe('isUserAlreadyExistsError helper', () => {
    it('detects existing user error patterns', () => {
      expect(isUserAlreadyExistsError({ message: 'User already registered' })).toBe(true)
      expect(isUserAlreadyExistsError({ code: 'user_already_exists' })).toBe(true)
      expect(isUserAlreadyExistsError({ message: 'A user with this email already exists' })).toBe(true)
      expect(isUserAlreadyExistsError({ message: 'Wrong password' })).toBe(false)
      expect(isUserAlreadyExistsError(null)).toBe(false)
    })
  })

  describe('signup action', () => {
    it('returns needsVerification when email confirmation is required and no session exists', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'test-user-id', identities: [{ id: '1' }] },
          session: null,
        },
        error: null,
      })

      const formData = new FormData()
      formData.set('email', 'test@example.com')
      formData.set('password', 'secret123')
      formData.set('passwordConfirm', 'secret123')

      const result = await signup(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret123',
      })
      expect(result).toEqual({
        success: true,
        needsVerification: true,
        email: 'test@example.com',
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('redirects to /home if auto-confirmed (session exists)', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'test-user-id' },
          session: { access_token: 'fake-token' },
        },
        error: null,
      })

      const formData = new FormData()
      formData.set('email', 'auto@example.com')
      formData.set('password', 'secret123')
      formData.set('passwordConfirm', 'secret123')

      await signup(formData)

      expect(mockRedirect).toHaveBeenCalledWith('/home')
    })

    it('translates rate-limit error into Turkish message during signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'email rate limit exceeded', status: 429 },
      })

      const formData = new FormData()
      formData.set('email', 'rate@example.com')
      formData.set('password', 'secret123')
      formData.set('passwordConfirm', 'secret123')

      const result = await signup(formData)

      expect(result).toEqual({
        error: RATE_LIMIT_MESSAGE,
        rateLimited: true,
        email: 'rate@example.com',
      })
    })

    it('guides user toward verification when account already exists', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', code: 'user_already_exists' },
      })

      const formData = new FormData()
      formData.set('email', 'existing@example.com')
      formData.set('password', 'secret123')
      formData.set('passwordConfirm', 'secret123')

      const result = await signup(formData)

      expect(result).toEqual({
        existingUser: true,
        email: 'existing@example.com',
        error: 'Bu e-posta adresiyle zaten bir hesap var.',
      })
    })

    it('rejects mismatched passwords without calling Supabase', async () => {
      const formData = new FormData()
      formData.set('email', 'test@example.com')
      formData.set('password', 'secret123')
      formData.set('passwordConfirm', 'mismatch456')

      const result = await signup(formData)

      expect(result).toEqual({ error: 'Şifreler eşleşmiyor.' })
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })
  })

  describe('resendVerification action', () => {
    it('calls supabase.auth.resend with type signup and existing email (does NOT create another account)', async () => {
      mockSupabase.auth.resend.mockResolvedValue({
        data: {},
        error: null,
      })

      const result = await resendVerification('test@example.com')

      expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
      })
      // Ensure signUp is never called
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('translates rate-limit error on resend into Turkish message', async () => {
      mockSupabase.auth.resend.mockResolvedValue({
        data: {},
        error: { message: 'email rate limit exceeded', status: 429 },
      })

      const result = await resendVerification('test@example.com')

      expect(result).toEqual({
        error: RATE_LIMIT_MESSAGE,
        rateLimited: true,
      })
    })

    it('returns clean error message on generic resend failure', async () => {
      mockSupabase.auth.resend.mockResolvedValue({
        data: {},
        error: { message: 'Internal server error' },
      })

      const result = await resendVerification('test@example.com')

      expect(result).toEqual({
        error: 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.',
      })
    })
  })

  describe('login action', () => {
    it('returns unverified error with Turkish message when user has unconfirmed email', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', code: 'email_not_confirmed' },
      })

      const formData = new FormData()
      formData.set('email', 'unverified@example.com')
      formData.set('password', 'secret123')

      const result = await login(formData)

      expect(result).toEqual({
        error: UNVERIFIED_LOGIN_MESSAGE,
        unverified: true,
        email: 'unverified@example.com',
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('translates rate-limit error on login into Turkish message', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'email rate limit exceeded', status: 429 },
      })

      const formData = new FormData()
      formData.set('email', 'rate@example.com')
      formData.set('password', 'secret123')

      const result = await login(formData)

      expect(result).toEqual({
        error: RATE_LIMIT_MESSAGE,
        rateLimited: true,
      })
    })

    it('returns generic error on wrong password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const formData = new FormData()
      formData.set('email', 'test@example.com')
      formData.set('password', 'wrongpassword')

      const result = await login(formData)

      expect(result).toEqual({
        error: 'E-posta veya şifre hatalı.',
      })
    })

    it('redirects to /home on successful verified login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'verified-user' }, session: { access_token: 'valid' } },
        error: null,
      })

      const formData = new FormData()
      formData.set('email', 'verified@example.com')
      formData.set('password', 'secret123')

      await login(formData)

      expect(mockRedirect).toHaveBeenCalledWith('/home')
    })
  })
})
