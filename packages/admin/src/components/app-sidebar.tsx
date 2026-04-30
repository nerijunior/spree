import { useParams } from '@tanstack/react-router'
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
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { StoreSwitcher } from '@/components/store-switcher'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { Subject, type SubjectName } from '@/lib/permissions'
import { type Permissions, usePermissions } from '@/providers/permission-provider'

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  /** CanCanCan subject required to see this item. If omitted, item is always visible. */
  subject?: SubjectName
  items?: { title: string; url: string; subject?: SubjectName }[]
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
      subject: Subject.Order,
      items: [{ title: 'Draft Orders', url: `${p}/orders/drafts`, subject: Subject.Order }],
    },
    {
      title: 'Products',
      url: `${p}/products`,
      icon: PackageIcon,
      subject: Subject.Product,
      items: [
        { title: 'Price Lists', url: `${p}/products/price-lists`, subject: Subject.Product },
        { title: 'Stock', url: `${p}/products/stock`, subject: Subject.StockLocation },
        { title: 'Categories', url: `${p}/products/categories`, subject: Subject.Taxon },
        { title: 'Options', url: `${p}/products/options`, subject: Subject.OptionType },
      ],
    },
    {
      title: 'Customers',
      url: `${p}/customers`,
      icon: UsersIcon,
      subject: Subject.Customer,
    },
    {
      title: 'Promotions',
      url: `${p}/promotions`,
      icon: TagIcon,
      subject: Subject.Promotion,
      items: [
        { title: 'Gift Cards', url: `${p}/promotions/gift-cards`, subject: Subject.Promotion },
      ],
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
      subject: Subject.Store,
    },
  ]
}

/** Filter nav items by permission: hide items the user can't `read`. */
function filterByPermissions(items: NavItem[], permissions: Permissions): NavItem[] {
  return items
    .filter((item) => !item.subject || permissions.can('read', item.subject))
    .map((item) => ({
      ...item,
      items: item.items?.filter((sub) => !sub.subject || permissions.can('read', sub.subject)),
    }))
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { storeId } = useParams({ strict: false }) as { storeId?: string }
  const { permissions } = usePermissions()
  const id = storeId || 'default'

  const navItems = filterByPermissions(buildNavigation(id), permissions)
  const bottomItems = filterByPermissions(buildBottomNavigation(id), permissions)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <StoreSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} bottomItems={bottomItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
