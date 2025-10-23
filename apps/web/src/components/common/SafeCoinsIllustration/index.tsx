import { Box } from '@mui/material'
import Image from 'next/image'
import styles from './styles.module.css'

const SafeCoinsIllustration = () => {
  return (
    <Box className={styles.container}>
      {/* Left coin (rotated 5.34deg) */}
      <Box className={`${styles.coin} ${styles.coinLeft}`}>
        <Image
          src="/images/common/no-fee-november/coin-left.svg"
          alt="SAFE coin"
          width={33}
          height={55}
          className={styles.coinImage}
        />
        {/* Dollar sign overlay */}
        <Box className={styles.dollarOverlay}>
          <Box component="span" className={styles.dollarSign}>
            $
          </Box>
        </Box>
        {/* Corner dots */}
        <Box className={`${styles.cornerDot} ${styles.cornerDotTopLeft}`} />
        <Box className={`${styles.cornerDot} ${styles.cornerDotTopRight} ${styles.cornerDotTopRightLeft}`} />
      </Box>

      {/* Right coin (rotated 354.66deg) */}
      <Box className={`${styles.coin} ${styles.coinRight}`}>
        <Image
          src="/images/common/no-fee-november/coin-right.svg"
          alt="SAFE coin"
          width={33}
          height={55}
          className={styles.coinImage}
        />
        {/* Dollar sign overlay */}
        <Box className={`${styles.dollarOverlay} ${styles.dollarOverlayRight}`}>
          <Box component="span" className={styles.dollarSign}>
            $
          </Box>
        </Box>
        {/* Corner dots */}
        <Box className={`${styles.cornerDot} ${styles.cornerDotTopLeft}`} />
        <Box className={`${styles.cornerDot} ${styles.cornerDotTopRight} ${styles.cornerDotTopRightRight}`} />
      </Box>

      {/* Center coin (no rotation) */}
      <Box className={styles.coinCenter}>
        <Image
          src="/images/common/no-fee-november/coin-center.svg"
          alt="SAFE coin"
          width={33}
          height={55}
          className={styles.coinImage}
        />
        {/* Safe logo overlay */}
        <Box className={styles.safeLogoOverlay}>
          <Image
            src="/images/common/no-fee-november/safe-token.png"
            alt="SAFE token"
            width={20}
            height={20}
            className={styles.safeTokenImage}
          />
          <Box className={styles.safeLogoContainer}>
            <Image
              src="/images/common/no-fee-november/safe-logo.svg"
              alt="Safe logo"
              width={14}
              height={14}
              className={styles.safeLogoImage}
            />
          </Box>
        </Box>
        {/* Corner dots */}
        <Box className={`${styles.cornerDot} ${styles.cornerDotTopLeft}`} />
        <Box className={`${styles.cornerDot} ${styles.cornerDotTopRight} ${styles.cornerDotTopRightRight}`} />
      </Box>
    </Box>
  )
}

export default SafeCoinsIllustration
