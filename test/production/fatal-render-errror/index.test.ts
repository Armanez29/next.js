import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import { check, renderViaHTTP, waitFor } from 'next-test-utils'
import webdriver from 'next-webdriver'
import { join } from 'path'

describe('fatal-render-errror', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: new FileRef(join(__dirname, 'app')),
      dependencies: {},
    })
  })
  afterAll(() => next.destroy())

  it('should render page without error correctly', async () => {
    const html = await renderViaHTTP(next.url, '/')
    expect(html).toContain('index page')
    expect(html).toContain('from _app')
  })

  it('should handle fatal error in _app and _error without loop on direct visit', async () => {
    const browser = await webdriver(next.url, '/with-error')

    // wait a bit to see if we are rendering multiple times unexpectedly
    await waitFor(500)
    // there are 4 render attempts of _app due to first render attempt (initial
    // error is thrown), second render attempt with custom _error, third render
    // attempt with default _error, and final for query update
    expect(await browser.eval('window.renderAttempts')).toBe(4)

    const html = await browser.eval('document.documentElement.innerHTML')
    expect(html).not.toContain('from _app')
    expect(html).toContain(
      'Application error: a client-side exception has occurred'
    )
  })

  it('should handle fatal error in _app and _error without loop on client-transition', async () => {
    const browser = await webdriver(next.url, '/')
    await browser.eval('window.renderAttempts = 0')

    await browser.eval('window.next.router.push("/with-error")')
    await check(() => browser.eval('location.pathname'), '/with-error')

    // wait a bit to see if we are rendering multiple times unexpectedly
    await waitFor(500)
    expect(await browser.eval('window.renderAttempts')).toBe(4)

    const html = await browser.eval('document.documentElement.innerHTML')
    expect(html).not.toContain('from _app')
    expect(html).toContain(
      'Application error: a client-side exception has occurred'
    )
  })
})
