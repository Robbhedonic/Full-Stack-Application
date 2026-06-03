import { describe, expect, it } from 'vitest';
import { pageToPath, pathToPage } from './routes.js';

describe('routes', () => {
  it('maps known pages to paths', () => {
    expect(pageToPath('dashboard')).toBe('/dashboard');
    expect(pageToPath('profile')).toBe('/profile');
    expect(pageToPath('unknown')).toBe('/home');
  });

  it('maps pathname to page id', () => {
    expect(pathToPage('/dashboard')).toBe('dashboard');
    expect(pathToPage('/profile/')).toBe('profile');
    expect(pathToPage('/nope')).toBe('home');
  });
});
