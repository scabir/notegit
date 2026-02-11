import { buildHeaderTitle, truncateProfileName } from '../../../frontend/components/EditorShell/utils';

describe('EditorShell utils', () => {
  it('truncates long profile names', () => {
    expect(truncateProfileName('Short', 10)).toBe('Short');
    expect(truncateProfileName('VeryLongProfileName', 4)).toBe('Very...');
  });

  it('builds header title with profile only', () => {
    const title = buildHeaderTitle('MyProfile');
    expect(title).toBe('MyProfile');
  });

  it('returns empty title when no profile is selected', () => {
    expect(buildHeaderTitle('')).toBe('');
  });
});
