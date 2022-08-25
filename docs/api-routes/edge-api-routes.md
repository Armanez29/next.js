---
description: Edge API Routes enable you to build high performance APIs directly inside your Next.js application.
---

# Edge API Routes (Beta)

Edge API Routes enable you to build high performance APIs with Next.js. Using the [Edge Runtime](/docs/api-reference/edge-runtime.md), they are often faster than Node.js-based API Routes. This performance improvement does come with [constraints](/docs/api-reference/edge-runtime.md#unsupported-apis), like not having access to native Node.js APIs. Instead, Edge API Routes are built on standard Web APIs.

Any file inside the folder `pages/api` is mapped to `/api/*` and will be treated as an API endpoint instead of a page. They are server-side only bundles and won't increase your client-side bundle size.

## Examples

### Basic

```typescript
export const config = {
  runtime: 'experimental-edge',
}

export default (req) => new Response('Hello world!')
```

### JSON Response

```typescript
import type { NextRequest } from 'next/server'

export const config = {
  runtime: 'experimental-edge',
}

export default async function handler(req: NextRequest) {
  return new Response(
    JSON.stringify({
      name: 'Jim Halpert',
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }
  )
}
```

### Cache-Control

```typescript
import type { NextRequest } from 'next/server'

export const config = {
  runtime: 'experimental-edge',
}

export default async function handler(req: NextRequest) {
  return new Response(
    JSON.stringify({
      name: 'Jim Halpert',
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, s-maxage=1200, stale-while-revalidate=600',
      },
    }
  )
}
```

### Query Parameters

```typescript
import type { NextRequest } from 'next/server'

export const config = {
  runtime: 'experimental-edge',
}

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  return new Response(email)
}
```

### Forwarding Headers

```typescript
import { type NextRequest } from 'next/server'

export const config = {
  runtime: 'experimental-edge',
}

export default async function handler(req: NextRequest) {
  const authorization = req.cookies.get('authorization')
  return fetch('https://backend-api.com/api/protected', {
    method: req.method,
    headers: {
      authorization,
    },
    redirect: 'manual',
  })
}
```

## Differences between API Routes

Edge API Routes use the [Edge Runtime](/docs/api-reference/edge-runtime.md), whereas API Routes use the [Node.js runtime](/docs/advanced-features/react-18/switchable-runtime.md).

Edge API Routes can [stream responses](/docs/api-reference/edge-runtime.md#web-stream-apis) from the server and run _after_ cached files (e.g. HTML, CSS, JavaScript) have been accessed. Server-side streaming can help improve performance with faster [Time To First Byte (TTFB)](https://web.dev/ttfb/).

View the [supported APIs](/docs/api-reference/edge-runtime.md) and [unsupported APIs](/docs/api-reference/edge-runtime.md#unsupported-apis) for the Edge Runtime.

## Web Assembly (Wasm)

You can use Warm within your Edge API Route by importing your `.wasm` binary with:

```ts
import wasm from './my-file.wasm?module'
```

Note the `?module` suffix. This will provide an array of the WASM data that can be instantiated using `WebAssembly.instantiate()`, which can be done as follows:

```ts
export default async function handler() {
  const { exports } = (await WebAssembly.instantiate(wasmModule)) as any
  const result = exports.xor(0xb4c9a91f, 0xf0c0ffee)
  return new Response(result)
}
```

The example above is taken from the [WASM XOR API Route]() example.
