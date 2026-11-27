import { parseAllowlist, resolveRemoteMissionUrl } from './remote-mission';

const allowlist = parseAllowlist(
  'https://s3.beta.vtg.in.ua/testing-missions, https://*.files.example.com/, not a url',
);

const resolve = (url: string) => resolveRemoteMissionUrl(url, allowlist);

describe('remote mission url', () => {
  it('accepts an allowed .pbo link and keeps the island in the name', () => {
    const result = resolve(
      'https://s3.beta.vtg.in.ua/testing-missions/VTG_Blitzkrieg_124_v1a.cup_chernarus_A3.pbo?v=6e0549ab-b491-47cf-b3a5-6a82dd31dfc8',
    );

    expect(result).toMatchObject({
      ok: true,
      fileName: 'VTG_Blitzkrieg_124_v1a.cup_chernarus_A3.pbo',
    });
  });

  it('decodes the file name and normalizes the extension', () => {
    expect(
      resolve(
        'https://s3.beta.vtg.in.ua/testing-missions/a/My%20Mission.Altis.PBO',
      ),
    ).toMatchObject({ ok: true, fileName: 'My Mission.Altis.pbo' });
  });

  it('supports subdomain wildcards', () => {
    expect(resolve('https://cdn.files.example.com/x.Altis.pbo').ok).toBe(true);
    expect(resolve('https://files.example.com/x.Altis.pbo').ok).toBe(false);
    expect(resolve('https://evilfiles.example.com/x.Altis.pbo').ok).toBe(false);
  });

  it.each([
    'https://s3.beta.vtg.in.ua/other/x.Altis.pbo',
    'https://s3.beta.vtg.in.ua/testing-missions-evil/x.Altis.pbo',
    'https://s3.beta.vtg.in.ua/testing-missions/../other/x.Altis.pbo',
    'https://s3.beta.vtg.in.ua/testing-missions/%2e%2e/other/x.Altis.pbo',
    'http://s3.beta.vtg.in.ua/testing-missions/x.Altis.pbo',
    'https://s3.beta.vtg.in.ua:8443/testing-missions/x.Altis.pbo',
    'https://s3.beta.vtg.in.ua.evil.com/testing-missions/x.Altis.pbo',
  ])('rejects %s', (url) => {
    expect(resolve(url)).toEqual({ ok: false, reason: 'not-allowed' });
  });

  it('rejects credentials, garbage and non-pbo files', () => {
    expect(
      resolve(
        'https://user:pass@s3.beta.vtg.in.ua/testing-missions/x.Altis.pbo',
      ),
    ).toEqual({ ok: false, reason: 'invalid' });
    expect(resolve('nope')).toEqual({ ok: false, reason: 'invalid' });
    expect(resolveRemoteMissionUrl(undefined, allowlist).ok).toBe(false);
    expect(resolve('https://s3.beta.vtg.in.ua/testing-missions/x.zip')).toEqual(
      {
        ok: false,
        reason: 'not-pbo',
      },
    );
  });

  it('allows nothing when the list is empty', () => {
    expect(
      resolveRemoteMissionUrl(
        'https://s3.beta.vtg.in.ua/testing-missions/x.Altis.pbo',
        parseAllowlist(''),
      ),
    ).toEqual({ ok: false, reason: 'not-allowed' });
  });
});
