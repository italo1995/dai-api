/* 
- File: VehicleAdditionalService.ts

- Purpose: El serivicio VehicleAdditional se encarga de las consultas con los modelos y funcionalidades relacionadas al VehicleAdditional

- Author: Jairo Belen

- Creation: 26/01/2024  

==========Functions Manifest==========
- VehicleAdditionalService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { Op, type FindOptions } from 'sequelize'
import type { IVehicleAdditionalInstance } from '../../models/Vehicle/VehicleAdditionalModels'
import { modelVehicleAdditional } from '../../models'
import type { IVehicleAdditionalInput } from '../../types/VehicleTypes.js'
import type { IResponseAllVehicleAdditionalType } from '../../types/VehicleTypes'

interface IVehicleAdditionalService {
  validate(data: any): any
  show(pId: number): Promise<IVehicleAdditionalInstance | null>
  all(pParam: any): Promise<IResponseAllVehicleAdditionalType | IVehicleAdditionalInstance[]>
  create(payload: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance>
  update(payload: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class VehicleAdditionalService implements IVehicleAdditionalService {
  async validate(data: any) {
    const dataValidate = modelVehicleAdditional.build(data)
    await dataValidate.validate()
  }

  public async all(
    pParam: any
  ): Promise<IResponseAllVehicleAdditionalType | IVehicleAdditionalInstance[]> {
    try {
      const whereStatement: FindOptions = {}
      if (Number(pParam?.pag)) {
        const limit = Number(pParam?.limit) || 10 // Define cuantos registros por pagina quieres mostrar
        whereStatement.limit = limit
        whereStatement.offset = (pParam.pag - 1) * limit
      }
      if (Number(pParam?.orden) === 2) {
        whereStatement.order =
          whereStatement.order instanceof Array
            ? [...whereStatement.order, ['name', 'ASC']]
            : [['name', 'ASC']]
      } else {
        whereStatement.order =
          whereStatement.order instanceof Array
            ? [...whereStatement.order, ['id', 'DESC']]
            : [['id', 'DESC']]
      }

      if (pParam?.search) {
        whereStatement.where = {
          ...whereStatement.where,
          name: { [Op.iLike]: `%${pParam.search}%` },
        }
      }
      if ('isMoto' in pParam) {
        whereStatement.where = { ...whereStatement.where, isMoto: pParam.isMoto }
      }
      if ('isCar' in pParam) {
        whereStatement.where = { ...whereStatement.where, isCar: pParam.isCar }
      }
      if ('isClient' in pParam) {
        whereStatement.where = { ...whereStatement.where, isClient: pParam.isClient }
      }
      if ('isRegister' in pParam) {
        whereStatement.where = { ...whereStatement.where, isRegister: pParam.isRegister }
      }
      const vResponse: IVehicleAdditionalInstance[] =
        await modelVehicleAdditional.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelVehicleAdditional.count(whereStatement)
        const vResponsePaginate: IResponseAllVehicleAdditionalType = {
          total: vCount,
          totalPage: Math.ceil(vCount / vLimit),
          data: vResponse,
          actualPage: Number(pParam.pag),
        }
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async allFilterIdArray(pParam: any): Promise<IVehicleAdditionalInstance[]> {
    try {
      const JSONParam = JSON.parse(JSON.stringify(pParam))
      if (!JSONParam || JSONParam?.length === 0) {
        return []
      }
      const vAdditionalsValue = JSONParam.detail.filter((d: any) => d.fieldName === 'additionals')
      if (vAdditionalsValue && vAdditionalsValue.length) {
        let stringIds = vAdditionalsValue[0].value
        stringIds = stringIds.replaceAll('{', '')
        stringIds = stringIds.replaceAll('}', '')
        if (stringIds) {
          const ids = stringIds.split(',')
          if (ids && ids.length === 0) {
            return []
          }
          const vResponse: IVehicleAdditionalInstance[] = await modelVehicleAdditional.findAll({
            where: {
              id: ids,
            },
          })
          return vResponse
        }
      }
      return []
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IVehicleAdditionalInstance | null> {
    try {
      if (!pId) {
        return null
      }
      const vResponse: IVehicleAdditionalInstance | null = await modelVehicleAdditional.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance> {
    try {
      const vResponse: IVehicleAdditionalInstance = await modelVehicleAdditional.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IVehicleAdditionalInstance | null = await modelVehicleAdditional.findOne({
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
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelVehicleAdditional.update(
        { deletedAt: new Date() },
        {
          where: { id: pId },
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
export default new VehicleAdditionalService()
