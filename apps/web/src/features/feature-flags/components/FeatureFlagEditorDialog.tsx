import type { ReactElement } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/store'
import { clearAllOverrides } from '@/features/feature-flags/store'
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
      <DialogContent className="flex max-h-[90vh] w-full max-w-[min(900px,calc(100vw-2rem))] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="font-bold">Feature flags</DialogTitle>
          <DialogDescription>
            Override the feature flags delivered by the config service. Changes apply instantly across all chains — no
            reload needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
          <FeatureFlagEditor />

          <div className="mt-4 flex shrink-0 flex-row items-center gap-3 border-t border-border pt-4">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FeatureFlagEditorDialog
