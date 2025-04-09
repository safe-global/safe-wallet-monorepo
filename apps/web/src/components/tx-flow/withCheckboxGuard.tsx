import React, { useCallback, useMemo, type ComponentType } from 'react'
import { Checkbox, FormControlLabel, Stack } from '@mui/material'

/**
 * Higher-order component that wraps a given component with a checkbox guard.
 * The wrapped component will only be enabled if the checkbox is checked.
 * If the checkbox is not checked, a tooltip will be shown with the provided text.
 * The wrapped component will receive the `disableSubmit` prop to indicate whether it should be disabled.
 * @param WrappedComponent component to be wrapped
 * @param label the label of the checkbox
 * @param tooltipText the tooltip text to be shown when the checkbox is not checked
 * @returns a new component that wraps the original component with a checkbox guard
 */
export const withCheckboxGuard = <P extends { disableSubmit?: boolean; tooltip?: string }>(
  WrappedComponent: ComponentType<P>,
  label: string,
  tooltipText?: string,
) => {
  return function WithCheckboxGuard({
    disableSubmit,
    tooltip,
    isChecked = false,
    onCheckboxChange,
    ...props
  }: P & { onCheckboxChange?: (checked: boolean) => void; isChecked?: boolean }) {
    const handleCheckboxChange = useCallback(
      ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
        onCheckboxChange?.(checked)
      },
      [onCheckboxChange],
    )

    const checkboxTooltip = useMemo(() => (tooltip || !isChecked ? tooltipText : undefined), [tooltip, isChecked])

    return (
      <Stack gap={2} width="100%">
        <FormControlLabel
          sx={{ mt: 2 }}
          control={<Checkbox checked={isChecked} onChange={handleCheckboxChange} />}
          label={label}
        />

        <WrappedComponent {...(props as P)} disableSubmit={!isChecked || disableSubmit} tooltip={checkboxTooltip} />
      </Stack>
    )
  }
}
