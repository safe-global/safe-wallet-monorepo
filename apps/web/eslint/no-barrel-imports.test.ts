/**
 * @jest-environment node
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { RuleTester, type Rule } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import noBarrelImports from '../../../packages/views/eslint-no-barrel-imports.mjs'

const rule = noBarrelImports.rules['no-barrel-imports'] as Rule.RuleModule
const fixtureDirs: string[] = []

const fixture = (files: Record<string, string>): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-barrel-imports-'))
  fixtureDirs.push(dir)
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    fs.writeFileSync(path.join(dir, file), content)
  }
  return dir
}

const importing = (name: string, code: string, files: Record<string, string>, ignore: string[] = []) => {
  const dir = fixture(files)
  return {
    name,
    code,
    filename: path.join(dir, 'consumer.ts'),
    options: [{ aliases: { '@/': dir + path.sep }, ignore }],
  }
}

const barrel = { messageId: 'barrel' }

afterAll(() => {
  for (const dir of fixtureDirs) fs.rmSync(dir, { recursive: true, force: true })
})

new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
}).run('no-barrel-imports', rule, {
  valid: [
    importing("allows a name the target declares with 'export const'", "import { value } from './values'", {
      'values.ts': 'export const value = 1',
    }),
    importing("allows a name the target declares with 'export function'", "import { helper } from './helper'", {
      'helper.ts': 'export function helper() {}\nexport { other } from "./other"',
    }),
    importing("allows the default export the target declares with 'export default'", "import Card from './Card'", {
      'Card.tsx': 'export default function Card() { return null }\nexport { other } from "./other"',
    }),
    importing('allows a name the target re-exports from an npm package', "import { render } from './test-utils'", {
      'test-utils.ts': "export { render } from '@testing-library/react'",
    }),
    importing(
      "allows a feature index to re-export from its own 'components' folder",
      "import { Banner } from './src/features/foo'",
      {
        'src/features/foo/index.ts': "export { Banner } from './components/Banner'",
        'src/features/foo/components/Banner.tsx': 'export const Banner = () => null',
      },
    ),
    importing('allows a namespace import of a barrel', "import * as utils from './utils'", {
      'utils/index.ts': "export { format } from './format'",
      'utils/format.ts': 'export const format = () => ""',
    }),
    importing(
      "allows a barrel whose specifier starts with an 'ignore' prefix",
      "import { Safe } from '@/generated/types'",
      {
        'generated/types/index.ts': "export { Safe } from './Safe'",
        'generated/types/Safe.ts': 'export type Safe = string',
      },
      ['@/generated'],
    ),
  ],
  invalid: [
    {
      ...importing(
        "reports a name the target only re-exports with 'export { x } from'",
        "import { x } from './barrel'",
        {
          'barrel.ts': "export { x } from './x'",
          'x.ts': 'export const x = 1',
        },
      ),
      errors: [barrel],
    },
    {
      ...importing('reports a name the target imports and then re-exports', "import { x } from './barrel'", {
        'barrel.ts': "import { x } from './x'\nexport { x }",
        'x.ts': 'export const x = 1',
      }),
      errors: [barrel],
    },
    {
      ...importing(
        "reports a name that reaches the target through a local 'export *'",
        "import { a } from './barrel'",
        {
          'barrel.ts': "export * from './a'",
          'a.ts': 'export const a = 1',
        },
      ),
      errors: [barrel],
    },
    {
      ...importing(
        "reports a feature index re-exporting from outside its 'components' folder",
        "import { useX } from './src/features/foo'",
        {
          'src/features/foo/index.ts': "export { useX } from './hooks/useX'",
          'src/features/foo/hooks/useX.ts': 'export const useX = () => null',
        },
      ),
      errors: [barrel],
    },
    {
      ...importing('reports a default import the target re-exports as default', "import Card from './cards'", {
        'cards/index.ts': "export { default } from './Card'",
        'cards/Card.tsx': 'export default function Card() { return null }',
      }),
      errors: [barrel],
    },
    {
      ...importing('reports a barrel imported through an alias', "import { bar } from '@/foo/bar'", {
        'foo/bar.ts': "export { bar } from './impl'",
        'foo/impl.ts': 'export const bar = 1',
      }),
      errors: [barrel],
    },
  ],
})
