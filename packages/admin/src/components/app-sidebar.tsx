import {
  BarChart3Icon,
  HomeIcon,
  InboxIcon,
  type LucideIcon,
  PackageIcon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
} from 'lucide-react'
import type { ComponentProps } from 'react'
import { useParams } from '@tanstack/react-router'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { StoreSwitcher } from '@/components/store-switcher'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  items?: { title: string; url: string }[]
}

function buildNavigation(storeId: string): NavItem[] {
  const p = `/${storeId}`
  return [
    {
      title: 'Home',
      url: p,
      icon: HomeIcon,
    },
    {
      title: 'Orders',
      url: `${p}/orders`,
      icon: InboxIcon,
      items: [{ title: 'Draft Orders', url: `${p}/orders/drafts` }],
    },
    {
      title: 'Products',
      url: `${p}/products`,
      icon: PackageIcon,
      items: [
        { title: 'Price Lists', url: `${p}/products/price-lists` },
        { title: 'Stock', url: `${p}/products/stock` },
        { title: 'Categories', url: `${p}/products/categories` },
        { title: 'Options', url: `${p}/products/options` },
      ],
    },
    {
      title: 'Customers',
      url: `${p}/customers`,
      icon: UsersIcon,
    },
    {
      title: 'Promotions',
      url: `${p}/promotions`,
      icon: TagIcon,
      items: [{ title: 'Gift Cards', url: `${p}/promotions/gift-cards` }],
    },
    {
      title: 'Reports',
      url: `${p}/reports`,
      icon: BarChart3Icon,
    },
  ]
}

function buildBottomNavigation(storeId: string): NavItem[] {
  return [
    {
      title: 'Settings',
      url: `/${storeId}/settings`,
      icon: SettingsIcon,
    },
  ]
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { storeId } = useParams({ strict: false }) as { storeId?: string }
  const id = storeId || 'default'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <StoreSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={buildNavigation(id)} bottomItems={buildBottomNavigation(id)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
