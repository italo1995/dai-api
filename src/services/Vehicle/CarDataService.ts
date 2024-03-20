/* 
- File: CarDataService.ts

- Purpose: El serivicio CarData se encarga de las consultas con los modelos y funcionalidades relacionadas a las caracteristicas de cada vehiculo

- Author: Jairo belen

- Creation: 16/03/2024  

==========Functions Manifest==========
- CarDataService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import { ETypeCarData, type ICarDataInstance } from '../../models/Vehicle/CarDataModel'
import { modelCarData } from '../../models'
import type { ICarDataInput, IResponseAllCarData } from '../../types/VehicleTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ICarData {
  validate(data: any): any
  show(pId: number): Promise<ICarDataInstance | null>
  all(pParam: any): Promise<IResponseAllCarData | ICarDataInstance[]>
  create(payload: ICarDataInput): Promise<ICarDataInstance>
  update(payload: ICarDataInput): Promise<ICarDataInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class CarData implements ICarData {
  async validate(data: any) {
    const dataValidate = modelCarData.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllCarData | ICarDataInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name', modelCarData.name
      )

      if (pParam?.type) {
        (whereStatement.where as any)['type'] = pParam.type
      }
      
      if (pParam?.parentId) {
        (whereStatement.where as any)['parentId'] = pParam.parentId
      }

      const vResponse: ICarDataInstance[] = await modelCarData.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllCarData = await fxReponseServices(
          pParam,
          whereStatement,
          'CarData',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async getModelsByBrand(brandId: string): Promise<ICarDataInstance[]> {
    try {
      const models = await modelCarData.findAll({
        where: {
          parentId: brandId,
          type: ETypeCarData.model
        }
      })
      return models
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ICarDataInstance | null> {
    try {
      const vResponse: ICarDataInstance | null = await modelCarData.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ICarDataInput): Promise<ICarDataInstance> {
    try {
      const vResponse: ICarDataInstance = await modelCarData.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ICarDataInput): Promise<ICarDataInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: ICarDataInstance | null = await modelCarData.findOne({
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
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelCarData.update({ deletedAt: new Date() }, {
        where: { id: pId }
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
export default new CarData()