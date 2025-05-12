import { Outlet } from 'react-router'
import { Content, Layout as RootLayout } from '@tinkerbells/xenon-ui'

import { Header, Panel } from '@/widgets'

export function Layout() {
  return (
    <RootLayout>
      <Header />
      <Content className="app-content">
        <Panel />
        <Outlet />
      </Content>
    </RootLayout>
  )
}
