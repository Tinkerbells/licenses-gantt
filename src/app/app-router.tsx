import * as React from 'react'
import { Spin } from '@tinkerbells/xenon-ui'
import { Navigate, Route, Routes } from 'react-router'

import { root } from '@/shared/router'
import { Home } from '@/view/home/home'
import { Status } from '@/view/status/status'

import { Layout } from './layout'

export function AppRouter() {
  return (
    <React.Suspense fallback={<Spin fullscreen />}>
      <Routes>
        <Route path={root.$path()} element={<Layout />}>
          {/* Редирект с корневого пути на Главную */}
          <Route path={root.$path()} element={<Navigate to={root.home.$path()} replace />} />
          <Route path={root.home.$path()} element={<Home />} />
          <Route path={root.status.$path()} element={<Status />} />
        </Route>
      </Routes>
    </React.Suspense>
  )
}
