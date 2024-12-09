import fs from 'fs'
import path from 'path'
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest'
import { analyzeDependencies } from './analyze'

vi.mock('fs')
vi.mock('path')

describe('analyzeDependencies', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation((number) => {
    throw new Error('process.exit: ' + number)
  })
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  let pathResolveMock: MockedFunction<typeof path.resolve>
  let fsExistsSyncMock: MockedFunction<typeof fs.existsSync>
  let fsReadFileSyncMock: MockedFunction<typeof fs.readFileSync>

  beforeEach(() => {
    vi.clearAllMocks()

    pathResolveMock = path.resolve as MockedFunction<typeof path.resolve>
    fsExistsSyncMock = fs.existsSync as MockedFunction<typeof fs.existsSync>
    fsReadFileSyncMock = fs.readFileSync as MockedFunction<typeof fs.readFileSync>

    pathResolveMock.mockImplementation((p: string) => `/mock/path/${p}`)
  })

  it('should report all dependencies are installed when everything is present', () => {
    const mockPackageJson = {
      dependencies: {
        'test-dep': '1.0.0',
      },
      devDependencies: {
        'test-dev-dep': '1.0.0',
      },
    }

    fsExistsSyncMock.mockImplementation((p) => true)
    fsReadFileSyncMock.mockReturnValue(JSON.stringify(mockPackageJson))

    analyzeDependencies('package.json')

    expect(mockConsoleLog).toHaveBeenCalledWith('All dependencies are installed.')
    expect(mockExit).not.toHaveBeenCalled()
  })

  it('should report missing dependencies', () => {
    const mockPackageJson = {
      dependencies: {
        'missing-dep': '1.0.0',
      },
      devDependencies: {
        'installed-dev-dep': '1.0.0',
      },
    }

    fsExistsSyncMock.mockImplementation((p) => !String(p).includes('missing-dep'))
    fsReadFileSyncMock.mockReturnValue(JSON.stringify(mockPackageJson))

    expect(() => analyzeDependencies('package.json')).toThrow('process.exit: 1')
    expect(mockConsoleWarn).toHaveBeenCalledWith('The following packages are missing:')
    expect(mockConsoleWarn).toHaveBeenCalledWith('- missing-dep (declared)')
  })

  it('should report missing context specific dependencies', () => {
    const mockPackageJson = {
      dependencies: {
        next: '1.0.0',
        'next/image': '1.0.0',
      },
    }

    fsExistsSyncMock.mockImplementation((p) => !String(p).includes('missing-dep'))
    fsReadFileSyncMock.mockReturnValue(JSON.stringify(mockPackageJson))

    expect(() => analyzeDependencies('package.json')).toThrow('process.exit: 1')
    expect(mockConsoleWarn).toHaveBeenCalledWith('The following packages are missing:')
    expect(mockConsoleWarn).toHaveBeenCalledWith('- sharp (required by usage)')
  })

  it('should handle non-existent package.json', () => {
    fsExistsSyncMock.mockReturnValue(false)

    expect(() => analyzeDependencies('non-existent.json')).toThrow('process.exit: 1')
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error: File not found'))
  })
})
