import React from 'react'
import type { SvgIconProps } from '@mui/material'
import { Card, CardMedia, CardContent, CardActions, Typography, Button } from '@mui/material'
import css from './styles.module.css'

interface ActionCardProps {
  title: string
  description: string
  icon: React.ReactElement<SvgIconProps>
  buttonText: string
  buttonColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  buttonVariant?: 'text' | 'outlined' | 'contained'
  onClick: () => void
  iconBgColor?: string
  iconColor?: string
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  buttonText,
  buttonColor = 'primary',
  buttonVariant = 'contained',
  onClick,
  iconColor = '#ffffff',
}) => {
  // Clone the icon and apply custom styling
  const styledIcon = React.cloneElement(icon, {
    sx: {
      fontSize: 60,
      color: iconColor,
      ...icon.props.sx,
    },
  })

  return (
    <Card className={css.actionCard}>
      <CardMedia
        sx={{
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {styledIcon}
      </CardMedia>
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="large" variant={buttonVariant} color={buttonColor} fullWidth onClick={onClick}>
          {buttonText}
        </Button>
      </CardActions>
    </Card>
  )
}

export default ActionCard
