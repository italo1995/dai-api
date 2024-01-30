import { Op, type FindOptions } from 'sequelize'
import sequelize from '../models'

export const fxOrderNameId = (pParam: any, whereStatement: FindOptions) => {
  if (Number(pParam?.orden)  === 2) {
    whereStatement.order = whereStatement.order instanceof Array ? [
      ...whereStatement.order, ['name', 'ASC']
    ] : [
      ['name', 'ASC']
    ]
  } else {
    whereStatement.order = whereStatement.order instanceof Array ? [
      ...whereStatement.order, ['id', 'DESC']
    ] : [
      ['id', 'DESC']
    ]
  }
  return whereStatement.order
}

export const fxSearchILikeName = (pParam: any, whereStatement: FindOptions) => {
  if (pParam?.search) {
    whereStatement.where = { ...whereStatement.where, name: { [Op.iLike]: `%${pParam.search}%` } }
  }
  return whereStatement.where || {}
}

export const fxPaginate = (pParam: any, whereStatement: FindOptions) => {
  if (Number(pParam?.pag)) {
    const limit = Number(pParam?.limit) || 10 // Define cuantos registros por pagina quieres mostrar
    whereStatement.limit = limit
    whereStatement.offset = (pParam.pag - 1) * limit
  }
  return whereStatement
}

export const fxReponseServices = async (pParam: any, whereStatement: FindOptions, modelName: string, vResponse: any) => {
  const vLimit = Number(pParam?.limit) || 10
  console.log('sequelize.models :>> ', sequelize.models)
  console.log('modelName :>> ', modelName)
  const vCount = await sequelize.models[modelName].count(whereStatement)
  const vResponsePaginate: any = {
    total: vCount,
    totalPage: Math.ceil(vCount / vLimit),
    data: vResponse,
    actualPage: Number(pParam.pag),
  }
  return vResponsePaginate
}