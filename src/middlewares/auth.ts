import type { Request, Response, NextFunction } from 'express'
import { fxErrorResponse } from '../utils/helpers'

export function authMiddleware(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (role === 'user') {
      next()
    } else if (
      req.auth &&
      role === 'client' &&
      (req.auth.rolId === 3 || req.auth.rolId === 1 || req.auth.rolId === 2)
    ) {
      next()
    } else if (req.auth && role === 'admin' && req.auth.rolId === 1) {
      next()
    } else if (req.auth && role === 'operator' && (req.auth.rolId === 2 || req.auth.rolId === 1)) {
      next()
    } else if (req.auth && role === 'store' && req.auth.rolId === 4) {
      next()
    } else {
      return res
        .status(403)
        .send(fxErrorResponse(403, { error: 'Acceso denegado' }, 'Acceso denegado'))
    }
  }
}
