import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CircleAlert } from 'lucide-react'

const SimilarAddressAlert = () => (
  <Alert variant="warning">
    <CircleAlert />
    <AlertTitle>Similar addresses detected</AlertTitle>
    <AlertDescription>
      These addresses look very similar. Carefully verify the full address before confirming.
    </AlertDescription>
  </Alert>
)

export default SimilarAddressAlert
