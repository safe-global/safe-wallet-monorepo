import { Box } from '@mui/material'
import Image from 'next/image'

const SafeCoinsIllustration = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '76px',
        height: '76px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Left coin (rotated 5.34deg) */}
      <Box
        sx={{
          position: 'absolute',
          left: 'calc(50% - 17.662px)',
          top: '2.52px',
          transform: 'translateX(-50%)',
          transformOrigin: 'center',
          rotate: '5.34deg',
          opacity: 0.6,
          zIndex: 1,
        }}
      >
        <Image
          src="/images/common/no-fee-november/coin-left.svg"
          alt="SAFE coin"
          width={33}
          height={55}
          style={{ display: 'block' }}
        />
        {/* Dollar sign overlay */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '23.646px',
            height: '23.646px',
            borderRadius: '26.273px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '0.657px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.1,
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: 'Citerne, sans-serif',
              fontSize: '15.764px',
              color: '#12ff80',
              lineHeight: 1.2,
            }}
          >
            $
          </Box>
        </Box>
        {/* Corner dots */}
        <Box
          sx={{
            position: 'absolute',
            left: '-1.97px',
            top: '-1.97px',
            width: '5.255px',
            height: '5.255px',
            borderRadius: '26.273px',
            backgroundColor: 'transparent',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '29.89px',
            top: '-1.97px',
            width: '5.255px',
            height: '5.255px',
            borderRadius: '26.273px',
            backgroundColor: '#303030',
          }}
        />
      </Box>

      {/* Right coin (rotated 354.66deg) */}
      <Box
        sx={{
          position: 'absolute',
          left: 'calc(50% + 18.406px)',
          top: '2.52px',
          transform: 'translateX(-50%)',
          transformOrigin: 'center',
          rotate: '354.66deg',
          opacity: 0.6,
          zIndex: 1,
        }}
      >
        <Image
          src="/images/common/no-fee-november/coin-right.svg"
          alt="SAFE coin"
          width={33}
          height={55}
          style={{ display: 'block' }}
        />
        {/* Dollar sign overlay */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '23.646px',
            height: '23.646px',
            borderRadius: '26.273px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.1,
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: 'Citerne, sans-serif',
              fontSize: '15.764px',
              color: '#12ff80',
              lineHeight: 1.2,
            }}
          >
            $
          </Box>
        </Box>
        {/* Corner dots */}
        <Box
          sx={{
            position: 'absolute',
            left: '-1.97px',
            top: '-1.97px',
            width: '5.255px',
            height: '5.255px',
            borderRadius: '26.273px',
            backgroundColor: 'transparent',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '29.89px',
            top: '-1.97px',
            width: '5.255px',
            height: '5.255px',
            borderRadius: '26.273px',
            backgroundColor: 'transparent',
          }}
        />
      </Box>

      {/* Center coin (no rotation) */}
      <Box
        sx={{
          position: 'absolute',
          left: 'calc(50% + 0.164px)',
          top: 0,
          transform: 'translateX(-50%)',
          zIndex: 2,
        }}
      >
        <Image
          src="/images/common/no-fee-november/coin-center.svg"
          alt="SAFE coin"
          width={33}
          height={55}
          style={{ display: 'block' }}
        />
        {/* Safe logo overlay */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '1000px',
            overflow: 'hidden',
          }}
        >
          <Image
            src="/images/common/no-fee-november/safe-token.png"
            alt="SAFE token"
            width={20}
            height={20}
            style={{ position: 'absolute', inset: 0 }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: '15.56%',
            }}
          >
            <Image
              src="/images/common/no-fee-november/safe-logo.svg"
              alt="Safe logo"
              width={14}
              height={14}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Box>
        {/* Corner dots */}
        <Box
          sx={{
            position: 'absolute',
            left: '-1.97px',
            top: '-1.97px',
            width: '5.255px',
            height: '5.255px',
            borderRadius: '26.273px',
            backgroundColor: 'transparent',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '29.89px',
            top: '-1.97px',
            width: '5.255px',
            height: '5.255px',
            borderRadius: '26.273px',
            backgroundColor: 'transparent',
          }}
        />
      </Box>
    </Box>
  )
}

export default SafeCoinsIllustration
