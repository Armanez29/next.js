#!/usr/bin/env node

const fs = require('fs/promises')
const path = require('path')
const fetch = require('node-fetch')

;(async () => {
  const { familyMetadataList } = await fetch(
    'https://fonts.google.com/metadata/fonts'
  ).then((r) => r.json())

  let fontFunctions = `/**
  * This is an autogenerated file by scripts/update-google-fonts.js
  */
  import type { CssVariable, NextFont, NextFontWithVariable, Display } from '../types'
  `
  const fontData = {}
  const ignoredSubsets = [
    'menu',
    'japanese',
    'korean',
    'chinese-simplified',
    'chinese-hongkong',
    'chinese-traditional',
  ]
  for (let { family, fonts, axes, subsets } of familyMetadataList) {
    subsets = subsets.filter((subset) => !ignoredSubsets.includes(subset))
    const hasPreloadableSubsets = subsets.length > 0
    const weights = new Set()
    const styles = new Set()

    for (const variant of Object.keys(fonts)) {
      if (variant.endsWith('i')) {
        styles.add('italic')
        weights.add(variant.slice(0, -1))
        continue
      } else {
        styles.add('normal')
        weights.add(variant)
      }
    }

    const hasVariableFont = axes.length > 0

    let optionalAxes
    if (hasVariableFont) {
      weights.add('variable')

      const nonWeightAxes = axes.filter(({ tag }) => tag !== 'wght')
      if (nonWeightAxes.length > 0) {
        optionalAxes = nonWeightAxes
      }
    }

    fontData[family] = {
      weights: [...weights],
      styles: [...styles],
      axes: hasVariableFont ? axes : undefined,
      subsets,
    }
    const optionalIfVariableFont = hasVariableFont ? '?' : ''

    const formatUnion = (values) =>
      values.map((value) => `"${value}"`).join('|')

    const weightTypes = [...weights]
    const styleTypes = [...styles]

    fontFunctions += `export declare function ${family.replaceAll(
      ' ',
      '_'
    )}<T extends CssVariable | undefined = undefined>(options${optionalIfVariableFont}: {
    weight${optionalIfVariableFont}:${formatUnion(
      weightTypes
    )} | Array<${formatUnion(
      weightTypes.filter((weight) => weight !== 'variable')
    )}>
    style?: ${formatUnion(styleTypes)} | Array<${formatUnion(styleTypes)}>
    display?:Display
    variable?: T
    text?: string
    ${hasPreloadableSubsets ? 'preload?:boolean' : ''}
    fallback?: string[]
    adjustFontFallback?: boolean
    ${hasPreloadableSubsets ? `subsets?: Array<${formatUnion(subsets)}>` : ''}
    ${
      optionalAxes
        ? `axes?:(${formatUnion(optionalAxes.map(({ tag }) => tag))})[]`
        : ''
    }
    }): T extends undefined ? NextFont : NextFontWithVariable
    `
  }

  await Promise.all([
    fs.writeFile(
      path.join(__dirname, '../packages/font/src/google/index.ts'),
      fontFunctions
    ),
    fs.writeFile(
      path.join(__dirname, '../packages/font/src/google/font-data.json'),
      JSON.stringify(fontData, null, 2)
    ),
  ])
})()
