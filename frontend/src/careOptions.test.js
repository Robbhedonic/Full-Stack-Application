import { describe, expect, it } from 'vitest';
import { formatBookingCareSummary, petTypeLabel, plantTypeLabel } from './careOptions.js';

describe('careOptions', () => {
  it('returns labels for pet and plant types', () => {
    expect(petTypeLabel('dog')).toBe('Dog');
    expect(plantTypeLabel('succulent')).toBe('Succulents');
    expect(petTypeLabel('unknown')).toBe('unknown');
  });

  it('formats pet booking care summary', () => {
    const summary = formatBookingCareSummary({
      serviceType: 'pet',
      petType: 'cat',
      mealsPerDay: 2,
      careNotes: 'No dairy',
    });
    expect(summary).toContain('Cat');
    expect(summary).toContain('2 meal(s)/day');
    expect(summary).toContain('No dairy');
  });
});
