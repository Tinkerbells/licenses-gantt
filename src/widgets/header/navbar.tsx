import type { MenuProps } from '@tinkerbells/xenon-ui'

import * as React from 'react'
import { useLocation, useNavigate } from 'react-router'
import { LogoPlaceholder, Menu } from '@tinkerbells/xenon-ui'

import { root } from '@/shared/router'

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  {
    icon: <LogoPlaceholder />,
    key: 'logo',
  },
  {
    label: 'Главная',
    key: root.home.$path(),
  },
  {
    label: 'Статус лицензий',
    key: root.status.$path(),
  },
]

type NavbarProps = MenuProps

export function Navbar({ className }: NavbarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [current, setCurrent] = React.useState(pathname)
  const [isPending, startTransition] = React.useTransition()

  const onClick: MenuProps['onClick'] = (e) => {
    if (e.key !== 'logo') {
      startTransition(() => {
        setCurrent(e.key)
        navigate(e.key)
      })
    }
  }

  return (
    <Menu
      className={className}
      onClick={onClick}
      mode="horizontal"
      selectedKeys={[current]}
      items={items}
      style={isPending ? { opacity: 0.8 } : undefined}
    />
  )
}
