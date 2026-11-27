import { useCallback, type ReactElement } from 'react'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, TriangleAlert } from 'lucide-react'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'
import { trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import { Controller, useForm } from 'react-hook-form'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Field } from '@safe-global/views/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@safe-global/views/components/ui/input-group'
import { cn } from '@safe-global/views/utils/cn'
import TxSectionTitle from '@safe-global/views/components/tx-flow/common/TxSectionTitle'
import { usePrivateNotesPrototype, type PrivateNoteAccess } from '../../public/services/privateNotesPrototype'

const MAX_NOTE_LENGTH = 280

const Title = ({ locked = false }: { locked?: boolean }): ReactElement => (
  <TxSectionTitle>
    Private note
    {locked && (
      <Badge variant="subtle" size="status" shape="status">
        <LockKeyhole aria-hidden />
        Pro
      </Badge>
    )}
  </TxSectionTitle>
)

type LockedCopy = {
  testId: string
  /** What the disabled field says, where the note would go */
  line: string
  help: (args: { workspaceName: string; planName: string }) => string
  action: ReactElement
  pro: boolean
}

const LOCKED: Record<Exclude<PrivateNoteAccess, 'ready'>, LockedCopy> = {
  signedOut: {
    testId: 'tx-note-signed-out',
    line: 'Sign in to add a private note',
    help: ({ workspaceName }) => `Only members of ${workspaceName} can write and read private notes.`,
    action: (
      <Button size="sm" variant="outline">
        Sign in
      </Button>
    ),
    pro: false,
  },
  lockedPlan: {
    testId: 'tx-note-locked',
    line: 'Tell your signers why this transaction exists',
    help: ({ workspaceName, planName }) =>
      `Notes are now private and part of Safe Pro. ${workspaceName} is on ${planName}.`,
    action: (
      <Button size="sm" render={<Link href={AppRoutes.spaces.plans} />}>
        Upgrade to Pro
        <ArrowRight aria-hidden />
      </Button>
    ),
    pro: true,
  },
  noWorkspace: {
    testId: 'tx-note-locked',
    line: 'Tell your signers why this transaction exists',
    help: () => 'Notes are now private and part of Safe Pro, for Safes in a Workspace.',
    action: (
      <Button size="sm" render={<Link href={AppRoutes.welcome.spaces} />}>
        Explore Safe Pro
        <ArrowRight aria-hidden />
      </Button>
    ),
    pro: true,
  },
}

/** The field when the proposer cannot write a note: disabled, one line, one action */
const LockedField = ({ copy, help }: { copy: LockedCopy; help: string }): ReactElement => (
  <div className="flex flex-col gap-2">
    <Title locked={copy.pro} />
    <InputGroup data-testid={copy.testId} inputSize="hero">
      <InputGroupInput disabled aria-label="Private note" aria-describedby="tx-note-help" placeholder={copy.line} />
      <InputGroupAddon align="inline-end">{copy.action}</InputGroupAddon>
    </InputGroup>
    <Typography id="tx-note-help" data-testid="tx-note-alert" variant="paragraph-small" color="muted">
      {help}
    </Typography>
  </div>
)

export default function TxNoteInput({
  onChange,
  defaultValue = '',
}: {
  onChange: (note: string) => void
  defaultValue?: string
}) {
  const { access, workspaceName, planName, outsideSigners } = usePrivateNotesPrototype()
  const {
    control,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<{ note: string }>({
    defaultValues: { note: defaultValue },
  })

  const note = watch('note') || ''

  const onFocus = useCallback(() => {
    // Reset the isDirty state when the user focuses on the input
    reset({ note })
  }, [reset, note])

  const onBlur = useCallback(() => {
    if (isDirty && note.length > 0) {
      trackEvent(MODALS_EVENTS.SUBMIT_TX_NOTE)
    }
  }, [isDirty, note])

  if (access !== 'ready') {
    const copy = LOCKED[access]
    return <LockedField copy={copy} help={copy.help({ workspaceName, planName })} />
  }

  return (
    <div className="flex flex-col gap-2">
      <Title />

      <Controller
        name="note"
        control={control}
        render={({ field }) => (
          <Field>
            <InputGroup data-testid="tx-note-textfield" inputSize="heroWrap">
              <InputGroupTextarea
                name={field.name}
                id="tx-note-input"
                aria-label="Private note"
                aria-describedby="tx-note-help"
                placeholder="Optional. For example an invoice number, or who approved this."
                rows={1}
                className="min-h-0"
                value={field.value || ''}
                maxLength={MAX_NOTE_LENGTH}
                onChange={(e) => {
                  const limitedValue = e.target.value.slice(0, MAX_NOTE_LENGTH)
                  field.onChange(limitedValue)
                  onChange(limitedValue)
                }}
                onFocus={onFocus}
                onBlur={() => {
                  field.onBlur()
                  onBlur()
                }}
              />
            </InputGroup>
          </Field>
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <Typography id="tx-note-help" data-testid="tx-note-alert" variant="paragraph-small" color="muted">
          Only members of {workspaceName} can read this. Cannot be edited after submit.
        </Typography>
        <Typography
          variant="paragraph-small"
          color="muted"
          className={cn('shrink-0 tabular-nums', note.length >= MAX_NOTE_LENGTH && 'text-warning-strong')}
        >
          {note.length}/{MAX_NOTE_LENGTH}
        </Typography>
      </div>

      {outsideSigners > 0 && note.length > 0 && (
        <Typography
          data-testid="tx-note-outside-signers"
          variant="paragraph-small"
          className="flex items-start gap-2 text-warning-strong"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {outsideSigners} {outsideSigners === 1 ? 'signer is' : 'signers are'} not in this Workspace and will not see
            this note.{' '}
            <Link href={AppRoutes.spaces.members} className="font-medium underline underline-offset-2">
              Invite
            </Link>
          </span>
        </Typography>
      )}
    </div>
  )
}
