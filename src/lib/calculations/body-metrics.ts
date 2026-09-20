import { kgToLb, lbToKg, parseWeightInput } from '../../utils/weight-conversion';

export type WeightEntryItem = {
  id: string;
  weight_kg: number;
  recorded_at: string;
};

export type WeightRange = '30d' | '3m' | '6m' | '1y';

/**
 * Calculates Body Mass Index (BMI).
 * Formula: weight_kg / (height_m ^ 2) = weight_kg / ((height_cm / 100) ^ 2)
 *
 * Requirements:
 * - weight > 0
 * - height > 0
 * - returns null if required data missing
 * - returns full precision number
 */
export function calculateBMI(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined
): number | null {
  if (
    weightKg === null ||
    weightKg === undefined ||
    heightCm === null ||
    heightCm === undefined
  ) {
    return null;
  }

  if (weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Formats BMI for display (rounded to 1 decimal place).
 * Does NOT display classification labels.
 */
export function formatBMI(bmi: number | null | undefined): string {
  if (bmi === null || bmi === undefined || isNaN(bmi)) {
    return '—';
  }
  return (Math.round(bmi * 10) / 10).toFixed(1);
}

/**
 * Derives exact calendar age from date_of_birth.
 * Accurately determines if birthday has occurred this year.
 * Returns null if dob is missing, invalid, or in the future.
 */
export function calculateAge(
  dob: string | Date | null | undefined,
  referenceDate: Date = new Date()
): number | null {
  if (!dob) return null;

  let birthDate: Date;
  if (typeof dob === 'string') {
    // Parse YYYY-MM-DD in local time
    const parts = dob.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      birthDate = new Date(year, month, day);
    } else {
      birthDate = new Date(dob);
    }
  } else {
    birthDate = dob;
  }

  if (isNaN(birthDate.getTime())) return null;

  // If birthDate is after referenceDate (future date), return null
  if (birthDate.getTime() > referenceDate.getTime()) return null;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Calculates Estimated BMR using the Mifflin–St Jeor equation.
 *
 * Male:
 * BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
 *
 * Female:
 * BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
 *
 * Returns null if any required input is missing or invalid.
 */
export function calculateEstimatedBMR(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
  age: number | null | undefined,
  sex: 'male' | 'female' | string | null | undefined
): number | null {
  if (
    weightKg === null ||
    weightKg === undefined ||
    heightCm === null ||
    heightCm === undefined ||
    age === null ||
    age === undefined ||
    !sex
  ) {
    return null;
  }

  if (weightKg <= 0 || heightCm <= 0 || age < 0) {
    return null;
  }

  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (sex === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  return null;
}

/**
 * Formats Estimated BMR for display (rounded to nearest whole kcal).
 * Unit: kcal/day.
 */
export function formatEstimatedBMR(bmr: number | null | undefined): string {
  if (bmr === null || bmr === undefined || isNaN(bmr)) {
    return '—';
  }
  return `${Math.round(bmr).toLocaleString('en-US')} kcal/day`;
}

/**
 * Returns a list of missing field names required for Estimated BMR calculation.
 */
export function getBMRMissingFields(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
  age: number | null | undefined,
  sex: 'male' | 'female' | string | null | undefined
): string[] {
  const missing: string[] = [];
  if (weightKg === null || weightKg === undefined || weightKg <= 0) {
    missing.push('weight');
  }
  if (heightCm === null || heightCm === undefined || heightCm <= 0) {
    missing.push('height');
  }
  if (age === null || age === undefined || age < 0) {
    missing.push('date of birth');
  }
  if (!sex || (sex !== 'male' && sex !== 'female')) {
    missing.push('BMR sex');
  }
  return missing;
}

/**
 * Generates concise helper text explaining which fields are missing for BMR.
 * Example: "Add date of birth and BMR sex to calculate."
 */
export function getBMRMissingMessage(missingFields: string[]): string | null {
  if (missingFields.length === 0) return null;

  if (missingFields.length === 1) {
    return `Add ${missingFields[0]} to calculate.`;
  }
  if (missingFields.length === 2) {
    return `Add ${missingFields[0]} and ${missingFields[1]} to calculate.`;
  }
  const allExceptLast = missingFields.slice(0, -1).join(', ');
  const last = missingFields[missingFields.length - 1];
  return `Add ${allExceptLast}, and ${last} to calculate.`;
}

/**
 * Returns the latest weight in kg strictly by recorded_at timestamp.
 * Never by highest value or insertion order.
 */
export function getLatestWeight(
  entries: { weight_kg: number; recorded_at: string }[]
): number | null {
  if (!entries || entries.length === 0) return null;

  // Find the entry with the latest recorded_at timestamp
  let latest = entries[0];
  let latestMs = new Date(latest.recorded_at).getTime();

  for (let i = 1; i < entries.length; i++) {
    const ms = new Date(entries[i].recorded_at).getTime();
    if (ms > latestMs) {
      latest = entries[i];
      latestMs = ms;
    }
  }

  return latest.weight_kg;
}

export type DailyWeightPoint = {
  dateKey: string;      // YYYY-MM-DD
  weight_kg: number;    // latest recorded entry for this calendar day
  recorded_at: string;  // timestamp of that latest entry
  rawEntryId: string;
};

export type WeightChartPoint = {
  id: string;
  weight_kg: number;
  recorded_at: string;
};

export type WeightChartMode = 'intraday' | 'daily';

export type WeightChartData = {
  mode: WeightChartMode;
  points: WeightChartPoint[];
};

/**
 * Produces the visible chart series from already range-filtered raw entries.
 *
 * A single local calendar date keeps every raw entry so same-day progress is
 * visible. Once entries span days, the chart returns the latest entry per day.
 */
export function getWeightChartData(
  entries: WeightEntryItem[]
): WeightChartData | null {
  if (entries.length < 2) return null;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const dailyPoints = groupWeightEntriesByDay(sortedEntries);

  if (dailyPoints.length === 1) {
    return {
      mode: 'intraday',
      points: sortedEntries.map((entry) => ({
        id: entry.id,
        weight_kg: entry.weight_kg,
        recorded_at: entry.recorded_at,
      })),
    };
  }

  return {
    mode: 'daily',
    points: dailyPoints.map((point) => ({
      id: point.rawEntryId,
      weight_kg: point.weight_kg,
      recorded_at: point.recorded_at,
    })),
  };
}

/**
 * Groups weight entries by the user's local calendar date.
 * For any day with multiple entries, selects the LATEST recorded entry.
 * Returns sorted chronologically by date.
 */
export function groupWeightEntriesByDay(
  entries: WeightEntryItem[]
): DailyWeightPoint[] {
  if (!entries || entries.length === 0) return [];

  // Sort entries ascending by recorded_at
  const sorted = [...entries].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  // Group by local calendar date YYYY-MM-DD
  const dayMap = new Map<string, WeightEntryItem>();

  for (const entry of sorted) {
    const d = new Date(entry.recorded_at);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    // Because sorted ascending, later entry on same day overwrites earlier entry
    dayMap.set(dateKey, entry);
  }

  const result: DailyWeightPoint[] = [];
  for (const [dateKey, entry] of dayMap.entries()) {
    result.push({
      dateKey,
      weight_kg: entry.weight_kg,
      recorded_at: entry.recorded_at,
      rawEntryId: entry.id,
    });
  }

  return result;
}

/**
 * Filters weight entries by the selected time range.
 * Entries must be sorted by recorded_at ascending.
 */
export function filterWeightEntriesByRange<T extends { recorded_at: string }>(
  entries: T[],
  range: WeightRange,
  referenceDate: Date = new Date()
): T[] {
  const cutoffDate = new Date(referenceDate.getTime());

  switch (range) {
    case '30d':
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      break;
    case '3m':
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
      break;
    case '6m':
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      break;
    case '1y':
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      break;
  }

  const cutoffMs = cutoffDate.getTime();

  return entries.filter((e) => new Date(e.recorded_at).getTime() >= cutoffMs);
}

export type WeightChangeSummary = {
  changeValue: number | null; // In preferred unit, null if fewer than two points
  formatted: string;          // e.g. "−2.6 kg today" or "−2.6 kg in 3M"
  hasTrend: boolean;
};

/**
 * Calculates factual weight change between the earliest and latest visible
 * chart point. Callers select the "today" context for intraday series.
 */
export function calculateWeightChange(
  points: Array<Pick<WeightChartPoint, 'weight_kg' | 'recorded_at'>>,
  rangeLabel: string,
  unitPreference: 'kg' | 'lb' = 'kg',
  context: 'range' | 'today' = 'range'
): WeightChangeSummary {
  if (points.length < 2) {
    return {
      changeValue: null,
      formatted: 'More entries needed for a trend.',
      hasTrend: false,
    };
  }

  // Sort ascending by recorded_at to guarantee earliest vs latest chart point.
  const sorted = [...points].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  const earliestVal =
    unitPreference === 'lb' ? kgToLb(earliest.weight_kg) : earliest.weight_kg;
  const latestVal =
    unitPreference === 'lb' ? kgToLb(latest.weight_kg) : latest.weight_kg;

  const diff = Math.round((latestVal - earliestVal) * 10) / 10;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  const absDiff = Math.abs(diff).toFixed(1);

  return {
    changeValue: diff,
    formatted:
      context === 'today'
        ? `${sign}${absDiff} ${unitPreference} today`
        : `${sign}${absDiff} ${unitPreference} in ${rangeLabel.toUpperCase()}`,
    hasTrend: true,
  };
}

/**
 * Validates height in cm.
 * Optional: empty/null returns null.
 * Range: 0 < height_cm <= 300.
 */
export function validateHeight(heightInput: number | string | null | undefined): {
  isValid: boolean;
  value: number | null;
  error?: string;
} {
  if (heightInput === null || heightInput === undefined || heightInput === '') {
    return { isValid: true, value: null };
  }

  const num = typeof heightInput === 'string' ? parseFloat(heightInput.trim()) : heightInput;

  if (isNaN(num) || num <= 0 || num > 300) {
    return {
      isValid: false,
      value: null,
      error: 'Height must be a positive number up to 300 cm.',
    };
  }

  return { isValid: true, value: Math.round(num * 10) / 10 };
}

/**
 * Validates Date of Birth (YYYY-MM-DD).
 * Optional: empty/null returns null.
 * Must not be in the future.
 */
export function validateDateOfBirth(
  dobInput: string | null | undefined,
  referenceDate: Date = new Date()
): {
  isValid: boolean;
  value: string | null;
  error?: string;
} {
  if (!dobInput || dobInput.trim() === '') {
    return { isValid: true, value: null };
  }

  const trimmed = dobInput.trim();
  const dateObj = new Date(trimmed);

  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      value: null,
      error: 'Please enter a valid date (YYYY-MM-DD).',
    };
  }

  if (dateObj.getTime() > referenceDate.getTime()) {
    return {
      isValid: false,
      value: null,
      error: 'Date of birth cannot be in the future.',
    };
  }

  return { isValid: true, value: trimmed };
}

/**
 * Validates sex used for BMR.
 * Allowed: 'male' | 'female' | null.
 */
export function validateBMRSex(sexInput: string | null | undefined): {
  isValid: boolean;
  value: 'male' | 'female' | null;
  error?: string;
} {
  if (!sexInput || sexInput.trim() === '') {
    return { isValid: true, value: null };
  }

  const normalized = sexInput.trim().toLowerCase();
  if (normalized === 'male' || normalized === 'female') {
    return { isValid: true, value: normalized };
  }

  return {
    isValid: false,
    value: null,
    error: "Sex for BMR must be 'male', 'female', or left blank.",
  };
}

/**
 * Validates weight input and returns canonical weight in kg.
 * Converts lb -> kg if unitPreference is 'lb'.
 * Range: 0 < weight <= 500 kg (or equivalent in lb).
 */
export function validateWeightInput(
  weightInput: number | string | null | undefined,
  unitPreference: 'kg' | 'lb' = 'kg'
): {
  isValid: boolean;
  weightKg: number | null;
  error?: string;
} {
  if (weightInput === null || weightInput === undefined || weightInput === '') {
    return {
      isValid: false,
      weightKg: null,
      error: 'Weight is required.',
    };
  }

  const rawNum =
    typeof weightInput === 'string'
      ? parseWeightInput(weightInput)
      : weightInput;

  if (isNaN(rawNum) || rawNum <= 0) {
    return {
      isValid: false,
      weightKg: null,
      error: 'Weight must be greater than zero.',
    };
  }

  const maxInput = unitPreference === 'lb' ? 1100 : 500;
  if (rawNum > maxInput) {
    return {
      isValid: false,
      weightKg: null,
      error: `Weight must not exceed ${maxInput} ${unitPreference}.`,
    };
  }

  const weightKg = unitPreference === 'lb' ? lbToKg(rawNum) : Math.round(rawNum * 100) / 100;

  return {
    isValid: true,
    weightKg,
  };
}
