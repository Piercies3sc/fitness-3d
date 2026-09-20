'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string
  
  if (password !== passwordConfirm) {
    return { error: 'Şifreler eşleşmiyor.' }
  }

  const data = {
    email: formData.get('email') as string,
    password,
  }

  const { error } = await supabase.auth.signUp(data)
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/home')
}
