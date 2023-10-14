/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { NextResponse } from 'next/src/server/web/spec-extension/response'

it('reflect .set into `set-cookie`', async () => {
  const response = new NextResponse()
  expect(response.cookies.get('foo')?.value).toBe(undefined)
  expect(response.cookies.get('foo')).toEqual(undefined)

  response.cookies
    .set('foo', 'bar', { path: '/test' })
    .set('fooz', 'barz', { path: '/test2' })

  expect(response.cookies.get('foo')?.value).toBe('bar')
  expect(response.cookies.get('fooz')?.value).toBe('barz')

  expect(response.cookies.get('foo')).toEqual({
    name: 'foo',
    path: '/test',
    value: 'bar',
  })
  expect(response.cookies.get('fooz')).toEqual({
    name: 'fooz',
    path: '/test2',
    value: 'barz',
  })

  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/test, fooz=barz; Path=/test2'
  )
})

it('reflect .set all options attributes into `set-cookie`', async () => {
  const response = new NextResponse()
  const options = {
    domain: 'custom-domain',
    path: 'custom-path',
    secure: true,
    sameSite: 'strict' as 'strict' | 'lax' | 'none',
    expires: new Date(2100, 0, 1, 12, 0, 0),
    httpOnly: true,
    maxAge: 0,
    priority: 'high' as 'low' | 'medium' | 'high',
  }
  response.cookies.set('first-name', 'first-value', options)
  const cookiesInHeaders = Object.fromEntries(response.headers.entries())[
    'set-cookie'
  ]
  expect(cookiesInHeaders).toBe(
    'first-name=first-value; Path=custom-path; Expires=Fri, 01 Jan 2100 12:00:00 GMT; Max-Age=0; Domain=custom-domain; Secure; HttpOnly; SameSite=strict; Priority=high'
  )
})

it('reflect .delete into `set-cookie`', async () => {
  const { NextResponse } = await import(
    'next/dist/server/web/spec-extension/response'
  )

  const response = new NextResponse()

  response.cookies.set('foo', 'bar')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/'
  )

  expect(response.cookies.get('foo')?.value).toBe('bar')
  expect(response.cookies.get('foo')).toEqual({
    name: 'foo',
    path: '/',
    value: 'bar',
  })

  response.cookies.set('fooz', 'barz')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/, fooz=barz; Path=/'
  )

  expect(response.cookies.get('fooz')?.value).toBe('barz')
  expect(response.cookies.get('fooz')).toEqual({
    name: 'fooz',
    path: '/',
    value: 'barz',
  })

  response.cookies.delete('foo')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=barz; Path=/'
  )

  expect(response.cookies.get('foo')?.value).toBe('')
  expect(response.cookies.get('foo')).toEqual({
    expires: new Date(0),
    name: 'foo',
    value: '',
    path: '/',
  })

  response.cookies.delete('fooz')

  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )

  expect(response.cookies.get('fooz')?.value).toBe('')
  expect(response.cookies.get('fooz')).toEqual({
    expires: new Date(0),
    name: 'fooz',
    value: '',
    path: '/',
  })
})

it('response.cookie does not modify options', async () => {
  const { NextResponse } = await import(
    'next/dist/server/web/spec-extension/response'
  )

  const options = { maxAge: 10000 }
  const response = new NextResponse(null, {
    headers: { 'content-type': 'application/json' },
  })
  response.cookies.set('cookieName', 'cookieValue', options)
  expect(options).toEqual({ maxAge: 10000 })
})
