describe('Comments API validation', () => {
  const sanitizeName = raw =>
    (raw || '')
      .toString()
      .replace(/[<>]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .slice(0, 20) || 'Guest';

  const sanitizeMessage = raw => (raw || '').toString().replace(/[<>]/g, '').trim().slice(0, 280);

  test('should sanitize and default invalid names', () => {
    expect(sanitizeName('Alice')).toBe('Alice');
    expect(sanitizeName('<script>')).toBe('script');
    expect(sanitizeName('')).toBe('Guest');
  });

  test('should trim long names to 20 chars', () => {
    const name = 'a'.repeat(30);
    expect(sanitizeName(name).length).toBe(20);
  });

  test('should strip html brackets from message', () => {
    expect(sanitizeMessage('<b>Hello</b>')).toBe('bHello/b');
  });

  test('should enforce 280 character message limit', () => {
    const msg = 'x'.repeat(500);
    expect(sanitizeMessage(msg).length).toBe(280);
  });

  test('should reject empty comment after sanitize', () => {
    expect(sanitizeMessage('   ')).toBe('');
  });
});
