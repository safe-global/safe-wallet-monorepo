import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { FETCH_STATUS, isValidAddress } from '../utils'
import { useNetwork } from '../store'

const isAxiosError = (e: unknown): e is AxiosError => e != null && typeof e === 'object' && 'request' in e

const useAbi = (address: string) => {
  const [abi, setAbi] = useState('')
  const { interfaceRepo } = useNetwork()
  const [abiStatus, setAbiStatus] = useState<FETCH_STATUS>(FETCH_STATUS.NOT_ASKED)

  useEffect(() => {
    const loadContract = async (address: string) => {
      if (!isValidAddress(address) || !interfaceRepo) {
        return
      }

      setAbi('')
      setAbiStatus(FETCH_STATUS.LOADING)
      try {
        const abiResponse = await interfaceRepo.loadAbi(address)

        if (abiResponse) {
          setAbi(abiResponse)
        }
        setAbiStatus(FETCH_STATUS.SUCCESS)
      } catch (e) {
        if (isAxiosError(e) && e.request.status === 404) {
          // Handle the case where the request is successful but the ABI is not found
          setAbiStatus(FETCH_STATUS.SUCCESS)
        } else {
          setAbiStatus(FETCH_STATUS.ERROR)
          console.error(e)
        }
      }
    }

    loadContract(address)
  }, [address, interfaceRepo])

  return { abi, abiStatus, setAbi }
}

export { useAbi }
