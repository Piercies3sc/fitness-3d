import { describe, expect, it } from 'vitest';
import { getSelectableMuscleSlug } from './meshInteraction';
import { displayMuscleName } from '../../lib/ui/turkish';

const reverseMapping = {
  'left tibialis anterior': 'tibialis-anterior',
  'right fibularis longus': 'fibularis',
};

describe('Body mesh interaction', () => {
  it('keeps a tracked zero-exposure muscle selectable', () => {
    const normalizedExposure: Record<string, number> = { 'tibialis-anterior': 0 };
    const slug = getSelectableMuscleSlug('left tibialis anterior', reverseMapping);

    expect(slug).toBe('tibialis-anterior');
    expect(normalizedExposure[slug!]).toBe(0);
  });

  it('does not resolve neutral anatomical context', () => {
    expect(getSelectableMuscleSlug('left calcaneal tendon', reverseMapping)).toBeNull();
    expect(getSelectableMuscleSlug('Dorsum of foot.l', reverseMapping)).toBeNull();
  });

  it('resolves each new lower-leg mesh to its canonical internal slug', () => {
    expect(getSelectableMuscleSlug('left tibialis anterior', reverseMapping)).toBe('tibialis-anterior');
    expect(getSelectableMuscleSlug('right fibularis longus', reverseMapping)).toBe('fibularis');
  });

  it('keeps Turkish display labels separate from canonical mappings', () => {
    expect(displayMuscleName('Tibialis Anterior')).toBe('Ön Kaval Kası');
    expect(displayMuscleName('Fibularis')).toBe('Dış Baldır / Fibularis');
    expect(getSelectableMuscleSlug('left tibialis anterior', reverseMapping)).toBe('tibialis-anterior');
  });
});
