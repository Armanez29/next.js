import { globSync } from 'glob'
import type { Rule } from 'eslint'

/**
 * Process a Next.js root directory glob.
 */
const processRootDir = (rootDir: string): string[] => {
  // Ensures we only match folders.
  if (!rootDir.endsWith('/')) rootDir += '/'
  return globSync(rootDir)
}

/**
 * Gets one or more Root, returns an array of root directories.
 */
export const getRootDirs = (context: Rule.RuleContext) => {
  let rootDirs = [context.cwd]

  const nextSettings: { rootDir?: string | string[] } =
    context.settings.next || {}
  let rootDir = nextSettings.rootDir

  if (typeof rootDir === 'string') {
    rootDirs = processRootDir(rootDir)
  } else if (Array.isArray(rootDir)) {
    rootDirs = rootDir
      .map((dir) => (typeof dir === 'string' ? processRootDir(dir) : []))
      .flat()
  }

  return rootDirs
}
