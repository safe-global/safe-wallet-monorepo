import { Button, type ButtonProps } from '@mui/material'
import { useState, useCallback, useEffect, type ReactNode } from 'react'

// TODO: Extract into a hook so it can be reused for links and not just buttons
const CooldownButton = ({
  onClick,
  cooldown,
  startDisabled = false,
  children,
  ...props
}: ButtonProps & {
  onClick?: () => void
  startDisabled?: boolean
  cooldown: number // Cooldown in seconds
  children: ReactNode
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(startDisabled ? cooldown : 0)
  const [lastSendTime, setLastSendTime] = useState(startDisabled ? Date.now() : 0)

  const adjustSeconds = useCallback(() => {
    const remainingCoolDownSeconds = Math.max(0, cooldown * 1000 - (Date.now() - lastSendTime)) / 1000
    setRemainingSeconds(remainingCoolDownSeconds)
  }, [cooldown, lastSendTime])

  useEffect(() => {
    // Counter for progress
    const interval = setInterval(adjustSeconds, 1000)
    return () => clearInterval(interval)
  }, [adjustSeconds])

  const handleClick = () => {
    setLastSendTime(Date.now())
    setRemainingSeconds(cooldown)
    onClick?.()
  }

  const isDisabled = remainingSeconds > 0

  return (
    <Button onClick={handleClick} variant="contained" size="small" disabled={isDisabled} {...props}>
      <span>
        {children}
        {remainingSeconds > 0 && ` in ${Math.floor(remainingSeconds)}s`}
      </span>
    </Button>
  )
}

export default CooldownButton
