import { useContext, useRef } from 'react'
import { alpha } from '@mui/material'
import Hidden from '@mui/material/Hidden'
import styled from 'styled-components'
import { useTheme } from '@mui/material/styles'

import { ReactComponent as CreateNewBatchLightSvg } from '../assets/new-batch-light.svg'
import { ReactComponent as CreateNewBatchDarkSvg } from '../assets/new-batch-dark.svg'
import { ReactComponent as ArrowBlock } from '../assets/arrowtotheblock.svg'
import useDropZone from '../hooks/useDropZone'
import { useMediaQuery } from '@mui/material'
import { Icon } from './Icon'
import Text from './Text'
import ButtonLink from './buttons/ButtonLink'
import { EModes, ThemeModeContext } from '../theme/SafeThemeProvider'

type CreateNewBatchCardProps = {
  onFileSelected: (file: File | null) => void
}

const CreateNewBatchCard = ({ onFileSelected }: CreateNewBatchCardProps) => {
  const theme = useTheme()
  const mode = useContext(ThemeModeContext)
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const fileRef = useRef<HTMLInputElement | null>(null)
  const { isOverDropZone, isAcceptError, dropHandlers } = useDropZone((file: File | null) => {
    onFileSelected(file)
  }, '.json')

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (event.target.files?.length) {
      onFileSelected(event.target.files[0])
      event.target.value = ''
    }
  }

  const handleBrowse = function (event: React.MouseEvent) {
    event.preventDefault()
    fileRef.current?.click()
  }

  return (
    <Wrapper isSmallScreen={isSmallScreen}>
      <Hidden smDown>
        {mode === EModes.DARK ? <CreateNewBatchDarkSvg /> : <CreateNewBatchLightSvg />}
        <StyledArrowBlock />
      </Hidden>

      <StyledCreateBatchContent>
        <StyledText variant="body1">Start creating a new batch </StyledText>
        <StyledText variant="body1">or</StyledText>
        <StyledDragAndDropFileContainer
          {...dropHandlers}
          dragOver={isOverDropZone}
          fullWidth={isSmallScreen}
          error={isAcceptError}
        >
          {isAcceptError ? (
            <StyledText variant="body1" error={isAcceptError}>
              The uploaded file is not a valid JSON file
            </StyledText>
          ) : (
            <>
              <Icon type="termsOfUse" size="sm" />
              <StyledText variant="body1">Drag and drop a JSON file or</StyledText>
              <StyledButtonLink color="secondary" onClick={handleBrowse}>
                choose a file
              </StyledButtonLink>
            </>
          )}
        </StyledDragAndDropFileContainer>
        <input ref={fileRef} id="logo-input" type="file" onChange={handleFileSelected} accept=".json" hidden />
      </StyledCreateBatchContent>
    </Wrapper>
  )
}

export default CreateNewBatchCard

const Wrapper = styled.div<{ isSmallScreen: boolean }>`
  text-align: center;
  position: relative;
  margin-top: ${({ isSmallScreen }) => (isSmallScreen ? '0' : '64px')};
`

const StyledArrowBlock = styled(ArrowBlock)`
  position: absolute;
  left: -2px;
  top: 7rem;
`

const StyledCreateBatchContent = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const StyledDragAndDropFileContainer = styled.div<{
  dragOver: boolean
  fullWidth: boolean
  error: boolean
}>`
  box-sizing: border-box;
  max-width: ${({ fullWidth }) => (fullWidth ? '100%' : '430px')};
  width: 100%;
  border: 2px dashed ${({ theme, error }) => (error ? theme.palette.error.main : theme.palette.secondary.dark)};
  border-radius: 8px;
  background-color: ${({ theme, error }) =>
    error ? alpha(theme.palette.error.main, 0.7) : theme.palette.secondary.background};
  padding: 24px;
  margin: 6px auto;

  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    margin-right: 4px;
  }

  ${({ dragOver, error, theme }) => {
    if (dragOver) {
      return `
        transition: all 0.2s ease-in-out;
        transform: scale(1.05);
      `
    }

    return `
      border-color: ${error ? theme.palette.error.main : theme.palette.secondary.dark};
      background-color: ${error ? alpha(theme.palette.error.main, 0.7) : theme.palette.secondary.background};
    `
  }}
`

const StyledText = styled(Text)<{ error?: boolean }>`
  && {
    color: ${({ error, theme }) => (error ? theme.palette.common.white : theme.palette.text.secondary)};
  }
`

const StyledButtonLink = styled(ButtonLink)`
  margin-left: 0.3rem;
  padding: 0;

  && > p {
    color: ${({ theme }) => theme.palette.upload.primary};
    text-decoration: underline;

    &:hover {
      color: ${({ theme }) => theme.palette.backdrop.main};
    }
  }
`
