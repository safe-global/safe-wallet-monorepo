import { readdirSync } from 'node:fs'
import { join, sep } from 'node:path'

let mockHeavyModulesLoaded: string[] = []

jest.mock('@/utils/transaction-errors', () => {
  mockHeavyModulesLoaded.push('transaction-errors')
  return jest.requireActual('@/utils/transaction-errors')
})

const PUBLIC_DIR = join(__dirname, '../public')

// Every module in public/, so a new public file is checked too.
const publicModules = (readdirSync(PUBLIC_DIR, { recursive: true }) as string[])
  .filter((file) => /\.tsx?$/.test(file) && !file.split(sep).includes('__tests__'))
  .map((file) =>
    file
      .replace(/\.tsx?$/, '')
      .split(sep)
      .join('/'),
  )
  .sort()

describe('policy-guard bundle boundary', () => {
  it('finds the public modules', () => {
    expect(publicModules).toContain('hooks/usePolicyGuard')
  })

  it.each(publicModules)('keeps the RPC error helpers and their contract ABIs out of public/%s', (file) => {
    mockHeavyModulesLoaded = []
    jest.isolateModules(() => {
      require(`../public/${file}`)
    })
    expect(mockHeavyModulesLoaded).toEqual([])
  })
})
