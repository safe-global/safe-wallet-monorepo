// services/onboardPrivy.js
import { PRIVY_APP_ID } from '@/config/constants'
import { PrivyClient } from '@privy-io/react-auth'

export const initPrivy = async () => {
  const client = new PrivyClient({
    appId: PRIVY_APP_ID,
  })

  // Asume que tienes una función que maneja la lógica de autenticación
  return await authenticateWithPrivy(client)
}

const authenticateWithPrivy = async (client) => {
  try {
    // Logic to authenticate and handle Privy sessions
    const session = await client.signIn()
    return session
  } catch (error) {
    console.error('Failed to initialize Privy client:', error)
    throw error
  }
}

export default initPrivy
