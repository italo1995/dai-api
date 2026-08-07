/* 
- File: HelpInformationService.ts

- Purpose: El serivicio HelpInformation se encarga de las consultas con los modelos y funcionalidades relacionadas a la informacion de ayuda

- Author: Jairo belen

- Creation: 14/03/2024  

==========Functions Manifest==========
- HelpInformationService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IHelpInformationInstance } from '../../models/web/HelpInfomationModel'
import { modelHelpInformation } from '../../models'
import type { IHelpInformationInput, IResponseAllHelpInformation } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IHelpInformation {
  validate(data: any): any
  show(pId: number): Promise<IHelpInformationInstance | null>
  all(pParam: any): Promise<IResponseAllHelpInformation | IHelpInformationInstance[]>
  create(payload: IHelpInformationInput): Promise<IHelpInformationInstance>
  update(payload: IHelpInformationInput): Promise<IHelpInformationInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class HelpInformation implements IHelpInformation {
  async validate(data: any) {
    const dataValidate = modelHelpInformation.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllHelpInformation | IHelpInformationInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        modelHelpInformation.name
      )

      const vResponse: IHelpInformationInstance[] =
        await modelHelpInformation.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllHelpInformation = await fxReponseServices(
          pParam,
          whereStatement,
          'HelpInformation',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IHelpInformationInstance | null> {
    try {
      const vResponse: IHelpInformationInstance | null = await modelHelpInformation.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IHelpInformationInput): Promise<IHelpInformationInstance> {
    try {
      const vResponse: IHelpInformationInstance = await modelHelpInformation.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IHelpInformationInput): Promise<IHelpInformationInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IHelpInformationInstance | null = await modelHelpInformation.findOne({
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
      const record = await modelHelpInformation.update(
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
export default new HelpInformation()
