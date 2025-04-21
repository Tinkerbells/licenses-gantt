import { Outlet } from 'react-router'
import { Content, Layout as RootLayout } from '@tinkerbells/xenon-ui'

import { Header } from '@/widgets'

export function Layout() {
  return (
    <RootLayout>
      <Header />
      <Content>
        <Outlet />
      </Content>
    </RootLayout>
  )
}
