import { useRouter } from 'next/router'
import { ActionCard } from '@/components/common/ActionCard'
import { AppRoutes } from '@/config/routes'
import useSecurityIssueCount from '@/features/security/hooks/useSecurityIssueCount'

const SecurityIssuesWarning = () => {
  const { issueCount, isScanning } = useSecurityIssueCount()
  const router = useRouter()

  if (isScanning || issueCount === 0) return null

  const handleReviewSecurity = () => {
    router.push({
      pathname: AppRoutes.security,
      query: { safe: router.query.safe },
    })
  }

  return (
    <ActionCard
      severity="info"
      title={`${issueCount} ${issueCount === 1 ? 'check needs' : 'checks need'} your attention`}
      content="Your Safe's security setup has items that could be improved."
      action={{ label: 'Go to Security hub', onClick: handleReviewSecurity }}
      actionTestId="review-security-btn"
    />
  )
}

export default SecurityIssuesWarning
