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
} from '@mui/material'
import SearchIcon from '@/public/images/common/search.svg'
import InviteProfile from '../invite-profile'
import type { PendingEOASRequest } from '@/hooks/super-chain/usePendingEOASRequests'
import type { ModalContext } from '..'
import type { Address } from 'viem'

export function InvitesCard({
  setModalContext,
  populations,
  loading,
}: {
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
          {loading ? (
            <>
              <Skeleton className={css['skeleton-container']} variant="rectangular" width="100%" />
              <Skeleton className={css['skeleton-container']} variant="rectangular" width="100%" />
              <Skeleton className={css['skeleton-container']} variant="rectangular" width="100%" />
            </>
          ) : (
            populations?.ownerPopulateds.map((population) => (
              <InviteProfile key={population.id} population={population} onClick={handleOpenModal} />
            ))
          )}

          <Pagination shape="rounded" count={3} />
        </Stack>
      </CardContent>
    </Card>
  )
}
