import { Box, Paper, Stack, Typography } from '@mui/material'
import { ArrowUpRight, LifeBuoy, Shield, WalletMinimal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import AppliedPolicies from './AppliedPolicies'
import SpendingLimitFlow from './SpendingLimitFlow'
import RecoveryFlow from './RecoveryFlow'

type PolicyCardProps = {
  icon: LucideIcon
  title: string
  description: string
  comingSoon?: boolean
  onClick?: () => void
}

const PolicyCard = ({ icon: Icon, title, description, comingSoon = false, onClick }: PolicyCardProps) => {
  return (
    <Paper
      elevation={0}
      onClick={comingSoon ? undefined : onClick}
      sx={{
        position: 'relative',
        borderRadius: '20px',
        padding: '28px 24px',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: comingSoon ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(0, 0, 0, 0.03)',
        transition: 'background-color 150ms ease',
        '& .policy-card-arrow': {
          opacity: 0,
          transform: 'scale(0.6)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        },
        '& .policy-card-tier': {
          transition: 'opacity 200ms ease',
        },
        ...(comingSoon
          ? {}
          : {
              '&:hover': { backgroundColor: 'background.main', borderColor: '#fff' },
              '&:hover .policy-card-tier': { opacity: 0 },
              '&:hover .policy-card-arrow': { opacity: 1, transform: 'scale(1)' },
            }),
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '14px',
          backgroundColor: 'secondary.background',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={24} color="#1C5538" />
      </Box>

      {comingSoon ? (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(18, 255, 128, 0.14) 0%, rgba(18, 255, 128, 0.04) 100%)',
            border: '1px solid rgba(18, 255, 128, 0.28)',
            backdropFilter: 'blur(8px)',
            padding: '5px 10px 5px 9px',
            borderRadius: '9999px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.2px',
            color: '#166534',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'secondary.main',
              boxShadow: '0 0 0 0 rgba(18, 255, 128, 0.6)',
              animation: 'policyComingSoonPulse 2.2s ease-in-out infinite',
              '@keyframes policyComingSoonPulse': {
                '0%, 100%': { boxShadow: '0 0 0 0 rgba(18, 255, 128, 0.6)' },
                '50%': { boxShadow: '0 0 0 5px rgba(18, 255, 128, 0)' },
              },
            }}
          />
          Coming soon
        </Box>
      ) : (
        <>
          <Typography
            className="policy-card-tier"
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              fontSize: 11,
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            Free
          </Typography>
          <Box
            className="policy-card-arrow"
            sx={{
              position: 'absolute',
              top: 18,
              right: 18,
              width: 36,
              height: 36,
              borderRadius: '9999px',
              backgroundColor: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowUpRight size={18} color="#fff" />
          </Box>
        </>
      )}

      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: '4px' }}>{description}</Typography>
      </Box>
    </Paper>
  )
}

const SpacePolicies = () => {
  const router = useRouter()

  if (router.query.policy === 'spendingLimit') {
    return <SpendingLimitFlow />
  }

  if (router.query.policy === 'accountRecovery') {
    return <RecoveryFlow />
  }

  const openSpendingLimitFlow = () => {
    void router.push({ pathname: AppRoutes.spaces.policies, query: { ...router.query, policy: 'spendingLimit' } })
  }

  const openRecoveryFlow = () => {
    void router.push({ pathname: AppRoutes.spaces.policies, query: { ...router.query, policy: 'accountRecovery' } })
  }

  return (
    <>
      <Stack mb={5} gap={1}>
        <Typography variant="h1">Policies</Typography>
        <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>
          Rules that govern this workspace&apos;s Safes — applied onchain, enforced by audited modules and guards.
        </Typography>
      </Stack>

      <Stack gap={2} sx={{ maxWidth: 1040, mb: 6 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
          Add a policy
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <PolicyCard
            icon={WalletMinimal}
            title="Spending Limit"
            description="Per-member spending cap."
            onClick={openSpendingLimitFlow}
          />
          <PolicyCard icon={Shield} title="Operator Role" description="Scoped DeFi permissions." comingSoon />
          <PolicyCard
            icon={LifeBuoy}
            title="Account Recovery"
            description="Recover lost access."
            onClick={openRecoveryFlow}
          />
        </Box>
      </Stack>

      <AppliedPolicies />
    </>
  )
}

export default SpacePolicies
