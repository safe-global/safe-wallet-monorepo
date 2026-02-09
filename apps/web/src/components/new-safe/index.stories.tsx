import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  Divider,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'

/**
 * New Safe components handle the creation and loading of Safe accounts.
 * The creation flow includes network selection, owner configuration,
 * and threshold settings.
 *
 * Key components:
 * - CardStepper: Multi-step form navigation
 * - SetNameStep: Safe name and network selection
 * - OwnerPolicyStep: Configure owners and threshold
 * - ReviewStep: Final review before creation
 *
 * Note: Actual components require wallet and form context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/NewSafe',
  parameters: {
    layout: 'padded',
  },
}

export default meta

// Mock owner data
const mockOwners = [
  { name: 'My Wallet', address: '0x1234567890123456789012345678901234567890' },
  { name: 'Hardware Wallet', address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' },
]

// Mock OwnerRow component
const MockOwnerRow = ({
  owner,
  index,
  onRemove,
  readOnly = false,
}: {
  owner: { name: string; address: string }
  index: number
  onRemove?: () => void
  readOnly?: boolean
}) => (
  <Box
    sx={{
      display: 'flex',
      gap: 2,
      alignItems: 'flex-start',
      p: 2,
      bgcolor: 'background.default',
      borderRadius: 1,
      mb: 1,
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ width: 24 }}>
      {index + 1}.
    </Typography>
    <Box sx={{ flex: 1 }}>
      {readOnly ? (
        <>
          <Typography variant="body2">{owner.name || 'Owner'}</Typography>
          <Typography variant="caption" fontFamily="monospace" color="text.secondary">
            {owner.address}
          </Typography>
        </>
      ) : (
        <>
          <TextField size="small" fullWidth defaultValue={owner.name} placeholder="Owner name" sx={{ mb: 1 }} />
          <TextField size="small" fullWidth defaultValue={owner.address} placeholder="Owner address" />
        </>
      )}
    </Box>
    {!readOnly && onRemove && index > 0 && (
      <IconButton size="small" onClick={onRemove}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    )}
  </Box>
)

// Mock ReviewRow component
const MockReviewRow = ({ name, value }: { name: string; value: React.ReactNode }) => (
  <Box sx={{ display: 'flex', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary" sx={{ width: 150 }}>
      {name}
    </Typography>
    <Box sx={{ flex: 1 }}>{value}</Box>
  </Box>
)

// Docs-style wrapper for each step
const StepWrapper = ({
  stepNumber,
  stepName,
  description,
  children,
}: {
  stepNumber: number
  stepName: string
  description: string
  children: React.ReactNode
}) => (
  <Box sx={{ mb: 8 }}>
    <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="overline" color="text.secondary">
        Step {stepNumber}
      </Typography>
      <Typography variant="h5">{stepName}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>{children}</Box>
  </Box>
)

// All Steps - Scrollable view of entire Create Safe flow with full UI at each step
export const CreateSafeAllSteps: StoryObj = {
  render: () => {
    const steps = ['Name', 'Owners', 'Review']

    return (
      <Box sx={{ maxWidth: 700 }}>
        <Box sx={{ mb: 6, pb: 3, borderBottom: '2px solid', borderColor: 'primary.main' }}>
          <Typography variant="h4">Create Safe Flow</Typography>
          <Typography variant="body1" color="text.secondary">
            Complete walkthrough of the Safe creation process. Scroll to view each step.
          </Typography>
        </Box>

        {/* Step 1: Name */}
        <StepWrapper
          stepNumber={1}
          stepName="Name & Network"
          description="User enters a name for their Safe and selects the network to deploy on."
        >
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h4" gutterBottom>
              Create new Safe
            </Typography>
            <Stepper activeStep={0} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Name your Safe
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose a name for your Safe. This is stored locally.
              </Typography>
              <TextField
                fullWidth
                label="Safe name"
                placeholder="My Safe"
                defaultValue="Team Treasury"
                sx={{ mb: 3 }}
              />
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Network</InputLabel>
                <Select defaultValue="1" label="Network">
                  <MenuItem value="1">Ethereum</MenuItem>
                  <MenuItem value="137">Polygon</MenuItem>
                  <MenuItem value="42161">Arbitrum</MenuItem>
                  <MenuItem value="10">Optimism</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mb: 3 }}>
                Your Safe will be created on the selected network. Make sure you have funds for deployment.
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained">Next</Button>
              </Box>
            </Paper>
          </Box>
        </StepWrapper>

        {/* Step 2: Owners */}
        <StepWrapper
          stepNumber={2}
          stepName="Owners & Threshold"
          description="User configures the Safe owners and sets the required number of confirmations."
        >
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h4" gutterBottom>
              Create new Safe
            </Typography>
            <Stepper activeStep={1} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Owners and confirmations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add the addresses that will own this Safe and set the number of required confirmations.
              </Typography>
              {mockOwners.map((owner, index) => (
                <MockOwnerRow key={index} owner={owner} index={index} onRemove={() => {}} />
              ))}
              <Button startIcon={<AddIcon />} sx={{ mb: 3 }}>
                Add owner
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Required confirmations
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Select defaultValue={2} size="small">
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                </Select>
                <Typography variant="body2">out of 2 owner(s)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button>Back</Button>
                <Button variant="contained">Next</Button>
              </Box>
            </Paper>
          </Box>
        </StepWrapper>

        {/* Step 3: Review */}
        <StepWrapper stepNumber={3} stepName="Review" description="User reviews all settings before creating the Safe.">
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h4" gutterBottom>
              Create new Safe
            </Typography>
            <Stepper activeStep={2} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Review
              </Typography>
              <MockReviewRow name="Safe name" value={<Typography variant="body2">Team Treasury</Typography>} />
              <MockReviewRow name="Network" value={<Chip label="Ethereum" size="small" />} />
              <MockReviewRow
                name="Owners"
                value={
                  <Box>
                    {mockOwners.map((owner, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <Typography variant="body2">{owner.name}</Typography>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {owner.address}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                }
              />
              <MockReviewRow name="Threshold" value={<Typography variant="body2">2 out of 2</Typography>} />
              <Alert severity="warning" sx={{ mt: 3, mb: 3 }}>
                You will need to pay network fees to deploy this Safe.
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button>Back</Button>
                <Button variant="contained">Create Safe</Button>
              </Box>
            </Paper>
          </Box>
        </StepWrapper>

        {/* Step 4: Success */}
        <StepWrapper stepNumber={4} stepName="Success" description="Confirmation screen shown after Safe is created.">
          <Box sx={{ maxWidth: 600 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Safe created successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your new Safe is ready to use.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Safe address
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  0x1234567890123456789012345678901234567890
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<AccountBalanceWalletIcon />}>
                Open Safe
              </Button>
            </Paper>
          </Box>
        </StepWrapper>
      </Box>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'All steps of the Create Safe flow displayed vertically with full UI state at each step.',
      },
    },
  },
}

