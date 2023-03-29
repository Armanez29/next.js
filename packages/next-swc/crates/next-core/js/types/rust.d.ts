// modules provided by rust

declare module 'PAGE' {
  import {
    NextPage,
    GetStaticPaths,
    GetServerSideProps,
    GetStaticProps,
  } from 'next'

  const Component: NextPage
  export default Component

  export const getStaticProps: GetStaticProps | undefined
  export const getStaticPaths: GetStaticPaths | undefined
  export const getServerSideProps: GetServerSideProps | undefined
}

declare module 'INNER' {
  export * from 'PAGE'
}

declare module 'CHUNK_GROUP' {
  const chunkGroup: import('types/next').ChunkGroup
  export default chunkGroup
}

declare module 'MIDDLEWARE_CHUNK_GROUP' {
  export { default } from 'CHUNK_GROUP'
}

declare module 'INNER_CLIENT_CHUNK_GROUP' {
  export { default } from 'CHUNK_GROUP'
}

declare module 'INNER_EDGE_CHUNK_GROUP' {
  export { default } from 'CHUNK_GROUP'
}

declare module 'ROUTE_CHUNK_GROUP' {
  export { default } from 'CHUNK_GROUP'
}

declare module 'MIDDLEWARE_CONFIG' {
  const matcher: string[]
  export default {
    matcher,
  }
}

declare module 'ENTRY' {
  import type { AppRouteModule } from 'next/dist/server/future/route-handlers/app-route-route-handler'

  const handlers: AppRouteModule['handlers']
  export = handlers
}

declare module 'CLIENT_MODULE' {
  export const __turbopack_module_id__: string
}

declare module 'CLIENT_CHUNKS' {
  const moduleId: string
  export default moduleId

  export const chunks: any[]
  export const chunkListPath: string
}
