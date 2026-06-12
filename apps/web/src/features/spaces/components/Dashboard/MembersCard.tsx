import classnames from 'classnames'
import css from './styles.module.css'
import MemberIcon from '@/public/images/spaces/member.svg'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'
import { useIsAdmin } from '@/features/spaces'
import AddMemberModal from '../AddMemberModal'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const MembersCard = () => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const isAdmin = useIsAdmin()
  const isButtonDisabled = !isAdmin

  const handleInviteClick = () => {
    setOpenAddMembersModal(true)
  }

  const addButton = (
    <Track {...SPACE_EVENTS.ADD_MEMBER_MODAL} label={SPACE_LABELS.space_dashboard_card}>
      <Button
        data-testid="add-member-button"
        onClick={handleInviteClick}
        variant={isButtonDisabled ? 'default' : 'outline'}
        size="lg"
        aria-label="Invite team members"
        disabled={isButtonDisabled}
      >
        Add members
      </Button>
    </Track>
  )

  return (
    <>
      <div className="rounded-3xl bg-card p-6">
        <div className="relative w-full">
          <div className={classnames(css.iconBG, css.iconBGBlue)}>
            <MemberIcon className="text-[var(--color-info-main)]" />
          </div>
          <span className="absolute right-0 top-0 inline-flex">
            {isButtonDisabled ? (
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex" />}>{addButton}</TooltipTrigger>
                <TooltipContent>You need to be an Admin to add members</TooltipContent>
              </Tooltip>
            ) : (
              addButton
            )}
          </span>
        </div>
        <div>
          <Typography variant="paragraph-bold" className="mb-2 text-foreground">
            Add members
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            Invite team members to help manage your Safe Accounts. You can add both Safe Account signers and external
            collaborators.
          </Typography>
        </div>
      </div>
      {openAddMembersModal && <AddMemberModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default MembersCard
