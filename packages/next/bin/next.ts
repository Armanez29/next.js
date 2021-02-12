#!/usr/bin/env node
import * as log from '../build/output/log'
import arg from 'next/dist/compiled/arg/index.js'
import { NON_STANDARD_NODE_ENV } from '../lib/constants'
import opentelemetryApi from '@opentelemetry/api'
import { traceFn, tracer } from '../build/tracer'
import loadConfig from '../next-server/server/config'
import { PHASE_PRODUCTION_BUILD } from '../next-server/lib/constants'
import { readFileSync, readdirSync } from 'fs'
;['react', 'react-dom'].forEach((dependency) => {
  try {
    // When 'npm link' is used it checks the clone location. Not the project.
    require.resolve(dependency)
  } catch (err) {
    console.warn(
      `The module '${dependency}' was not found. Next.js requires that you include it in 'dependencies' of your 'package.json'. To add it, run 'npm install ${dependency}'`
    )
  }
})

const defaultCommand = 'dev'
export type cliCommand = (argv?: string[]) => void
const commands: { [command: string]: () => Promise<cliCommand> } = {
  build: () => import('../cli/next-build').then((i) => i.nextBuild),
  start: () => import('../cli/next-start').then((i) => i.nextStart),
  export: () => import('../cli/next-export').then((i) => i.nextExport),
  dev: () => import('../cli/next-dev').then((i) => i.nextDev),
  telemetry: () => import('../cli/next-telemetry').then((i) => i.nextTelemetry),
}

const args = arg(
  {
    // Types
    '--version': Boolean,
    '--help': Boolean,
    '--inspect': Boolean,

    // Aliases
    '-v': '--version',
    '-h': '--help',
  },
  {
    permissive: true,
  }
)

// Version is inlined into the file using taskr build pipeline
if (args['--version']) {
  console.log(`Next.js v${process.env.__NEXT_VERSION}`)
  process.exit(0)
}

// Check if we are running `next <subcommand>` or `next`
const foundCommand = Boolean(commands[args._[0]])

// Makes sure the `next --help` case is covered
// This help message is only showed for `next --help`
// `next <subcommand> --help` falls through to be handled later
if (!foundCommand && args['--help']) {
  console.log(`
    Usage
      $ next <command>

    Available commands
      ${Object.keys(commands).join(', ')}

    Options
      --version, -v   Version number
      --help, -h      Displays this message

    For more information run a command with the --help flag
      $ next build --help
  `)
  process.exit(0)
}

const command = foundCommand ? args._[0] : defaultCommand
const forwardedArgs = foundCommand ? args._.slice(1) : args._

if (args['--inspect'])
  throw new Error(
    `--inspect flag is deprecated. Use env variable NODE_OPTIONS instead: NODE_OPTIONS='--inspect' next ${command}`
  )

// Make sure the `next <subcommand> --help` case is covered
if (args['--help']) {
  forwardedArgs.push('--help')
}

const defaultEnv = command === 'dev' ? 'development' : 'production'

const standardEnv = ['production', 'development', 'test']

if (process.env.NODE_ENV && !standardEnv.includes(process.env.NODE_ENV)) {
  log.warn(NON_STANDARD_NODE_ENV)
}

;(process.env as any).NODE_ENV = process.env.NODE_ENV || defaultEnv

// this needs to come after we set the correct NODE_ENV or
// else it might cause SSR to break
const React = require('react')

if (typeof React.Suspense === 'undefined') {
  throw new Error(
    `The version of React you are using is lower than the minimum required version needed for Next.js. Please upgrade "react" and "react-dom": "npm install react react-dom" https://err.sh/vercel/next.js/invalid-react-version`
  )
}

// Make sure commands gracefully respect termination signals (e.g. from Docker)
process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))

commands[command]()
  .then((exec) => exec(forwardedArgs))
  .then(async () => {
    if (command === 'build') {
      // @ts-ignore getDelegate exists
      const tp = opentelemetryApi.trace.getTracerProvider().getDelegate()
      if (tp.shutdown) {
        await tp.shutdown()
      }
      process.exit(0)
    }
  })

const config = traceFn(tracer.startSpan('load-next-config'), () =>
  loadConfig(PHASE_PRODUCTION_BUILD, process.cwd())
)
const { enableBuildTimeLinting } = config.experimental

if (
  enableBuildTimeLinting &&
  enableBuildTimeLinting !== 'eslint' &&
  enableBuildTimeLinting !== 'default'
) {
  log.warn(
    'The experimental enableBuildTimeLinting flag is enabled incorrectly. Please specify a value of "default" or "eslint".'
  )
}

if (enableBuildTimeLinting === 'eslint') {
  const dirFiles = readdirSync(process.cwd())
  const eslintrc = dirFiles.find((file) =>
    /^.eslintrc.?(js|json|yaml|yml)?$/.test(file)
  )

  if (eslintrc) {
    let eslintConfig = readFileSync(`${process.cwd()}/${eslintrc}`).toString()

    if (!eslintConfig.includes('@next/next')) {
      log.warn(
        `The Next.js ESLint plugin is missing from ${eslintrc}. We recommend including it to prevent significant issues in your application (see https://nextjs.org/docs/linting).`
      )
    }
  }
}

if (command === 'dev') {
  const { CONFIG_FILE } = require('../next-server/lib/constants')
  const { watchFile } = require('fs')
  watchFile(`${process.cwd()}/${CONFIG_FILE}`, (cur: any, prev: any) => {
    if (cur.size > 0 || prev.size > 0) {
      console.log(
        `\n> Found a change in ${CONFIG_FILE}. Restart the server to see the changes in effect.`
      )
    }
  })

  if (enableBuildTimeLinting === 'eslint') {
    const dirFiles = readdirSync(process.cwd())
    const eslintrc = dirFiles.find((file) =>
      /^.eslintrc.?(js|json|yaml|yml)?$/.test(file)
    )

    if (eslintrc) {
      watchFile(`${process.cwd()}/${eslintrc}`, (cur: any, prev: any) => {
        if (cur.size > 0 || prev.size > 0) {
          console.log(
            `\n> Found a change in ${eslintrc}. Restart the server to see the changes in effect.`
          )
        }
      })
    }
  }
}
