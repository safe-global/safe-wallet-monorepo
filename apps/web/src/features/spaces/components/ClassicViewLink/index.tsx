import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { ArrowRight } from 'lucide-react'
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
    <div className="mb-5 mt-2 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        data-testid="classic-view-link"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-[13px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Use the old UI
        <ArrowRight size={13} />
      </button>
    </div>
  )
}

export default ClassicViewLink
