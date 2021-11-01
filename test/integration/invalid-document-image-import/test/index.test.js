/* eslint-env jest */
import { nextBuild, File } from 'next-test-utils'
import { join } from 'path'

jest.setTimeout(1000 * 60 * 2)

const appDir = join(__dirname, '../')
const nextConfig = new File(join(appDir, 'next.config.js'))

describe('Invalid static image import in _document', () => {
  afterAll(() => nextConfig.restore())

  it('Should fail to build when no next.config.js', async () => {
    const { code, stderr } = await nextBuild(appDir, [], {
      stderr: true,
    })
    expect(code).not.toBe(0)
    expect(stderr).toContain('Failed to compile')
    expect(stderr).toMatch(
      /Images.*cannot.*be imported within.*pages[\\/]_document\.js/
    )
    expect(stderr).toMatch(/Location:.*pages[\\/]_document\.js/)
  })

  it('Should build without error when disableStaticImages in next.config.js', async () => {
    nextConfig.write(`
      module.exports = {
        images: {
          disableStaticImages: true
        }
      }
    `)
    const { code } = await nextBuild(appDir, [], {})
    expect(code).toBe(0)
  })
})
