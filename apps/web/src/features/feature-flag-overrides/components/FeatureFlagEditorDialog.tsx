import type { ReactElement } from 'react'
import { useAppDispatch } from '@/store'
import { clearAllOverrides } from '@/features/feature-flag-overrides/store'
import { useFeatureFlagEditorData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagEditor } from './FeatureFlagEditor'
import { FeatureFlagEditorDialogView } from '@views/features/feature-flag-overrides/components/FeatureFlagEditorDialogView'

export interface FeatureFlagEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const FeatureFlagEditorDialog = ({ open, onOpenChange }: FeatureFlagEditorDialogProps): ReactElement => {
  const dispatch = useAppDispatch()
  const { overridden } = useFeatureFlagEditorData()

  return (
    <FeatureFlagEditorDialogView
      open={open}
      onOpenChange={onOpenChange}
      editor={<FeatureFlagEditor />}
      hasOverrides={overridden.length !== 0}
      onResetAll={() => dispatch(clearAllOverrides())}
    />
  )
}

export default FeatureFlagEditorDialog
