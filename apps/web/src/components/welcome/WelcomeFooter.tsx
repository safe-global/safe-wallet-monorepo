import { Typography } from "@mui/material";

import { Box } from "@mui/material";
import ExternalLink from "@/components/common/ExternalLink";
import Link from "next/link";
import packageJson from '../../../package.json'
import MUILink from '@mui/material/Link'
import css from './welcomeFooter.module.css'

export default function WelcomeFooter() {
  const date = new Date().getFullYear();
  return (
    <Box component="footer" className={css.footer}>
          <ul>
            <li>
              <Typography variant="caption">{date} Safe Labs</Typography>
            </li>
            <li>
              <Link href="/terms" passHref>
                <MUILink>Terms</MUILink>
              </Link>
            </li>
            <li>
              <Link href="/privacy" passHref>
                <MUILink>Privacy</MUILink>
              </Link>
            </li>
            <li>
              <Link href="/licenses" passHref>
                <MUILink>Licenses</MUILink>
              </Link>
            </li>
            <li>
              <Link href="/imprint" passHref>
                <MUILink>Imprint</MUILink>
              </Link>
            </li>
            <li>
              <Link href="/cookie" passHref>
                <MUILink>Cookies</MUILink>
              </Link>
            </li>
            <li>
              <ExternalLink href={`${packageJson.homepage}/releases/tag/v${packageJson.version}`} noIcon>
                <MUILink>v{packageJson.version}</MUILink>
              </ExternalLink>
            </li>
          </ul>
        </Box>
  )
}