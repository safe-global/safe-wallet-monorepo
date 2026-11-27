import { useState, type ReactElement, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import { Check, Eye, Route } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { REASSURANCE, TRIAL_CTA } from './fixtures'
import { useIsPrototypeOn, useScenario } from './scenario'
import { getIntendedUrl, getShellPageKey, isWorkspacePage, PREVIEW_ROUTE, SHELL_PAGES } from './shellPages'
import { useShell } from './useShell'

const PLAN_ROWS = [
  { name: 'Free', detail: 'Your Safe Accounts, signing, assets and apps. Forever.' },
  { name: 'Starter', detail: '2 Safes in a Workspace, members, activity log, Security hub.' },
  { name: 'Business', detail: '5, 10 or 20 Safes, plus Policies and priority support.' },
  { name: 'Enterprise', detail: 'More than 20 Safes, a named contact and custom terms.' },
]

const Note = ({ icon, children }: { icon: ReactNode; children: ReactNode }): ReactElement => (
  <Card>
    <CardContent>
      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <p>{children}</p>
      </div>
    </CardContent>
  </Card>
)

/** Stands in for a page the prototype can't show: a locked item, a page with no route yet, or one that needs sign-in. */
export const ProPreview = (): ReactElement => {
  const { pathname, query } = useRouter()
  const isOn = useIsPrototypeOn()
  const [, update] = useScenario()
  const shell = useShell()
  const [isRequested, setIsRequested] = useState(false)
  const key = getShellPageKey(pathname, query.feature)

  if (!isOn) {
    return (
      <main className="p-8">
        This design prototype opens with <code>?proto=sidebar</code> in preview builds only.
      </main>
    )
  }
  if (!key) return <main className="p-8">This preview doesn&apos;t exist.</main>

  const page = SHELL_PAGES[key]
  const link = shell.getLink(key)
  const isLocked = link.kind === 'preview'
  const safeName = shell.pickedSafe?.name ?? shell.workspace.safes[0]?.name ?? 'your Safe'
  const intendedUrl = getIntendedUrl(key, shell)
  const filter =
    page.scope === 'workspaceOnly'
      ? 'Not filtered by Safe'
      : page.scope === 'ignores'
        ? 'Same contacts for every Safe'
        : `Filter: ${shell.pickedSafe?.name ?? 'All Safes'}`

  const cta =
    shell.role === 'admin' ? (
      <Button onClick={() => update({ plan: 'trial', context: 'workspace' })} data-testid="unified-trial-start">
        {TRIAL_CTA}
      </Button>
    ) : (
      <Button variant="outline" onClick={() => setIsRequested(true)} disabled={isRequested}>
        {isRequested ? 'We let your admins know' : 'Ask an admin to start a free trial'}
      </Button>
    )

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10" data-testid="unified-stand-in">
      <header className="flex flex-col gap-2">
        <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <page.icon className="size-4" />
          {isWorkspacePage(page) ? 'Workspace' : shell.workspace.name}
          {isLocked && (
            <span className="block h-4 w-7" role="img" aria-label="Safe Pro">
              <ProChip className="size-full" />
            </span>
          )}
          {shell.scenario.layout === 'filter' && <Badge variant="outline">{filter}</Badge>}
        </span>
        <h1 className="text-2xl font-bold">{page.label}</h1>
        {page.what && <p className="text-muted-foreground">{page.what}</p>}
      </header>

      {isLocked ? (
        <>
          {page.example && (
            <Card>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold">For example</p>
                  <p>{page.example(safeName)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {key === 'plan' ? (
            <Card>
              <CardContent>
                <ul className="flex flex-col divide-y divide-border">
                  {PLAN_ROWS.map((row) => (
                    <li key={row.name} className="flex flex-col gap-0.5 py-2">
                      <span className="font-semibold">{row.name}</span>
                      <span className="text-sm text-muted-foreground">{row.detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            page.preview && (
              <Card aria-label={`Read-only preview of ${page.label}`}>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="size-4" aria-hidden /> Preview, read only
                    </p>
                    <ul className="flex flex-col gap-2">
                      {page.preview.map((line) => (
                        <li key={line} className="flex items-center gap-3 rounded-md bg-muted p-3 text-sm">
                          <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )
          )}

          <div className="flex flex-col items-start gap-2">
            {cta}
            <p className="text-sm font-semibold">{REASSURANCE}</p>
          </div>
        </>
      ) : link.kind === 'placeholder' ? (
        <Note icon={<Route className="size-4" aria-hidden />}>
          This page isn&apos;t built yet, so the prototype stops here. Proposed address, for developers to confirm:{' '}
          <code>{intendedUrl}</code>
        </Note>
      ) : (
        <Note icon={<Check className="size-4 text-green-500" aria-hidden />}>
          {pathname === PREVIEW_ROUTE ? 'Included in your plan. ' : ''}In the app this is <code>{intendedUrl}</code>,
          which needs sign-in, so the prototype stops here.
          {shell.safe && page.scope === 'workspace'
            ? ' The Safe filter on a Workspace address is new, for developers to confirm.'
            : ''}
        </Note>
      )}
    </main>
  )
}
