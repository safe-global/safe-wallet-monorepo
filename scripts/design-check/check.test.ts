type CheckResult = { designOnly: boolean; errors: string[]; files: { file: string; kind: string; errors: string[] }[] }
type Checker = { check: (changes: { status: string; file: string }[]) => CheckResult }
// eslint-disable-next-line @typescript-eslint/no-require-imports -- check.cjs is plain CommonJS so CI can run it without a build
const { DesignChecker } = require('./check.cjs') as {
  DesignChecker: new (io: {
    readBase: (f: string) => string | undefined
    readHead: (f: string) => string | undefined
  }) => Checker
}

const FILE = 'apps/web/src/features/plans/components/PlanCard.tsx'

const BASE = `import { Button } from '@/components/ui/button'
import { useSubscribe } from '@/features/plans/hooks/useSubscribe'
import type { Plan } from '@/features/plans/types'

export const PlanCard = ({ plan, features }: { plan: Plan; features: string[] }) => {
  const { subscribe, isLoading } = useSubscribe(plan.id)

  return (
    <div className="flex flex-col gap-2 rounded-md p-4">
      <h2 className="text-lg">{plan.name}</h2>
      <p>Billed monthly</p>
      <Button variant="primary" disabled={isLoading} onClick={subscribe}>
        Subscribe
      </Button>
    </div>
  )
}
`

type Files = Record<string, string>

const run = (head: Files, base: Files = { [FILE]: BASE }) => {
  const checker = new DesignChecker({ readBase: (f: string) => base[f], readHead: (f: string) => head[f] })
  const changes = Object.keys(head)
    .map((file) => ({ status: file in base ? 'M' : 'A', file }))
    .concat(
      Object.keys(base)
        .filter((f) => !(f in head))
        .map((file) => ({ status: 'D', file })),
    )
  return checker.check(changes)
}

const edit = (replace: [string, string][]) => ({
  [FILE]: replace.reduce((src, [a, b]) => src.replace(a, b), BASE),
})

describe('design check', () => {
  describe('passes a design change that', () => {
    it('changes Tailwind classes', () => {
      expect(run(edit([['rounded-md p-4', 'rounded-2xl p-6 shadow-sm']])).errors).toEqual([])
    })

    it('changes copy and a presentational variant', () => {
      const head = edit([
        ['Billed monthly', 'Billed every month, cancel anytime'],
        ['variant="primary"', 'variant="outline"'],
      ])
      expect(run(head).errors).toEqual([])
    })

    it('wraps and reorders markup without changing the button wiring', () => {
      const head = edit([
        [
          '<h2 className="text-lg">{plan.name}</h2>\n      <p>Billed monthly</p>',
          '<header className="flex items-center gap-2">\n        <p>Billed monthly</p>\n        <h2 className="text-lg">{plan.name}</h2>\n      </header>',
        ],
      ])
      expect(run(head).errors).toEqual([])
    })

    it('adds a table that shows data the component already has', () => {
      const head = edit([
        [
          '<p>Billed monthly</p>',
          '<table className="w-full">\n        <tbody>\n          {features.map((feature) => (\n            <tr key={feature} className="hover:bg-muted">\n              <td>{feature}</td>\n            </tr>\n          ))}\n        </tbody>\n      </table>',
        ],
      ])
      expect(run(head).errors).toEqual([])
    })

    it('adds a new presentational component and renders it with existing data', () => {
      const badge = `import { cn } from '@/utils/cn'\n\nexport const PlanBadge = ({ name }: { name: string }) => <span className={cn('rounded-full px-2 text-xs')}>{name}</span>\n`
      const head = {
        ...edit([
          ['import type { Plan }', "import { PlanBadge } from './PlanBadge'\nimport type { Plan }"],
          ['<p>Billed monthly</p>', '<PlanBadge name={plan.name} />'],
        ]),
        'apps/web/src/features/plans/components/PlanBadge.tsx': badge,
      }
      expect(run(head).errors).toEqual([])
    })

    it('changes CSS tokens such as radius and font', () => {
      const css = 'apps/web/src/styles/vars.css'
      expect(
        run({ [css]: ':root { --radius: 12px; --font-sans: "Inter"; }' }, { [css]: ':root { --radius: 8px; }' }).errors,
      ).toEqual([])
    })
  })

  describe('fails a change that', () => {
    it('adds an event handler', () => {
      const head = edit([['<p>Billed monthly</p>', '<p onClick={subscribe}>Billed monthly</p>']])
      expect(run(head).errors).toEqual([`${FILE}:11 adds onClick={subscribe}`])
    })

    it('changes when the button is disabled', () => {
      const head = edit([['disabled={isLoading}', 'disabled={false}']])
      expect(run(head).errors).toEqual([
        `${FILE}:12 adds disabled={false}`,
        `${FILE} removes disabled={isLoading} (was at line 12 before)`,
      ])
    })

    it('removes the button that subscribes', () => {
      const head = edit([
        ['<Button variant="primary" disabled={isLoading} onClick={subscribe}>\n        Subscribe\n      </Button>', ''],
      ])
      expect(run(head).designOnly).toBe(false)
    })

    it('changes code outside the markup', () => {
      const head = edit([['useSubscribe(plan.id)', 'useSubscribe(plan.id, { trial: true })']])
      expect(run(head).errors).toEqual([
        `${FILE} changes code outside JSX, copy and class strings (hooks, handlers, logic or data)`,
      ])
    })

    it('renders a call result in the markup', () => {
      const head = edit([['{plan.name}', '{subscribe()}']])
      expect(run(head).errors).toContain(`${FILE}:10 adds {subscribe()}`)
    })

    it('adds a script element', () => {
      const head = edit([['<p>Billed monthly</p>', '<script src="https://example.com/x.js" />']])
      expect(run(head).designOnly).toBe(false)
    })

    it('adds a new component that reads from the store', () => {
      const file = 'apps/web/src/features/plans/components/Balance.tsx'
      const head = {
        [file]: `import { useAppSelector } from '@/store'\n\nexport const Balance = () => <span>{useAppSelector((s) => s.balance)}</span>\n`,
      }
      expect(run(head, {}).errors).toEqual([
        `${file}:1 imports "@/store", which is not a presentational module`,
        `${file}:3 calls the hook useAppSelector()`,
      ])
    })

    it('adds a new code file with a function', () => {
      const file = 'apps/web/src/features/plans/components/price.ts'
      const head = { [file]: 'export const price = (n: number) => n * 1.19\n' }
      expect(run(head, {}).designOnly).toBe(false)
    })

    it('edits a test or a hook', () => {
      const test = 'apps/web/src/features/plans/components/PlanCard.test.tsx'
      const hook = 'apps/web/src/features/plans/hooks/useSubscribe.ts'
      expect(run({ [test]: 'x', [hook]: 'y' }, { [test]: 'a', [hook]: 'b' }).files.map((f) => f.kind)).toEqual([
        'test',
        'other',
      ])
    })

    it('loads a stylesheet or image from another site', () => {
      const css = 'apps/web/src/styles/vars.css'
      expect(run({ [css]: '.x { background: url(https://example.com/a.png) }' }, { [css]: '' }).designOnly).toBe(false)
    })
  })
})
