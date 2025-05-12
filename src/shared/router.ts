import { route } from 'react-router-typesafe-routes'

import { env } from './env'

export const root = route({
  path: env.BASE_URL.replace('/', ''),
  children: {
    // Главная страница с графиками агрегации и детализации
    home: route({
      path: 'home',
    }),
    // Страница с диаграммой Ганта
    status: route({
      path: 'status',
    }),
  },
})
