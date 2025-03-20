import { AppRoutes } from '@/config/routes'
import { Box, Card, hslToRgb, Stack, Typography } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'
import Link from 'next/link'

import css from './styles.module.css'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import classNames from 'classnames'
import { useSpaceSafeCount } from '@/features/spaces/hooks/useSpaceSafeCount'

/**
 * Returns a deterministic "random" color (in Hex format) based on a string.
 * The color is constrained so it won't be too dark or too light or too saturated.
 */
export function getDeterministicColor(str: string): string {
  const sum = [...str].reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const hue = sum % 360
  const saturation = 40 + (sum % 31)
  const lightness = 40 + (sum % 31)

  return hslToRgb(`hsl(${hue}, ${saturation}, ${lightness})`)
}

export const InitialsAvatar = ({
  name,
  size = 'large',
  rounded = false,
}: {
  name: string
  size?: 'small' | 'medium' | 'large'
  rounded?: boolean
}) => {
  const logoLetters = name.slice(0, 1)
  const logoColor = getDeterministicColor(name)
  const dimensions = {
    small: { width: 24, height: 24, fontSize: '12px !important' },
    medium: { width: 32, height: 32, fontSize: '16px !important' },
    large: { width: 48, height: 48, fontSize: '20px !important' },
  }

  const { width, height, fontSize } = dimensions[size]

  return (
    <Box
      className={css.initialsAvatar}
      bgcolor={logoColor}
      width={width}
      height={height}
      fontSize={fontSize}
      borderRadius={rounded ? '50%' : '6px'}
    >
      {logoLetters}
    </Box>
  )
}

export const SpaceSummary = ({
  name,
  numberOfAccounts,
  numberOfMembers,
  isCompact = false,
}: {
  name: string
  numberOfAccounts: number
  numberOfMembers: number
  isCompact?: boolean
}) => {
  return (
    <Box className={css.spaceInfo}>
      <Typography variant="body2" fontWeight="bold">
        {name}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" mt={isCompact ? 0 : 0.5}>
        <Typography variant="caption" color="text.secondary">
          {numberOfAccounts} Accounts
        </Typography>

        <div className={css.dot} />

        <Typography variant="caption" color="text.secondary">
          {numberOfMembers} Members
        </Typography>
      </Stack>
    </Box>
  )
}

const SpaceCard = ({
  space,
  isCompact = false,
  isLink = true,
}: {
  space: GetOrganizationResponse
  isCompact?: boolean
  isLink?: boolean
}) => {
  const { id, name, userOrganizations: members } = space
  const numberOfMembers = members.length
  const numberOfAccounts = useSpaceSafeCount(id)

  return (
    <Card className={classNames(css.card, { [css.compact]: isCompact })}>
      {isLink && <Link className={css.cardLink} href={{ pathname: AppRoutes.spaces.index, query: { spaceId: id } }} />}

      <InitialsAvatar name={name} size={isCompact ? 'medium' : 'large'} />

      <SpaceSummary
        name={name}
        numberOfAccounts={numberOfAccounts}
        numberOfMembers={numberOfMembers}
        isCompact={isCompact}
      />

      <IconButton className={css.spaceActions} size="small" onClick={() => {}}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
    </Card>
  )
}

export default SpaceCard
