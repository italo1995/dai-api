/* 
- File: VehicleTypeService.ts

- Purpose: El serivicio VehicleType se encarga de las consultas con los modelos y funcionalidades relacionadas al VehicleType

- Author: Jairo Belen

- Creation: 29/01/2024  

==========Functions Manifest==========
- VehicleAdditionalService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { Op, type findOptions } from 'sequelize'
import type { IVehicleTypeInstance } from '../../models/Vehicle/VehicleTypeModels'
import { modelVehicleType } from '../../models'
import type { IVehicleAdditionalInput } from '../../types/VehicleTypes'
import type { IResponseAllVehicleAdditionalType } from '../../types/VehicleTypes'


  interface IVehicleTypeService {
    validate (data: any): any
    show(pId: number): Promise<IVehicleTypeInstance | null>
    create(payload: IVehicleAdditionalInput): Promise<IVehicleTypeInstance>
    update(payload: IVehicleAdditionalInput): Promise<IVehicleTypeInstance | null>
}

class VehicleTypeService implements IVehicleTypeService {

  async validate(data: any) {
    const dataValidate = modelVehicleType.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllVehicleAdditionalType | IVehicleTypeInstance[]> {
    try {
      const whereStatement: findOptions = {}
      if (Number(pParam?.pag)) {
        const limit = Number(pParam?.limit) || 10 // Define cuantos registros por pagina quieres mostrar
        whereStatement.limit = limit
        whereStatement.offset = (pParam.pag - 1) * limit
      }
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

      if (pParam?.search) {
        whereStatement.where = { ...whereStatement.where, name: { [Op.iLike]: `%${pParam.search}%` } }
      }
      const vResponse: IVehicleTypeInstance[] = await modelVehicleType.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelVehicleType.count (whereStatement)
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

  async create(pData: IVehicleAdditionalInput): Promise<IVehicleTypeInstance> {
    try {
      const vResponse: IVehicleTypeInstance = await modelVehicleType.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IVehicleAdditionalInput): Promise<IVehicleTypeInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IVehicleTypeInstance | null = await modelVehicleType.findOne({
          where: {
            id: pData.id,
          },
        })
        await vCountry?.update(pData, {where: { id: pData.id } })
        return vCountry
      }
      return null
    } catch (error) {
      throw error
    }
  }


}
export default new VehicleTypeService()