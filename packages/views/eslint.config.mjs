import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import { builtinRules } from 'eslint/use-at-your-own-risk'
import { designSystemSyntaxRules } from './eslint-design-system.mjs'

const viewFiles = ['src/**/*.{ts,tsx}']
const nonViewFiles = ['src/components/ui/**', 'src/utils/**', 'src/hooks/**']

// The core rule under a second name, so view rules can be relaxed per file without relaxing the design-system rules.
const viewsPlugin = { rules: { 'no-restricted-syntax': builtinRules.get('no-restricted-syntax') } }

const propsOnly = 'Views only turn props into markup; pass data or callbacks in as props.'

const restrictedGlobals = [
  'window',
  'document',
  'globalThis',
  'self',
  'top',
  'parent',
  'frames',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'caches',
  'open',
  'postMessage',
  'eval',
  'Function',
].map((name) => ({ name, message: `Views must not use the \`${name}\` global. ${propsOnly}` }))

const restrictedPackages = ['@safe-global/store', '@safe-global/protocol-kit', '@safe-global/api-kit', 'ethers', 'viem']

const urlAttribute = 'JSXAttribute[name.name=/^(href|src|action|formAction|srcSet)$/]'
const absoluteUrl = '/^\\s*(https?:|\\x2F\\x2F)/i'
const urlMessage = 'Do not hard-code an absolute URL in a view; pass it in as a prop.'
const refOrEffectMessage = `Views do not use refs or effects; move that logic to the app or a components/ui primitive. ${propsOnly}`
const domMessage = `Views must not reach the document, window or prototype chain. ${propsOnly}`
const prototypeMessage = 'Views must not assign to a prototype.'
const styleUrlMessage = 'Do not load resources from a `style` prop in a view; import the asset or use a class.'

const viewSyntaxRules = [
  { selector: 'MemberExpression[property.name=/^(ownerDocument|defaultView|__proto__)$/]', message: domMessage },
  { selector: 'MemberExpression[property.value=/^(ownerDocument|defaultView|__proto__)$/]', message: domMessage },
  { selector: "AssignmentExpression > MemberExpression.left[property.name='prototype']", message: prototypeMessage },
  {
    selector: "AssignmentExpression > MemberExpression.left > MemberExpression.object[property.name='prototype']",
    message: prototypeMessage,
  },
  {
    selector: 'CallExpression[callee.name=/^(useRef|useEffect|useLayoutEffect|useImperativeHandle)$/]',
    message: refOrEffectMessage,
  },
  {
    selector: 'CallExpression[callee.property.name=/^(useRef|useEffect|useLayoutEffect|useImperativeHandle)$/]',
    message: refOrEffectMessage,
  },
  { selector: "JSXAttribute[name.name='ref']", message: refOrEffectMessage },
  { selector: `${urlAttribute} > Literal[value=${absoluteUrl}]`, message: urlMessage },
  { selector: `${urlAttribute} > JSXExpressionContainer > Literal[value=${absoluteUrl}]`, message: urlMessage },
  {
    selector: `${urlAttribute} > JSXExpressionContainer > TemplateLiteral > TemplateElement:first-child[value.raw=${absoluteUrl}]`,
    message: urlMessage,
  },
  {
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message: 'Views must not use dangerouslySetInnerHTML; render through JSX.',
  },
  { selector: "JSXAttribute[name.name='style'] Literal[value=/url\\(/i]", message: styleUrlMessage },
  { selector: "JSXAttribute[name.name='style'] TemplateElement[value.raw=/url\\(/i]", message: styleUrlMessage },
]

const viewRules = {
  'no-restricted-globals': ['error', ...restrictedGlobals],
  '@typescript-eslint/no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: restrictedPackages.flatMap((name) => [name, `${name}/*`]),
          allowTypeImports: true,
          message: `Views must not import the store, Safe SDKs or chain libraries (type imports are fine). ${propsOnly}`,
        },
      ],
    },
  ],
  'views/no-restricted-syntax': ['error', ...viewSyntaxRules],
  'no-warning-comments': ['error', { terms: ['eslint-disable', 'eslint-enable'], location: 'start' }],
}

// Existing views that predate the view rules: violations warn here so new ones still fail.
const legacyViewFiles = [
  'src/components/balances/AssetsTable/FiatChange.tsx',
  'src/components/common/AccountRow/FullAddress.tsx',
  'src/components/common/AccountRow/TruncatedText.tsx',
  'src/components/common/GradientCircularProgress/GradientCircularProgress.tsx',
  'src/components/common/PaginatedDataTable/index.tsx',
  'src/components/common/PaperViewToggle/index.tsx',
  'src/components/common/SplitMenuButton/index.tsx',
  'src/components/common/UnreadBadge/index.tsx',
  'src/components/settings/SettingsCard/index.tsx',
  'src/features/hypernative/components/HnSignupFlow/HnModal.tsx',
  'src/features/hypernative/components/HypernativeLogo/index.tsx',
  'src/features/spaces/components/Policies/PolicyIntroDialog/index.tsx',
  'src/features/spaces/components/SafeWidget/WidgetViewAll.tsx',
  'src/features/spaces/components/SpaceSettings/SpaceSettingsSection.tsx',
]

export default tseslint.config(
  { ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx', '**/__tests__/**', '**/__mocks__/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*', '@views/*'],
              message:
                'Views must not import from an app. Move what you need into @safe-global/views or pass it in as a prop.',
            },
          ],
        },
      ],
    },
  },
  {
    files: viewFiles,
    ignores: nonViewFiles,
    plugins: { views: viewsPlugin },
    linterOptions: { noInlineConfig: true },
    rules: viewRules,
  },
  {
    files: legacyViewFiles,
    linterOptions: { noInlineConfig: false },
    rules: Object.fromEntries(Object.entries(viewRules).map(([rule, [, ...options]]) => [rule, ['warn', ...options]])),
  },
)
