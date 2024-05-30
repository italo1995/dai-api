import express from 'express'
const { OpenApiValidator } = require('express-openapi-validator')

const app = express()

// Define tus rutas y modelos aquí

// Configura el validador OpenAPI
new OpenApiValidator({
  apiSpec: './path/to/your/openapi.yaml', // Ruta a tu especificación OpenAPI 3.0
  validateRequests: true,
  validateResponses: true,
}).install(app)

app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000')
})
