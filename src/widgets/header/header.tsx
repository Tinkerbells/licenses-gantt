import './header.styles.css'

import { Flex, Header as HeaderContainer, ThemePicker } from '@tinkerbells/xenon-ui'

import { cn } from '@/shared/lib/utils'

import { Navbar } from './navbar'

const b = cn('header')

export function Header() {
  return (
    <HeaderContainer className={b()}>
      <Navbar className={b('navbar')} />
      <Flex align="center" gap="middle">
        <ThemePicker />
      </Flex>
    </HeaderContainer>
  )
}
