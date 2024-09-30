import {
  Box,
  Button,
  CardActions,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  SvgIcon,
  Typography,
} from '@mui/material'
import css from './styles.module.css'
import { TxLayoutHeader } from '@/components/tx-flow/common/TxLayout'
import { ImageData } from '@nouns/assets'
import TxCard from '@/components/tx-flow/common/TxCard'
import NounsAvatar from '@/components/common/NounsAvatar'
import { NounProps, PART_MAP } from '@/components/new-safe/create/steps/AvatarStep'
import { useContext, useEffect, useMemo, useState } from 'react'
import ArrowForward from '@/public/images/common/right-arrow.svg'
import ArrowBack from '@/public/images/common/left-arrow.svg'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import Save from '@/public/images/common/save.svg'
import { head } from 'lodash'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import { Address } from 'viem'
import { TxModalContext } from '@/components/tx-flow'
import LoadingModal from '@/components/common/LoadingModal'
import FailedTxnModal from '@/components/common/ErrorModal'
import SuccessTxn from '../TopUpModal/states/SuccessTxn'
import SuccessTxnModal from '@/components/common/SuccessTxnModal'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useQueryClient } from '@tanstack/react-query'

const TRAIT_LIMITS = {
  head: { min: 0, max: ImageData.images.heads.length - 1 },
  body: { min: 0, max: ImageData.images.bodies.length - 1 },
  accessory: { min: 0, max: ImageData.images.accessories.length - 1 },
  glasses: { min: 0, max: ImageData.images.glasses.length - 1 },
  background: { min: 0, max: ImageData.bgcolors.length - 1 },
}

enum ModalState {
  Loading,
  Success,
  Error,
}

