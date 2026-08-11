import { Alert, AlertTitle, AlertDescription } from '@safe-global/design-system/components/alert'
import { Button } from '@safe-global/design-system/components/button'

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
      <AlertTitle>Add to my accounts</AlertTitle>
      <AlertDescription>Only Safes you add will appear in your account list.</AlertDescription>
      <div className="mt-4">
        <Button size="sm" onClick={onProceed} data-testid="select-safes-button">
          Add Safes
        </Button>
      </div>
    </Alert>
  )
}

export default MigrationPrompt
