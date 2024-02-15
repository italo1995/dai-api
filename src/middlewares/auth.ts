import type { Request, Response, NextFunction } from 'express'
import { fxErrorResponse } from '../utils/helpers'

export function authMiddleware(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (role === 'user') {
      next()
    } else if (req.auth && role === 'client' && req.auth.role === 3) {
      next()
    } else if (req.auth && role === 'admin' && req.auth.role === 1) {
      next()
    } else if (req.auth && role === 'operator' && req.auth.role === 2) {
      next()
    } else {
      res.status(403).send(fxErrorResponse(403, { error: 'Acceso denegado' }, 'Acceso denegado'))
    }
  }
}
