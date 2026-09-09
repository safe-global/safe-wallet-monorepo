import { useCallback, useState, type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import PolicyCatalogue from './PolicyCatalogue'
import type { PolicyCatalogueId } from './PolicyCatalogue/catalogue'
import SpendingLimitIntroDialog from './SpendingLimitIntroDialog'
import { SPENDING_LIMIT_INTRO_SEEN_KEY } from './SpendingLimitIntroDialog/constants'

const Policies = (): ReactElement => {
  const [hasSeenSpendingLimitIntro = false, setHasSeenSpendingLimitIntro] =
    useLocalStorage<boolean>(SPENDING_LIMIT_INTRO_SEEN_KEY)
  const [isSpendingLimitIntroOpen, setIsSpendingLimitIntroOpen] = useState(false)

  const startSpendingLimitFlow = useCallback(() => {
    // TODO(WA-3150): open the spending limit create form.
  }, [])

  const handleSelect = useCallback(
    (id: PolicyCatalogueId) => {
      // TODO(WA-3138, WA-3160): open the proposer form and the Suggest a policy dialog.
      if (id !== 'spending-limit') return

      // The intro explains what a spending limit is, so it is worth reading once: later entries
      // go straight to the flow.
      if (hasSeenSpendingLimitIntro) {
        startSpendingLimitFlow()
        return
      }

      setIsSpendingLimitIntroOpen(true)
    },
    [hasSeenSpendingLimitIntro, startSpendingLimitFlow],
  )

  // Any dismissal counts as shown — an explainer that returns after the user closed it reads as
  // a bug, and the help link in its title is there for a second look.
  const closeSpendingLimitIntro = useCallback(() => {
    setIsSpendingLimitIntroOpen(false)
    setHasSeenSpendingLimitIntro(true)
  }, [setHasSeenSpendingLimitIntro])

  const proceedToSpendingLimitFlow = useCallback(() => {
    closeSpendingLimitIntro()
    startSpendingLimitFlow()
  }, [closeSpendingLimitIntro, startSpendingLimitFlow])

  return (
    <div data-testid="policies">
      <div className="mb-6 flex flex-col gap-6">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Policies
        </Typography>

        <Typography variant="paragraph-medium">
          Policies are rules that help you manage your Safe accounts. Set them up once and they will run onchain,
          automatically.{' '}
          <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.POLICIES}>
            Learn more
          </ExternalLink>
        </Typography>
      </div>

      <PolicyCatalogue onSelect={handleSelect} />

      <SpendingLimitIntroDialog
        open={isSpendingLimitIntroOpen}
        onOpenChange={(open) => {
          if (!open) closeSpendingLimitIntro()
        }}
        onProceed={proceedToSpendingLimitFlow}
      />
    </div>
  )
}

export default Policies
