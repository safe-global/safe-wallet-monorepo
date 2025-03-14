import lightPalette from '@/components/theme/lightPalette'
import { Avatar, Card, CardContent, CardHeader, LinearProgress, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useState } from 'react'
import css from './styles.module.css'
import type { TxStepperProps } from './useCardStepper'
import { useCardStepper } from './useCardStepper'

export function CardStepper<StepperData>(props: TxStepperProps<StepperData>) {
  const [progressColor, setProgressColor] = useState(lightPalette.secondary.main)
  const { activeStep, onSubmit, onBack, stepData, setStep, setStepData } = useCardStepper<StepperData>(props)
  const { steps, customProgressBar } = props
  const currentStep = steps[activeStep]
  const progress = ((activeStep + 1) / steps.length) * 100

  return (
    <Card className={css.card}>
      {customProgressBar !== undefined ? (
        customProgressBar
      ) : (
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
              <Typography variant="body2">{activeStep + 1}</Typography>
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
