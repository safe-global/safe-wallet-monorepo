import { Box, Card, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { SvgIcon } from '@mui/material'
import CheckIcon from '@/public/images/common/check.svg'
import css from './styles.module.css'
import type { ReactElement } from 'react'

export interface PendingBannerProps {
    onDismiss?: () => void
}

const PendingBanner = ({ onDismiss }: PendingBannerProps): ReactElement => {
    return (
        <Card className={css.banner}>
            <Stack direction="row" alignItems="flex-start" spacing={1} className={css.content}>
                <Box className={css.iconContainer}>
                    <SvgIcon
                        component={CheckIcon}
                        inheritViewBox
                        className={css.icon}
                        sx={{
                            color: 'var(--color-success-main)',
                        }}
                    />
                </Box>
                <Box className={css.textContainer}>
                    <Typography variant="subtitle1" fontWeight="bold" className={css.title}>
                        Guardian setup in progress
                    </Typography>
                    <Typography variant="body2" className={css.description}>
                        We've received your request and will follow up with next steps.
                    </Typography>
                </Box>
                {onDismiss && (
                    <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Stack>
        </Card>
    )
}

export default PendingBanner

