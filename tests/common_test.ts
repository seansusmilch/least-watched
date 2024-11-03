import { assertEquals } from '@std/assert';
import { urlWithParams, bytesToGB } from '../src/common.ts';

Deno.test('urlWithParams', () => {
  const url = 'http://example.com';
  const params = {
    foo: 'bar',
    baz: 123,
  };
  const expected = new URL(url);
  expected.searchParams.append('foo', 'bar');
  expected.searchParams.append('baz', '123');

  assertEquals(urlWithParams(url, params), expected);
});

Deno.test('bytesToGB', () => {
  assertEquals(bytesToGB(1073741824), 1);
});
