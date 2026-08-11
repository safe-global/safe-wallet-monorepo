import { RuleTester } from 'eslint'
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS guard module, see rules.cjs
const { designSystemRestrictedSyntax } = require('./rules.cjs')
// eslint-disable-next-line @typescript-eslint/no-require-imports -- the built-in rule under test
const { builtinRules } = require('eslint/use-at-your-own-risk')
import tsParser from '@typescript-eslint/parser'

/**
 * These guards are AST selectors written as strings. Nothing type-checks them, and a selector that
 * stops matching fails *silently* — the lint run goes green and the rule is simply gone. That is
 * the failure this file exists to catch: each guard must still flag a violation, and must still let
 * a layout-only `className` through.
 *
 * If you add a guard to rules.cjs, add a case here. A guard with no test is a guard that can
 * quietly stop working.
 */

type RestrictedSyntaxEntry = { selector: string; message: string }

const entries = designSystemRestrictedSyntax as RestrictedSyntaxEntry[]

/** The entry guarding a given JSX element name — throws loudly if a guard is removed. */
const guardFor = (element: string): RestrictedSyntaxEntry => {
  const match = entries.find((entry) => entry.selector.includes(`name.name='${element}'`))
  if (!match) throw new Error(`no design-system guard found for <${element}>`)
  return match
}

/**
 * One case per guard family: a `className` that re-declares what a prop owns (must be flagged),
 * and the prop-driven equivalents plus layout-only `className` (must pass).
 */
const CASES: { element: string; invalid: string; valid: string[] }[] = [
  {
    element: 'Button',
    invalid: '<Button className="h-12 px-8">Save</Button>',
    valid: ['<Button size="xl" className="w-full">Save</Button>', '<Button variant="outline">Cancel</Button>'],
  },
  {
    element: 'SubmitButton',
    invalid: '<SubmitButton className="bg-primary">Save</SubmitButton>',
    valid: ['<SubmitButton fullWidth>Save</SubmitButton>'],
  },
  {
    element: 'SelectTrigger',
    invalid: '<SelectTrigger className="h-10 rounded-lg" />',
    valid: ['<SelectTrigger size="lg" className="w-40" />'],
  },
  {
    element: 'Card',
    invalid: '<Card className="p-6 shadow-lg">body</Card>',
    valid: ['<Card size="lg" variant="outlined" className="mt-4 w-full">body</Card>'],
  },
  {
    element: 'Input',
    invalid: '<Input className="h-11 border bg-white" />',
    valid: ['<Input inputSize="lg" className="w-64" />'],
  },
  {
    element: 'TabsList',
    invalid: '<TabsList className="gap-4 bg-muted p-1" />',
    valid: ['<TabsList variant="toggle" className="w-full" />'],
  },
  {
    element: 'Badge',
    invalid: '<Badge className="px-3 text-[10px]">New</Badge>',
    valid: ['<Badge variant="success" size="sm">New</Badge>'],
  },
  {
    element: 'DialogContent',
    invalid: '<DialogContent className="max-w-lg p-8">body</DialogContent>',
    valid: ['<DialogContent size="lg" className="max-h-[80vh] overflow-y-auto">body</DialogContent>'],
  },
  {
    element: 'Chip',
    invalid: '<Chip className="rounded-full bg-muted">Owner</Chip>',
    valid: ['<Chip variant="outline" shape="tag">Owner</Chip>'],
  },
]

/** Guards are matched inside `cn(...)` too — that is the loophole the selector deliberately closes. */
const INSIDE_CN = '<Button className={cn("h-12", isWide && "w-full")}>Save</Button>'

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 'latest', sourceType: 'module' },
  },
})

// RuleTester.run registers its own describe/it blocks, so it has to be called at suite level
// rather than inside a test.
ruleTester.run('design-system: no styling className on primitives', builtinRules.get('no-restricted-syntax'), {
  valid: CASES.flatMap(({ element, valid }) => valid.map((code) => ({ code, options: [guardFor(element)] }))),
  invalid: [
    ...CASES.map(({ element, invalid }) => {
      const guard = guardFor(element)
      return { code: invalid, options: [guard], errors: [{ message: guard.message }] }
    }),
    { code: INSIDE_CN, options: [guardFor('Button')], errors: [{ message: guardFor('Button').message }] },
  ],
})

describe('design-system lint guard inventory', () => {
  it('covers every element family the design system documents', () => {
    // The families above plus the slot and preset variants they expand into.
    expect(entries.length).toBeGreaterThanOrEqual(30)
    expect(entries.every((entry) => entry.selector.length > 0 && entry.message.length > 0)).toBe(true)
  })

  it('points every message at the design system, not at an app path', () => {
    // A rule message is the only documentation a developer sees at the moment they break the rule.
    // After the move out of apps/web, an `apps/web/...` pointer would send them to a dead path.
    const stale = entries.filter((entry) => /apps\/web|\.storybook\/AGENTS\.md|components\/ui\//.test(entry.message))

    expect(stale.map((entry) => entry.message)).toEqual([])
  })

  it('guards each closed preset as well as the primitive it wraps', () => {
    // The presets are the anti-drift layer; a guard missing here is how a preset starts taking
    // styling className again.
    for (const preset of ['SubmitButton', 'ActionButton', 'IconAction', 'SearchInput', 'SettingsCard', 'TxCard']) {
      expect(() => guardFor(preset)).not.toThrow()
    }
  })
})
