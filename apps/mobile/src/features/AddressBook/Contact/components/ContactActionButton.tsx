import React from 'react'
import { SafeButton } from '@/src/components/SafeButton'

interface ContactActionButtonProps {
  isEditing: boolean
  isValid: boolean
  onEdit?: () => void
  onSave: () => void
}

export const ContactActionButton = ({ isEditing, isValid, onEdit, onSave }: ContactActionButtonProps) => {
  if (isEditing) {
    return (
      <SafeButton primary onPress={onSave} disabled={!isValid}>
        Save contact
      </SafeButton>
    )
  }

  return (
    <SafeButton secondary onPress={onEdit}>
      Edit contact
    </SafeButton>
  )
}
