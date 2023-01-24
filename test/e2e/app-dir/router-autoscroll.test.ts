import path from 'path'
import webdriver from 'next-webdriver'
import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import { waitFor } from 'next-test-utils'

describe('router autoscrolling on navigation', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: new FileRef(path.join(__dirname, './router-autoscroll')),
      dependencies: {
        react: 'latest',
        'react-dom': 'latest',
        typescript: 'latest',
        '@types/react': 'latest',
        '@types/node': 'latest',
      },
    })
  })
  afterAll(() => next.destroy())

  const isReact17 = process.env.NEXT_TEST_REACT_VERSION === '^17'
  if (isReact17) {
    it('should skip tests for react 17', () => {})
    return
  }
  type BrowserInterface = Awaited<ReturnType<typeof webdriver>>
  const getRect = async (
    browser: BrowserInterface,
    id: string
  ): Promise<DOMRect> => {
    return JSON.parse(
      await browser.eval(
        'JSON.stringify(document.getElementById("page").getBoundingClientRect())'
      )
    )
  }

  const getBrowserDims = async (browser: BrowserInterface) => ({
    width: await browser.eval<number>(
      'window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth'
    ),
    height: await browser.eval<number>(
      'window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight'
    ),
  })

  let browser: BrowserInterface

  beforeEach(async () => {
    browser = await webdriver(next.url, '/')
    await browser.eval('window.scrollTo(0, 0)')
  })

  afterEach(() => {
    browser.quit()
  })

  it('should scroll page into view on navigation', async () => {
    const oldRect = await getRect(browser, 'page')

    expect(oldRect.x).toBe(10000)
    expect(oldRect.y).toBe(10000)

    browser.elementById('link-small-page').click()
    // Wait for scroll to happen
    await waitFor(100)

    const newRect = await getRect(browser, 'page')

    const { width, height } = await getBrowserDims(browser)

    // Scroll x
    expect(newRect.x).toBeGreaterThanOrEqual(0)
    expect(newRect.x).toBeLessThanOrEqual(width)

    // Scroll y
    expect(newRect.y).toBeGreaterThanOrEqual(0)
    expect(newRect.y).toBeLessThanOrEqual(height)
  })

  it('should scroll not scroll when running router.refresh()', async () => {
    const oldRect = await getRect(browser, 'page')
    expect(oldRect.x).toBe(10000)
    expect(oldRect.y).toBe(10000)

    browser.elementById('refresh').click()
    // Wait for scroll to happen (if it happens)
    await waitFor(1000)

    const newRect = await getRect(browser, 'page')
    expect(newRect.x).toBe(10000)
    expect(newRect.y).toBe(10000)
  })
})
