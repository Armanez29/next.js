import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import { renderViaHTTP } from 'next-test-utils'
import path from 'path'

describe('app-dir edge SSR', () => {
  if ((global as any).isNextDeploy) {
    it('should skip next deploy for now', () => {})
    return
  }

  if (process.env.NEXT_TEST_REACT_VERSION === '^17') {
    it('should skip for react v17', () => {})
    return
  }

  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: new FileRef(path.join(__dirname, 'app-edge')),
      dependencies: {
        react: 'experimental',
        'react-dom': 'experimental',
        typescript: 'latest',
        '@types/react': 'latest',
        '@types/node': 'latest',
      },
    })
  })
  afterAll(() => next.destroy())

  it('should handle edge only routes', async () => {
    const appHtml = await renderViaHTTP(next.url, '/app-edge')
    expect(appHtml).toContain('<p>app-edge-ssr</p>')

    const pageHtml = await renderViaHTTP(next.url, '/pages-edge')
    expect(pageHtml).toContain('<p>pages-edge-ssr</p>')
  })
})
