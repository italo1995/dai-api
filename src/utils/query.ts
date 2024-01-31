import { Op, type FindOptions } from 'sequelize'
import sequelize from '../models'

export const fxOrderNameId = (pParam: any, pWhereStatement: FindOptions) => {
  if (Number(pParam?.orden)  === 2) {
    pWhereStatement.order = pWhereStatement.order instanceof Array ? [
      ...pWhereStatement.order, ['name', 'ASC']
    ] : [
      ['name', 'ASC']
    ]
  } else {
    pWhereStatement.order = pWhereStatement.order instanceof Array ? [
      ...pWhereStatement.order, ['id', 'DESC']
    ] : [
      ['id', 'DESC']
    ]
  }
  return pWhereStatement.order
}

const fxSearchILikeQuery = (pParam: any, pWhereStatement: FindOptions, pName: string, pAttibutesPermisse: string | string[]) => {
  const vName = pName.trim()
  if (pAttibutesPermisse.includes(vName)) {
    pWhereStatement.where = { ...pWhereStatement.where, [vName]: { [Op.iLike]: `%${pParam.search}%` } }
  }
  return pWhereStatement.where || {}
}

export const fxSearchILike = (pParam: any, pWhereStatement: FindOptions, pName: string = 'name', pModelName: string) => {
  const vModelAttributes: any = sequelize.models[pModelName].getAttributes()
  const vAttibutesPermisse = Object.keys(vModelAttributes).filter(key => vModelAttributes[key].type.key === 'STRING')
  if (pParam?.search) {
    if (pParam?.typeSearch && pParam.typeSearch.includes(',')) {
      const vTypeSearchs = pParam.typeSearch.split(',')
      for (const typeSearch of vTypeSearchs) {
        pWhereStatement.where = fxSearchILikeQuery(pParam, pWhereStatement, typeSearch, vAttibutesPermisse)
      }
    } else {
      pWhereStatement.where = fxSearchILikeQuery(pParam, pWhereStatement, pName, vAttibutesPermisse)
    }
  }
  return pWhereStatement.where || {}
}

export const fxPaginate = (pParam: any, pWhereStatement: FindOptions) => {
  if (Number(pParam?.pag)) {
    const limit = Number(pParam?.limit) || 10 // Define cuantos registros por pagina quieres mostrar
    pWhereStatement.limit = limit
    pWhereStatement.offset = (pParam.pag - 1) * limit
  }
  return pWhereStatement
}

export const fxReponseServices = async (pParam: any, pWhereStatement: FindOptions, pModelName: string, vResponse: any) => {
  const vLimit = Number(pParam?.limit) || 10
  console.log('sequelize.models :>> ', sequelize.models)
  console.log('modelName :>> ', pModelName)
  const vCount = await sequelize.models[pModelName].count(pWhereStatement)
  const vResponsePaginate: any = {
    total: vCount,
    totalPage: Math.ceil(vCount / vLimit),
    data: vResponse,
    actualPage: Number(pParam.pag),
  }
  return vResponsePaginate
}