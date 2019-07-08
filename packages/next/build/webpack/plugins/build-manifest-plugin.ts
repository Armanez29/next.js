import { Compiler } from 'webpack'
import { RawSource } from 'webpack-sources'
import {
  BUILD_MANIFEST,
  ROUTE_NAME_REGEX,
  IS_BUNDLED_PAGE_REGEX,
  CLIENT_STATIC_FILES_PATH,
  CLIENT_STATIC_FILES_RUNTIME_MAIN,
} from 'next-server/constants'

// This plugin creates a build-manifest.json for all assets that are being output
// It has a mapping of "entry" filename to real filename. Because the real filename can be hashed in production
export default class BuildManifestPlugin {
  options: { buildId: string; clientManifest: boolean }

  constructor(options: { buildId: string; clientManifest: boolean }) {
    this.options = options
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tapAsync(
      'NextJsBuildManifest',
      (compilation, callback) => {
        const { chunks } = compilation
        const assetMap: {
          devFiles: string[]
          pages: { [page: string]: string[] }
        } = { devFiles: [], pages: {} }

        const mainJsChunk = chunks.find(
          c => c.name === CLIENT_STATIC_FILES_RUNTIME_MAIN
        )
        const mainJsFiles: string[] =
          mainJsChunk && mainJsChunk.files.length > 0
            ? mainJsChunk.files.filter((file: string) => /\.js$/.test(file))
            : []

        for (const filePath of Object.keys(compilation.assets)) {
          const path = filePath.replace(/\\/g, '/')
          if (/^static\/development\/dll\//.test(path)) {
            assetMap.devFiles.push(path)
          }
        }

        // compilation.entrypoints is a Map object, so iterating over it 0 is the key and 1 is the value
        for (const [, entrypoint] of compilation.entrypoints.entries()) {
          const result = ROUTE_NAME_REGEX.exec(entrypoint.name)
          if (!result) {
            continue
          }

          const pagePath = result[1]

          if (!pagePath) {
            continue
          }

          const filesForEntry: string[] = []
          for (const chunk of entrypoint.chunks) {
            // If there's no name or no files
            if (!chunk.name || !chunk.files) {
              continue
            }

            for (const file of chunk.files) {
              if (/\.map$/.test(file) || /\.hot-update\.js$/.test(file)) {
                continue
              }

              // Only `.js` and `.css` files are added for now. In the future we can also handle other file types.
              if (!/\.js$/.test(file) && !/\.css$/.test(file)) {
                continue
              }

              // The page bundles are manually added to _document.js as they need extra properties
              if (IS_BUNDLED_PAGE_REGEX.exec(file)) {
                continue
              }

              filesForEntry.push(file.replace(/\\/g, '/'))
            }
          }

          assetMap.pages[`/${pagePath.replace(/\\/g, '/')}`] = [
            ...filesForEntry,
            ...mainJsFiles,
          ]
        }

        if (typeof assetMap.pages['/index'] !== 'undefined') {
          assetMap.pages['/'] = assetMap.pages['/index']
        }

        // Add the runtime buildManifest.js file (generated later in this file) as a
        // dependency for the app. If the flag is false, the file won't be downloaded
        // by the client
        if (this.options.clientManifest) {
          assetMap.pages['/_app'].push(
            `${CLIENT_STATIC_FILES_PATH}/${
              this.options.buildId
            }/_buildManifest.js`
          )
        }

        assetMap.pages = Object.keys(assetMap.pages)
          .sort()
          // eslint-disable-next-line
          .reduce((a, c) => ((a[c] = assetMap.pages[c]), a), {} as any)

        const manifestContentString = JSON.stringify(assetMap, null, 2)

        compilation.assets[BUILD_MANIFEST] = new RawSource(
          manifestContentString
        )

        const clientManifestPath = `${CLIENT_STATIC_FILES_PATH}/${
          this.options.buildId
        }/_buildManifest.js`
        const clientManifestContentString = manifestContentString.replace(
          /\s/g,
          ''
        )

        if (this.options.clientManifest) {
          compilation.assets[clientManifestPath] = new RawSource(
            `(function(){__BUILD_MANIFEST = JSON.parse('${clientManifestContentString}')})()`
          )
        }

        callback()
      }
    )
  }
}
