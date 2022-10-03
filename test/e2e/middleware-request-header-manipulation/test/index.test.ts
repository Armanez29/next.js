/* eslint-env jest */

import { join } from 'path'
import { NextInstance } from 'test/lib/next-modes/base'
import { fetchViaHTTP } from 'next-test-utils'
import { createNext, FileRef } from 'e2e-utils'

describe.each([
  { title: 'Serverless Functions', apiPath: '/api/dump-headers-serverless' },
  { title: 'Edge Functions', apiPath: '/api/dump-headers-edge' },
])('Middleware Request Headers Manipulation (for $title)', ({ apiPath }) => {
  let next: NextInstance

  afterAll(() => next.destroy())
  beforeAll(async () => {
    next = await createNext({
      files: {
        pages: new FileRef(join(__dirname, '../app/pages')),
        'next.config.js': new FileRef(join(__dirname, '../app/next.config.js')),
        'middleware.js': new FileRef(join(__dirname, '../app/middleware.js')),
      },
    })
  })

  it(`Adds new headers`, async () => {
    const res = await fetchViaHTTP(next.url, apiPath, null, {
      headers: {
        'x-from-client': 'hello-from-client',
      },
    })
    expect(await res.json()).toMatchObject({
      'x-from-client': 'hello-from-client',
      'x-from-middleware': 'hello-from-middleware',
    })
  })

  it(`Deletes headers`, async () => {
    const res = await fetchViaHTTP(
      next.url,
      apiPath,
      {
        'remove-headers': 'x-from-client1,x-from-client2',
      },
      {
        headers: {
          'x-from-client1': 'hello-from-client',
          'X-From-Client2': 'hello-from-client',
        },
      }
    )

    const json = await res.json()
    expect(json).not.toHaveProperty('x-from-client1')
    expect(json).not.toHaveProperty('X-From-Client2')
    expect(json).toMatchObject({
      'x-from-middleware': 'hello-from-middleware',
    })
  })

  it(`Updates headers`, async () => {
    const res = await fetchViaHTTP(
      next.url,
      apiPath,
      {
        'update-headers': 'x-from-client1=new-value1,x-from-client2=new-value2',
      },
      {
        headers: {
          'x-from-client1': 'old-value1',
          'X-From-Client2': 'old-value2',
          'x-from-client3': 'old-value3',
        },
      }
    )
    expect(await res.json()).toMatchObject({
      'x-from-client1': 'new-value1',
      'x-from-client2': 'new-value2',
      'x-from-client3': 'old-value3',
      'x-from-middleware': 'hello-from-middleware',
    })
  })
})
