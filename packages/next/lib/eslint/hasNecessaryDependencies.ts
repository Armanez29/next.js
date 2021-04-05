import chalk from 'chalk'
import path from 'path'

import { ESLintFatalError } from './ESLintFatalError'

const requiredESLintPackages = [
  'eslint',
  '@babel/core',
  '@babel/eslint-parser',
  '@next/eslint-config',
  '@next/eslint-plugin-next',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
  'eslint-plugin-import',
]

const requiredTSPackages = ['@typescript-eslint/parser']

export type NecessaryDependencies = {
  resolvedESLint: string
}

export async function hasNecessaryDependencies(
  baseDir: string,
  eslintrcFile: string | null,
  isUsingTS: boolean
): Promise<NecessaryDependencies> {
  let resolutions = new Map<string, string>()

  // If TypeScript is being used, ensure that @typescript-eslint/parser is also installed
  const requiredPackages = isUsingTS
    ? requiredESLintPackages.concat(requiredTSPackages)
    : requiredESLintPackages

  const missingPackages = requiredPackages.filter((pkg) => {
    try {
      resolutions.set(pkg, require.resolve(pkg, { paths: [baseDir] }))
      return false
    } catch (_) {
      return true
    }
  })

  if (missingPackages.length < 1) {
    return { resolvedESLint: resolutions.get('eslint')! }
  }

  const removalLocation = eslintrcFile
    ? chalk.cyan(path.basename(eslintrcFile)) + ' file from your application'
    : chalk.cyan('eslintConfig') + ' field from your package.json file'

  throw new ESLintFatalError(
    chalk.bold.red(
      `It looks like you're trying to use ESLint${
        isUsingTS ? ' with TypeScript ' : ' '
      }but do not have the required package(s) installed.`
    ) +
      '\n\n' +
      chalk.bold(`Please install all missing dependencies by running:`) +
      '\n\n' +
      `\t${chalk.bold.cyan('npx install-peerdeps --dev @next/eslint-config')}` +
      '\n\n' +
      chalk.bold(
        `If you are not trying to use ESLint, please remove the ${removalLocation}.\n\nLearn more: https://nextjs.org/docs/basic-features/eslint\n`
      )
  )
}
