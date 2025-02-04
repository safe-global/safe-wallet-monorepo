import lightPalette from '@/components/theme/lightPalette'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import SafenetBright from '@/public/images/safenet/safenet-bright.svg'
import { Avatar, Card, CardContent, CardHeader, LinearProgress, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useState } from 'react'
import css from './styles.module.css'
import type { TxStepperProps } from './useCardStepper'
import { useCardStepper } from './useCardStepper'

export function CardStepper<StepperData>(props: TxStepperProps<StepperData>) {
  const [progressColor, setProgressColor] = useState(lightPalette.secondary.main)
  const { activeStep, onSubmit, onBack, stepData, setStep, setStepData } = useCardStepper<StepperData>(props)
  const { steps, discoverSafenet, isSafenetFlow } = props
  const currentStep = steps[activeStep]
  const progress = discoverSafenet ? (activeStep / (steps.length - 1)) * 100 : ((activeStep + 1) / steps.length) * 100

  return (
    <Card className={css.card}>
      {((discoverSafenet && activeStep === 0) || isSafenetFlow) && (
        <Box className={css.safenetHeader}>
          <Typography fontSize={14}>Powered by</Typography>
          <SafenetLogo height="14" />
        </Box>
      )}
      {!(discoverSafenet && activeStep === 0) && (
        <Box className={css.progress} color={progressColor}>
          <LinearProgress color="inherit" variant="determinate" value={Math.min(progress, 100)} />
        </Box>
      )}
      {currentStep.title && (
        <CardHeader
          title={currentStep.title}
          subheader={currentStep.subtitle}
          titleTypographyProps={{ variant: 'h4' }}
          subheaderTypographyProps={{ variant: 'body2' }}
          avatar={
            <Avatar className={css.step}>
              {discoverSafenet && activeStep === 0 ? (
                <SafenetBright className={css.avatar} />
              ) : (
                <Typography variant="body2">{discoverSafenet ? activeStep : activeStep + 1}</Typography>
              )}
            </Avatar>
          }
          className={css.header}
        />
      )}
      <CardContent className={css.content}>
        {currentStep.render({
          data: stepData,
          onSubmit,
          onBack,
          setStep,
          setProgressColor,
          setStepData,
        })}
      </CardContent>
    </Card>
  )
}
