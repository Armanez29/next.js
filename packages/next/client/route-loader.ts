import { ComponentType } from 'react'
import type { ClientBuildManifest } from '../build/webpack/plugins/build-manifest-plugin'
import requestIdleCallback from './request-idle-callback'

// 3.8s was arbitrarily chosen as it's what https://web.dev/interactive
// considers as "Good" time-to-interactive. We must assume something went
// wrong beyond this point, and then fall-back to a full page transition to
// show the user something of value.
const MS_MAX_IDLE_DELAY = 3800

declare global {
  interface Window {
    __BUILD_MANIFEST?: ClientBuildManifest
    __BUILD_MANIFEST_CB?: Function
  }
}

export interface LoadedEntrypointSuccess {
  component: ComponentType
  exports: any
}
export interface LoadedEntrypointFailure {
  error: unknown
}
export type RouteEntrypointFuture = {
  resolve: (entrypoint: RouteEntrypoint) => void
  future: Promise<RouteEntrypoint>
}
export type RouteEntrypoint = LoadedEntrypointSuccess | LoadedEntrypointFailure

export interface RouteStyleSheet {
  href: string
  content: string
}

export interface LoadedRouteSuccess extends LoadedEntrypointSuccess {
  styles: RouteStyleSheet[]
}
export interface LoadedRouteFailure {
  error: unknown
}
export type RouteLoaderEntry = LoadedRouteSuccess | LoadedRouteFailure

export interface RouteLoader {
  whenEntrypoint(route: string): Promise<RouteEntrypoint>
  onEntrypoint(route: string, execute: () => unknown): void
  loadRoute(route: string): Promise<RouteLoaderEntry>
}

// function hasPrefetch(link?: HTMLLinkElement): boolean {
//   try {
//     link = document.createElement('link')
//     return link.relList.supports('prefetch')
//   } catch {
//     return false
//   }
// }

// const canPrefetch: boolean = hasPrefetch()

// function prefetchViaDom(
//   href: string,
//   as: string,
//   link?: HTMLLinkElement
// ): Promise<any> {
//   return new Promise((res, rej) => {
//     link = document.createElement('link')

//     // The order of property assignment here is intentional:
//     if (as) link!.as = as
//     link!.rel = `prefetch`
//     link!.crossOrigin = process.env.__NEXT_CROSS_ORIGIN!
//     link!.onload = res
//     link!.onerror = rej

//     // `href` should always be last:
//     link!.href = href

//     document.head.appendChild(link)
//   })
// }

const ASSET_LOAD_ERROR = Symbol('ASSET_LOAD_ERROR')
function markAssetError(err: Error): Error {
  return Object.defineProperty(err, ASSET_LOAD_ERROR, {})
}

export function isAssetError(err?: Error) {
  return err && ASSET_LOAD_ERROR in err
}

function appendScript(
  src: string,
  script?: HTMLScriptElement
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    script = document.createElement('script')

    // The order of property assignment here is intentional.
    // 1. Setup success/failure hooks in case the browser synchronously
    //    executes when `src` is set.
    script.onload = resolve
    script.onerror = () =>
      reject(markAssetError(new Error(`Failed to load script: ${src}`)))

    // 2. Configure the cross-origin attribute before setting `src` in case the
    //    browser begins to fetch.
    script.crossOrigin = process.env.__NEXT_CROSS_ORIGIN!

    // 3. Finally, set the source and inject into the DOM in case the child
    //    must be appended for fetching to start.
    script.src = src
    document.body.appendChild(script)
  })
}

function idleTimeout<T>(ms: number, err: Error): Promise<T> {
  return new Promise((_resolve, reject) =>
    requestIdleCallback(() => setTimeout(() => reject(err), ms))
  )
}

