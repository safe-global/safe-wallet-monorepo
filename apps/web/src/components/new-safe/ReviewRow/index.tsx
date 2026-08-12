import React, { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'

const ReviewRow = ({ name, value }: { name?: string; value: ReactElement }) => {
  return (
    <>
      {name && (
        <div className="col-span-3">
          <Typography variant="paragraph-small">{name}</Typography>
        </div>
      )}
      <div className={name ? 'col-span-9' : 'col-span-12'}>{value}</div>
    </>
  )
}

export default ReviewRow
