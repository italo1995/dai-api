/* 
- File: NewService.ts

- Purpose: El serivicio New se encarga de las consultas con los modelos y funcionalidades relacionadas a las noticias

- Author: Jairo Belen

- Creation: 01/02/2024  

==========Functions Manifest==========
- VehicleAdditionalService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { INewInstance } from '../../models/web/NewsModel'
import { modelNew } from '../../models'
import type { IWebInput, IResponseAllNew } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface INewService{
    validate(data: any): any
    show(pId: number): Promise<INewInstance | null>
    create(payload: IWebInput): Promise<INewInstance>
    update(payload: IWebInput): Promise<INewInstance | null>
}

class NewService implements INewService {
  async validate(data: any) {
    const dataValidate = modelNew.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllNew | INewInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name','new'
      )

      const vResponse: INewInstance[] = await modelNew.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllNew = await fxReponseServices(
          pParam,
          whereStatement,
          'news',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }
  
  async show(pId: number): Promise<INewInstance | null> {
    try {
      const vResponse: INewInstance | null = await modelNew.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IWebInput): Promise<INewInstance> {
    try {
      const vResponse: INewInstance = await modelNew.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IWebInput): Promise<INewInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: INewInstance | null = await modelNew.findOne({
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

}
export default new NewService()