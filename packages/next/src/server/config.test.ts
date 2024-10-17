import loadConfig from './config'

describe('loadConfig', () => {
  describe('nextConfig.images defaults', () => {
    it('should assign a `images.remotePatterns` when using assetPrefix', async () => {
      const result = await loadConfig('', __dirname, {
        customConfig: {
          assetPrefix: 'https://cdn.example.com',
          images: {
            formats: ['image/webp'],
          },
        },
      })

      expect(result.images.remotePatterns).toMatchInlineSnapshot(`
        [
          {
            "hostname": "cdn.example.com",
            "port": "",
            "protocol": "https",
          },
        ]
      `)
    })

    it('should not assign a duplicate `images.remotePatterns` value when using assetPrefix', async () => {
      let result = await loadConfig('', __dirname, {
        customConfig: {
          assetPrefix: 'https://cdn.example.com',
          images: {
            formats: ['image/webp'],
            remotePatterns: [
              {
                hostname: 'cdn.example.com',
                port: '',
                protocol: 'https',
              },
            ],
          },
        },
      })

      expect(result.images.remotePatterns.length).toBe(1)

      result = await loadConfig('', __dirname, {
        customConfig: {
          assetPrefix: 'https://cdn.example.com/foobar',
          images: {
            formats: ['image/webp'],
            remotePatterns: [
              {
                hostname: 'cdn.example.com',
                port: '',
                protocol: 'https',
              },
            ],
          },
        },
      })

      expect(result.images.remotePatterns.length).toBe(1)
    })
  })

  describe('canary-only features', () => {
    beforeAll(() => {
      process.env.__NEXT_VERSION = '14.2.0'
    })

    afterAll(() => {
      delete process.env.__NEXT_VERSION
    })

    it('errors when using dynamicIO if not in canary', async () => {
      await expect(
        loadConfig('', __dirname, {
          customConfig: {
            experimental: {
              dynamicIO: true,
            },
          },
        })
      ).rejects.toThrow(
        /The experimental feature "experimental.dynamicIO" can only be enabled when using the latest canary version of Next.js./
      )
    })

    it('errors when using persistentCaching if not in canary', async () => {
      await expect(
        loadConfig('', __dirname, {
          customConfig: {
            experimental: {
              turbo: {
                unstablePersistentCaching: true,
              },
            },
          },
        })
      ).rejects.toThrow(
        /The experimental feature "experimental.turbo.unstablePersistentCaching" can only be enabled when using the latest canary version of Next.js./
      )
    })
  })
})
