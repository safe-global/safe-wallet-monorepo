import CodeInput from '@/components/common/CodeInput'
import CopyButton from '@/components/common/CopyButton'
import QRCode from '@/components/common/QRCode'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ButtonBase, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import { type EIP712TypedDataTx } from '@safe-global/types-kit'
import { useContext } from 'react'
import CopyIcon from '@/public/images/common/copy.svg'

export const TxAuthentication = () => {
  // Generate QR code
  const { safeTx } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()

  const typedDataPayload: Pick<EIP712TypedDataTx, 'domain' | 'message'> | null = safeTx
    ? {
        domain: { verifyingContract: safe.address.value, chainId: safe.chainId },
        message: safeTx.data,
      }
    : null

  const url = `myapp://authenticator?payload=${encodeURIComponent(JSON.stringify(typedDataPayload))}`
  return (
    <Stack spacing={2} mb={2}>
      <Typography variant="h3">Authenticate the signature</Typography>
      <Stack direction="row" spacing={1}>
        <Stack spacing={2}>
          <Typography>Your Safe has MFA enabled.</Typography>
          <Typography variant="body2" color="text.secondary">
            Follow these steps to authenticate:
          </Typography>
          <Stack spacing={1} pl={2}>
            <Typography variant="body2" component="div">
              1. Scan the QR Code and verify the transaction in the Safe{'{'}Wallet{'}'} mobile app
            </Typography>
            <Typography variant="body2" component="div">
              2. Enter the authentication code
            </Typography>
            <Typography variant="body2" component="div">
              3. Sign the transaction
            </Typography>
          </Stack>
          <Typography variant="subtitle2" fontWeight={700}>
            Authenticator code:
          </Typography>
          <CodeInput length={6} onCodeChanged={() => {}} />
        </Stack>
        <Stack spacing={1} alignItems="center">
          <QRCode value={url} size={240} />
          <CopyButton text={url}>
            <ButtonBase sx={{ cursor: 'pointer', borderRadius: '6px', padding: '4px', pointerEvents: 'all' }}>
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                Copy link
                <IconButton size="small">
                  <SvgIcon
                    data-testid="copy-btn-icon"
                    component={CopyIcon}
                    inheritViewBox
                    color="border"
                    fontSize="small"
                  />
                </IconButton>
              </Typography>
            </ButtonBase>
          </CopyButton>
        </Stack>
      </Stack>
    </Stack>
  )
}
