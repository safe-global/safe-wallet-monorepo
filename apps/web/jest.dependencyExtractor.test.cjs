const { extract } = require('./jest.dependencyExtractor.cjs')

describe('jest dependency extractor', () => {
  it('should, when a source file loads a module with import(), hide that call from the default extractor', () => {
    const defaultExtract = jest.fn(() => new Set())

    extract(
      "import { a } from './a'\nconst Lazy = dynamic(() => import('./Lazy'))",
      '/app/src/Page.tsx',
      defaultExtract,
    )

    expect(defaultExtract).toHaveBeenCalledWith(
      "import { a } from './a'\nconst Lazy = dynamic(() => lazyImport('./Lazy'))",
      '/app/src/Page.tsx',
    )
  })

  it('should, when a test file loads its subject with import(), pass the code unchanged', () => {
    const defaultExtract = jest.fn(() => new Set())

    extract("const { run } = await import('./run')", '/app/src/run.test.ts', defaultExtract)

    expect(defaultExtract).toHaveBeenCalledWith("const { run } = await import('./run')", '/app/src/run.test.ts')
  })

  it('should, when called, return the dependencies the default extractor found', () => {
    const defaultExtract = jest.fn(() => new Set(['./a']))

    const dependencies = extract("import { a } from './a'", '/app/src/Page.tsx', defaultExtract)

    expect(dependencies).toEqual(new Set(['./a']))
  })
})
