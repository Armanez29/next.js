import { createNextDescribe } from 'e2e-utils'
import { check } from 'next-test-utils'

import { SavedSpan, traceFile } from './constants'

createNextDescribe(
  'opentelemetry',
  {
    files: __dirname,
    skipDeployment: true,
    dependencies: {
      'fs-extra': '^8.0.0',
      '@types/fs-extra': '^8.0.0',
      '@opentelemetry/api': '^1.0.0',
      '@opentelemetry/core': '^1.0.0',
      '@opentelemetry/resources': '^1.0.0',
      '@opentelemetry/sdk-trace-base': '^1.0.0',
      '@opentelemetry/sdk-trace-node': '^1.0.0',
      '@opentelemetry/semantic-conventions': '^1.0.0',
      '@opentelemetry/exporter-trace-otlp-http': '^0.34.0',
    },
  },
  ({ next }) => {
    const getTraces = async (): Promise<SavedSpan[]> => {
      const traces = await next.readFile(traceFile)
      return traces
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    }

    /** There were issues where OTEL might not be initialized for first few requests (this is a bug).
     * It made our tests, flaky. This should make tests deterministic.
     */
    const waitForOtelToInitialize = async () => {
      await check(
        async () =>
          await next
            .readFile(traceFile)
            .then(() => 'ok')
            .catch(() => 'err'),
        'ok'
      )
    }

    const waitForRootSpan = async (numberOfRootTraces: number) => {
      await check(async () => {
        const spans = await getTraces()
        const rootSpans = spans.filter((span) => !span.parentId)
        return String(rootSpans.length)
      }, String(numberOfRootTraces))
    }

    /**
     * Sanitize (modifies) span to make it ready for snapshot testing.
     */
    const sanitizeSpan = (span: SavedSpan) => {
      delete span.duration
      delete span.id
      delete span.links
      delete span.timestamp
      delete span.traceId
      span.parentId = span.parentId === undefined ? undefined : '[parent-id]'
      return span
    }
    const sanitizeSpans = (spans: SavedSpan[]) =>
      spans.sort((a, b) => a.name.localeCompare(b.name)).map(sanitizeSpan)

    const getSanitizedTraces = async (numberOfRootTraces: number) => {
      await waitForRootSpan(numberOfRootTraces)
      return sanitizeSpans(await getTraces())
    }

    const cleanTraces = async () => {
      await next.patchFile(traceFile, '')
    }

    beforeAll(async () => {
      await waitForOtelToInitialize()
    })

    afterEach(async () => {
      await cleanTraces()
    })

    it('should have spans when accessing page', async () => {
      await next.fetch('/pages')

      expect(await getSanitizedTraces(1)).toMatchInlineSnapshot(`
        Array [
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "BaseServer.renderToResponse",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextNodeServer.findPageComponents",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextServer.getRequestHandler",
            "parentId": undefined,
            "status": Object {
              "code": 0,
            },
          },
        ]
      `)
    })

    it('should handle route params', async () => {
      await next.fetch('/pages/params/stuff')

      expect(await getSanitizedTraces(1)).toMatchInlineSnapshot(`
        Array [
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "BaseServer.renderToResponse",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextNodeServer.findPageComponents",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextServer.getRequestHandler",
            "parentId": undefined,
            "status": Object {
              "code": 0,
            },
          },
        ]
      `)
    })

    it('should handle RSC with fetch', async () => {
      await next.fetch('/app/rsc-fetch')

      expect(await getSanitizedTraces(1)).toMatchInlineSnapshot(`
        Array [
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 2,
            "name": "AppRender.fetch",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 2,
              "message": "Request cannot be constructed from a URL that includes credentials: https://user:pass@vercel.com",
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "BaseServer.renderToResponse",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextNodeServer.findPageComponents",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextServer.getRequestHandler",
            "parentId": undefined,
            "status": Object {
              "code": 0,
            },
          },
        ]
      `)
    })

    it('should handle getServerSideProps', async () => {
      await next.fetch('/pager/getServerSideProps')

      expect(await getSanitizedTraces(1)).toMatchInlineSnapshot(`
        Array [
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "BaseServer.renderToResponse",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextNodeServer.findPageComponents",
            "parentId": "[parent-id]",
            "status": Object {
              "code": 0,
            },
          },
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextServer.getRequestHandler",
            "parentId": undefined,
            "status": Object {
              "code": 0,
            },
          },
        ]
      `)
    })

    it('should handle route handlers in app router', async () => {
      await next.fetch('/api/pages/basic')

      expect(await getSanitizedTraces(1)).toMatchInlineSnapshot(`
        Array [
          Object {
            "attributes": Object {},
            "events": Array [],
            "kind": 0,
            "name": "NextServer.getRequestHandler",
            "parentId": undefined,
            "status": Object {
              "code": 0,
            },
          },
        ]
      `)
    })
  }
)
