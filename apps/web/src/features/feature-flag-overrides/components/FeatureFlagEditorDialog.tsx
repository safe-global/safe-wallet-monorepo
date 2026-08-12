import type { ReactElement } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/store'
import { clearAllOverrides } from '@/features/feature-flag-overrides/store'
import { useFeatureFlagEditorData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagEditor } from './FeatureFlagEditor'

export interface FeatureFlagEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const FeatureFlagEditorDialog = ({ open, onOpenChange }: FeatureFlagEditorDialogProps): ReactElement => {
  const dispatch = useAppDispatch()
  const { overridden } = useFeatureFlagEditorData()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="flex max-h-[90vh] flex-col">
        <DialogHeader divided className="shrink-0">
          <DialogTitle className="font-bold">Feature flags</DialogTitle>
          <DialogDescription>
            Override the feature flags delivered by the config service. Changes apply instantly across all chains — no
            reload needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <FeatureFlagEditor />
        </div>

        <DialogFooter divided className="shrink-0 flex-row items-center">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => dispatch(clearAllOverrides())}
            disabled={overridden.length === 0}
          >
            <RotateCcw />
            Reset all overrides
          </Button>
          <DialogClose render={<Button size="lg" className="ml-auto" />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FeatureFlagEditorDialog
