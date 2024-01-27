/* 
- File: CountryService.ts

- Purpose: El serivicio auth se encarga de las consultas con los modelos y funcionalidades relacionadas al auth

- Author: Italo Belen

- Creation: 17/01/2024  

==========Functions Manifest==========

- CountryService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del usuario segun el id, puede usarse en el perfil o para verificar informacion del usuario
  3 - create: crea datos del usuario
  4 - update: actualiza datos del usuario
*/
import { Op, type FindOptions } from 'sequelize'
import type { ITypeFileUserInstance } from '../../models/User/TypeFileUser'
import { modelTypeFileUser } from '../../models'
import type { ITypeFileUserInput } from '../../types/User'
import type { IReponseAll } from '../../types/generalType'

interface ITypeFileUserService {
  validate(data: any): any
  show(pId: number): Promise<ITypeFileUserInstance | null>
  create(payload: ITypeFileUserInput): Promise<ITypeFileUserInstance>
  update(payload: ITypeFileUserInput): Promise<ITypeFileUserInstance | null>
}
class TypeFileUserService implements ITypeFileUserService {

  async validate(data: any) {
    const dataValidate = modelTypeFileUser.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IReponseAll | ITypeFileUserInstance[]> {
    try {
      const whereStatement: FindOptions = {}
      if (Number(pParam?.pag)) {
        const limit = Number(pParam?.limit) || 10 // Define cuántos registros por página quieres mostrar
        whereStatement.limit = limit
        whereStatement.offset = (pParam.pag - 1) * limit
      }
      if (Number(pParam?.orden) === 2) {
        whereStatement.order = whereStatement.order instanceof Array ? [
          ...whereStatement.order, ['name', 'ASC']
        ] : [
          ['name', 'ASC']
        ]
      } else {
        whereStatement.order =  whereStatement.order instanceof Array ? [
          ...whereStatement.order, ['id', 'DESC']
        ] : [
          ['id', 'DESC']
        ]
      }

      if (pParam?.search) {
        whereStatement.where = { ...whereStatement.where, name: { [Op.like]: `%${pParam.search}%` } }
      }
      const res = await modelTypeFileUser.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const limit = Number(pParam?.limit) || 10
        const count = await modelTypeFileUser.count(whereStatement)
        const resp = {
          total: count,
          totalPage: Math.ceil(count / limit),
          data: res,
          actualPage: Number(pParam.pag),
        }
        return resp
      }
      return res
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ITypeFileUserInstance | null> {
    const vResponse: ITypeFileUserInstance | null = await modelTypeFileUser.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async create(pData: ITypeFileUserInput): Promise<ITypeFileUserInstance> {
    const vResponse: ITypeFileUserInstance = await modelTypeFileUser.create(pData)
    return vResponse
  }

  async update(pData: ITypeFileUserInput): Promise<ITypeFileUserInstance | null> {
    if (pData?.id) {
      const vCountry: ITypeFileUserInstance | null = await modelTypeFileUser.findOne({
        where: {
          id: pData.id,
        },
      })
      await vCountry?.update(pData, { where: { id: pData.id } })
      return vCountry
    }
    return null
  }

}
export default new TypeFileUserService()
