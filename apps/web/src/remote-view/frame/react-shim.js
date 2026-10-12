// The worker build resolves `react` here (except from this file and jsx-runtime.ts), so libraries
// that call createElement directly also get remote tags.
export * from 'react'
export { default } from 'react'
export { createElement } from './jsx-runtime'
