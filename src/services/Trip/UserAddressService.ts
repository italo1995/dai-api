/* 
- File: CountryService.ts

- Purpose: El serivicio auth se encarga de las consultas con los modelos y funcionalidades relacionadas al auth

- Author: Italo Belen

- Creation: 17/01/2024  

==========Functions Manifest==========

- CountryService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del direcciones del usuario segun el id
  3 - create: crea datos del direcciones del usuario
  4 - update: actualiza datos del direcciones del usuario
  5 - destroy: Borra datos del direcciones del usuario
*/
import { type FindOptions } from 'sequelize'
import type { UUID } from 'crypto'
import { modelUserAddress } from '../../models'
import type { IUserAddressInstance } from '../../models/Trip/UserAddressModel'
import type { IUserAddressInput, IResponseAllUserAddress } from '../../types/TransferType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'

interface ICountryService {
  validate(data: any): any
  show(pId: number, pUserId: UUID): Promise<IUserAddressInstance | null>
  all(pParam: any): Promise<IResponseAllUserAddress | IUserAddressInstance[]>
  create(payload: IUserAddressInput): Promise<IUserAddressInstance>
  update(payload: IUserAddressInput): Promise<IUserAddressInstance | null>
}

class UserAddressService implements ICountryService {

  async validate(data: any) {
    const dataValidate = modelUserAddress.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllUserAddress | IUserAddressInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'name', 'UserAddress')
      whereStatement.where = {
        ...whereStatement.where,
        userId: pParam.userId
      }
      const vRes = await modelUserAddress.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelUserAddress.count(whereStatement)
        const vResp = {
          total: vCount,
          totalPage: Math.ceil(vCount / vLimit),
          data: vRes,
          actualPage: Number(pParam.pag),
        }
        return vResp
      }

      return vRes
    } catch (error) {
      throw error
    }
  }

  async show(pId: number, pUserId: UUID): Promise<IUserAddressInstance | null> {
    const vResponse: IUserAddressInstance | null = await modelUserAddress.findOne({
      where: {
        id: pId,
        userId: pUserId
      },
    })
    return vResponse
  }

  async create(pData: IUserAddressInput): Promise<IUserAddressInstance> {
    const vResponse: IUserAddressInstance = await modelUserAddress.create(pData)
    return vResponse
  }

  async update(pData: IUserAddressInput): Promise<IUserAddressInstance | null> {
    if (pData?.id) {
      const vItem: IUserAddressInstance | null = await modelUserAddress.findOne({
        where: {
          id: pData.id,
          userId: pData.userId
        },
      })
      await vItem?.update(pData)
      return vItem
    }
    return null
  }

  async softDeleteRecord(pId: number, pUserId: UUID) {
    try {
      const record = await modelUserAddress.update({ deletedAt: new Date() }, {
        where: { id: pId, userId: pUserId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new UserAddressService()
