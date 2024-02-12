import { type Express } from 'express'
import path from 'path'
import * as swaggerUI from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerJSON from '../swagger.json'

export const startSwagger = (app: Express, _port: string) => {
  try {
    const swaggerDoc = swaggerJSON
    if(swaggerDoc) {
      console.log('leido')
    }
    const rutaYAML = path.resolve(__dirname, './documentation/*.yaml')
    const options = {
      swaggerDefinition: swaggerDoc,
      apis: [rutaYAML]
    }
    const swaggerSpec = swaggerJSDoc(options)
    app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerSpec))
    app.get('/api/docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(swaggerSpec)
    })
  } catch (error) {
    console.log(error)
  }
}