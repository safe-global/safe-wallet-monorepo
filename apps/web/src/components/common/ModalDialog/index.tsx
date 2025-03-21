import { type ReactElement, type ReactNode } from 'react'
import { IconButton, type ModalProps } from '@mui/material'
import {
  Dialog,
  DialogTitle,
  type DialogProps,
  type DialogTitleProps as MuiDialogTitleProps,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ChainIndicator from '@/components/common/ChainIndicator'
import CloseIcon from '@mui/icons-material/Close'

import css from './styles.module.css'

interface ModalDialogProps extends DialogProps {
  dialogTitle?: React.ReactNode
  hideChainIndicator?: boolean
  chainId?: string
}

interface DialogTitleProps {
  children: ReactNode
  onClose?: ModalProps['onClose']
  hideChainIndicator?: boolean
  chainId?: string
  sx?: MuiDialogTitleProps['sx']
}

export const ModalDialogTitle = ({
  children,
  onClose,
  hideChainIndicator = false,
  chainId,
  sx = {},
  ...other
}: DialogTitleProps) => {
  return (
    <DialogTitle
      data-testid="modal-title"
      sx={{ m: 0, px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold', ...sx }}
      {...other}
    >
      {children}
      <span style={{ flex: 1 }} />
      {!hideChainIndicator && <ChainIndicator chainId={chainId} inline />}
      {onClose ? (
        <IconButton
          data-testid="modal-dialog-close-btn"
          aria-label="close"
          onClick={(e) => {
            onClose(e, 'backdropClick')
          }}
          size="small"
          sx={{
            ml: 2,
            color: 'border.main',
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  )
}

const ModalDialog = ({
  dialogTitle,
  hideChainIndicator,
  children,
  fullScreen = false,
  chainId,
  ...restProps
}: ModalDialogProps): ReactElement => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const isFullScreen = fullScreen || isSmallScreen

  return (
    <Dialog
      data-testid="modal-view"
      {...restProps}
      fullScreen={isFullScreen}
      scroll={fullScreen ? 'paper' : 'body'}
      className={css.dialog}
      onClick={(e) => e.stopPropagation()}
    >
      {dialogTitle && (
        <ModalDialogTitle onClose={restProps.onClose} hideChainIndicator={hideChainIndicator} chainId={chainId}>
          {dialogTitle}
        </ModalDialogTitle>
      )}

      {children}
    </Dialog>
  )
}

export default ModalDialog
