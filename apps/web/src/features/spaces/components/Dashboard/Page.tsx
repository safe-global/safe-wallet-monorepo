import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceDashboard from './index'
import { SpacesFeedbackPopupContainer } from '../SpacesFeedbackPopup'

export default function SpaceDashboardPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="merged">
        <SpaceDashboard />
        <SpacesFeedbackPopupContainer />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
