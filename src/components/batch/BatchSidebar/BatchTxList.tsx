import { Reorder } from 'framer-motion'
import type { DraftBatchItem } from '@/store/batchSlice'
import BatchTxItem from './BatchTxItem'
import { useState } from 'react'
import { List } from '@mui/material'

const BatchTxList = ({ txItems, onDelete }: { txItems: DraftBatchItem[]; onDelete?: (id: string) => void }) => {
  return (
    <>
      <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {txItems.map((item, index) => (
          <BatchTxItem key={item.id} count={index + 1} {...item} onDelete={onDelete} />
        ))}
      </List>
    </>
  )
}

export const BatchReorder = ({
  txItems,
  onDelete,
  onReorder,
}: {
  txItems: DraftBatchItem[]
  onDelete?: (id: string) => void
  onReorder: (items: DraftBatchItem[]) => void
}) => {
  const [dragging, setDragging] = useState(false)

  return (
    <Reorder.Group axis="y" values={txItems} onReorder={onReorder}>
      {txItems.map((item, index) => (
        <Reorder.Item
          key={item.id}
          value={item}
          onDragStart={() => setDragging(true)}
          onDragEnd={() => setDragging(false)}
        >
          <BatchTxItem count={index + 1} {...item} onDelete={onDelete} draggable dragging={dragging} />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  )
}

export default BatchTxList
