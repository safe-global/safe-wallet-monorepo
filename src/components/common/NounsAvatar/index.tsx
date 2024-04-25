import React from 'react'
import css from './styles.module.css'
import type { NounProps } from '@/components/new-safe/create/steps/AvatarStep'
import { getNounData, ImageData } from '@nouns/assets'
import { buildSVG } from '@nouns/sdk'
function NounsAvatar({ seed }: { seed: NounProps }) {
  const { parts, background } = getNounData(seed)
  const { palette } = ImageData
  const svgBinary = buildSVG(parts, palette, background)
  const svgBase64 = btoa(svgBinary)
  return <img className={css.nouns} src={`data:image/svg+xml;base64,${svgBase64}`} alt="nouns" />
}

export default NounsAvatar
