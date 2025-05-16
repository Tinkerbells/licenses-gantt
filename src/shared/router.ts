import { route } from 'react-router-typesafe-routes'

export const root = route({
  path: '',
  children: {
    // Страница с диаграммой Ганта
    status: route({
      path: 'status',
    }),
  },
})
