import React, { Fragment, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import ListItemButton from '@mui/material/ListItemButton'
import Collapse from '@mui/material/Collapse'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import List from '@mui/material/List'
import Link from 'next/link'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { navItems, type NavItem } from './config'

import css from './styles.module.css'

const Navigation = (): ReactElement => {
  const router = useRouter()
  const query = { safe: router.query.safe }
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
              href={{ pathname: item.href, query }}
              key={item.href}
            >
              {item.icon && (
                <SidebarListItemIcon>
                  <img src={item.icon} alt={item.label} height="16px" width="16px" />
                </SidebarListItemIcon>
              )}
              <SidebarListItemText bold>{item.label}</SidebarListItemText>
            </SidebarListItemButton>
          )
        }

        const isExpanded = open[item.href] || item.items.some((i) => open[i.href])

        return (
          <Fragment key={item.href}>
            <SidebarListItemButton
              onClick={() => toggleOpen(item)}
              selected={isExpanded}
              href={{ pathname: item.href, query }}
            >
              {item.icon && (
                <SidebarListItemIcon>
                  <img src={item.icon} alt={item.label} height="16px" width="16px" />
                </SidebarListItemIcon>
              )}

              <SidebarListItemText bold>{item.label}</SidebarListItemText>

              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </SidebarListItemButton>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="nav" className={css.sublist}>
                {item.items.map((subItem) => (
                  <Link href={{ pathname: subItem.href, query }} passHref key={subItem.href}>
                    <ListItemButton
                      className={css.sublistItem}
                      onClick={() => toggleOpen(subItem)}
                      selected={isSelected(subItem.href)}
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
