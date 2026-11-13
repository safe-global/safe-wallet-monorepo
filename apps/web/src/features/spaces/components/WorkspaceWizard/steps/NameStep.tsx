import type { ReactElement } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import OnboardingFooter from '@safe-global/views/components/common/OnboardingFooter'
import { Input } from '@safe-global/views/components/ui/input'
import { sanitizeName } from '@safe-global/utils/validation/names'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { useStepAdvance } from '../hooks/useStepAdvance'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'
import NameStepNotices from '../NameStepNotices'
import { validateStep } from '../validation'
import WizardFrame from '../WizardFrame'

const FORM_ID = 'workspace-name-form'

type NameForm = { name: string }

const toNameForm = (draft: WorkspaceDraft): NameForm => ({ name: draft.name })

const NameStep = (): ReactElement => {
  const { draft } = useWorkspaceDraft()
  const { stepNumber, totalSteps, advance, retreat, onExit, hasNoSpaces } = useStepAdvance('name')
  const { register, handleSubmit, reset, getValues, setValue, control, formState } = useForm<NameForm>({
    mode: 'onChange',
    defaultValues: toNameForm(draft),
  })

  const typedName = useWatch({ control, name: 'name' }) ?? ''
  const nameField = register('name', {
    validate: (value) => validateStep('name', { ...draft, name: value ?? '' }, {}) ?? true,
  })

  const onSubmit = handleSubmit(({ name }) => advance({ name: sanitizeName(name) }))
  const onBack = () => retreat({ name: sanitizeName(getValues('name')) })

  return (
    <WizardFrame
      draft={{ ...draft, name: typedName }}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title="Create a Workspace"
      subtitle="Your team's home for managing Safes, tracking activity, and collaborating."
      highlight="switcher"
      onLogoClick={hasNoSpaces ? onExit : undefined}
      footer={
        <OnboardingFooter
          onBack={onBack}
          continueLabel="Next"
          continueType="submit"
          continueForm={FORM_ID}
          continueDisabled={!formState.isValid}
          continueTestId="create-space-onboarding-continue-button"
        />
      }
    >
      <NameStepNotices onStartOver={() => reset({ name: '' })} />
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="space-name" className="m-0 text-sm leading-5 font-medium">
            Workspace name
          </label>
          <Input
            id="space-name"
            data-testid="space-name-input"
            placeholder="e.g. Treasury Ops, DeFi Team"
            autoComplete="off"
            autoFocus
            variant="surface"
            // eslint-disable-next-line no-restricted-syntax -- bespoke 44px onboarding field (h-11, rounded-sm, px-4); between the lg/xl tiers, no size fits
            className="mt-2 h-11 rounded-sm px-4"
            {...nameField}
            error={formState.errors.name?.message}
            onBlur={(event) => {
              void nameField.onBlur(event)
              setValue('name', sanitizeName(event.target.value), { shouldValidate: true })
            }}
          />
        </div>
      </form>
    </WizardFrame>
  )
}

export default NameStep
