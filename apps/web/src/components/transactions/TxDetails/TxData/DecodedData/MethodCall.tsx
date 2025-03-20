import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { Typography } from '@mui/material'

const MethodCall = ({
  method,
  contractAddress,
  contractName,
  contractLogo,
}: {
  method: string
  contractAddress: string
  contractName?: string
  contractLogo?: string
}) => {
  return (
    <>
      <Typography
        fontWeight="bold"
        display="flex"
        flexWrap={['wrap', 'wrap', 'nowrap']}
        alignItems="center"
        gap=".5em"
        component="div"
      >
        Call
        <Typography
          component="code"
          variant="body2"
          sx={{
            backgroundColor: 'background.main',
            px: 1,
            py: 0.5,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}
        >
          {method}
        </Typography>{' '}
        on
        <NamedAddressInfo
          address={contractAddress}
          name={contractName}
          customAvatar={contractLogo}
          showAvatar
          onlyName
          hasExplorer
          showCopyButton
          avatarSize={24}
        />
      </Typography>
    </>
  )
}

export default MethodCall
