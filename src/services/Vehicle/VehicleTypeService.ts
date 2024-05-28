/* 
- File: VehicleTypeService.ts

- Purpose: El serivicio VehicleType se encarga de las consultas con los modelos y funcionalidades relacionadas al VehicleType

- Author: Jairo Belen

- Creation: 29/01/2024  

==========Functions Manifest==========
- VehicleTypeService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IVehicleTypeInstance } from '../../models/Vehicle/VehicleTypeModels'
import { modelVehicleType } from '../../models'
import type { IVehicleTypeInput, IResponseAllVehicleTypeType } from '../../types/VehicleTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IVehicleTypeService {
  validate(data: any): any
  show(pId: number): Promise<IVehicleTypeInstance | null>
  all(pParam: any): Promise<IResponseAllVehicleTypeType | IVehicleTypeInstance[]>
  create(payload: IVehicleTypeInput): Promise<IVehicleTypeInstance>
  update(payload: IVehicleTypeInput): Promise<IVehicleTypeInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class VehicleTypeService implements IVehicleTypeService {
  async validate(data: any) {
    const dataValidate = modelVehicleType.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllVehicleTypeType | IVehicleTypeInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      if (!pParam?.orden) {
        whereStatement.order = [['orden', 'ASC']]
      }
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'VehicleType'
      )
      if (pParam?.isMoto) {
        whereStatement.where = { ...whereStatement.where, isMoto: true }
      }
      if (pParam?.isCar) {
        whereStatement.where = { ...whereStatement.where, isCar: true }
      }
      const vResponse: IVehicleTypeInstance[] = await modelVehicleType.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllVehicleTypeType = await fxReponseServices(
          pParam,
          whereStatement,
          'VehicleType',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IVehicleTypeInstance | null> {
    try {
      const vResponse: IVehicleTypeInstance | null = await modelVehicleType.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IVehicleTypeInput): Promise<IVehicleTypeInstance> {
    try {
      const vResponse: IVehicleTypeInstance = await modelVehicleType.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IVehicleTypeInput): Promise<IVehicleTypeInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IVehicleTypeInstance | null = await modelVehicleType.findOne({
          where: {
            id: pData.id,
          },
        })
        await vReponse?.update(pData, { where: { id: pData.id } })
        return vReponse
      }
      return null
    } catch (error) {
      throw error
    }
  }
  async softDeleteRecord(vId: number) {
    try {
      const record = await modelVehicleType.update(
        { deletedAt: new Date() },
        {
          where: { id: vId },
        }
      )
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new VehicleTypeService()
