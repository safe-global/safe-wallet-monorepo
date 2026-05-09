const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        className={`size-1.5 rounded-full ${i + 1 === currentStep ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
      />
    ))}
  </div>
)

export default StepIndicator
