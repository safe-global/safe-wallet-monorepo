import { useEffect, useState } from 'react'
import { Image } from 'react-native'

const useValidLogoUri = (logoUri?: string | null) => {
  const [validUri, setValidUri] = useState<string | null>(null)

  useEffect(() => {
    if (!logoUri) {
      return
    }

    Image.getSize(
      logoUri,
      () => setValidUri(logoUri),
      () => setValidUri(null),
    )
  }, [logoUri])

  return validUri
}

export default useValidLogoUri
