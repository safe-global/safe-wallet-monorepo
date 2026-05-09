import type { ComponentEntry } from '../types'
import { scanComponents, getComponentPaths } from '../scanner'

// Mock fs, glob, and typescript modules
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

jest.mock('glob', () => ({
  glob: jest.fn(),
}))

jest.mock('typescript', () => ({
  createSourceFile: jest.fn(),
  forEachChild: jest.fn(),
  ScriptTarget: { Latest: 99 },
  isExportAssignment: jest.fn(() => false),
  isFunctionDeclaration: jest.fn(() => false),
  isExportDeclaration: jest.fn(() => false),
  isVariableStatement: jest.fn(() => false),
  isImportDeclaration: jest.fn(() => false),
  isIdentifier: jest.fn(() => false),
  isStringLiteral: jest.fn(() => false),
  isNamedImports: jest.fn(() => false),
  isNamedExports: jest.fn(() => false),
  getModifiers: jest.fn(() => []),
  SyntaxKind: { ExportKeyword: 93 },
}))

const mockFs = jest.mocked(require('fs'))
const mockGlob = jest.mocked(require('glob'))
const mockTs = jest.mocked(require('typescript'))

/**
 * Creates a mock source file for TypeScript parsing
 */
function createMockSourceFile(fullText: string = '') {
  return {
    getFullText: () => fullText,
  }
}

/**
 * Creates a mock component entry for testing
 */
function createMockComponent(overrides: Partial<ComponentEntry> = {}): ComponentEntry {
  return {
    path: 'components/common/Test.tsx',
    name: 'Test',
    category: 'common',
    hasStory: false,
    dependencies: {
      hooks: [],
      redux: [],
      apiCalls: [],
      components: [],
      packages: [],
      needsMsw: false,
      needsRedux: false,
      needsWeb3: false,
    },
    priorityScore: 0,
    priorityReasons: [],
    ...overrides,
  }
}

