import { useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Link,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import { OpenInNewRounded } from '@mui/icons-material'
import CheckIcon from '@/public/images/common/check.svg'
import SafeLabsLogo from '@/public/images/logo-safe-labs.svg'
import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { setSafeLabsTermsAccepted } from '@/services/safe-labs-terms'
import { getSafeRedirectUrl, isValidAutoConnectParam } from '@/services/safe-labs-terms/security'
import { getLogoLink } from '../common/Header'
import NextLink from 'next/link'
import { trackEvent, TERMS_EVENTS } from '@/services/analytics'

const SafeLabsTerms = () => {
  const router = useRouter()
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acknowledgeLiability, setAcknowledgeLiability] = useState(false)
  const [requestDataTransfer, setRequestDataTransfer] = useState(false)

  const canAccept = acceptTerms && acknowledgeLiability

  const logoHref = getLogoLink(router)

  const handleAcceptAndContinue = () => {
    trackEvent({ ...TERMS_EVENTS.ACCEPT_SAFE_LABS_TERMS, label: requestDataTransfer }, { requestDataTransfer })

    const { pathname, query } = getSafeRedirectUrl(router.query.redirect as string | undefined)
    const autoConnect = router.query.autoConnect
    const isValidAutoConnect = isValidAutoConnectParam(autoConnect)
    setSafeLabsTermsAccepted()

    router.push({
      pathname,
      query: {
        ...query,
        ...(isValidAutoConnect && autoConnect === 'true' ? { autoConnect: 'true' } : {}),
      },
    })
  }

  return (
    <>
      <div className={css.headerContainer}>
        <NextLink href={logoHref}>
          <SafeLabsLogo alt="Safe logo" style={{ height: '24px', width: 'auto', cursor: 'pointer' }} />
        </NextLink>
      </div>

      <div className={css.container}>
        <Container maxWidth="md" className={css.contentWrapper}>
          <Stack spacing={3}>
            <div className={css.header}>
              <Typography variant="h4" component="h1" className={css.headerTitle} color="text.primary">
                Welcome to Safe{'{Wallet}'}
                <br />
                by Safe Labs
              </Typography>
            </div>
            <Card className={css.mainCard} style={{ margin: 0 }}>
              <Stack spacing={2} className={css.cardContent}>
                <Typography variant="body2">
                  Starting <strong>October 15, 2025</strong>, Safe Labs GmbH (<strong>&quot;Safe Labs&quot;</strong> or{' '}
                  <strong>&quot;we&quot;</strong>) will offer the interface to your multi-signature wallet:
                </Typography>

                <Card variant="outlined" className={css.nestedCard}>
                  <div className={css.nestedCardHeader}>
                    <div className={css.nestedCardHeaderInner}>
                      <SafeLabsLogo className={css.logo} />
                    </div>
                  </div>

                  <div className={css.nestedCardBody}>
                    <Typography variant="body2" className={css.introText}>
                      Our Safe{'{Wallet}'} is fully compatible with your previous use of Safe{'{Wallet}'} as formerly
                      provided by Core Contributors GmbH: You can migrate your data to your new Safe{'{Wallet}'} by Safe Labs.
                      Of course, you may also choose to start fresh with your new Safe{'{Wallet}'}.
                    </Typography>

                    <Divider className={css.divider} />

                    <Typography variant="body2" fontWeight={700} className={css.featureTitle}>
                      Why you should use Safe{'{Wallet}'}, powered by Safe Labs:
                    </Typography>

                    <Stack spacing={1}>
                      {[
                        'Continuous development of Safe{Wallet} features',
                        'Security standards recognized in the industry',
                        'Alignment with Safe DAO governance',
                        'Leading interface to the Safe Smart Contract multi-signature wallet',
                      ].map((text, index) => (
                        <div key={index} className={css.featureItem}>
                          <div className={css.checkIcon}>
                            <SvgIcon component={CheckIcon} inheritViewBox className={css.checkIconSvg} />
                          </div>
                          <Typography variant="body2">{text}</Typography>
                        </div>
                      ))}
                    </Stack>
                  </div>
                </Card>

                <Typography variant="body2">
                  Please review and accept our{' '}
                  <Link href={AppRoutes.terms} className={css.linkBold}>
                    Terms & Conditions
                  </Link>{' '}
                  to start using your new Safe{'{Wallet}'} by Safe Labs. For information on how we process your personal
                  data, please read our{' '}
                  <Link href={AppRoutes.privacy} className={css.linkBold}>
                    Privacy Policy
                  </Link>
                  .
                </Typography>

                <Card variant="outlined" className={css.checkboxCard}>
                  <div className={css.checkboxCardOuter}>
                    <div className={css.checkboxCardInner}>
                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              sx={{ px: 2, py: 0 }}
                              checked={acceptTerms}
                              onChange={(e) => setAcceptTerms(e.target.checked)}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              I want to use Safe{'{Wallet}'} by Safe Labs GmbH and have read and accept the{' '}
                              <Link href={AppRoutes.terms} className={css.linkBold}>
                                Terms & Conditions
                              </Link>{' '}
                              governing my use of Safe{'{Wallet}'} by Safe Labs GmbH.
                            </Typography>
                          }
                          className={css.formControlLabel}
                        />

                        <FormControlLabel
                          control={
                            <Checkbox
                              sx={{ px: 2, py: 0 }}
                              checked={acknowledgeLiability}
                              onChange={(e) => setAcknowledgeLiability(e.target.checked)}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              I acknowledge that Safe Labs GmbH does not assume any liabilities related to the previous
                              operation of Safe{'{Wallet}'}.
                            </Typography>
                          }
                          className={css.formControlLabel}
                        />
                      </Stack>
                    </div>
                  </div>
                </Card>

                <Typography variant="body2">
                  To ensure a seamless user experience, but only upon your voluntary request, we can arrange the
                  transfer of your interface account data, including personal data (e.g. your Spaces address book), from
                  Core Contributors GmbH to Safe Labs GmbH so it is available in your new Safe{'{Wallet}'} by Safe Labs
                  GmbH.
                </Typography>

                <Typography variant="body2">
                  After the transfer, your personal data will be processed by Safe Labs to provide you your new Safe
                  {'{Wallet}'} experience. For information on how we process your personal data, please read our{' '}
                  <Link href={AppRoutes.privacy} className={css.linkBold}>
                    Privacy Policy
                  </Link>
                  .
                </Typography>

                <Card variant="outlined" className={css.checkboxCard}>
                  <div className={css.checkboxCardOuter}>
                    <div className={css.checkboxCardInner}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            sx={{ px: 2, py: 0 }}
                            checked={requestDataTransfer}
                            onChange={(e) => setRequestDataTransfer(e.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            I request to transfer my personal data to my new Safe{'{Wallet}'} by Safe Labs GmbH.
                          </Typography>
                        }
                        className={css.formControlLabel}
                      />
                    </div>
                  </div>
                </Card>

                <Typography variant="caption" color="text.secondary" className={css.captionText}>
                  Of course, you may also choose to start fresh with Safe{'{Wallet}'} by Safe Labs GmbH and not transfer
                  your personal data. Doing so will have no negative consequences for you or your use of Safe
                  {'{Wallet}'}, by Safe Labs GmbH.
                </Typography>

                <Typography variant="caption" color="text.secondary" className={css.captionText}>
                  You may also revoke your consent to the transfer of your personal data at any time. In this case, we
                  will delete your personal data transferred to us. Please ensure to download your personal data
                  beforehand, as you will no longer be able to access your personal data via Safe{'{Wallet}'} as
                  provided by Safe Labs GmbH.
                </Typography>
              </Stack>

              <div className={css.buttonWrapper}>
                <Button
                  variant="contained"
                  disabled={!canAccept}
                  className={css.acceptButton}
                  onClick={handleAcceptAndContinue}
                >
                  Accept terms & Continue
                </Button>
              </div>
            </Card>

            <Stack spacing={1} className={css.learnMoreSection}>
              <Typography variant="body2" color="text.secondary">
                Learn more:
              </Typography>

              <div className={css.learnMoreLinks}>
                <a
                  href="https://safe.global/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.externalLink}
                >
                  <Typography variant="body2" className={css.externalLinkText}>
                    Read blog post
                  </Typography>
                  <OpenInNewRounded className={css.externalLinkIcon} />
                </a>

                <a href="https://safe.global" target="_blank" rel="noopener noreferrer" className={css.externalLink}>
                  <Typography variant="body2" className={css.externalLinkText}>
                    Safe Labs
                  </Typography>
                  <OpenInNewRounded className={css.externalLinkIcon} />
                </a>

                <a
                  href="https://safefoundation.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.externalLink}
                >
                  <Typography variant="body2" className={css.externalLinkText}>
                    Safe Ecosystem
                  </Typography>
                  <OpenInNewRounded className={css.externalLinkIcon} />
                </a>
              </div>
            </Stack>
          </Stack>
        </Container>
      </div>
    </>
  )
}

export default SafeLabsTerms
