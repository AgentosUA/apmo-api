import { assignCallsigns, extractManualCallsign } from './callsigns';

const unit = (description: string, isPlayable = true) => ({
  description,
  isPlayable,
});

describe('extractManualCallsign', () => {
  it.each([
    ['Командир@Альфа 2-3', 'Alpha 2-3'],
    ['Squad Leader@Alpha 1-1', 'Alpha 1-1'],
    ['SL @alpha 4 - 5', 'Alpha 4-5'],
    ['Медик@АЛЬФА 3-2', 'Alpha 3-2'],
  ])('%s → %s', (description, expected) => {
    expect(extractManualCallsign(description)).toBe(expected);
  });

  it('returns null without override', () => {
    expect(extractManualCallsign('1. Командир')).toBeNull();
    expect(extractManualCallsign('')).toBeNull();
  });
});

describe('assignCallsigns', () => {
  it('uses overrides, skips taken callsigns and AI-only groups, counts per side', () => {
    const groups = assignCallsigns([
      { side: 'West', units: [unit('1. Командир'), unit('2. Медик')] },
      { side: 'West', units: [unit('Командир@Альфа 1-1'), unit('Стрілець')] },
      { side: 'West', units: [unit('AI', false)] },
      { side: 'West', units: [unit('SL')] },
      { side: 'East', units: [unit('Лідер')] },
    ]);

    expect(groups.map((group) => group.callsign)).toEqual([
      'Alpha 1-2',
      'Alpha 1-1',
      null,
      'Alpha 1-3',
      'Alpha 1-1',
    ]);
  });

  it('rolls over to the next squad after 6 groups', () => {
    const groups = assignCallsigns(
      Array.from({ length: 7 }, () => ({ side: 'West', units: [unit('x')] })),
    );

    expect(groups[groups.length - 1].callsign).toBe('Alpha 2-1');
  });
});
