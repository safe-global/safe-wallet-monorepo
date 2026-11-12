import { mkdirSync } from 'node:fs'
import { generatedDir } from './paths.ts'
import { main as icons } from './icons.ts'
import { main as props } from './props.ts'
import { main as rules } from './rules.ts'
import { main as stories } from './stories.ts'
import { main as tokens } from './tokens.ts'

mkdirSync(generatedDir, { recursive: true })
stories()
props()
tokens()
rules()
icons()
