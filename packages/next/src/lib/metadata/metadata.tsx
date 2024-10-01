import type { ParsedUrlQuery } from 'querystring'
import type { GetDynamicParamFromSegment } from '../../server/app-render/app-render'
import type { LoaderTree } from '../../server/lib/app-dir-module'
import type { CreateServerParamsForMetadata } from '../../server/request/params'

import { cache, cloneElement } from 'react'
import {
  AppleWebAppMeta,
  FormatDetectionMeta,
  ItunesMeta,
  BasicMeta,
  ViewportMeta,
  VerificationMeta,
  FacebookMeta,
} from './generate/basic'
import { AlternatesMetadata } from './generate/alternate'
import {
  OpenGraphMetadata,
  TwitterMetadata,
  AppLinksMeta,
} from './generate/opengraph'
import { IconsMetadata } from './generate/icons'
import {
  resolveMetadataItems,
  accumulateMetadata,
  accumulateViewport,
} from './resolve-metadata'
import { MetaFilter } from './generate/meta'
import type {
  ResolvedMetadata,
  ResolvedViewport,
} from './types/metadata-interface'
import { isNotFoundError } from '../../client/components/not-found'
import type { MetadataContext } from './types/resolvers'
import type { StaticGenerationStore } from '../../client/components/static-generation-async-storage.external'

// Use a promise to share the status of the metadata resolving,
// returning two components `MetadataTree` and `MetadataOutlet`
// `MetadataTree` is the one that will be rendered at first in the content sequence for metadata tags.
// `MetadataOutlet` is the one that will be rendered under error boundaries for metadata resolving errors.
// In this way we can let the metadata tags always render successfully,
// and the error will be caught by the error boundary and trigger fallbacks.
export function createMetadataComponents({
  tree,
  searchParams,
  metadataContext,
  getDynamicParamFromSegment,
  appUsingSizeAdjustment,
  errorType,
  createServerParamsForMetadata,
  staticGenerationStore,
}: {
  tree: LoaderTree
  searchParams: Promise<ParsedUrlQuery>
  metadataContext: MetadataContext
  getDynamicParamFromSegment: GetDynamicParamFromSegment
  appUsingSizeAdjustment: boolean
  errorType?: 'not-found' | 'redirect'
  createServerParamsForMetadata: CreateServerParamsForMetadata
  staticGenerationStore: StaticGenerationStore
}): [React.ComponentType, () => Promise<void>] {
  function MetadataRoot() {
    return (
      <>
        <Metadata />
        <Viewport />
        {appUsingSizeAdjustment ? <meta name="next-size-adjust" /> : null}
      </>
    )
  }

  async function viewport() {
    return getResolvedViewport(
      tree,
      searchParams,
      getDynamicParamFromSegment,
      createServerParamsForMetadata,
      staticGenerationStore,
      errorType
    )
  }

  async function Viewport() {
    try {
      return await viewport()
    } catch (error) {
      if (!errorType && isNotFoundError(error)) {
        try {
          return await getNotFoundViewport(
            tree,
            searchParams,
            getDynamicParamFromSegment,
            createServerParamsForMetadata,
            staticGenerationStore
          )
        } catch {}
      }
      // We don't actually want to error in this component. We will
      // also error in the MetadataOutlet which causes the error to
      // bubble from the right position in the page to be caught by the
      // appropriate boundaries
      return null
    }
  }

  async function metadata() {
    return getResolvedMetadata(
      tree,
      searchParams,
      getDynamicParamFromSegment,
      metadataContext,
      createServerParamsForMetadata,
      staticGenerationStore,
      errorType
    )
  }

  async function Metadata() {
    try {
      return await metadata()
    } catch (error) {
      if (!errorType && isNotFoundError(error)) {
        try {
          return await getNotFoundMetadata(
            tree,
            searchParams,
            getDynamicParamFromSegment,
            metadataContext,
            createServerParamsForMetadata,
            staticGenerationStore
          )
        } catch {}
      }
      // We don't actually want to error in this component. We will
      // also error in the MetadataOutlet which causes the error to
      // bubble from the right position in the page to be caught by the
      // appropriate boundaries
      return null
    }
  }

  async function getMetadataAndViewportReady(): Promise<void> {
    await viewport()
    await metadata()
    return undefined
  }

  return [MetadataRoot, getMetadataAndViewportReady]
}

