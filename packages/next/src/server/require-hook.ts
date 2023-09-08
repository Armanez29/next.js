// Synchronously inject a require hook for webpack and webpack/. It's required to use the internal ncc webpack version.
// This is needed for userland plugins to attach to the same webpack instance as Next.js'.
// Individually compiled modules are as defined for the compilation in bundles/webpack/packages/*.

import path, { dirname } from 'path'

// This module will only be loaded once per process.

const mod = require('module')
const resolveFilename = mod._resolveFilename
const originalRequire = mod.prototype.require
const hookPropertyMap = new Map()

let aliasedPrebundledReact = false

// that env var is only set in app router

const resolve = process.env.NEXT_MINIMAL
  ? // @ts-ignore
    __non_webpack_require__.resolve
  : require.resolve

const toResolveMap = (map: Record<string, string>): [string, string][] =>
  Object.entries(map).map(([key, value]) => [key, resolve(value)])

export const defaultOverrides = {
  'styled-jsx': dirname(resolve('styled-jsx/package.json')),
  'styled-jsx/style': resolve('styled-jsx/style'),
}

export const baseOverrides = {
  react: 'next/dist/compiled/react',
  'react/package.json': 'next/dist/compiled/react/package.json',
  'react/jsx-runtime': 'next/dist/compiled/react/jsx-runtime',
  'react/jsx-dev-runtime': 'next/dist/compiled/react/jsx-dev-runtime',
  'react-dom': 'next/dist/compiled/react-dom/server-rendering-stub',
  'react-dom/package.json': 'next/dist/compiled/react-dom/package.json',
  'react-dom/client': 'next/dist/compiled/react-dom/client',
  'react-dom/server': 'next/dist/compiled/react-dom/server',
  'react-dom/server.browser': 'next/dist/compiled/react-dom/server.browser',
  'react-dom/server.edge': 'next/dist/compiled/react-dom/server.edge',
  'react-server-dom-webpack/client':
    'next/dist/compiled/react-server-dom-webpack/client',
  'react-server-dom-webpack/client.edge':
    'next/dist/compiled/react-server-dom-webpack/client.edge',
  'react-server-dom-webpack/server.edge':
    'next/dist/compiled/react-server-dom-webpack/server.edge',
  'react-server-dom-webpack/server.node':
    'next/dist/compiled/react-server-dom-webpack/server.node',
}

export const experimentalOverrides = {
  react: 'next/dist/compiled/react-experimental',
  'react/jsx-runtime': 'next/dist/compiled/react-experimental/jsx-runtime',
  'react/jsx-dev-runtime':
    'next/dist/compiled/react-experimental/jsx-dev-runtime',
  'react-dom':
    'next/dist/compiled/react-dom-experimental/server-rendering-stub',
  'react/package.json': 'next/dist/compiled/react-experimental/package.json',
  'react-dom/package.json':
    'next/dist/compiled/react-dom-experimental/package.json',
  'react-dom/client': 'next/dist/compiled/react-dom-experimental/client',
  'react-dom/server': 'next/dist/compiled/react-dom-experimental/server',
  'react-dom/server.browser':
    'next/dist/compiled/react-dom-experimental/server.browser',
  'react-dom/server.edge':
    'next/dist/compiled/react-dom-experimental/server.edge',
  'react-server-dom-webpack/client':
    'next/dist/compiled/react-server-dom-webpack-experimental/client',
  'react-server-dom-webpack/client.edge':
    'next/dist/compiled/react-server-dom-webpack-experimental/client.edge',
  'react-server-dom-webpack/server.edge':
    'next/dist/compiled/react-server-dom-webpack-experimental/server.edge',
  'react-server-dom-webpack/server.node':
    'next/dist/compiled/react-server-dom-webpack-experimental/server.node',
}

export function addHookAliases(aliases: [string, string][] = []) {
  for (const [key, value] of aliases) {
    hookPropertyMap.set(key, value)
  }
}

addHookAliases(toResolveMap(defaultOverrides))

// Override built-in React packages if necessary
function overrideReact() {
  if (process.env.__NEXT_PRIVATE_PREBUNDLED_REACT) {
    aliasedPrebundledReact = true

    // Require these modules with static paths to make sure they are tracked by
    // NFT when building the app in standalone mode, as we are now conditionally
    // aliasing them it's tricky to track them in build time.
    if (process.env.__NEXT_PRIVATE_PREBUNDLED_REACT === 'experimental') {
      addHookAliases(toResolveMap(experimentalOverrides))
    } else {
      addHookAliases(toResolveMap(baseOverrides))
    }
  }
}
overrideReact()

mod._resolveFilename = function (
  originalResolveFilename: typeof resolveFilename,
  requestMap: Map<string, string>,
  request: string,
  parent: any,
  isMain: boolean,
  options: any
) {
  if (process.env.__NEXT_PRIVATE_PREBUNDLED_REACT && !aliasedPrebundledReact) {
    // In case the environment variable is set after the module is loaded.
    overrideReact()
  }

  const hookResolved = requestMap.get(request)
  if (hookResolved) request = hookResolved
  return originalResolveFilename.call(mod, request, parent, isMain, options)

  // We use `bind` here to avoid referencing outside variables to create potential memory leaks.
}.bind(null, resolveFilename, hookPropertyMap)

// This is a hack to make sure that if a user requires a Next.js module that wasn't bundled
// that needs to point to the rendering runtime version, it will point to the correct one.
// This can happen on `pages` when a user requires a dependency that uses next/image for example.
// This is only needed in production as in development we fallback to the external version.
if (process.env.NODE_ENV !== 'development' && !process.env.TURBOPACK) {
  mod.prototype.require = function (request: string) {
    if (request.endsWith('.shared-runtime')) {
      const currentRuntime = `${
        !!process.env.__NEXT_PRIVATE_PREBUNDLED_REACT
          ? 'next/dist/compiled/next-server/app-page.runtime'
          : 'next/dist/compiled/next-server/pages.runtime'
      }.prod`
      const base = path.basename(request, '.shared-runtime')
      const camelized = base.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
      const instance = originalRequire.call(this, currentRuntime)
      return instance.default.sharedModules[camelized]
    }
    return originalRequire.call(this, request)
  }
}
