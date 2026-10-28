import { useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FormProvider, useForm } from 'react-hook-form'
import type { DropzoneRootProps } from 'react-dropzone'
import { createMockStory } from '@/stories/mocks'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import NameInput from '@/components/common/NameInput'
import AddressInput from '@/components/common/AddressInput'
import NetworkSelector from '@/components/common/NetworkSelector'
import { SimilarAddressNotice, SimilarAddressTooltip } from '@/components/common/SimilarAddressNotice'
import SimilarityConfirmDialog from '@/components/common/TrustedSafesModal/SimilarityConfirmDialog'
import SelectAllConfirmDialog from '@/components/common/TrustedSafesModal/SelectAllConfirmDialog'
import { CardStepper } from '@/components/new-safe/CardStepper'
import type { StepRenderProps, TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import { LoadSafeSteps, loadSafeDefaultData, type LoadSafeFormData } from '@/components/new-safe/load'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import importCss from '@/components/address-book/ImportDialog/styles.module.css'
import { useCurrentChain } from '@/hooks/useChains'
import { LOAD_SAFE_CATEGORY } from '@/services/analytics'
import { BRAND_NAME } from '@/config/constants'
import FileUpload, { FileTypes, type FileInfo } from '@safe-global/views/components/common/FileUpload'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { largeFormFieldSurfaceClassName } from '@safe-global/views/components/common/formFieldStyles'
import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import { HelpCenterArticle, PRIVACY_URL, TERMS_URL } from '@safe-global/utils/config/constants'

const ADDRESSES = {
  treasury: '0x7a3F9effb3CBa71e009951eDcA8008bFb52B9C2E',
  treasuryLookalike: '0x7A3F2aaF834BE71EcD2d5180e017218939e49C2E',
  vendorLookalike: '0x4b8D483068ec1A31B550b53E7d6201332Cac21a0',
  payrollLookalike: '0xc5E28161073aFC4eB60139949EE86F07679c07fd',
  safe: '0x5aFe3CbE842b62fc2C649F8171d06b415dA9B3c1',
  safeLookalike: '0x5AFE5e449B3D1a52475ebfebEB766674E100B3C1',
}

const noop = () => {}

type SavedAddress = { name: string; address: string }

const TREASURY: SavedAddress = { name: 'Treasury', address: ADDRESSES.treasury }

const EntryDialogPrototype = ({ address, similarTo }: { address: string; similarTo: SavedAddress }): ReactElement => {
  const chain = useCurrentChain()
  const [showConfirm, setShowConfirm] = useState(false)
  const methods = useForm({ defaultValues: { name: 'Treasury ops', address }, mode: 'onChange' })

  return (
    <ModalDialog open onClose={noop} dialogTitle="Create entry">
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setShowConfirm(true)
          }}
        >
          <div className="p-6">
            <div className="mb-4">
              <NameInput label="Name" name="name" required inputSize="hero" />
            </div>

            <AddressInput name="address" label="Address" variant="outlined" fullWidth required chain={chain} />

            <div className="mt-4">
              <SimilarAddressNotice>
                This address is similar to{' '}
                <SimilarAddressTooltip
                  name={similarTo.name}
                  savedAddress={similarTo.address}
                  enteredAddress={address}
                />{' '}
                in your address book.
              </SimilarAddressNotice>
            </div>
          </div>

          <DialogActions onCancel={noop} confirmLabel="Save" confirmType="submit" className="p-6 pt-2" />
        </form>
      </FormProvider>

      <SimilarityConfirmDialog
        open={showConfirm}
        safe={{ address }}
        description="This address is similar to an address in your address book. This could indicate an address poisoning attack."
        addressLabel="Address"
        hint="Verify the full address carefully. Continue only if you recognize this address."
        onConfirm={() => setShowConfirm(false)}
        onCancel={() => setShowConfirm(false)}
      />
    </ModalDialog>
  )
}

const CSV_ENTRY_COUNT = 42

const FLAGGED_CSV_ENTRIES = [
  { address: ADDRESSES.vendorLookalike, name: 'Vendor A' },
  { address: ADDRESSES.payrollLookalike, name: 'Payroll' },
  { address: '0x6E54912FF1F763f537ab7880Ba3e025F8cceD894', name: 'Exchange deposit' },
  { address: '0x87B2C99D5DEB8f4aa9BFb25858c38dB77f8f6245', name: 'Market maker' },
  { address: '0x0B11290b33917Cc79212C8B3c6eD77E8E564F16a', name: 'Grant recipient' },
  { address: '0x4EdECFA23BbAB844499975a3091013E8cdd02760', name: 'Auditor' },
  { address: '0xf8176E870e52FFD86e35B5dCAC64569Ff6D2574f', name: 'Ops wallet' },
  { address: '0xa81772764892D4a1674B46b3A165e2872C4e0c88', name: 'Treasury 2' },
]

const getRootProps = <T extends DropzoneRootProps>(props?: T): T => ({ ...props }) as T

