import 'ses'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import * as jsxDevRuntime from 'react/jsx-dev-runtime'
import { ensureLockdown } from './lockdown'

type ModuleExports = Record<string, unknown>

const viewConsole = Object.freeze({
  log: (...args: unknown[]) => console.log(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug(...args),
})

const reactModules: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  'react/jsx-dev-runtime': jsxDevRuntime,
}

/**
 * Evaluates one view module (compiled to CommonJS by the view loader) in its own compartment.
 * The compartment has no host globals; its only capabilities are the modules in `dependencies`,
 * which the loader has already checked against apps/web/sandbox/policy.json.
 */
export function runView(code: string, dependencies: Record<string, unknown>, file: string): ModuleExports {
  ensureLockdown()

  const compartment = new Compartment({
    globals: { console: viewConsole, Date, Math, Intl },
    __options__: true,
  })
  const factory = compartment.evaluate(
    `(function (require) { const module = { exports: {} }; const exports = module.exports;\n${code}\nreturn module.exports })\n//# sourceURL=view:${file}`,
  )

  const require = (specifier: string) => {
    if (specifier in reactModules) return reactModules[specifier]
    if (!(specifier in dependencies))
      throw new Error(`View ${file} requires ${specifier}, which the loader did not provide`)
    return dependencies[specifier]
  }
  return factory(require) as ModuleExports
}