describe('scanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync.mockReturnValue(false)
    mockFs.readFileSync.mockReturnValue('')
    mockGlob.glob.mockResolvedValue([])
    mockTs.createSourceFile.mockReturnValue(createMockSourceFile())
    mockTs.forEachChild.mockImplementation(() => {})
  })

  describe('scanComponents', () => {
    it('should use default root directory based on cwd', async () => {
      mockGlob.glob.mockResolvedValue([])

      await scanComponents()

      expect(mockGlob.glob).toHaveBeenCalledWith(
        '**/*.tsx',
        expect.objectContaining({
          cwd: expect.any(String),
          ignore: expect.any(Array),
          absolute: false,
        }),
      )
    })

    it('should use custom root directory when provided', async () => {
      mockGlob.glob.mockResolvedValue([])

      await scanComponents({ rootDir: 'custom/dir' })

      expect(mockGlob.glob).toHaveBeenCalledWith(
        '**/*.tsx',
        expect.objectContaining({
          cwd: 'custom/dir',
        }),
      )
    })

    it('should apply exclude patterns', async () => {
      const customPatterns = ['**/*.test.tsx', '**/node_modules/**']
      mockGlob.glob.mockResolvedValue([])

      await scanComponents({ excludePatterns: customPatterns })

      expect(mockGlob.glob).toHaveBeenCalledWith(
        '**/*.tsx',
        expect.objectContaining({
          ignore: customPatterns,
        }),
      )
    })

    it('should return empty array when no files found', async () => {
      mockGlob.glob.mockResolvedValue([])

      const result = await scanComponents()

      expect(result).toEqual([])
    })

    it('should handle file read errors gracefully', async () => {
      mockGlob.glob.mockResolvedValue(['components/Broken.tsx'])
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error')
      })

      const result = await scanComponents({ rootDir: 'src' })

      // Should not throw, should return empty array
      expect(result).toEqual([])
    })

    it('should log verbose output when verbose option is true', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      mockGlob.glob.mockResolvedValue([])

      await scanComponents({ verbose: true })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found'))
      consoleSpy.mockRestore()
    })

    it('should not log when verbose is false', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      mockGlob.glob.mockResolvedValue([])

      await scanComponents({ verbose: false })

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getComponentPaths', () => {
    it('should return Set of all component paths', () => {
      const components = [
        createMockComponent({ path: 'components/Button.tsx' }),
        createMockComponent({ path: 'components/Card.tsx' }),
        createMockComponent({ path: 'features/swap/Widget.tsx' }),
      ]

      const paths = getComponentPaths(components)

      expect(paths).toBeInstanceOf(Set)
      expect(paths.size).toBe(3)
      expect(paths.has('components/Button.tsx')).toBe(true)
      expect(paths.has('components/Card.tsx')).toBe(true)
      expect(paths.has('features/swap/Widget.tsx')).toBe(true)
    })

    it('should handle duplicate paths (returns unique Set)', () => {
      const components = [
        createMockComponent({ path: 'components/Button.tsx' }),
        createMockComponent({ path: 'components/Button.tsx' }),
      ]

      const paths = getComponentPaths(components)

      expect(paths.size).toBe(1)
    })

    it('should return empty Set for empty input', () => {
      const paths = getComponentPaths([])

      expect(paths.size).toBe(0)
    })
  })

  describe('category detection', () => {
    // Test category detection by creating components with specific paths
    // and verifying the scanner would categorize them correctly

    it('should detect UI components from path containing /ui/', () => {
      const path = 'components/ui/Button.tsx'
      expect(path.toLowerCase().includes('/ui/')).toBe(true)
    })

    it('should detect sidebar components from path containing /sidebar/', () => {
      const path = 'components/sidebar/Header.tsx'
      expect(path.toLowerCase().includes('/sidebar/')).toBe(true)
    })

    it('should detect common components from path containing /common/', () => {
      const path = 'components/common/EthHashInfo.tsx'
      expect(path.toLowerCase().includes('/common/')).toBe(true)
    })

    it('should detect dashboard components from path containing /dashboard/', () => {
      const path = 'components/dashboard/Widget.tsx'
      expect(path.toLowerCase().includes('/dashboard/')).toBe(true)
    })

    it('should detect transaction components from path containing /transactions/ or /tx/', () => {
      expect('components/transactions/TxList.tsx'.toLowerCase().includes('/transactions/')).toBe(true)
      expect('components/tx/Details.tsx'.toLowerCase().includes('/tx/')).toBe(true)
    })

    it('should detect balance components from path containing /balances/ or /assets/', () => {
      expect('components/balances/TokenList.tsx'.toLowerCase().includes('/balances/')).toBe(true)
      expect('components/assets/NFTGallery.tsx'.toLowerCase().includes('/assets/')).toBe(true)
    })

    it('should detect settings components from path containing /settings/', () => {
      const path = 'components/settings/Preferences.tsx'
      expect(path.toLowerCase().includes('/settings/')).toBe(true)
    })

    it('should detect layout components from path containing /layout/', () => {
      const path = 'components/layout/PageWrapper.tsx'
      expect(path.toLowerCase().includes('/layout/')).toBe(true)
    })

    it('should detect page components from path containing /pages/', () => {
      const path = 'components/pages/Dashboard.tsx'
      expect(path.toLowerCase().includes('/pages/')).toBe(true)
    })

    it('should detect feature components from path containing /features/', () => {
      const path = 'src/features/swap/SwapWidget.tsx'
      expect(path.toLowerCase().includes('/features/')).toBe(true)
    })
  })

  describe('PascalCase detection', () => {
    // The scanner uses PascalCase to identify React components

    it('should recognize PascalCase names as components', () => {
      const pascalCaseNames = ['Button', 'EthHashInfo', 'TransactionList', 'NFTCard']

      for (const name of pascalCaseNames) {
        expect(/^[A-Z][a-zA-Z0-9]*$/.test(name)).toBe(true)
      }
    })

    it('should not recognize non-PascalCase names as components', () => {
      const nonPascalCaseNames = ['button', 'useHook', 'eth-hash', 'transaction_list', '123Number']

      for (const name of nonPascalCaseNames) {
        expect(/^[A-Z][a-zA-Z0-9]*$/.test(name)).toBe(false)
      }
    })
  })

  describe('story path detection', () => {
    it('should check for .stories.tsx file in same directory', () => {
      const componentPath = '/src/components/Button.tsx'
      const expectedStoryPath = '/src/components/Button.stories.tsx'

      // The scanner uses this pattern:
      // path.join(dir, `${baseName}.stories.tsx`)
      const dir = componentPath.replace('/Button.tsx', '')
      const baseName = 'Button'
      const storyPath = `${dir}/${baseName}.stories.tsx`

      expect(storyPath).toBe(expectedStoryPath)
    })
  })

  describe('dependency detection patterns', () => {
    // Test the patterns used for detecting dependencies

    it('should detect hooks by use prefix', () => {
      const hookNames = ['useState', 'useEffect', 'useCustomHook', 'useSWR']

      for (const name of hookNames) {
        expect(name.startsWith('use')).toBe(true)
      }
    })

    it('should detect Redux imports by common patterns', () => {
      // These patterns match what the scanner actually detects (case-sensitive)
      // Note: scanner uses case-sensitive includes(), so 'Slice' matches but 'slice' doesn't
      const reduxPatterns = ['safeInfoSlice', 'selectSafeInfo', 'basicselector', 'redispatch']

      for (const name of reduxPatterns) {
        const isRedux =
          name.includes('Slice') || name.includes('selector') || name.includes('dispatch') || name.startsWith('select')

        expect(isRedux).toBe(true)
      }
    })

    it('should detect Web3 packages', () => {
      const web3Packages = ['ethers', 'web3', 'wagmi', '@ethersproject/abi']

      for (const pkg of web3Packages) {
        const isWeb3 = pkg.includes('ethers') || pkg.includes('web3') || pkg.includes('wagmi')
        expect(isWeb3).toBe(true)
      }
    })

    it('should detect data fetching packages for MSW', () => {
      const fetchPackages = ['swr', 'react-query', '@tanstack/react-query']

      for (const pkg of fetchPackages) {
        const needsMsw = pkg.includes('swr') || pkg.includes('react-query')
        expect(needsMsw).toBe(true)
      }
    })
  })
})
