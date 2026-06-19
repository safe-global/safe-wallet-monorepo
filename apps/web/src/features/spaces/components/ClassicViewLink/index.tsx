import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { History } from 'lucide-react'
import { enableClassicView } from '@/hooks/useClassicView'
import { AppRoutes } from '@/config/routes'
import { parseNextUrlForRouter } from '@/utils/nextUrl'

/**
 * Escape-hatch link shown under the sign-in card on /welcome/spaces.
 *
 * Opting in does two things: it disables the require-login gate for the rest
 * of the tab session (so subsequent navigations don't bounce back here), and
 * it sends the user to whichever URL originally brought them to the gate. If
 * no `next` was preserved we fall back to /welcome/accounts — never `/` or
 * `/welcome/spaces`, both of which would loop the user straight back here.
 */
const ClassicViewLink = () => {
  const router = useRouter()

  const onClick = useCallback(() => {
    const next = parseNextUrlForRouter(router.query.next) ?? { pathname: AppRoutes.welcome.accounts }
    enableClassicView()
    router.replace(next)
  }, [router])

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onClick}
        data-testid="classic-view-link"
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-border bg-card px-4 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <History size={18} />
        Use the old UI
      </button>
    </div>
  )
}

export default ClassicViewLink
