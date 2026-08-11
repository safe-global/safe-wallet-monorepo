/**
 * Storybook re-export of the design system's scope provider.
 *
 * The tokens arrive via `../src/styles/globals.css` (imported in preview.tsx), which imports
 * `@safe-global/design-system/styles.css` — the same entry `_app.tsx` uses, so Storybook and
 * production load an identical token layer. Tailwind's `@source` directives in the design
 * system's tokens.css already cover both this app's tree and the package's own stories, so no
 * Storybook-only source declaration is needed.
 */
export { ShadcnProvider } from '@safe-global/design-system/components/ShadcnProvider'
