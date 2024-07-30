import css from './styles.module.css'
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon,
  Stack,
  Pagination,
  Skeleton,
  Typography,
} from '@mui/material'
import SearchIcon from '@/public/images/common/search.svg'
import InviteProfile from '../invite-profile'
import type { PendingEOASRequest } from '@/hooks/super-chain/usePendingEOASRequests'
import type { ModalContext } from '..'
import type { Address } from 'viem'

export function InvitesCard({
  setPage,
  setModalContext,
  populations,
  loading,
}: {
  setPage: (page: number) => void
  setModalContext: (modalContext: ModalContext) => void
  populations: PendingEOASRequest | undefined
  loading: boolean
}) {
  const handleOpenModal = (safe: Address, newOwner: Address, superChainId: string) => {
    setModalContext({
      isOpen: true,
      safe,
      newOwner,
      superChainId,
    })
  }
  {
    populations?.ownerPopulateds.length === 0 && (
      <Stack spacing="12px">
        <Typography>There are no invites found on this address</Typography>
      </Stack>
    )
  }

  return (
    <Card className={css.card}>
      <CardHeader
        title="Superchain Account invites"
        subheader={false}
        titleTypographyProps={{ variant: 'h4' }}
        subheaderTypographyProps={{ variant: 'body2' }}
        className={css.header}
      />
      <CardContent className={css.content}>
        <Stack justifyContent="center" alignItems="center" p="24px" spacing="12px">
          {loading ? (
            <>
              <Skeleton className={css['skeleton-container']} variant="rectangular" width="100%" />

              <Skeleton className={css['skeleton-container']} variant="rectangular" width="100%" />
              <Skeleton className={css['skeleton-container']} variant="rectangular" width="100%" />
              <Skeleton className={css['skeleton-container']} variant="rectangular" width="100%" />
            </>
          ) : populations?.ownerPopulateds.length === 0 ? (
            <Stack spacing="12px">
              <Typography>There are no invites found on this address</Typography>
            </Stack>
          ) : (
            <>
              <TextField
                className={css.search}
                placeholder="Search by account name or address"
                aria-label="Search SuperChainSmartAccount by name or address"
                variant="outlined"
                hiddenLabel
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SvgIcon component={SearchIcon} inheritViewBox color="border" />
                    </InputAdornment>
                  ),
                  disableUnderline: true,
                }}
                fullWidth
                size="small"
                sx={{
                  '& > .MuiInputBase-root': { padding: '8px 16px' },
                }}
              />
              {populations?.ownerPopulateds.map((population) => (
                <InviteProfile key={population.id} population={population} onClick={handleOpenModal} />
              ))}
              <Pagination onChange={(_, page) => setPage(page)} shape="rounded" count={Math.max(1, Math.ceil((populations?.meta.count ?? 0) / 5))} />
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