const UpdateAvatarModal = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const { data, loading } = useAppSelector(selectSuperChainAccount)
  const { safe } = useSafeInfo()
  const { address } = safe
  const queryClient = useQueryClient()
  const { getSponsoredWriteableSuperChainSmartAccount } = useSuperChainAccount()
  const [seed, setSeed] = useState<NounProps>({
    background: Math.floor(Math.random() * ImageData.bgcolors.length),
    body: Math.floor(Math.random() * ImageData.images.bodies.length),
    accessory: Math.floor(Math.random() * ImageData.images.accessories.length),
    head: Math.floor(Math.random() * ImageData.images.heads.length),
    glasses: Math.floor(Math.random() * ImageData.images.glasses.length),
  })
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  useEffect(() => {
    if (data?.noun) {
      setSeed({
        background: Number(data?.noun?.[0]),
        body: Number(data?.noun?.[1]),
        accessory: Number(data?.noun?.[2]),
        head: Number(data?.noun?.[3]),
        glasses: Number(data?.noun?.[4]),
      })
    }
  }, [data])

  const isChanged = useMemo(() => {
    if (loading) return false
    return (
      JSON.stringify(seed) !==
      JSON.stringify({
        background: Number(data?.noun?.[0]),
        body: Number(data?.noun?.[1]),
        accessory: Number(data?.noun?.[2]),
        head: Number(data?.noun?.[3]),
        glasses: Number(data?.noun?.[4]),
      })
    )
  }, [seed, data])

  const handleChangeBodyPart = (part: keyof NounProps, delta: number) => {
    if (seed[part] + delta < TRAIT_LIMITS[part as keyof typeof TRAIT_LIMITS].min) {
      setSeed((prev: NounProps) => {
        return {
          ...prev,
          [part]: TRAIT_LIMITS[part as keyof typeof TRAIT_LIMITS].max,
        }
      })
    } else if (seed[part] + delta > TRAIT_LIMITS[part as keyof typeof TRAIT_LIMITS].max) {
      setSeed((prev: NounProps) => {
        return {
          ...prev,
          [part]: TRAIT_LIMITS[part as keyof typeof TRAIT_LIMITS].min,
        }
      })
    }
    setSeed((prev: NounProps) => {
      return {
        ...prev,
        [part]: prev[part] + delta,
      }
    })
  }

  const handleSubmit = async () => {
    const superChainSmartAccountSponsored = getSponsoredWriteableSuperChainSmartAccount()
    setModalState(ModalState.Loading)
    try {
      const transaction = await superChainSmartAccountSponsored?.write.UpdateNounAvatar([
        data.smartAccount as Address,
        seed,
      ])
      console.debug(transaction)

      setTransactionHash(transaction!)
      setModalState(ModalState.Success)
      queryClient.refetchQueries({ queryKey: ['superChainAccount', address.value] })
    } catch (e) {
      setModalState(ModalState.Error)
      console.error(e)
    }
  }

  const onClose = () => {
    setModalState(null)
    setTxFlow(undefined)
  }

  return (
    <>
      {modalState === ModalState.Loading && <LoadingModal open title="Updating avatar" />}
      {modalState === ModalState.Success && (
        <SuccessTxnModal open onClose={onClose} title="Avatar updated succesful" hash={transactionHash!} />
      )}
      {modalState === ModalState.Error && <FailedTxnModal open onClose={onClose} handleRetry={handleSubmit} />}
      <Container className={css.container}>
        <Grid container gap={3} justifyContent="center">
          {/* Main content */}
          <Grid item xs={12} md={7}>
            <div className={css.titleWrapper}>
              <Typography data-testid="modal-title" variant="h3" component="div" fontWeight="700" className={css.title}>
                My Avatar
              </Typography>
            </div>

            <Paper data-testid="modal-header" className={css.header}>
              <TxLayoutHeader icon={undefined} subtitle={'Customize your Super Account Avatar'} hideNonce={true} />
            </Paper>
            <div className={css.step}>
              <TxCard>
                <Grid container justifyContent="center" alignItems="center" spacing={2} columns={20} direction="row">
                  <Grid xs={12} item>
                    <NounsAvatar seed={seed} />
                  </Grid>
                  <Grid xs={8} item>
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: 360,
                        bgcolor: 'background.paper',
                        margin: 'auto',
                      }}
                    >
                      <List className={css.list} aria-label="Nouns categories">
                        {['Head', 'Glasses', 'Body', 'Accessory', 'Background'].map((text, index) => (
                          <ListItem className={css['list-item']} key={text} disablePadding>
                            <IconButton
                              onClick={() => handleChangeBodyPart(text.toLowerCase() as keyof NounProps, -1)}
                              edge="start"
                            >
                              <SvgIcon
                                style={{
                                  width: '7px',
                                  height: '12px',
                                  padding: '0px',
                                }}
                                inheritViewBox
                                component={ArrowBack}
                              />
                            </IconButton>
                            <ListItemText
                              primary={
                                <Box
                                  display="flex"
                                  flexDirection="row"
                                  gap={1}
                                  justifyContent="center"
                                  alignItems="center"
                                >
                                  <Typography fontWeight="bold" color="GrayText">
                                    {text}
                                  </Typography>
                                  <Typography fontWeight="bold">
                                    (
                                    {text.toLowerCase() === 'background'
                                      ? seed[text.toLowerCase() as keyof NounProps] === 0
                                        ? 'Gray'
                                        : 'Cream'
                                      : ImageData.images[
                                          PART_MAP[
                                            text.toLowerCase() as keyof typeof PART_MAP
                                          ] as keyof typeof ImageData.images
                                        ][seed[text.toLowerCase() as keyof NounProps]].filename.split('-')[1]}
                                    )
                                  </Typography>
                                </Box>
                              }
                              sx={{ textAlign: 'center' }}
                            />
                            <IconButton
                              onClick={() => handleChangeBodyPart(text.toLowerCase() as keyof NounProps, 1)}
                              edge="end"
                            >
                              <SvgIcon
                                style={{
                                  width: '7px',
                                  height: '12px',
                                  padding: '0px',
                                }}
                                inheritViewBox
                                component={ArrowForward}
                              />
                            </IconButton>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                </Grid>

                <Divider className={commonCss.nestedDivider} />

                <CardActions style={{ margin: 0 }}>
                  <Button onClick={handleSubmit} disabled={!isChanged} variant="contained" color="secondary">
                    <Typography color="white">Save</Typography>
                    <SvgIcon sx={{ marginLeft: 1 }} inheritViewBox component={Save} />
                  </Button>
                </CardActions>
              </TxCard>
            </div>
          </Grid>

          {/* Sidebar */}
          {/* {!isReplacement && (
          <Grid item xs={12} md={4} className={classnames(css.widget, { [css.active]: statusVisible })}>
            {statusVisible && (
              <TxStatusWidget
                step={step}
                txSummary={txSummary}
                handleClose={() => setStatusVisible(false)}
                isBatch={isBatch}
                isMessage={isMessage}
              />
            )}

            <Box className={css.sticky}>
              <SecurityWarnings />
            </Box>
          </Grid>
        )}
           */}
        </Grid>
      </Container>
    </>
  )
}

export default UpdateAvatarModal
