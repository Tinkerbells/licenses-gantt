import React from 'react'

import './app.styles.css'

import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@tinkerbells/xenon-ui'

import { AppRouter } from './app-router'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
