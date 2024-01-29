import multer from 'multer'
import cors from 'cors'
import morgan from 'morgan'
import express, { type Express } from 'express'
import jwt, { type Secret } from 'jsonwebtoken'
import AppConfig from './config/AppConfig'
import routes from './routes'
import { ValidationError } from 'sequelize'
import { modelErrorReporting, modelUser } from './models'
import type { IUserInstance } from './models/User/User'
import { startSwagger } from './swagger'
export class Server {
  private app: Express
  private upload = multer()

  constructor() {
    this.app = express()
    this.configuration()
    this.middlewares()
    this.errorReporting()
    this.startSwagger()
  }

  configuration() {
    this.app.set('port', AppConfig.PORT)
  }

  middlewares() {
    this.app.use(morgan('dev'))
    this.app.use(cors())
    this.app.use(express.json())
    this.app.use((req: any, res: any, next: any) => {
      if (req.method === 'POST') {
        this.upload.any()(req, res, (err) => {
          if (err) {
            next(err)
          }
          next()
        })
      } else {
        next()
      }
    })
    this.app.use((req: any, _res: any, next: any) => {
      const query = req.query
      const body = req.body
      for (const key in query) {
        if (Object.prototype.hasOwnProperty.call(query, key)) {
          const element = query[key]
          if (element === 'null' || element === 'true' || element === 'false') {
            query[key] = JSON.parse(element)
          }
          if (element === 'undefined') {
            query[key] = undefined
          }
          if (element === '') {
            query[key] = null
          }
        }
      }
      req.query = query
      for (const key in body) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          const element = body[key]
          if (element === 'null' || element === 'true' || element === 'false') {
            body[key] = JSON.parse(element)
          }
          if (element === 'undefined') {
            body[key] = undefined
          }
          if (element === '') {
            body[key] = null
          }
        }
      }
      req.body = body
      next()
    })
    this.app.use((req, _res, next) => {
      req.only = (keys: string[]) => {
        const body: any = req.body
        const data: any = {}
        for (const key of keys) {
          if (key in body) {
            data[key] = body[key]
          } else {
            data[key] = null
          }
        }
        return data
      }
      req.input = (key: string, type: string | undefined = undefined) => {
        let resp: any = req?.body[key] || req?.query[key]
        if (resp && type === 'json' && typeof resp === 'string') {
          resp = JSON.parse(resp)
        }
        if (resp && type === 'number' && typeof resp === 'string') {
          resp = Number(resp)
        }
        return resp
      }
      next()
    })
    this.app.use((req: any, _res, next) => {
      const authHeader = req.headers['authorization']
      if (authHeader) {
        const token = authHeader.split(' ')[1]
        if (token) {
          jwt.verify(token, AppConfig.SECRET_KEY as Secret, async (err: any, decoded: any) => {
            if (err) {
              req.auth = false
              next()
            } else {
              if (decoded) {
                const vUser: IUserInstance | null = await modelUser.findOne({
                  where: {
                    id: decoded.id,
                  },
                })
                req.auth = { ...decoded, ...vUser?.dataValues }
                next()
              } else {
                req.auth = false
                next()
              }
            }
          })
        } else {
          next()
        }
      } else {
        next()
      }
    })
    this.app.use('/api', routes)
  }

  errorReporting() {
    this.app.use(async (err: any, req: any, res: any, _next: any) => {
      if (err.issues) {
        const errorMessage = err.issues.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }))
        console.log('errorMessage :>> ', errorMessage)
        //   return res.status(400).json({ error: errorMessage[0] })
      }
      if (err instanceof ValidationError) {
        const errors: string[] = []
        for (const itemError of err.errors) {
          errors.push(itemError.message)
        }
        return res.status(400).json({ success: false, type: 'validation', message: errors })
      } else {
        console.log('err :>> ', err)
        const newErrorReporting = {
          type: 'middelware',
          data: JSON.stringify({
            request: {
              method: req.method,
              url: req.url,
              headers: req.headers,
              body: req.body,
            },
            userId: req?.auth?.id, // Asume que el usuario está en req.user
          }),
          error: JSON.stringify({
            message: err.message,
            stack: err.stack,
          }),
        }
        await modelErrorReporting.create(newErrorReporting)
        return res.status(500).send({ success: false, type: 'error', message: 'Ocurrió un error' })
      }
    })
  }
  private startSwagger(): void {
    startSwagger(this.app, this.app.get('port'))
  }
  listen() {
    this.app.listen(this.app.get('port'), () => {
      console.log(`corriendo en ${this.app.get('port')}`)
    })
    // const options = {
    //   key: fs.readFileSync('./src/ssl/ca.key'),
    //   cert: fs.readFileSync('./src/ssl/ca.csr'),
    // }
    
    // https.createServer(options, this.app).listen(AppConfig.PORT, function() {
    //   console.log('Express server listening on AppConfig.PORT ' + AppConfig.PORT)
    // })
  }
}
