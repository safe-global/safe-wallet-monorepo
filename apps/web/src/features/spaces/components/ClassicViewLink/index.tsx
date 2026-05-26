import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { Box, Link } from '@mui/material'
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
    <Box mt={2} textAlign="center">
      <Link
        component="button"
        type="button"
        onClick={onClick}
        data-testid="classic-view-link"
        underline="hover"
        sx={{ fontSize: 14 }}
      >
        View classic app
      </Link>
    </Box>
  )
}

export default ClassicViewLink
