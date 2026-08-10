import type { Meta, StoryObj } from '@storybook/react'
import { Fragment } from 'react'
import { Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, Chip, Alert } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import ErrorMessage from './index'
import CONTRACT_ERRORS, {
  GS026_MESSAGES,
  getContractErrorMessage,
  type GsCode,
} from '@safe-global/utils/services/exceptions/contractErrors'

/**
 * Living reference for the Safe contract (GS) error messages (WA-3005).
 *
 * - `MessageCatalog` lists every GS code with its user-facing copy and handling.
 * - `RenderedInErrorMessage` shows the copy in the real `ErrorMessage` component.
 *   Each error is fed a realistic raw payload (provider URLs, request bodies,
 *   library versions); "Details" shows only the sanitised support reference
 *   (code / tx hash / network / timestamp / copy) — never the raw payload.
 */

const PARAMS = { network: 'Ethereum', nativeAsset: 'ETH', token: 'USDC' }
const CODES = Object.keys(CONTRACT_ERRORS) as GsCode[]

const handlingColor = (handling: string) =>
  handling === 'inline-validation' ? 'info' : handling === 'internal' ? 'default' : 'warning'

const Catalog = () => (
  <Stack spacing={2}>
    <Typography variant="h4">All 32 GS codes → user-facing message</Typography>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Code</TableCell>
          <TableCell>Handling</TableCell>
          <TableCell>Message</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {CODES.map((code) => (
          <TableRow key={code}>
            <TableCell>
              <strong>{code}</strong>
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                label={CONTRACT_ERRORS[code].handling}
                color={handlingColor(CONTRACT_ERRORS[code].handling)}
              />
            </TableCell>
            <TableCell>{getContractErrorMessage(code, PARAMS)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    <Typography variant="h4">GS026 — three causes (chosen by pre-check in Topic 4)</Typography>
    <Table size="small">
      <TableBody>
        {Object.entries(GS026_MESSAGES).map(([reason, message]) => (
          <TableRow key={reason}>
            <TableCell>
              <strong>{reason}</strong>
            </TableCell>
            <TableCell>{message}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Stack>
)

/**
 * Representative raw payloads as they arrive from ethers/viem/RPC today. These
 * are the strings currently dumped into the "Details" panel — provider URLs,
 * request bodies, library versions, calldata. Topic 2 replaces them with a
 * support reference (code, tx hash, network, timestamp, copy button).
 */
const RAW_PAYLOADS: Partial<Record<GsCode, string>> = {
  GS201: `execution reverted: GS201 (action="estimateGas", data="0x08c379a0...4753323031", reason="GS201", code=CALL_EXCEPTION, version=6.13.2)`,
  GS010: `Error: cannot estimate gas; transaction may fail or may require manual gas limit (reason="GS010", method="estimateGas", code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.7.2)`,
  GS011: `HTTP request failed.\n\nStatus: 200\nURL: https://rpc.stable.xyz/\nRequest body: {"method":"eth_call","params":[{"to":"0xA063...","data":"0x6a761202..."}]}\n\nreason: GS011\nVersion: viem@2.52.2`,
  GS026: `HTTP request failed.\n\nStatus: 500\nURL: https://berachain.drpc.org\nRequest body: {"method":"eth_call","params":[{"to":"0x1f9840...","data":"0x6a761202..."}]}\n\nDetails: Internal server error\nVersion: viem@2.52.2`,
  GS100: `Error: SDK is not initialized yet\n    at GnosisSafe.execTransaction (protocol-kit/dist/index.js:1024:13)`,
}

const InErrorMessage = () => {
  const samples: Array<{ code: GsCode; label: string }> = [
    { code: 'GS201', label: 'inline-validation' },
    { code: 'GS010', label: 'runtime' },
    { code: 'GS011', label: 'runtime + interpolation' },
    { code: 'GS026', label: 'reactive fallback' },
    { code: 'GS100', label: 'internal fallback' },
  ]
  return (
    <Stack spacing={2}>
      <Alert severity="info" variant="outlined">
        The message you see is the new copy. Each error is fed a realistic raw payload (provider URLs, request bodies,
        library versions), but <strong>Details</strong> shows only the support reference — code, tx hash, network,
        timestamp, copy — never the raw payload.
      </Alert>
      {samples.map(({ code, label }) => {
        const message = getContractErrorMessage(code, PARAMS)
        const raw = RAW_PAYLOADS[code]
        return (
          <Fragment key={code}>
            <Typography variant="caption" color="text.secondary">
              {code} — {label}
            </Typography>
            <ErrorMessage error={raw ? new Error(raw) : undefined}>{message}</ErrorMessage>
          </Fragment>
        )
      })}
    </Stack>
  )
}

const meta = {
  title: 'Errors/Contract error messages',
  parameters: { visualTest: { disable: true } },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const MessageCatalog: Story = { render: () => <Catalog /> }
export const RenderedInErrorMessage: Story = { render: () => <InErrorMessage /> }
