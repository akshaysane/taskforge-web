import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('*/api/auth/refresh', () => HttpResponse.json(
    { message: 'Invalid or expired refresh token.' },
    { status: 401 },
  )),
]
