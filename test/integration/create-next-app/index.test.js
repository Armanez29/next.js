/* eslint-env jest */
import path from 'path'
import fs from 'fs-extra'
import execa from 'execa'
import os from 'os'
import readline from 'readline'

const cli = require.resolve('create-next-app/dist/index.js')

jest.setTimeout(1000 * 60 * 2)

const run = (cwd, ...args) => execa('node', [cli, ...args], { cwd })
const runStarter = (cwd, ...args) => {
  const res = run(cwd, ...args)

  const rl = readline.createInterface({
    input: res.stdout,
  })
  rl.on('line', line => {
    if (/Pick a template/.test(line)) {
      res.stdin.write('\n')
    }
  })

  return res
}

async function usingTempDir(fn) {
  const folder = path.join(
    os.tmpdir(),
    Math.random()
      .toString(36)
      .substring(2)
  )
  await fs.mkdirp(folder)
  try {
    return await fn(folder)
  } finally {
    await fs.remove(folder)
  }
}

describe('create next app', () => {
  it('non-empty directory', async () => {
    await usingTempDir(async cwd => {
      const projectName = 'non-empty-directory'
      await fs.mkdirp(path.join(cwd, projectName))
      const pkg = path.join(cwd, projectName, 'package.json')
      await fs.writeFile(pkg, '{ "foo": "bar" }')

      expect.assertions(1)
      try {
        await runStarter(cwd, projectName)
      } catch (e) {
        expect(e.stdout).toMatch(/contains files that could conflict/)
      }
    })
  })

  it('empty directory', async () => {
    await usingTempDir(async cwd => {
      const projectName = 'empty-directory'
      const res = await runStarter(cwd, projectName)

      expect(res.exitCode).toBe(0)
      expect(
        await fs.exists(path.join(cwd, projectName, 'package.json'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/index.js'))
      ).toBeTruthy()
    })
  })

  it('invalid example name', async () => {
    await usingTempDir(async cwd => {
      const projectName = 'invalid-example-name'
      expect.assertions(2)
      try {
        await run(cwd, projectName, '--example', 'not a real example')
      } catch (e) {
        expect(e.stderr).toMatch(/Could not locate an example named/i)
      }
      expect(
        await fs.exists(path.join(cwd, projectName, 'package.json'))
      ).toBeFalsy()
    })
  })

  it('valid example', async () => {
    await usingTempDir(async cwd => {
      const projectName = 'valid-example'
      const res = await run(cwd, projectName, '--example', 'basic-css')
      expect(res.exitCode).toBe(0)

      expect(
        await fs.exists(path.join(cwd, projectName, 'package.json'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/index.js'))
      ).toBeTruthy()
      // check we copied default `.gitignore`
      expect(
        await fs.exists(path.join(cwd, projectName, '.gitignore'))
      ).toBeTruthy()
    })
  })

  it('should allow example with GitHub URL', async () => {
    await usingTempDir(async cwd => {
      const projectName = 'github-app'
      const res = await run(
        cwd,
        projectName,
        '--example',
        'https://github.com/zeit/next-learn-demo/tree/master/1-navigate-between-pages'
      )

      expect(res.exitCode).toBe(0)
      expect(
        await fs.exists(path.join(cwd, projectName, 'package.json'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/index.js'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/about.js'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, '.gitignore'))
      ).toBeTruthy()
    })
  })

  it('should allow example with GitHub URL and example-path', async () => {
    await usingTempDir(async cwd => {
      const projectName = 'github-example-path'
      const res = await run(
        cwd,
        projectName,
        '--example',
        'https://github.com/zeit/next-learn-demo/tree/master',
        '--example-path',
        '1-navigate-between-pages'
      )

      expect(res.exitCode).toBe(0)
      expect(
        await fs.exists(path.join(cwd, projectName, 'package.json'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/index.js'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/about.js'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, '.gitignore'))
      ).toBeTruthy()
    })
  })

  it('should use --example-path over the file path in the GitHub URL', async () => {
    await usingTempDir(async cwd => {
      const projectName = 'github-example-path-2'
      const res = await run(
        cwd,
        projectName,
        '--example',
        'https://github.com/zeit/next-learn-demo/tree/master/1-navigate-between-pages',
        '--example-path',
        '1-navigate-between-pages'
      )

      expect(res.exitCode).toBe(0)
      expect(
        await fs.exists(path.join(cwd, projectName, 'package.json'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/index.js'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, 'pages/about.js'))
      ).toBeTruthy()
      expect(
        await fs.exists(path.join(cwd, projectName, '.gitignore'))
      ).toBeTruthy()
    })
  })

  it('should allow to manually select an example', async () => {
    await usingTempDir(async cwd => {
      const runExample = (...args) => {
        const res = run(cwd, ...args)

        const rl = readline.createInterface({
          input: res.stdout,
        })

        function pickExample(data) {
          if (/hello-world/.test(data.toString())) {
            rl.removeListener('line', pickExample)
            res.stdin.write('\n')
          }
        }

        function searchExample(data) {
          if (/Pick an example/.test(data.toString())) {
            rl.removeListener('line', searchExample)
            res.stdin.write('hello-world')
            rl.on('line', pickExample)
          }
        }

        function selectExample(data) {
          if (/Pick a template/.test(data.toString())) {
            rl.removeListener('line', selectExample)
            res.stdin.write('\u001b[B\n') // Down key and enter
            rl.on('line', searchExample)
          }
        }

        rl.on('line', selectExample)

        return res
      }

      const res = await runExample('no-example')

      expect(res.exitCode).toBe(0)
      expect(res.stdout).toMatch(/Downloading files for example hello-world/)
    })
  })
})
