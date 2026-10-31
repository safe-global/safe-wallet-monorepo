import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Check, Eye } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { getMockSafes, getActiveSummary, getSafeName, REASSURANCE, TRIAL_CTA } from './fixtures'
import { getProItem } from './proItems'
import { useIsPrototypeOn, useScenario } from './scenario'

const PLAN_ROWS = [
  { name: 'Free', detail: 'Your Safe Accounts, signing, assets and apps. Forever.' },
  { name: 'Starter', detail: '2 Safes in a Workspace, members, activity log, Security Hub.' },
  { name: 'Business', detail: '5, 10 or 20 Safes, plus Policies and priority support.' },
  { name: 'Enterprise', detail: 'More than 20 Safes, a named contact and custom terms.' },
]

/** Read-only page a Pro sidebar item opens in the prototype, so a tap never lands on a dead item. */
export const ProPreview = (): ReactElement => {
  const { query } = useRouter()
  const isOn = useIsPrototypeOn()
  const [scenario, update] = useScenario()
  const [isRequested, setIsRequested] = useState(false)
  const safe = useSafeQueryParam() || undefined
  const item = getProItem(typeof query.feature === 'string' ? query.feature : undefined)

  if (!isOn) {
    return (
      <main className="p-8">
        This design prototype opens with <code>?proto=sidebar</code> in preview builds only.
      </main>
    )
  }
  if (!item) return <main className="p-8">This preview doesn&apos;t exist.</main>

  const summary = getActiveSummary(scenario)
  const safeName = getSafeName(safe)
  const otherSafeName = getMockSafes(scenario.safes).find((s) => s.name !== safeName)?.name ?? 'your next Safe'
  const isPlan = item.key === 'plan'
  const isIncluded = summary.hasPro && !isPlan

  const cta =
    scenario.role === 'admin' ? (
      <Button onClick={() => update({ plan: 'trial', context: 'workspace' })}>{TRIAL_CTA}</Button>
    ) : (
      <Button variant="outline" onClick={() => setIsRequested(true)} disabled={isRequested}>
        {isRequested ? 'We let your admins know' : 'Ask an admin to start a free trial'}
      </Button>
    )

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-10" data-testid="unified-pro-preview">
      <header className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <item.icon className="size-4" />
          {isPlan ? 'Workspace' : 'Safe Pro'}
          {!isPlan && (
            <span className="block h-4 w-7" aria-hidden>
              <ProChip className="size-full" />
            </span>
          )}
        </span>
        <h1 className="text-2xl font-bold">{item.label}</h1>
        <p className="text-muted-foreground">{item.what}</p>
      </header>

      {isIncluded ? (
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 font-semibold text-green-500">
                <Check className="size-4" aria-hidden /> Included in your plan
              </p>
              <p className="text-sm text-muted-foreground">
                In the app this item opens <code>{item.route}</code>, which needs sign-in, so the prototype stops here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">For example</p>
                <p>{item.example(safeName, otherSafeName)}</p>
              </div>
            </CardContent>
          </Card>

          {isPlan ? (
            <Card>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{summary.detail}</p>
                  <ul className="flex flex-col divide-y divide-border">
                    {PLAN_ROWS.map((row) => (
                      <li key={row.name} className="flex flex-col gap-0.5 py-2">
                        <span className="font-semibold">{row.name}</span>
                        <span className="text-sm text-muted-foreground">{row.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card aria-label={`Read-only preview of ${item.label}`}>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="size-4" aria-hidden /> Preview, read only
                  </p>
                  <ul className="flex flex-col gap-2">
                    {item.preview.map((line) => (
                      <li key={line} className="flex items-center gap-3 rounded-md bg-muted p-3 text-sm">
                        <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {(!summary.hasPro || isPlan) && (
            <div className="flex flex-col items-start gap-2">
              {!summary.hasPro ? cta : <p className="text-sm">{summary.label}</p>}
              <p className="text-sm font-semibold">{REASSURANCE}</p>
            </div>
          )}
        </>
      )}
    </main>
  )
}
