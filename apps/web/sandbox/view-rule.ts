import path from 'node:path'
import policy from './policy.json' with { type: 'json' }

const VIEW_SRC = path.resolve(import.meta.dirname, '../../../packages/views/src')
const TRUSTED = new Set(policy.trusted.map((file) => path.join(VIEW_SRC, file)))

/** Bundler rule that sends every view module of @safe-global/views, except the trusted ones, through the view loader. */
const viewRule = {
  test: /\.tsx?$/,
  include: [VIEW_SRC],
  exclude: [
    /\.(test|stories|spec)\.tsx?$|__tests__|__mocks__/,
    (file: string) => TRUSTED.has(file.replace(/\.tsx?$/, '')),
  ],
  enforce: 'pre' as const,
  use: [{ loader: path.resolve(import.meta.dirname, 'view-loader.ts') }],
}

export default viewRule
