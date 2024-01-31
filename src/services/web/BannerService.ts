/* 
- File: BannerService.ts

- Purpose: El serivicio Banner se encarga de las oonsultas con modelos y funcionalidades al Banner

- Author: Jairo Belen

- Creation: 30/01/2024  

==========Functions Manifest==========
- VehicleAdditionalService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IBannerInstance } from '../../models/web/BannerModel'
import { modelBanner } from '../../models'
import type { IWebInput, IResponseAllBanner } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IBannerService {
  validate(data: any): any
  show(pId: number): Promise<IBannerInstance | null>
  create(payload: IWebInput): Promise<IBannerInstance>
  update(payload: IWebInput): Promise<IBannerInstance | null>
}

class BannerService implements IBannerService {
  async validate(data: any) {
    const dataValidate = modelBanner.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllBanner | IBannerInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        'banner'
      )

      const vResponse: IBannerInstance[] = await modelBanner.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllBanner = await fxReponseServices(pParam, whereStatement, 'banner', vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IBannerInstance | null> {
    try {
      const vResponse: IBannerInstance | null = await modelBanner.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IWebInput): Promise<IBannerInstance> {
    try {
      const vResponse: IBannerInstance = await modelBanner.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IWebInput): Promise<IBannerInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IBannerInstance | null = await modelBanner.findOne({
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
export default new BannerService()