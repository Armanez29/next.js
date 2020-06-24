/* eslint-env jest */

import fs from 'fs-extra'
import { check, findPort, killApp, launchApp } from 'next-test-utils'
import webdriver from 'next-webdriver'
import { join } from 'path'

jest.setTimeout(1000 * 60 * 3)

const appDir = join(__dirname, '../')

describe('no anonymous default export warning', () => {
  function getWarningsCount(text) {
    return (text.match(/warn {2}-/g) || []).length
  }

  beforeEach(async () => {
    await fs.remove(join(appDir, '.next'))
  })

  it('show correct warnings for page', async () => {
    let stdout = ''

    const appPort = await findPort()
    const app = await launchApp(appDir, appPort, {
      env: { __NEXT_TEST_WITH_DEVTOOL: true },
      onStdout(msg) {
        stdout += msg || ''
      },
    })

    const browser = await webdriver(appPort, '/page')

    const found = await check(() => stdout, /anonymous/i, false)
    expect(found).toBeTruthy()
    await browser.close()

    expect(getWarningsCount(stdout)).toBe(1)

    await killApp(app)
  })

  it('show correct warnings for child', async () => {
    let stdout = ''

    const appPort = await findPort()
    const app = await launchApp(appDir, appPort, {
      env: { __NEXT_TEST_WITH_DEVTOOL: true },
      onStdout(msg) {
        stdout += msg || ''
      },
    })

    const browser = await webdriver(appPort, '/child')

    const found = await check(() => stdout, /anonymous/i, false)
    expect(found).toBeTruthy()
    await browser.close()

    expect(getWarningsCount(stdout)).toBe(1)

    await killApp(app)
  })

  it('show correct warnings for both', async () => {
    let stdout = ''

    const appPort = await findPort()
    const app = await launchApp(appDir, appPort, {
      env: { __NEXT_TEST_WITH_DEVTOOL: true },
      onStdout(msg) {
        stdout += msg || ''
      },
    })

    const browser = await webdriver(appPort, '/both')

    const found = await check(() => stdout, /anonymous/i, false)
    expect(found).toBeTruthy()
    await browser.close()

    expect(getWarningsCount(stdout)).toBe(2)

    await killApp(app)
  })
})
