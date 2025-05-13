import { route } from 'react-router-typesafe-routes'

import { env } from './env'

export const root = route({
  // Главная страница с графиками агрегации и детализации
  path: env.BASE_URL.replace('/', ''),
  children: {
    // Страница с диаграммой Ганта
    status: route({
      path: 'status',
    }),
  },
})
