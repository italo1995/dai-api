import type { Request, Response, NextFunction } from 'express'
import { fxErrorResponse } from '../utils/helpers'

export function authMiddleware(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (role === 'user') {
      next()
    } else if (req.auth && role === 'client') {
      next()
    } else if (req.auth && req.auth.role === role) {
      next()
    } else {
      res.status(403).send(fxErrorResponse(403, { error: 'Acceso denegado' }, 'Acceso denegado'))
    }
  }
}
