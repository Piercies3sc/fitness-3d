'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './server';
import {
  validateHeight,
  validateDateOfBirth,
  validateBMRSex,
  validateWeightInput,
} from '../calculations/body-metrics';

export type WeightActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Server action to log a new weight entry.
 * Canonical storage is KG ONLY.
 */
export async function logWeightEntry(
  userId: string,
  weightInput: string | number,
  recordedAtInput?: string | null,
  unitPreference: 'kg' | 'lb' = 'kg'
): Promise<WeightActionResult> {
  const validation = validateWeightInput(weightInput, unitPreference);
  if (!validation.isValid || validation.weightKg === null) {
    return { success: false, error: validation.error || 'Geçersiz kilo değeri.' };
  }

  let recordedAt = new Date().toISOString();
  if (recordedAtInput && recordedAtInput.trim().length > 0) {
    const parsedDate = new Date(recordedAtInput);
    if (!isNaN(parsedDate.getTime())) {
      if (parsedDate.getTime() > Date.now() + 60000) {
        return { success: false, error: 'Kayıt tarihi gelecekte olamaz.' };
      }
      recordedAt = parsedDate.toISOString();
    }
  }

  const supabase = await createClient();

  const { error } = await supabase.from('weight_entries').insert({
    user_id: userId,
    weight_kg: validation.weightKg,
    recorded_at: recordedAt,
  });

  if (error) {
    console.error('Error logging weight entry:', error);
    return { success: false, error: 'Kilo kaydedilemedi. Lütfen tekrar deneyin.' };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Kilo başarıyla kaydedildi.' };
}

/**
 * Server action to delete a user's weight entry.
 */
export async function deleteWeightEntry(
  userId: string,
  entryId: string
): Promise<WeightActionResult> {
  if (!entryId) {
    return { success: false, error: 'Kayıt kimliği eksik.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('weight_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting weight entry:', error);
    return { success: false, error: 'Kilo kaydı silinemedi.' };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Kilo kaydı silindi.' };
}

/**
 * Server action to update user body metrics on profiles table.
 */
export async function updateBodyMetrics(
  userId: string,
  heightInput: string | number | null,
  dobInput: string | null,
  bmrSexInput: string | null
): Promise<WeightActionResult> {
  const heightVal = validateHeight(heightInput);
  if (!heightVal.isValid) {
    return { success: false, error: heightVal.error };
  }

  const dobVal = validateDateOfBirth(dobInput);
  if (!dobVal.isValid) {
    return { success: false, error: dobVal.error };
  }

  const sexVal = validateBMRSex(bmrSexInput);
  if (!sexVal.isValid) {
    return { success: false, error: sexVal.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      height_cm: heightVal.value,
      date_of_birth: dobVal.value,
      bmr_sex: sexVal.value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating body metrics:', error);
    return { success: false, error: 'Vücut ölçüleri güncellenemedi.' };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Vücut ölçüleri güncellendi.' };
}