// Interactive version - Create Safe Flow
export const CreateSafeInteractive: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [step, setStep] = useState(0)
    const [owners, setOwners] = useState(mockOwners)
    const [threshold, setThreshold] = useState(2)

    const steps = ['Name', 'Owners', 'Review']

    const addOwner = () => {
      setOwners([...owners, { name: '', address: '' }])
    }

    const removeOwner = (index: number) => {
      setOwners(owners.filter((_, i) => i !== index))
    }

    return (
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="h4" gutterBottom>
          Create new Safe
        </Typography>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3 }}>
          {step === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Name your Safe
              </Typography>
              <TextField fullWidth label="Safe name" placeholder="My Safe" sx={{ mb: 3 }} />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Network</InputLabel>
                <Select defaultValue="1" label="Network">
                  <MenuItem value="1">Ethereum</MenuItem>
                  <MenuItem value="137">Polygon</MenuItem>
                  <MenuItem value="42161">Arbitrum</MenuItem>
                  <MenuItem value="10">Optimism</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 3 }}>
                Your Safe will be created on the selected network. Make sure you have funds for deployment.
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={() => setStep(1)}>
                  Next
                </Button>
              </Box>
            </>
          )}

          {step === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Owners and confirmations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add the addresses that will own this Safe and set the number of required confirmations.
              </Typography>

              {owners.map((owner, index) => (
                <MockOwnerRow key={index} owner={owner} index={index} onRemove={() => removeOwner(index)} />
              ))}

              <Button startIcon={<AddIcon />} onClick={addOwner} sx={{ mb: 3 }}>
                Add owner
              </Button>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom>
                Required confirmations
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} size="small">
                  {owners.map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {i + 1}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="body2">out of {owners.length} owner(s)</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setStep(0)}>Back</Button>
                <Button variant="contained" onClick={() => setStep(2)}>
                  Next
                </Button>
              </Box>
            </>
          )}

          {step === 2 && (
            <>
              <Typography variant="h6" gutterBottom>
                Review
              </Typography>

              <MockReviewRow name="Safe name" value={<Typography variant="body2">My Safe</Typography>} />
              <MockReviewRow name="Network" value={<Chip label="Ethereum" size="small" />} />
              <MockReviewRow
                name="Owners"
                value={
                  <Box>
                    {owners.map((owner, i) => (
                      <Typography key={i} variant="body2" fontFamily="monospace">
                        {owner.address.slice(0, 10)}...{owner.address.slice(-8)}
                      </Typography>
                    ))}
                  </Box>
                }
              />
              <MockReviewRow
                name="Threshold"
                value={
                  <Typography variant="body2">
                    {threshold} out of {owners.length}
                  </Typography>
                }
              />

              <Alert severity="warning" sx={{ mt: 3, mb: 3 }}>
                You will need to pay network fees to deploy this Safe.
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setStep(1)}>Back</Button>
                <Button variant="contained">Create Safe</Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive Safe creation flow - click through to see each step.',
      },
    },
  },
}

