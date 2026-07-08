import { ConfigSchema } from '../src/config/types';

describe('ConfigSchema', () => {
  it('applies defaults for locale and logging level', () => {
    const parsed = ConfigSchema.parse({
      wikijs: { url: 'http://localhost:3000', token: 'abc' },
      logging: {}
    });
    expect(parsed.wikijs.defaultLocale).toBe('en');
    expect(parsed.logging.level).toBe('info');
  });

  it('rejects an invalid WikiJS URL', () => {
    expect(() =>
      ConfigSchema.parse({
        wikijs: { url: 'not-a-url', token: 'abc' },
        logging: {}
      })
    ).toThrow();
  });

  it('rejects a missing token', () => {
    expect(() =>
      ConfigSchema.parse({
        wikijs: { url: 'http://localhost:3000', token: '' },
        logging: {}
      })
    ).toThrow();
  });
});

describe('config module', () => {
  it('loads from environment variables (set in jest.setup.ts)', () => {
    const { config } = require('../src/config');
    expect(config.wikijs.url).toBe('http://localhost:3000');
    expect(config.wikijs.token).toBe('test-token');
    expect(config.logging.level).toBe('info');
  });
});
