import { Outlet } from 'react-router'
import { Content, Layout as RootLayout } from '@tinkerbells/xenon-ui'

import { Header } from '@/widgets'
import { Panel } from '@/widgets/panel'

export function Layout() {
  return (
    <RootLayout>
      <Header />
      <Panel />
      <Content>
        <Outlet />
      </Content>
    </RootLayout>
  )
}
