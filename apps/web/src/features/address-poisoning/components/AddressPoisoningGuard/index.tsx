import { useEffect, useRef, type ReactElement } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import useAddressPoisoningGuard, { type BlockedHint, type GuardContext } from '../../hooks/useAddressPoisoningGuard'
import { extractAddress } from '../../utils/extractAddress'
import GuardBanner from './GuardBanner'
import ResolvedChip from './ResolvedChip'

type CommonProps = {
  context?: GuardContext
  amberBlocks?: boolean
  /**
   * Notifies the host whether its continue/sign/confirm button must stay disabled.
   * `hint` carries the button-side cue (text + tone) while blocked, undefined otherwise.
   */
  onBlockedChange?: (blocked: boolean, hint?: BlockedHint) => void
}

type RhfProps = CommonProps & {
  /** react-hook-form field name to read the address from + write the trusted swap back to. */
  name: string
}

type ControlledProps = CommonProps & {
  /** The entered address (host extracts + validates it). */
  address?: string
  /** Swap the field to the trusted anchor address (recipient flows). */
  onUseTrusted?: (trusted: string) => void
}

export type AddressPoisoningGuardProps = RhfProps | ControlledProps

const GuardBody = ({
  address,
  onUseTrusted,
  context,
  amberBlocks,
  onBlockedChange,
}: ControlledProps): ReactElement | null => {
  const guard = useAddressPoisoningGuard({ address, onUseTrusted, context, amberBlocks })
  const entered = guard.parts.front + guard.parts.middle + guard.parts.back
  const { name } = useAddressResolver(guard.anchorAddress ?? entered)
  const trustedName = name || 'a trusted address'

  // Report blocking up without re-firing on every parent render (host callback may be inline).
  const cb = useRef(onBlockedChange)
  cb.current = onBlockedChange
  useEffect(() => {
    cb.current?.(
      guard.isBlocked,
      guard.isBlocked ? { text: guard.blockedHint, tone: guard.level === 'critical' ? 'critical' : 'warn' } : undefined,
    )
  }, [guard.isBlocked, guard.blockedHint, guard.level])

  if (guard.level === 'none' && !guard.usingTrusted) return null

  return guard.usingTrusted ? (
    <ResolvedChip trustedName={trustedName} onUndo={guard.undoTrusted} />
  ) : (
    <GuardBanner guard={guard} trustedName={trustedName} />
  )
}

const RhfGuard = ({ name, ...rest }: RhfProps): ReactElement | null => {
  const { control, setValue } = useFormContext()
  const value = useWatch({ control, name })
  return (
    <GuardBody
      {...rest}
      address={extractAddress(value)}
      onUseTrusted={(trusted) => setValue(name, trusted, { shouldValidate: true })}
    />
  )
}

/**
 * Reusable address-poisoning guard. Drop below any address-entry field; it shows the
 * two-tier warning with the address comparison inline, blocks by default (no one-click
 * proceed), offers the trusted-swap (recipient flows) or a single attestation checkbox,
 * and reports its blocked state via `onBlockedChange` so the host can disable its
 * continue/sign/confirm button.
 *
 * RHF mode: pass `name` (reads the field + writes the swap back).
 * Controlled mode: pass `address` + `onUseTrusted`.
 */
const AddressPoisoningGuard = (props: AddressPoisoningGuardProps): ReactElement | null => {
  if ('name' in props && props.name) {
    return <RhfGuard {...props} />
  }
  return <GuardBody {...(props as ControlledProps)} />
}

export default AddressPoisoningGuard
