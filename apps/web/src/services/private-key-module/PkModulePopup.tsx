import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'
import pkStore from './pk-popup-store'
const { useStore, setStore } = pkStore

const PkModulePopup = () => {
  const { isOpen, privateKey } = useStore() ?? { isOpen: false, privateKey: '' }

  const onClose = () => {
    setStore({ isOpen: false, privateKey })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const privateKey = (e.target as unknown as { 'private-key': HTMLInputElement })['private-key'].value

    setStore({
      isOpen: false,
      privateKey,
    })
  }

  return (
    <ModalDialog dialogTitle="Connect with Private Key" onClose={onClose} open={isOpen}>
      <div className="p-4">
        <Typography className="mb-6">
          Enter your signer private key. The key will be saved for the duration of this browser session.
        </Typography>

        <form onSubmit={onSubmit} action="#" method="post">
          <Field className="mb-6">
            <FieldLabel htmlFor="private-key">Private key</FieldLabel>
            <Input type="password" required id="private-key" name="private-key" data-testid="private-key-input" />
          </Field>

          <Button data-testid="pk-connect-btn" type="submit" className="w-full">
            Connect
          </Button>
        </form>
      </div>
    </ModalDialog>
  )
}

export default PkModulePopup
