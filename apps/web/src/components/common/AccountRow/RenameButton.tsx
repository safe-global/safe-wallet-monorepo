import { Pencil } from 'lucide-react'
import RowIconAction from './RowIconAction'

const RenameButton = ({ onRename, className }: { onRename: () => void; className?: string }) => (
  <RowIconAction
    label="Rename safe"
    tooltip="Rename"
    testId="safe-item-rename-btn"
    className={className}
    onActivate={onRename}
  >
    <Pencil className="size-3 text-muted-foreground" />
  </RowIconAction>
)

export default RenameButton
