#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, basename, dirname, relative, extname, join } from 'path'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: test-scaffold <file-path>')
  console.error('Example: yarn workspace @safe-global/web test:scaffold src/hooks/useMyHook.ts')
  process.exit(1)
}

const cwd = process.cwd()
const absolutePath = resolve(cwd, filePath)

if (!existsSync(absolutePath)) {
  console.error(`File not found: ${absolutePath}`)
  process.exit(1)
}

const fileName = basename(absolutePath)
const fileDir = dirname(absolutePath)
const ext = extname(fileName)
const nameWithoutExt = fileName.replace(ext, '')

// Determine test type from file name
function getTestType(name, extension) {
  if (name.startsWith('use') && extension === '.ts') return 'hook'
  if (extension === '.tsx') return 'component'
  if (name.endsWith('Slice') && extension === '.ts') return 'slice'
  return 'util'
}

const testType = getTestType(nameWithoutExt, ext)

// Determine test file location
const testsDir = join(fileDir, '__tests__')
const hasTestsDir = existsSync(testsDir)

const testExt = testType === 'component' ? '.test.tsx' : '.test.ts'
const testFilePath = hasTestsDir
  ? join(testsDir, `${nameWithoutExt}${testExt}`)
  : join(fileDir, `${nameWithoutExt}${testExt}`)

if (existsSync(testFilePath)) {
  console.log('Test file already exists')
  process.exit(0)
}

// Read source file
const source = readFileSync(absolutePath, 'utf-8')

// Extract exported names
const exportRegex = /export\s+(?:default\s+)?(?:const|function|class)\s+(\w+)/g
const exports = []
let match
while ((match = exportRegex.exec(source)) !== null) {
  exports.push(match[1])
}

const primaryExport = exports[0] || nameWithoutExt

// Detect common mockable imports
const mockableImports = []
const mockPatterns = [
  { pattern: /@\/hooks\/useSafeInfo/, mock: '@/hooks/useSafeInfo' },
  { pattern: /@\/hooks\/useChainId/, mock: '@/hooks/useChainId' },
  { pattern: /@\/hooks\/useWallet/, mock: '@/hooks/useWallet' },
  { pattern: /@\/store/, mock: '@/store' },
]

for (const { pattern, mock } of mockPatterns) {
  if (pattern.test(source)) {
    mockableImports.push(mock)
  }
}

// Calculate relative import path from test file to source file
const testDir = dirname(testFilePath)
let importPath = relative(testDir, absolutePath)
if (!importPath.startsWith('.')) {
  importPath = './' + importPath
}
// Remove extension
importPath = importPath.replace(/\.(tsx?|jsx?)$/, '')

// Generate test file content
function generateHookTest() {
  const lines = []
  lines.push("import { renderHook } from '@/tests/test-utils'")
  lines.push(`import { ${primaryExport} } from '${importPath}'`)
  lines.push('')

  for (const mock of mockableImports) {
    lines.push(`jest.mock('${mock}')`)
  }
  if (mockableImports.length > 0) lines.push('')

  lines.push('beforeEach(() => {')
  lines.push('  jest.clearAllMocks()')
  lines.push('})')
  lines.push('')
  lines.push(`describe('${primaryExport}', () => {`)
  lines.push(`  it('should work correctly', () => {`)
  lines.push(`    const { result } = renderHook(() => ${primaryExport}())`)
  lines.push('    // TODO: add assertions')
  lines.push('  })')
  lines.push('})')
  lines.push('')
  return lines.join('\n')
}

function generateComponentTest() {
  const lines = []
  lines.push("import { render, screen } from '@/tests/test-utils'")
  lines.push(`import ${primaryExport} from '${importPath}'`)
  lines.push('')

  for (const mock of mockableImports) {
    lines.push(`jest.mock('${mock}')`)
  }
  if (mockableImports.length > 0) lines.push('')

  lines.push(`describe('${primaryExport}', () => {`)
  lines.push(`  it('should render', () => {`)
  lines.push(`    render(<${primaryExport} />)`)
  lines.push('    // TODO: add assertions')
  lines.push('  })')
  lines.push('})')
  lines.push('')
  return lines.join('\n')
}

function generateSliceTest() {
  const lines = []
  lines.push(`import { ${primaryExport} } from '${importPath}'`)
  lines.push('')

  lines.push(`describe('${primaryExport}', () => {`)
  lines.push(`  it('should handle initial state', () => {`)
  lines.push(`    // TODO: add assertions`)
  lines.push(`    // const store = configureStore({ reducer: { [${primaryExport}.name]: ${primaryExport}.reducer } })`)
  lines.push(`    // store.dispatch(someAction())`)
  lines.push(`    // expect(store.getState()).toEqual(/* expected */)`)
  lines.push('  })')
  lines.push('})')
  lines.push('')
  return lines.join('\n')
}

function generateUtilTest() {
  const lines = []

  if (exports.length === 1) {
    lines.push(`import { ${primaryExport} } from '${importPath}'`)
  } else if (exports.length > 1) {
    lines.push(`import { ${exports.join(', ')} } from '${importPath}'`)
  } else {
    lines.push(`import { ${nameWithoutExt} } from '${importPath}'`)
  }
  lines.push('')

  lines.push(`describe('${primaryExport}', () => {`)

  const testExports = exports.length > 0 ? exports : [nameWithoutExt]
  for (const exp of testExports) {
    lines.push(`  it('${exp} should work correctly', () => {`)
    lines.push('    // TODO: add assertions')
    lines.push(`    // const result = ${exp}(/* args */)`)
    lines.push('    // expect(result).toBe(/* expected */)')
    lines.push('  })')
    if (exp !== testExports[testExports.length - 1]) lines.push('')
  }

  lines.push('})')
  lines.push('')
  return lines.join('\n')
}

const generators = {
  hook: generateHookTest,
  component: generateComponentTest,
  slice: generateSliceTest,
  util: generateUtilTest,
}

const content = generators[testType]()

writeFileSync(testFilePath, content, 'utf-8')
console.log(`Created ${testType} test: ${testFilePath}`)