const getResolvedMetadata = cache(getResolvedMetadataImpl)
async function getResolvedMetadataImpl(
  tree: LoaderTree,
  searchParams: Promise<ParsedUrlQuery>,
  getDynamicParamFromSegment: GetDynamicParamFromSegment,
  metadataContext: MetadataContext,
  createServerParamsForMetadata: CreateServerParamsForMetadata,
  staticGenerationStore: StaticGenerationStore,
  errorType?: 'not-found' | 'redirect'
): Promise<React.ReactNode> {
  const errorConvention = errorType === 'redirect' ? undefined : errorType

  const metadataItems = await resolveMetadataItems(
    tree,
    searchParams,
    errorConvention,
    getDynamicParamFromSegment,
    createServerParamsForMetadata,
    staticGenerationStore
  )
  const elements: Array<React.ReactNode> = createMetadataElements(
    await accumulateMetadata(metadataItems, metadataContext)
  )
  return (
    <>
      {elements.map((el, index) => {
        return cloneElement(el as React.ReactElement, { key: index })
      })}
    </>
  )
}

const getNotFoundMetadata = cache(getNotFoundMetadataImpl)
async function getNotFoundMetadataImpl(
  tree: LoaderTree,
  searchParams: Promise<ParsedUrlQuery>,
  getDynamicParamFromSegment: GetDynamicParamFromSegment,
  metadataContext: MetadataContext,
  createServerParamsForMetadata: CreateServerParamsForMetadata,
  staticGenerationStore: StaticGenerationStore
): Promise<React.ReactNode> {
  const notFoundErrorConvention = 'not-found'
  const notFoundMetadataItems = await resolveMetadataItems(
    tree,
    searchParams,
    notFoundErrorConvention,
    getDynamicParamFromSegment,
    createServerParamsForMetadata,
    staticGenerationStore
  )

  const elements: Array<React.ReactNode> = createMetadataElements(
    await accumulateMetadata(notFoundMetadataItems, metadataContext)
  )
  return (
    <>
      {elements.map((el, index) => {
        return cloneElement(el as React.ReactElement, { key: index })
      })}
    </>
  )
}

const getResolvedViewport = cache(getResolvedViewportImpl)
async function getResolvedViewportImpl(
  tree: LoaderTree,
  searchParams: Promise<ParsedUrlQuery>,
  getDynamicParamFromSegment: GetDynamicParamFromSegment,
  createServerParamsForMetadata: CreateServerParamsForMetadata,
  staticGenerationStore: StaticGenerationStore,
  errorType?: 'not-found' | 'redirect'
): Promise<React.ReactNode> {
  const errorConvention = errorType === 'redirect' ? undefined : errorType

  const metadataItems = await resolveMetadataItems(
    tree,
    searchParams,
    errorConvention,
    getDynamicParamFromSegment,
    createServerParamsForMetadata,
    staticGenerationStore
  )
  const elements: Array<React.ReactNode> = createViewportElements(
    await accumulateViewport(metadataItems)
  )
  return (
    <>
      {elements.map((el, index) => {
        return cloneElement(el as React.ReactElement, { key: index })
      })}
    </>
  )
}

const getNotFoundViewport = cache(getNotFoundViewportImpl)
async function getNotFoundViewportImpl(
  tree: LoaderTree,
  searchParams: Promise<ParsedUrlQuery>,
  getDynamicParamFromSegment: GetDynamicParamFromSegment,
  createServerParamsForMetadata: CreateServerParamsForMetadata,
  staticGenerationStore: StaticGenerationStore
): Promise<React.ReactNode> {
  const notFoundErrorConvention = 'not-found'
  const notFoundMetadataItems = await resolveMetadataItems(
    tree,
    searchParams,
    notFoundErrorConvention,
    getDynamicParamFromSegment,
    createServerParamsForMetadata,
    staticGenerationStore
  )

  const elements: Array<React.ReactNode> = createViewportElements(
    await accumulateViewport(notFoundMetadataItems)
  )
  return (
    <>
      {elements.map((el, index) => {
        return cloneElement(el as React.ReactElement, { key: index })
      })}
    </>
  )
}

function createMetadataElements(metadata: ResolvedMetadata) {
  return MetaFilter([
    BasicMeta({ metadata }),
    AlternatesMetadata({ alternates: metadata.alternates }),
    ItunesMeta({ itunes: metadata.itunes }),
    FacebookMeta({ facebook: metadata.facebook }),
    FormatDetectionMeta({ formatDetection: metadata.formatDetection }),
    VerificationMeta({ verification: metadata.verification }),
    AppleWebAppMeta({ appleWebApp: metadata.appleWebApp }),
    OpenGraphMetadata({ openGraph: metadata.openGraph }),
    TwitterMetadata({ twitter: metadata.twitter }),
    AppLinksMeta({ appLinks: metadata.appLinks }),
    IconsMetadata({ icons: metadata.icons }),
  ])
}

function createViewportElements(viewport: ResolvedViewport) {
  return MetaFilter([ViewportMeta({ viewport: viewport })])
}