function getClientBuildManifest(): Promise<ClientBuildManifest> {
  if (self.__BUILD_MANIFEST) {
    return Promise.resolve(self.__BUILD_MANIFEST)
  }

  const onBuildManifest = new Promise<ClientBuildManifest>((resolve) => {
    const cb = self.__BUILD_MANIFEST_CB
    self.__BUILD_MANIFEST_CB = () => {
      resolve(self.__BUILD_MANIFEST)
      cb && cb()
    }
  })
  return Promise.race([
    onBuildManifest,
    idleTimeout<ClientBuildManifest>(
      MS_MAX_IDLE_DELAY,
      markAssetError(new Error('Failed to load client build manifest'))
    ),
  ])
}

interface RouteFiles {
  scripts: string[]
  css: string[]
}
function getFilesForRoute(
  assetPrefix: string,
  route: string
): Promise<RouteFiles> {
  return getClientBuildManifest().then((manifest) => {
    if (!(route in manifest)) {
      throw markAssetError(new Error(`Failed to lookup route: ${route}`))
    }
    const allFiles = manifest[route].map(
      (entry) => assetPrefix + '/_next/' + encodeURI(entry)
    )
    return {
      scripts: allFiles.filter((v) => v.endsWith('.js')),
      css: allFiles.filter((v) => v.endsWith('.css')),
    }
  })
}

function createRouteLoader(assetPrefix: string): RouteLoader {
  const entrypoints: Map<
    string,
    RouteEntrypointFuture | RouteEntrypoint
  > = new Map()
  const loadedScripts: Map<string, Promise<unknown>> = new Map()
  const styleSheets: Map<string, Promise<RouteStyleSheet>> = new Map()

  function maybeExecuteScript(src: string): Promise<unknown> {
    // Skip executing script if it's already in the DOM:
    if (document.querySelector(`script[src^="${src}"]`)) {
      return Promise.resolve()
    }

    let prom = loadedScripts.get(src)
    if (prom) {
      return prom
    }
    loadedScripts.set(src, (prom = appendScript(src)))
    return prom
  }

  function fetchStyleSheet(href: string): Promise<RouteStyleSheet> {
    let prom = styleSheets.get(href)
    if (prom) {
      return prom
    }

    styleSheets.set(
      href,
      (prom = fetch(href, { credentials: 'include' })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load stylesheet: ${href}`)
          }
          return res.text().then((text) => ({ href: href, content: text }))
        })
        .catch((err) => {
          throw markAssetError(err)
        }))
    )
    return prom
  }

  return {
    whenEntrypoint(route: string) {
      let entry:
        | RouteEntrypointFuture
        | RouteEntrypoint
        | undefined = entrypoints.get(route)
      if (entry) {
        if ('future' in entry) {
          return entry.future
        }
        return Promise.resolve(entry)
      }

      let resolver: (entrypoint: RouteEntrypoint) => void
      const prom = new Promise<RouteEntrypoint>((resolve) => {
        resolver = resolve
      })
      entrypoints.set(route, (entry = { resolve: resolver!, future: prom }))
      return prom
    },
    async onEntrypoint(route, execute) {
      let input: RouteEntrypoint
      try {
        const exports: any = await execute()
        input = {
          component: exports.default || exports,
          exports: exports,
        }
      } catch (e) {
        input = { error: e }
      }

      const old = entrypoints.get(route)
      entrypoints.set(route, input)
      if (old && 'resolve' in old) old.resolve(input)
    },
    async loadRoute(route) {
      try {
        const { scripts, css } = await getFilesForRoute(assetPrefix, route)
        const [, styles] = await Promise.all([
          entrypoints.has(route)
            ? []
            : Promise.all(scripts.map(maybeExecuteScript)),
          Promise.all(css.map(fetchStyleSheet)),
        ] as const)

        // The await here is intentional:
        const entrypoint = await Promise.race([
          this.whenEntrypoint(route),
          idleTimeout<RouteLoaderEntry>(
            MS_MAX_IDLE_DELAY,
            markAssetError(
              new Error(`Route did not complete loading: ${route}`)
            )
          ),
        ])
        const res: RouteLoaderEntry = { ...entrypoint, styles }
        return 'error' in entrypoint ? entrypoint : res
      } catch (err) {
        return { error: err }
      }
    },
  }
}

export default createRouteLoader
