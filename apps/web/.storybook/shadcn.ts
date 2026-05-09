/**
 * Storybook-specific ShadcnProvider that bundles the CSS dependency.
 *
 * In production, shadcn.css is imported from _app.tsx. In Storybook, _app.tsx is
 * not part of the bundle, so we import the CSS here alongside the provider.
 *
 * NOTE: The CSS is global once loaded (webpack side-effect), but all styles are
 * scoped to .shadcn-scope via selectors, so they won't affect MUI-only stories.
 */
import '../src/styles/shadcn.css'
import './shadcn-stories.css'

export { ShadcnProvider } from '../src/components/ui/ShadcnProvider'
