import React, { Fragment, useState, type ReactElement } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import ListItemButton from '@mui/material/ListItemButton'
import Collapse from '@mui/material/Collapse'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import List from '@mui/material/List'
import { ListItemIconProps } from '@mui/material'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import Home from './assets/Home.svg'
import Assets from './assets/Assets.svg'
import Transactions from './assets/Transactions.svg'
import AddressBook from './assets/AddressBook.svg'
import Apps from './assets/Apps.svg'
import Settings from './assets/Settings.svg'

import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'

type NavItem = {
  label: string
  icon?: ListItemIconProps['children']
  href: string
  items?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    icon: <Image src={Home} alt="Home" />,
    href: AppRoutes.safe.home,
  },
  {
    label: 'Assets',
    icon: <Image src={Assets} alt="Assets" />,
    href: AppRoutes.safe.balances.index,
    items: [
      {
        label: 'Coins',
        href: AppRoutes.safe.balances.index,
      },
      {
        label: 'NFTs',
        href: AppRoutes.safe.balances.nfts,
      },
    ],
  },
  {
    label: 'Transactions',
    icon: <Image src={Transactions} alt="Transactions" />,
    href: AppRoutes.safe.transactions.index,
    items: [
      {
        label: 'Queue',
        href: AppRoutes.safe.transactions.queue,
      },
      {
        label: 'History',
        href: AppRoutes.safe.transactions.history,
      },
    ],
  },
  {
    label: 'Address Book',
    icon: <Image src={AddressBook} alt="Address Book" />,
    href: AppRoutes.safe.addressBook,
  },
  {
    label: 'Apps',
    icon: <Image src={Apps} alt="Safe Apps" />,
    href: AppRoutes.safe.apps,
  },
  {
    label: 'Settings',
    icon: <Image src={Settings} alt="Settings" />,
    href: AppRoutes.safe.settings.details,
    items: [
      {
        label: 'Safe Details',
        href: AppRoutes.safe.settings.details,
      },
      {
        label: 'Appearance',
        href: AppRoutes.safe.settings.appearance,
      },
      {
        label: 'Owners',
        href: AppRoutes.safe.settings.owners,
      },
      {
        label: 'Policies',
        href: AppRoutes.safe.settings.policies,
      },
      {
        label: 'Spending Limit',
        href: AppRoutes.safe.settings.spendingLimit,
      },
      {
        label: 'Advanced',
        href: AppRoutes.safe.settings.advanced,
      },
    ],
  },
]

const Navigation = (): ReactElement => {
  const router = useRouter()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const toggleOpen = ({ href }: NavItem) => {
    setOpen((prev) => ({ [href]: !prev[href] }))
  }

  const isSelected = (href: string) => router.pathname === href

  return (
    <SidebarList>
      {navItems.map((item) => {
        if (!item.items) {
          return (
            <SidebarListItemButton
              selected={isSelected(item.href)}
              href={{ pathname: item.href, query: router.query }}
              key={item.href}
            >
              {item.icon && <SidebarListItemIcon>{item.icon}</SidebarListItemIcon>}
              <SidebarListItemText bold>{item.label}</SidebarListItemText>
            </SidebarListItemButton>
          )
        }

        const isExpanded = open[item.href] || router.pathname.includes(item.href)

        return (
          <Fragment key={item.href}>
            <SidebarListItemButton
              onClick={() => toggleOpen(item)}
              selected={isExpanded}
              href={{ pathname: item.href, query: router.query }}
            >
              {item.icon && <SidebarListItemIcon>{item.icon}</SidebarListItemIcon>}
              <SidebarListItemText bold>{item.label}</SidebarListItemText>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </SidebarListItemButton>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List
                component="nav"
                className={css.sublist}
                sx={({ palette }) => ({
                  borderLeft: `solid 1px ${palette.gray[500]}`,
                  '::after': {
                    content: '""',
                    height: '23px',
                    width: '1px',
                    position: 'absolute',
                    bottom: 0,
                    left: '-1px',
                    backgroundColor: 'background.paper', // Cannot move to CSS module
                  },
                })}
              >
                {item.items.map((subItem) => (
                  <Link href={{ pathname: subItem.href, query: router.query }} passHref key={subItem.href}>
                    <ListItemButton
                      onClick={() => toggleOpen(subItem)}
                      selected={isSelected(subItem.href)}
                      sx={({ palette }) => ({
                        '::before': {
                          content: '""',
                          width: '6px',
                          height: '1px',
                          background: palette.gray[500],
                          position: 'absolute',
                          left: '-10px',
                        },
                        borderRadius: '6px',
                        '&.MuiListItemButton-root:hover, &.MuiListItemButton-root.Mui-selected': {
                          backgroundColor: `${palette.gray[300]} !important`,
                        },
                      })}
                    >
                      <SidebarListItemText>{subItem.label}</SidebarListItemText>
                    </ListItemButton>
                  </Link>
                ))}
              </List>
            </Collapse>
          </Fragment>
        )
      })}
    </SidebarList>
  )
}

export default React.memo(Navigation)
