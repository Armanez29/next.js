const objectHash = require('object-hash')

const engines: any = {}

export default function createEngine(options: any) {
  const { CLIEngine } = require(options.eslintPath)
  const hash = objectHash(options)

  if (!engines[hash]) {
    engines[hash] = new CLIEngine(options)
  }

  return {
    CLIEngine,
    engine: engines[hash],
  }
}