// Load Safe Flow
export const LoadSafeFlow: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Add existing Safe
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enter Safe address
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Paste the address of an existing Safe you want to add to your account.
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Network</InputLabel>
          <Select defaultValue="1" label="Network">
            <MenuItem value="1">Ethereum</MenuItem>
            <MenuItem value="137">Polygon</MenuItem>
            <MenuItem value="42161">Arbitrum</MenuItem>
          </Select>
        </FormControl>

        <TextField fullWidth label="Safe address" placeholder="0x..." sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained">Add Safe</Button>
        </Box>
      </Paper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Load an existing Safe by entering its address.',
      },
    },
  },
}

// Step 1: Name
export const SetNameStep: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Name your Safe
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a name for your Safe. This is stored locally.
      </Typography>

      <TextField fullWidth label="Safe name" placeholder="My Safe" defaultValue="Team Treasury" sx={{ mb: 3 }} />

      <FormControl fullWidth>
        <InputLabel>Network</InputLabel>
        <Select defaultValue="1" label="Network">
          <MenuItem value="1">Ethereum</MenuItem>
          <MenuItem value="137">Polygon</MenuItem>
          <MenuItem value="42161">Arbitrum</MenuItem>
        </Select>
      </FormControl>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'First step: set Safe name and select network.',
      },
    },
  },
}

// Step 2: Owners
export const OwnerPolicyStep: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Owners
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add owners and set the required confirmations.
      </Typography>

      {mockOwners.map((owner, index) => (
        <MockOwnerRow key={index} owner={owner} index={index} onRemove={() => {}} />
      ))}

      <Button startIcon={<AddIcon />} sx={{ mb: 3 }}>
        Add owner
      </Button>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Required confirmations
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Select defaultValue={2} size="small">
          <MenuItem value={1}>1</MenuItem>
          <MenuItem value={2}>2</MenuItem>
        </Select>
        <Typography variant="body2">out of 2 owner(s)</Typography>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Second step: configure owners and threshold.',
      },
    },
  },
}

// Step 3: Review
export const ReviewStep: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Review Safe configuration
      </Typography>

      <MockReviewRow name="Safe name" value={<Typography variant="body2">Team Treasury</Typography>} />
      <MockReviewRow name="Network" value={<Chip label="Ethereum" size="small" />} />
      <MockReviewRow
        name="Owners"
        value={
          <Box>
            {mockOwners.map((owner, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <Typography variant="body2">{owner.name}</Typography>
                <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                  {owner.address}
                </Typography>
              </Box>
            ))}
          </Box>
        }
      />
      <MockReviewRow name="Threshold" value={<Typography variant="body2">2 out of 2</Typography>} />

      <Alert severity="info" sx={{ mt: 3 }}>
        Estimated network fee: ~0.01 ETH
      </Alert>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Final review step before Safe creation.',
      },
    },
  },
}

// Owner row variants
export const OwnerRowVariants: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="subtitle2" gutterBottom>
        Editable Owner Row
      </Typography>
      <MockOwnerRow owner={mockOwners[0]} index={0} onRemove={() => {}} />

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
        Read-only Owner Row
      </Typography>
      <MockOwnerRow owner={mockOwners[0]} index={0} readOnly />
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Owner row in editable and read-only modes.',
      },
    },
  },
}

// Review row component
export const ReviewRowComponent: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <MockReviewRow name="Safe name" value={<Typography variant="body2">My Safe</Typography>} />
      <MockReviewRow name="Network" value={<Chip label="Ethereum" size="small" />} />
      <MockReviewRow name="Balance" value={<Typography variant="body2">$125,000</Typography>} />
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ReviewRow displays labeled data in a consistent format.',
      },
    },
  },
}

// Creation success
export const CreationSuccess: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Safe created successfully!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your new Safe is ready to use.
      </Typography>

      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Safe address
        </Typography>
        <Typography variant="body2" fontFamily="monospace">
          0x1234567890123456789012345678901234567890
        </Typography>
      </Box>

      <Button variant="contained" startIcon={<AccountBalanceWalletIcon />}>
        Open Safe
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success screen after Safe creation.',
      },
    },
  },
}

// Card stepper
export const CardStepper: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Box sx={{ maxWidth: 600 }}>
      <Stepper activeStep={1}>
        <Step>
          <StepLabel>Name</StepLabel>
        </Step>
        <Step>
          <StepLabel>Owners</StepLabel>
        </Step>
        <Step>
          <StepLabel>Review</StepLabel>
        </Step>
      </Stepper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Step progress indicator for multi-step flows.',
      },
    },
  },
}
