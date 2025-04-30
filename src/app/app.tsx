import React from 'react'

import './app.styles.css'

import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@tinkerbells/xenon-ui'

import { FilterProvider } from '@/context/filter-context'

import { AppRouter } from './app-router'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <FilterProvider>
          <AppRouter />
        </FilterProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
