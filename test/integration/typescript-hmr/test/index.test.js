/* global fixture, test */
import 'testcafe'

import fs from 'fs-extra'
import { join } from 'path'
import webdriver from 'next-webdriver'
import {
  findPort,
  launchApp,
  killApp,
  check,
  getBrowserBodyText,
  getReactErrorOverlayContent
} from 'next-test-utils'

const appDir = join(__dirname, '..')

fixture('TypeScript HMR')
  .before(async ctx => {
    ctx.appPort = await findPort()
    ctx.app = await launchApp(appDir, ctx.appPort)
  })
  .after(ctx => killApp(ctx.app))

test('should detect the changes to typescript pages and display it', async t => {
  let browser
  try {
    browser = await webdriver(t.fixtureCtx.appPort, '/hello')
    await check(() => getBrowserBodyText(browser), /Hello World/)

    const pagePath = join(appDir, 'pages/hello.tsx')
    const originalContent = await fs.readFile(pagePath, 'utf8')
    const editedContent = originalContent.replace('Hello', 'COOL page')

    // change the content
    await fs.writeFile(pagePath, editedContent, 'utf8')
    await check(() => getBrowserBodyText(browser), /COOL page/)

    // add the original content
    await fs.writeFile(pagePath, originalContent, 'utf8')
    await check(() => getBrowserBodyText(browser), /Hello World/)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
})

test('should recover from a type error', async t => {
  let browser
  const pagePath = join(appDir, 'pages/type-error-recover.tsx')
  const origContent = await fs.readFile(pagePath, 'utf8')
  try {
    browser = await webdriver(t.fixtureCtx.appPort, '/type-error-recover')
    const errContent = origContent.replace('() =>', '(): boolean =>')

    await fs.writeFile(pagePath, errContent)
    await check(
      () => getReactErrorOverlayContent(browser),
      /Type 'Element' is not assignable to type 'boolean'/
    )

    await fs.writeFile(pagePath, origContent)
    await check(async () => {
      const html = await browser.eval('document.documentElement.innerHTML')
      return html.match(/iframe/) ? 'fail' : 'success'
    }, /success/)
  } finally {
    if (browser) browser.close()
    await fs.writeFile(pagePath, origContent)
  }
})
