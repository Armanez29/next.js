'use client'

import dynamic from 'next/dynamic'

const Dynamic = dynamic(() => import('../text-dynamic-client'))
const DynamicNoSSR = dynamic(() => import('../text-dynamic-no-ssr-client'), {
  srr: false,
})

export function NextDynamicClientComponent() {
  return (
    <>
      <Dynamic />
      <DynamicNoSSR />
    </>
  )
}
