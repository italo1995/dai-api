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

export const fxSearchILike = (pParam: any, whereStatement: FindOptions, pName: string = 'name', modelName: string) => {
  const vModelAttributes: any = sequelize.models[modelName].getAttributes()
  const vAttibutesPermisse = Object.keys(vModelAttributes).filter(key => vModelAttributes[key].type.key === 'STRING')
  if (pParam?.search) {
    if (pParam?.typeSearch && pParam.typeSearch.includes(',')) {
      const vTypeSearchs = pParam.typeSearch.split(',')
      for (const typeSearch of vTypeSearchs) {
        if (vAttibutesPermisse.includes(typeSearch.trim())) {
          whereStatement.where = { ...whereStatement.where, [typeSearch.trim()]: { [Op.iLike]: `%${pParam.search}%` } }
        }
      }
    } else {
      if (vAttibutesPermisse.includes(pName.trim())) {
        whereStatement.where = { ...whereStatement.where, [pName.trim()]: { [Op.iLike]: `%${pParam.search}%` } }
      }
    }
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