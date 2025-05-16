import React from 'react'

import './app.styles.css'

import { HashRouter } from 'react-router'
import { ThemeProvider } from '@tinkerbells/xenon-ui'

import { FilterProvider } from '@/context/filter-context'

import { AppRouter } from './app-router'

const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider defaultTheme="light">
        <FilterProvider>
          <AppRouter />
        </FilterProvider>
      </ThemeProvider>
    </HashRouter>
  )
}

export default App
