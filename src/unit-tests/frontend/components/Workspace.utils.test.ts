import { buildHeaderTitle, truncateProfileName } from '../../../frontend/components/Workspace/utils';
import { WORKSPACE_TEXT } from '../../../frontend/components/Workspace/constants';

describe('Workspace utils', () => {
  it('truncates long profile names', () => {
    expect(truncateProfileName('Short', 10)).toBe('Short');
    expect(truncateProfileName('VeryLongProfileName', 4)).toBe('Very...');
  });

  it('builds header title with profile and version', () => {
    const title = buildHeaderTitle('MyProfile', '2.1.1');
    expect(title).toContain(WORKSPACE_TEXT.appName);
    expect(title).toContain('MyProfile');
    expect(title).toContain('2.1.1');
  });
});