const ImportDialogPrototype = (): ReactElement => {
  const [showConfirm, setShowConfirm] = useState(false)

  const fileInfo: FileInfo = {
    name: 'address-book.csv',
    additionalInfo: '2.1 KB',
    summary: [<Typography key="summary">{`Found ${CSV_ENTRY_COUNT} entries on 3 chains`}</Typography>],
  }

  return (
    <ModalDialog open onClose={noop} dialogTitle="Import address book" hideChainIndicator>
      <div className="px-6 py-5">
        <FileUpload fileInfo={fileInfo} fileType={FileTypes.CSV} getRootProps={getRootProps} onRemove={noop} />

        <div className="mt-4">
          <SimilarAddressNotice>
            {FLAGGED_CSV_ENTRIES.length} addresses in this file are similar to addresses in your address book.
          </SimilarAddressNotice>
        </div>

        <div className={importCss.horizontalDivider} />

        <Typography>
          Only CSV files exported from a {BRAND_NAME} can be imported.
          <br />
          <ExternalLink
            href={HelpCenterArticle.ADDRESS_BOOK_DATA}
            title="Learn about the address book import and export"
          >
            Learn about the address book import and export
          </ExternalLink>
        </Typography>
      </div>

      <DialogActions
        className="p-6 pt-2"
        onCancel={noop}
        confirmLabel="Import"
        onConfirm={() => setShowConfirm(true)}
      />

      <SelectAllConfirmDialog
        open={showConfirm}
        similarAddresses={FLAGGED_CSV_ENTRIES}
        description={`${FLAGGED_CSV_ENTRIES.length} addresses in this file closely resemble addresses in your address book. Review them carefully before continuing.`}
        question="Do you want to import these addresses?"
        confirmLabel="Yes, import them anyway"
        onConfirm={() => setShowConfirm(false)}
        onSkip={() => setShowConfirm(false)}
        onCancel={() => setShowConfirm(false)}
      />
    </ModalDialog>
  )
}

const SetAddressStepPrototype = ({ data, onBack }: StepRenderProps<LoadSafeFormData>): ReactElement => {
  const [showConfirm, setShowConfirm] = useState(false)
  const methods = useForm({ mode: 'all', defaultValues: { name: data.name, address: data.address } })

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => setShowConfirm(true))}>
        <div className={layoutCss.row}>
          <div className="mb-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
              <div className="order-last md:order-first">
                <NameInput
                  name="name"
                  label="Name"
                  placeholder="Treasury Safe 2"
                  InputLabelProps={{ shrink: true }}
                  inputSize="hero"
                  variant="surface"
                />
              </div>
              <div className="order-first w-full md:order-last md:w-[220px]">
                <NetworkSelector triggerClassName={`${largeFormFieldSurfaceClassName} w-full`} />
              </div>
            </div>

            <AddressInput label="Safe account" name="address" />

            <SimilarAddressNotice>
              This Safe account is similar to{' '}
              <SimilarAddressTooltip name="Treasury Safe" savedAddress={ADDRESSES.safe} enteredAddress={data.address} />{' '}
              in your accounts.
            </SimilarAddressNotice>
          </div>

          <Typography className="mt-8 block">
            By continuing you consent to the{' '}
            <ExternalLink href={TERMS_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
              terms of use
            </ExternalLink>{' '}
            and{' '}
            <ExternalLink href={PRIVACY_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
              privacy policy
            </ExternalLink>
            .
          </Typography>
        </div>

        <Separator />

        <div className={layoutCss.row}>
          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => onBack(methods.getValues())}>
              Back
            </Button>
            <Button type="submit" size="lg">
              Next
            </Button>
          </div>
        </div>
      </form>

      <SimilarityConfirmDialog
        open={showConfirm}
        safe={{ address: data.address, name: data.name || undefined }}
        onConfirm={() => setShowConfirm(false)}
        onCancel={() => setShowConfirm(false)}
      />
    </FormProvider>
  )
}

const loadSafeSteps: TxStepperProps<LoadSafeFormData>['steps'] = [
  {
    ...LoadSafeSteps[0],
    render: (data, onSubmit, onBack, setStep) => (
      <SetAddressStepPrototype data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} />
    ),
  },
  ...LoadSafeSteps.slice(1),
]

const LoadSafePrototype = (): ReactElement => {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-10 md:col-start-2 lg:col-span-8 lg:col-start-3">
          <Typography variant="h2" className="pb-4">
            Add existing Safe account
          </Typography>
        </div>
        <div className="order-1 col-span-12 md:order-0 md:col-span-10 md:col-start-2 lg:col-span-8 lg:col-start-3">
          <CardStepper
            initialData={{ ...loadSafeDefaultData, address: ADDRESSES.safeLookalike }}
            onClose={noop}
            steps={loadSafeSteps}
            eventCategory={LOAD_SAFE_CATEGORY}
          />
        </div>
      </div>
    </div>
  )
}

const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected' })

/** Prototype: one red line under the address, then the existing similarity confirm dialog on submit. Static data. */
const meta = {
  title: 'Features/AntiAddressPoisoning/EntryPointWarnings',
  parameters: { layout: 'fullscreen', ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AddressBookEntry: Story = {
  render: () => <EntryDialogPrototype address={ADDRESSES.treasuryLookalike} similarTo={TREASURY} />,
}

export const AddressBookImport: Story = {
  render: () => <ImportDialogPrototype />,
}

export const AddExistingSafe: Story = {
  render: () => <LoadSafePrototype />,
}
