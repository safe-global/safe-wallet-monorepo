import type { StorybookConfig } from '@storybook/react-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * The design system's own Storybook — the surface the design team works in.
 *
 * Deliberately minimal next to apps/web's Storybook: no Next.js framework, no Redux store, no
 * MSW, no wallet or chain mocks. Nothing in this package fetches data or reads app state, so a
 * story here cannot need any of that — and keeping it out is what makes this Storybook boot in
 * seconds and show only design-system surfaces.
 *
 * If a story needs a mocked API or a Redux store, the component under test is an app component:
 * it belongs in apps/web's Storybook, not here.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-themes',
    // Lets a story embed the Figma frame it was designed from, for as long as a Figma
    // reference still exists. Storybook is the source of truth; the embed is a citation.
    '@storybook/addon-designs',
    '@storybook/addon-docs',
  ],

  core: {
    disableTelemetry: true,
  },

  framework: '@storybook/react-vite',

  viteFinal: async (config) => {
    config.plugins = config.plugins ?? []
    // Tailwind v4: required for the `@theme`/`@source`/`@apply` directives in the token layer
    // and in the one remaining CSS module. Without it every utility class silently disappears.
    config.plugins.push(tailwindcss())

    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      // Mirrors the tsconfig `paths` so stories can use the package's public specifier.
      '@safe-global/design-system': path.resolve(__dirname, '../src'),
      '@safe-global/theme': path.resolve(__dirname, '../../theme/src'),
      '@safe-global/utils': path.resolve(__dirname, '../../utils/src'),
    }
    // React must not be duplicated across the workspace symlinks — two copies break hooks and
    // the portal-container context the overlay primitives share.
    config.resolve.dedupe = [...(config.resolve.dedupe ?? []), 'react', 'react-dom']

    config.server = config.server ?? {}
    // Monorepo: sources resolve outside this package's root.
    config.server.fs = { ...config.server.fs, strict: false }

    return config
  },

  env: (config) => ({
    ...config,
    // Lets "where it's used" links in gallery stories open the app Storybook. Unset locally,
    // which makes those links inert rather than broken.
    STORYBOOK_APP_URL: process.env.STORYBOOK_APP_URL ?? '',
  }),

  typescript: {
    reactDocgen: 'react-docgen',
  },
}

export default config
