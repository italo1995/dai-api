import { Op, type FindOptions } from 'sequelize'
import sequelize from '../models'

export const fxOrderNameId = (pParam: any, pWhereStatement: FindOptions) => {
  if (Number(pParam?.orden) === 2) {
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
    if (pParam.search.includes(',')) {
      const searchs: string[] = pParam.search.split(',')
      const searchsParse = searchs.map((search: string) => `%${search}%`)
      pWhereStatement.where = { 
        ...pWhereStatement.where, 
        [vName]: {
          [Op.or]: searchsParse.map(search => ({ [Op.iLike]: search }))
        }
      }
    } else {
      pWhereStatement.where = { ...pWhereStatement.where, [vName]: { [Op.iLike]: `%${pParam.search}%` } }
    }
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
        const where = fxSearchILikeQuery(pParam, pWhereStatement, typeSearch, vAttibutesPermisse)
        pWhereStatement.where = { ...pWhereStatement.where, ...where }
      }
    } else {
      pWhereStatement.where = fxSearchILikeQuery(pParam, pWhereStatement, pName, vAttibutesPermisse)
    }
  }
  return pWhereStatement.where || {}
}

// export const fxFilterDate = (pParam: any, pWhereStatement: FindOptions) => {
//   if (pParam?.initDate) {
//     const vDate = new Date(pParam?.initDate)
//     const where = {
//       createdAt: {
//         [Op.gte]: vDate.toISOString().split('T')[0]
//       },
//     }
//     pWhereStatement.where = { ...pWhereStatement.where, ...where }
//   }
//   return pWhereStatement.where || {}
// }

export const fxFilterDate = (pParam: any, pWhereStatement: FindOptions) => {
  pWhereStatement.where = pWhereStatement.where || {}
  if (pParam?.initDate) {
    const [year, day, month] = pParam.initDate.split('/')
    const vDate = new Date(`${year}/${month}/${day}`)
    const where = {
      createdAt: {
        [Op.gte]: vDate.toISOString().split('T')[0]
      },
    }
    pWhereStatement.where = { ...pWhereStatement.where, ...where }
  }

  if (pParam?.endDate) {
    const [year, day, month] = pParam.endDate.split('/')
    const vDate = new Date(`${year}/${month}/${day}`)
    let where = {}
    if (pWhereStatement?.where && 'createdAt' in pWhereStatement.where) {
      where = {
        createdAt: {
          ...pWhereStatement.where.createdAt,
          [Op.lte]: vDate.toISOString().split('T')[0]
        },
      }
    } else {
      where = {
        createdAt: {
          [Op.lte]: vDate.toISOString().split('T')[0]
        },
      }
    }
    pWhereStatement.where = { ...pWhereStatement.where, ...where }
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
  const vCount = await sequelize.models[pModelName].count({
    ...pWhereStatement,
    distinct: true,
    col: 'id'
  })
  const vResponsePaginate: any = {
    total: vCount,
    totalPage: Math.ceil(vCount / vLimit),
    data: vResponse,
    actualPage: Number(pParam.pag),
  }
  return vResponsePaginate
}