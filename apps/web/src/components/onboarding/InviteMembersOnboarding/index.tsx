import { useEffect, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { RoleMenuItem } from '@/features/spaces/components/AddMemberModal'
import css from '@/features/spaces/components/AddMemberModal/styles.module.css'

interface MemberInvite {
  address: string
  role: MemberRole
}

interface InviteMembersFormValues {
  members: MemberInvite[]
}

const InviteMembersOnboarding = (): ReactElement => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const spaceId = router.query.spaceId as string | undefined

  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteMembers] = useMembersInviteUserV1Mutation()

  const methods = useForm<InviteMembersFormValues>({
    mode: 'onChange',
    defaultValues: {
      members: [{ address: '', role: MemberRole.MEMBER }],
    },
  })

  const { handleSubmit, control, formState } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'members' })

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!wallet || !isUserAuthenticated) {
      router.replace({ pathname: AppRoutes.welcome.index })
    }
  }, [wallet, isUserAuthenticated, router])

  // Redirect to create-space if no spaceId
  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.onboarding.createSpace })
    }
  }, [router, spaceId])

  const redirectToSpaceDashboard = () => {
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }

  const goBack = () => {
    router.push({ pathname: AppRoutes.onboarding.selectSafes, query: { spaceId } })
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    const validMembers = data.members.filter((m) => m.address.trim() !== '')
    if (validMembers.length === 0) {
      redirectToSpaceDashboard()
      return
    }

    setError(undefined)
    setIsSubmitting(true)

    try {
      trackEvent({ ...SPACE_EVENTS.ADD_MEMBER })

      const usersToInvite = validMembers.map((member) => ({
        address: member.address,
        name: member.address,
        role: member.role,
      }))

      const result = await inviteMembers({
        spaceId: Number(spaceId),
        inviteUsersDto: { users: usersToInvite },
      })

      if (result.error) {
        // @ts-ignore
        const errorMessage = result.error?.data?.message || 'Failed to invite members. Please try again.'
        setError(errorMessage)
        return
      }

      dispatch(
        showNotification({
          message: `Invited ${validMembers.length} member(s) to space`,
          variant: 'success',
          groupKey: 'invite-member-success',
        }),
      )

      redirectToSpaceDashboard()
    } catch {
      setError('Something went wrong inviting members. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  if (!wallet || !isUserAuthenticated || !spaceId) {
    return <></>
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" p={3}>
      <Paper sx={{ maxWidth: 500, width: '100%', p: 4, position: 'relative' }}>
        <IconButton onClick={goBack} sx={{ position: 'absolute', top: 16, left: 16 }} aria-label="Go back">
          <ArrowBackIcon />
        </IconButton>

        <Box textAlign="center" mb={3}>
          <Typography variant="h3" fontWeight={700} mb={1}>
            Invite team members
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Add people to collaborate on this space.
          </Typography>
        </Box>

        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <Stack spacing={2} mb={2}>
              {fields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1} alignItems="center">
                  <TextField
                    {...methods.register(`members.${index}.address`, {
                      required: index === 0,
                    })}
                    placeholder="Type wallet address"
                    variant="outlined"
                    size="small"
                    fullWidth
                    data-testid={`invite-address-input-${index}`}
                  />

                  <Controller
                    control={control}
                    name={`members.${index}.role`}
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <Select
                        {...fieldProps}
                        value={value}
                        onChange={onChange}
                        size="small"
                        sx={{ minWidth: '140px' }}
                        renderValue={(role) => <RoleMenuItem role={role as MemberRole} />}
                      >
                        <MenuItem value={MemberRole.ADMIN} className={css.menuItem}>
                          <RoleMenuItem role={MemberRole.ADMIN} hasDescription selected={value === MemberRole.ADMIN} />
                        </MenuItem>
                        <MenuItem value={MemberRole.MEMBER} className={css.menuItem}>
                          <RoleMenuItem
                            role={MemberRole.MEMBER}
                            hasDescription
                            selected={value === MemberRole.MEMBER}
                          />
                        </MenuItem>
                      </Select>
                    )}
                  />

                  {fields.length > 1 && (
                    <IconButton
                      onClick={() => remove(index)}
                      size="small"
                      aria-label="Remove member"
                      data-testid={`remove-member-${index}`}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>

            <Button
              startIcon={<AddIcon />}
              onClick={() => append({ address: '', role: MemberRole.MEMBER })}
              sx={{ mb: 3 }}
              data-testid="add-another-member"
            >
              Add another
            </Button>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                data-testid="invite-members-continue-button"
                type="submit"
                variant="contained"
                disabled={!formState.isValid || isSubmitting}
                disableElevation
                fullWidth
                sx={{ minHeight: '42px' }}
              >
                {isSubmitting ? <CircularProgress size={20} /> : 'Continue'}
              </Button>

              <Button
                data-testid="invite-members-skip-button"
                onClick={redirectToSpaceDashboard}
                disabled={isSubmitting}
                fullWidth
                sx={{ minHeight: '42px' }}
              >
                Skip
              </Button>
            </Box>
          </form>
        </FormProvider>
      </Paper>
    </Box>
  )
}

export default InviteMembersOnboarding
