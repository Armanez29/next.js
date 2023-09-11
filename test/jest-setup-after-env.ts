// @ts-ignore
import * as matchers from 'jest-extended'
import '@testing-library/jest-dom'
expect.extend(matchers)

// A default max-timeout of 90 seconds is allowed
// per test we should aim to bring this down though
jest.setTimeout((process.platform === 'win32' ? 180 : 120) * 1000)
