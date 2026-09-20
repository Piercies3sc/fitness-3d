const exercises: Record<string, string> = {
  'Push-Up': 'Şınav', 'Incline Push-Up': 'Yüksekte Şınav',
  'Decline Push-Up': 'Alçakta Şınav', 'Bodyweight Squat': 'Vücut Ağırlığıyla Squat',
};

const muscles: Record<string, string> = {
  'Pectoralis Major': 'Göğüs', 'Anterior Deltoid': 'Ön Omuz', 'Lateral Deltoid': 'Yan Omuz',
  'Posterior Deltoid': 'Arka Omuz', Quadriceps: 'Ön Bacak / Quadriceps',
  Hamstrings: 'Arka Bacak / Hamstrings', Glutes: 'Kalça', Calves: 'Baldır',
  'Rectus Abdominis': 'Karın', Obliques: 'Yan Karın', 'Erector Spinae': 'Bel / Omurga Erektorları',
  Forearms: 'Ön Kol', 'Hip Flexors': 'Kalça Fleksörleri', 'Latissimus Dorsi': 'Kanat / Latissimus Dorsi',
  'Mid / Lower Trapezius': 'Orta / Alt Trapez', Adductors: 'İç Bacak / Adduktorlar',
  'Tibialis Anterior': 'Ön Kaval Kası', Fibularis: 'Dış Baldır / Fibularis',
  'Upper Trapezius': 'Üst Trapez', 'Rhomboids': 'Rhomboidler', 'Rotator Cuff': 'Rotator Manşet',
  'Serratus Anterior': 'Serratus Anterior', 'Brachialis': 'Brakialis', 'Neck': 'Boyun',
  'Deep Calf & Shin': 'Derin Baldır', 'Hand & Fingers': 'El ve Parmak Kasları',
};

export const displayExerciseName = (name: string) => exercises[name] || name;
export const displayMuscleName = (name: string) => muscles[name] || name;
export const formatTurkishDate = (value: string | Date, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('tr-TR', options).format(new Date(value));
