import styled from 'styled-components'

export type EditableLabelProps = {
  children: React.ReactNode
  onEdit: (value: string) => void
}

const EditableLabel = ({ children, onEdit }: EditableLabelProps) => {
  return (
    <EditableComponent
      contentEditable="true"
      suppressContentEditableWarning={true}
      onBlur={(event) => onEdit(event.target.innerText)}
      onKeyPress={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
          ;(event.target as HTMLDivElement).blur()
          event.preventDefault()
        }
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </EditableComponent>
  )
}

export default EditableLabel

const EditableComponent = styled.div`
  font-family: Averta, 'Roboto', sans-serif;
  display: block;
  white-space: nowrap;
  overflow: hidden;

  padding: 10px;
  cursor: text;
  border-radius: 8px;
  border: 1px solid transparent;

  &:hover {
    border-color: #e2e3e3;
  }

  &:focus {
    outline-color: #008c73;
  }
`
