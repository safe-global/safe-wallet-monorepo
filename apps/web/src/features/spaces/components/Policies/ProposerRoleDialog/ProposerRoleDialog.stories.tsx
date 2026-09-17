import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FormProvider, useForm } from 'react-hook-form'
import { Info, WalletCards } from 'lucide-react'
import { fn } from 'storybook/test'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import AddressBookInput from '@/components/common/AddressBookInput'
import DialogActions from '@/components/common/DialogActions'
import ExternalLink from '@/components/common/ExternalLink'
import NameInput from '@/components/common/NameInput'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { createMockStory } from '@/stories/mocks'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import SafeAccountSelector from '../SafeAccountSelector'
import { buildSafeAccountId } from '../SafeAccountSelector/utils'
import type { SafeAccountEntry, SafeAccountOption } from '../SafeAccountSelector/types'
import type { ChainInfo } from '@/features/spaces/types'

const ETHEREUM = '1'

const TREASURY = '0xA77De01c5B6f829Cbe4604cF71dDc8C4d608b000'
const PROPOSER = checksumAddress('0x8675B754342754A30A2AeF474D114d8460bca19b')

const ETHEREUM_CHAIN: ChainInfo = {
  chainId: ETHEREUM,
  chainName: 'Ethereum',
  chainLogoUri: null,
  shortName: 'eth',
}

const treasury: SafeAccountOption = {
  id: buildSafeAccountId(ETHEREUM, TREASURY),
  chainId: ETHEREUM,
  address: TREASURY,
  name: 'Treasury',
  threshold: 3,
  owners: 5,
  eligibility: 'signer',
  chain: ETHEREUM_CHAIN,
  fiatTotal: '123720',
}

const accounts: SafeAccountEntry[] = [treasury]

/** Resolves the proposer address to a name in the picker, the way a saved contact does in the app. */
const addressBook = { [DEFAULT_CHAIN_ID]: { [PROPOSER]: 'Nicole' } }

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'none',
  shadcn: true,
  store: { addressBook },
})

type ProposerRoleForm = {
  proposer: string
  name: string
}

/**
 * The proposer-role setup dialog: pick the Safe Account the role applies to, pick the proposer, name
 * it. Composed from the shipped pieces — `SafeAccountSelector` for the account field and
 * `AddressBookInput`/`NameInput` for the proposer fields, as the Settings add-proposer dialog uses them.
 */
const ProposerRoleDialog = () => {
  const [safeAccount, setSafeAccount] = useState<string | undefined>(treasury.id)

  const methods = useForm<ProposerRoleForm>({
    defaultValues: { proposer: PROPOSER, name: '' },
    mode: 'onChange',
  })

  return (
    <Dialog open>
      <DialogContent padding="none" showCloseButton={false}>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(fn())}>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-background-light-hover)]">
                  <WalletCards className="size-4 text-badge-dot-success" aria-hidden />
                </div>

                <div className="flex flex-col gap-1">
                  <DialogTitle className="flex items-center gap-2.5 text-xl leading-6 font-semibold">
                    Proposer role
                    <ExternalLink
                      href={HelpCenterArticle.PROPOSERS}
                      noIcon
                      aria-label="Learn more about proposers"
                      className="flex text-muted-foreground no-underline hover:text-foreground"
                    >
                      <Info className="size-4 translate-y-px" aria-hidden />
                    </ExternalLink>
                  </DialogTitle>

                  <Typography variant="paragraph-small" color="muted">
                    Let teammates without signing rights propose transactions.
                  </Typography>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-6 px-4 pb-4">
              <Alert variant="info" className="px-3 py-3 *:data-[slot=alert-description]:text-muted-foreground">
                <AlertSeverityIcon variant="info" />
                <AlertTitle className="text-sm font-normal">
                  You are about to grant the ability to propose transactions.
                </AlertTitle>

                <AlertDescription>
                  To complete the setup, confirm with a signature from your connected wallet.
                </AlertDescription>
              </Alert>

              <SafeAccountSelector
                accounts={accounts}
                value={safeAccount}
                onChange={setSafeAccount}
                helperText={null}
              />

              <div className="flex flex-col gap-1">
                <AddressBookInput name="proposer" label="Proposer" required />

                <Typography variant="paragraph-mini" color="muted">
                  The beneficiary that will have the ability to propose transactions, publicly visible
                </Typography>
              </div>

              <NameInput
                className="gap-1"
                name="name"
                label="Proposer name"
                placeholder="Type name here"
                helperText={
                  <Typography variant="paragraph-mini" color="muted">
                    Add a nickname for your proposer, it stays private.
                  </Typography>
                }
                inputSize="hero"
              />
            </div>

            <DialogActions confirmLabel="Submit" confirmType="submit" className="p-4" />
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}

const meta = {
  title: 'Features/Spaces/Policies/ProposerRoleDialog',
  component: ProposerRoleDialog,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
  },
  decorators: [setup.decorator],
  tags: ['autodocs'],
} satisfies Meta<typeof ProposerRoleDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Default state: the Treasury account preselected and a known proposer resolved from the address book. */
export const Default: Story = {}
