/* eslint-disable no-undef */
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
// Obtén el nombre del modelo, la ruta de la migración y la ruta de salida de los argumentos de la línea de comandos
const modelName = process.argv[2]
let migrationPath = process.argv[3]
const outputPath = process.argv[4]

// Lee el archivo de migración
if (!migrationPath.includes('.ts')) {
  migrationPath = migrationPath + '.ts'
}
const migrationFile = fs.readFileSync(
  path.join(__dirname, `../src/database/migrations/${migrationPath}`),
  'utf8'
)

// Extrae la definición del modelo de la migración
const modelDefinitionMatch = migrationFile.match(/createTable\('(\w+)', \{([\s\S]*?)\}\)/s)
const tableName = modelDefinitionMatch[1]
const modelDefinition = modelDefinitionMatch[2]
const keysAttributes = []
// Extrae los nombres de los atributos y sus tipos
const attributeMatches = [...modelDefinition.matchAll(/(\w+): \{\n\s*type: DataTypes\.(\w+),/g)]
let isDeletedAt = false
let isContainImages = false
const attributes = attributeMatches
  .map((match) => {
    const name = match[1]
    let type
    switch (match[2]) {
      case 'INTEGER':
        type = 'number'
        break
      case 'STRING':
        type = 'string'
        break
      case 'DATE':
        type = 'Date'
        break
      default:
        type = 'any'
    }
    if (name === 'deletedAt') {
      isDeletedAt = true
    }
    if (name === 'file' || name === 'images') {
      isContainImages = true
    }
    if (name !== 'id' && name !== 'updatedAt' && name !== 'createdAt' && name !== 'deletedAt') {
      keysAttributes.push(name)
    }
    return `${name}?: ${type}`
  })
  .join('\n  ')
const adjustedModelDefinition = modelDefinition.replace(/\n {4}/g, '\n')
// Define la estructura del modelo
const modelTemplate = `
import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ${modelName}Attributes {
  ${attributes}
}

export interface ${modelName}ReponseAll {
  total: number
  totalPage: number
  data: ${modelName}Instance[]
  actualPage: number
}

interface ${modelName}CreationAttributes extends Optional<${modelName}Attributes, 'id'> {}

export interface ${modelName}Instance
  extends Model<${modelName}Attributes, ${modelName}CreationAttributes>,
    ${modelName}Attributes {}

export const ${modelName}ModelAttributes: SequelizeAttributes<${modelName}Attributes> = {
  ${adjustedModelDefinition.trim()}
};

export function ${modelName}Factory(sequelize: Sequelize) {
  const ${modelName} = <ModelStatic<${modelName}Instance>>sequelize.define('${modelName}', ${modelName}ModelAttributes, {
    tableName: '${tableName}',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    ${isDeletedAt ? 'paranoid: true,' : ''}
  });

  return ${modelName};
}
`

// Crea el directorio de salida si no existe
fs.mkdirSync(path.dirname(outputPath), { recursive: true })

// Escribe el archivo del modelo
console.log(
  'path.join(__dirname, `/models/${outputPath}Model`) :>> ',
  path.join(__dirname, `/models/${outputPath}Model`)
)
fs.writeFileSync(path.join(__dirname, `../src/models/${outputPath}Model.ts`), modelTemplate)
let deletedMethod = `
async destroy(id: string): Promise<number> {
  try {
    const result: number = await ${modelName}.destroy({
      where: { id: id }
    })
    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}`
let interfaceServiceDelete = 'destroy(id: string): Promise<number>'

if (isDeletedAt) {
  deletedMethod = `
  async softDeleteRecord(pId: string) {
    try {
      const record = await ${modelName}.update({ deletedAt: new Date() }, {
        where: { id: pId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }`
  interfaceServiceDelete = 'softDeleteRecord(pId: string):Promise<boolean>'
}

const serviceTemplate = `
import { type FindOptions } from 'sequelize'
import { ${modelName} } from '../../models'
import type { ${modelName}Instance, ${modelName}Attributes, ${modelName}ReponseAll } from '../../models/web/${modelName}'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface I${modelName}Service {
  validate(data: any): any
  show(pId: string): Promise<${modelName}Instance | null>
  create(payload: ${modelName}Attributes): Promise<${modelName}Instance>
  update(payload: ${modelName}Attributes): Promise<${modelName}Instance | null>
  ${interfaceServiceDelete}
}

class ${modelName}Service implements I${modelName}Service {
  async validate(data: any) {
    const dataValidate = ${modelName}.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<${modelName}ReponseAll | ${modelName}Instance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        '${modelName}'
      )

      const vResponse: ${modelName}Instance[] = await ${modelName}.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: ${modelName}ReponseAll = await fxReponseServices(pParam, whereStatement, '${modelName}', vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: string): Promise<${modelName}Instance | null> {
    try {
      const vResponse: ${modelName}Instance | null = await ${modelName}.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ${modelName}Attributes): Promise<${modelName}Instance> {
    try {
      const vResponse: ${modelName}Instance = await ${modelName}.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ${modelName}Attributes): Promise<${modelName}Instance | null> {
    try {
      if (pData?.id) {
        const vCountry: ${modelName}Instance | null = await ${modelName}.findOne({
          where: {
            id: pData.id,
          },
        })
        await vCountry?.update(pData, { where: { id: pData.id } })
        return vCountry
      }
      return null
    } catch (error) {
      throw error
    }
  }
  ${deletedMethod}
}

export default new ${modelName}Service()
`

// const serviceOutputPath = outputPath.replace('Model', 'Service')
fs.mkdirSync(path.dirname(`services/${outputPath}`), { recursive: true })
fs.writeFileSync(path.join(__dirname, `../src/services/${outputPath}Service.ts`), serviceTemplate)
const formattedKeys = keysAttributes.map((key) => `'${key}'`)
const controllerTemplate = `
import type { NextFunction, Request, Response } from 'express'
import ${modelName}Service from '../../services/${outputPath}Service'
import type { ${modelName}Attributes, ${modelName}ReponseAll, ${modelName}Instance } from '../../models/web/${modelName}'
import { fxSuccessResponse, fxErrorResponse${isContainImages ? ', moveImages' : ''} } from '../../utils/helpers'

export const ${modelName} = {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = String(pReq.query.id)

      const vResponse: ${modelName}Instance | null = await ${modelName}Service.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: ${modelName}ReponseAll | ${modelName}Instance[] = await ${modelName}Service.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ${modelName}Attributes = pReq.only([${formattedKeys.join(',\n')}])
      ${isContainImages ? 'if (vData.file) {vData.file = await moveImages(vData.file)}' : ''}
      const vResponse: ${modelName}Instance | null = await ${modelName}Service.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ${modelName}Attributes = pReq.only(['id', ${formattedKeys.join(',\n')}])
      ${isContainImages ? 'if (vData.file) {vData.file = await moveImages(vData.file)}' : ''}
      const vResponse: ${modelName}Instance | null = await ${modelName}Service.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  },

async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vResponse: boolean = await ${modelName}Service.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}
`
console.log('outputPath :>> ', outputPath)
console.log(
  'path.dirname(`controller/${outputPath}` :>> ',
  path.dirname(`../src/controller/${outputPath}Controller.ts`)
)
fs.mkdirSync(path.dirname(path.join(__dirname, `../src/controller/${outputPath}Controller.ts`)), {
  recursive: true,
})
fs.writeFileSync(
  path.join(__dirname, `../src/controller/${outputPath}Controller.ts`),
  controllerTemplate
)

exec('npm run format', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al ejecutar el comando: ${error.message}`)
    return
  }
  console.log(`Salida del comando:\n${stdout}`)
})
