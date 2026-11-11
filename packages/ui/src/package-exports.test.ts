import { existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const { exports } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, string>
}
const componentsDir = path.join(root, 'src/components')
const componentFiles = readdirSync(componentsDir).filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))

describe('package exports', () => {
  it.each(componentFiles)('exposes %s under its own key', (file) => {
    const key = `./${file.replace(/\.tsx?$/, '')}`
    expect(exports[key]).toBe(`./src/components/${file}`)
  })

  it.each(Object.entries(exports).filter(([key]) => !key.includes('*')))(
    '%s points at an existing file',
    (_, target) => {
      expect(existsSync(path.join(root, target))).toBe(true)
    },
  )

  it('resolves the hooks pattern', () => {
    for (const hook of ['use-mobile', 'use-tablet']) {
      expect(existsSync(path.join(root, exports['./hooks/*'].replace('*', hook)))).toBe(true)
    }
  })
})
