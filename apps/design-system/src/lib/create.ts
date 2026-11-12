import { importPath } from './import-path.ts'
import type { Layer } from './types.ts'

export type Framework = 'vite' | 'next'
export type InstallPath = 'npm' | 'registry'

export const FRAMEWORKS: Array<{ value: Framework; label: string; description: string }> = [
  { value: 'vite', label: 'Vite', description: 'React + TypeScript single-page app' },
  { value: 'next', label: 'Next.js', description: 'App Router with Tailwind CSS' },
]

export const NPM_NOT_PUBLISHED =
  'The package is not published to npm yet; inside the monorepo it is the workspace @safe-global/ui.'

export const INSTALL_PATHS: Array<{ value: InstallPath; label: string; description: string }> = [
  { value: 'npm', label: 'npm package', description: 'Import from @safe-global/ui and upgrade with the package' },
  { value: 'registry', label: 'shadcn registry', description: 'Copy the source into your app and own it' },
]

export const PRESETS: Record<string, string[]> = {
  Forms: [
    'button',
    'checkbox',
    'combobox',
    'field',
    'input',
    'input-group',
    'input-otp',
    'label',
    'radio-group',
    'select',
    'slider',
    'switch',
    'textarea',
  ],
  Overlays: [
    'alert-dialog',
    'context-menu',
    'dialog',
    'drawer',
    'dropdown-menu',
    'hover-card',
    'popover',
    'sheet',
    'sonner',
    'tooltip',
  ],
  Navigation: ['breadcrumb', 'link', 'navigation-menu', 'pagination', 'sidebar', 'tabs'],
  'Data display': [
    'avatar',
    'badge',
    'card',
    'chip',
    'empty',
    'kbd',
    'list',
    'progress',
    'separator',
    'skeleton',
    'table',
    'typography',
  ],
}

export interface CreateOptions {
  framework: Framework
  installPath: InstallPath
  components: string[]
  /** `{name}` URL template of the Safe registry */
  registryUrl: string
  /** Component name → its exported names, for the npm import lines */
  exportsByComponent: Record<string, string[]>
  /** Component name → its layer, for the npm import paths */
  layerByComponent: Record<string, Layer>
  projectName?: string
}

export interface OutputBlock {
  id: string
  title: string
  lang: 'bash' | 'css' | 'json' | 'ts' | 'tsx'
  code: string
}

const cssFile = (framework: Framework) => (framework === 'vite' ? 'src/index.css' : 'src/app/globals.css')

const sourceLine = (framework: Framework) =>
  `@source '${framework === 'vite' ? '../' : '../../'}node_modules/@safe-global/ui/src';`

const createCommand = (framework: Framework, name: string) =>
  framework === 'vite'
    ? [
        `npm create vite@latest ${name} -- --template react-ts`,
        `cd ${name}`,
        'npm install tailwindcss @tailwindcss/vite',
      ].join('\n')
    : [`npx create-next-app@latest ${name} --typescript --tailwind --app --src-dir`, `cd ${name}`].join('\n')

const viteConfig = (withAlias: boolean) =>
  [
    ...(withAlias ? ["import path from 'node:path'"] : []),
    "import { defineConfig } from 'vite'",
    "import react from '@vitejs/plugin-react'",
    "import tailwindcss from '@tailwindcss/vite'",
    '',
    'export default defineConfig({',
    '  plugins: [react(), tailwindcss()],',
    ...(withAlias ? ["  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },"] : []),
    '})',
  ].join('\n')

export const componentsJson = (framework: Framework, registryUrl: string): string =>
  JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'base-vega',
      rsc: framework === 'next',
      tsx: true,
      tailwind: { config: '', css: cssFile(framework), baseColor: 'neutral', cssVariables: true, prefix: '' },
      iconLibrary: 'lucide',
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
      registries: { '@safe': registryUrl },
    },
    null,
    2,
  )

export const buildCreateOutput = ({
  framework,
  installPath,
  components,
  registryUrl,
  exportsByComponent,
  layerByComponent,
  projectName = 'my-safe-app',
}: CreateOptions): OutputBlock[] => {
  const selected = [...components].sort()
  const blocks: OutputBlock[] = [
    { id: 'create', title: 'Create the app', lang: 'bash', code: createCommand(framework, projectName) },
  ]
  if (framework === 'vite') {
    blocks.push({
      id: 'vite-config',
      title: 'vite.config.ts',
      lang: 'ts',
      code: viteConfig(installPath === 'registry'),
    })
  }

  if (installPath === 'npm') {
    blocks.push({ id: 'install', title: 'Install Safe UI', lang: 'bash', code: 'npm install @safe-global/ui' })
    blocks.push({
      id: 'css',
      title: cssFile(framework),
      lang: 'css',
      code: ["@import 'tailwindcss';", "@import '@safe-global/ui/styles.css';", sourceLine(framework)].join('\n'),
    })
    if (framework === 'next') {
      blocks.push({
        id: 'next-config',
        title: 'next.config.ts',
        lang: 'ts',
        code: [
          "import type { NextConfig } from 'next'",
          '',
          "const config: NextConfig = { transpilePackages: ['@safe-global/ui'] }",
          '',
          'export default config',
        ].join('\n'),
      })
    }
    blocks.push({
      id: 'usage',
      title: 'Import components',
      lang: 'tsx',
      code: selected.length
        ? selected
            .map(
              (name) =>
                `import { ${(exportsByComponent[name] ?? []).join(', ')} } from '${importPath(name, layerByComponent[name])}'`,
            )
            .join('\n')
        : '// Pick components above to see their imports',
    })
    return blocks
  }

  if (framework === 'vite') {
    blocks.push({
      id: 'css',
      title: `${cssFile(framework)} (replace its contents)`,
      lang: 'css',
      code: "@import 'tailwindcss';",
    })
    const paths = JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }, null, 2)
    blocks.push({ id: 'tsconfig', title: 'tsconfig.json (add compilerOptions)', lang: 'json', code: paths })
    blocks.push({ id: 'tsconfig-app', title: 'tsconfig.app.json (add to compilerOptions)', lang: 'json', code: paths })
  }
  blocks.push({
    id: 'components-json',
    title: 'components.json',
    lang: 'json',
    code: componentsJson(framework, registryUrl),
  })
  blocks.push({
    id: 'add',
    title: 'Add the theme and components',
    lang: 'bash',
    code: `npx shadcn@latest add ${['theme', ...selected].map((name) => `@safe/${name}`).join(' ')}`,
  })
  return blocks
}
