import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

export const MigrateToL2Information = ({ variant }: { variant: 'history' | 'queue' }) => {
  return (
    <div>
      <Alert variant="info">
        <AlertSeverityIcon variant="info" />
        <AlertTitle>Migration to compatible base contract</AlertTitle>
        <AlertDescription>
          {variant === 'history'
            ? 'This Safe was using an incompatible base contract. This transaction includes the migration to a supported base contract.'
            : 'This Safe is currently using an incompatible base contract. The transaction was automatically modified to first migrate to a supported base contract.'}
        </AlertDescription>
      </Alert>
    </div>
  )
}
