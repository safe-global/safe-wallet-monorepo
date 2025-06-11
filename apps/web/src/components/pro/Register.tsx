import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  FormHelperText,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import Grid from '@mui/material/Grid2'
import css from './styles.module.css'
import { createCustomer } from '@/services/pro/api'
import type { CreateCustomerInputDto, CreateCustomerResultDto } from './types'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

const Register = ({ onRegistered }: { onRegistered: (safeAddress: string) => void }) => {
  const spaceId = useCurrentSpaceId()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateCustomerInputDto>({
    spaceId: spaceId as string,
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
    customerType: 'individual',
    name: '',
    companyName: '',
    taxId: '',
    vatId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const input: CreateCustomerInputDto = {
        spaceId: spaceId as string,
        email: formData.email,
        address: {
          line1: formData.address.line1,
          city: formData.address.city,
          state: formData.address.state,
          postal_code: formData.address.postal_code,
          country: formData.address.country,
        },
        customerType: formData.customerType,
        name: formData.name,
        companyName: formData.customerType === 'company' ? formData.companyName : undefined,
        taxId: formData.taxId || undefined,
        vatId: formData.customerType === 'company' ? formData.vatId : undefined,
      }

      const result: CreateCustomerResultDto = await createCustomer(input)
      onRegistered(result.safeAddress)
    } catch (error) {
      console.error('Error creating customer:', error)
      setError('An error occurred while registering. Please try again.')
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    console.log('handleChange', name, value)

    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof CreateCustomerInputDto] as Record<string, any>),
          [child]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleAccountTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newAccountType: 'individual' | 'company' | null,
  ) => {
    if (newAccountType !== null) {
      setFormData({
        ...formData,
        customerType: newAccountType,
        // Reset company-specific fields when switching to individual
        ...(newAccountType === 'individual' ? { companyName: '', vat_id: '' } : {}),
      })
    }
  }

  return (
    <Box className={css.registerContainer}>
      <Paper elevation={3} className={css.registerPaper}>
        <Typography variant="h4" component="h1" align="center" gutterBottom fontWeight="500">
          Create account
        </Typography>

        {error && (
          <Alert severity="error" className={css.registerAlert} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <ToggleButtonGroup
                exclusive
                value={formData.customerType}
                onChange={handleAccountTypeChange}
                aria-label="account type"
                fullWidth
                color="primary"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="individual" aria-label="individual account">
                  <PersonIcon sx={{ mr: 1 }} />
                  Individual
                </ToggleButton>
                <ToggleButton value="company" aria-label="company account">
                  <BusinessIcon sx={{ mr: 1 }} />
                  Company
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {formData.customerType === 'company' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  required
                  autoFocus
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                label={formData.customerType === 'individual' ? 'Full Name' : 'Contact Person'}
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                required
                autoFocus={formData.customerType === 'individual'}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                required
              />
            </Grid>

            {formData.customerType === 'company' && (
              <Grid container spacing={2} sx={{ mt: 1, ml: 0 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="VAT ID"
                    name="vat_id"
                    value={formData.vatId}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    placeholder="e.g. EU123456789"
                    helperText="For European companies"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Tax ID / EIN"
                    name="tax_id"
                    value={formData.taxId}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    placeholder="e.g. 12-3456789"
                  />
                </Grid>
              </Grid>
            )}

            {formData.customerType === 'individual' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tax ID / SSN (optional)"
                  name="tax_id"
                  value={formData.taxId}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  placeholder="e.g. 123-45-6789"
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom className={css.addressTitle}>
                Billing Address <span className={css.optionalLabel}>(optional)</span>
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address Line 1"
                name="address.line1"
                value={formData.address.line1}
                onChange={handleChange}
                placeholder="Street address, P.O. box, company name"
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="State / Province"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="ZIP / Postal Code"
                name="address.postal_code"
                value={formData.address.postal_code}
                onChange={handleChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box className={css.registerButtonContainer}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={
                    isLoading ||
                    !formData.email ||
                    !formData.name ||
                    (formData.customerType === 'company' && !formData.companyName)
                  }
                  className={css.registerButton}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register & Continue'}
                </Button>
              </Box>
              <FormHelperText className={css.requiredHelperText}>
                {formData.customerType === 'individual'
                  ? '* Email and name are required'
                  : '* Email, company name, and contact person are required'}
              </FormHelperText>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default Register
