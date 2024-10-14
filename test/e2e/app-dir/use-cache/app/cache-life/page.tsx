import { unstable_cacheLife as cacheLife } from 'next/cache'

async function getCachedRandom() {
  'use cache'
  cacheLife('frequent' as any) // TODO: Generate types
  return Math.random()
}

export default async function Page() {
  const x = await getCachedRandom()
  return <p id="x">{x}</p>
}
