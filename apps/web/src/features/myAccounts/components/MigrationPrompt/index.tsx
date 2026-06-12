import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface MigrationPromptProps {
  /** Callback when user wants to proceed with selecting safes */
  onProceed: () => void
}

/**
 * Migration prompt displayed to existing users who have safes but none pinned
 * Explains the new pinned-only security feature and guides them to select trusted safes
 */
const MigrationPrompt = ({ onProceed }: MigrationPromptProps) => {
  return (
    <Alert data-testid="migration-prompt" className="mb-4">
      <AlertTitle>Add trusted Safes</AlertTitle>
      <AlertDescription>Only Safes you trust will appear in your account list.</AlertDescription>
      <div className="mt-4">
        <Button size="sm" onClick={onProceed} data-testid="select-safes-button">
          Add Safes
        </Button>
      </div>
    </Alert>
  )
}

export default MigrationPrompt
