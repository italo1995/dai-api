/* 
- File: CityService.ts

- Purpose: El serivicio auth se encarga de las consultas con los modelos y funcionalidades relacionadas al auth

- Author: Italo Belen

- Creation: 17/01/2024  

==========Functions Manifest==========

- CityService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del usuario segun el id, puede usarse en el perfil o para verificar informacion del usuario
  3 - showUserNumber: Verifica si existe un usuario con ese numero de telefono y codigo de area
  4 - showUserCodeNumber: Sirve para verificar si el usuario ya tiene un codigo creado ese dia.
  5 - create: crea datos del usuario
  6 - update: actualiza datos del usuario
  7 - createCode: Guarda los codigos generados en la base de datos
  8 - showCode: Vrificar el codigo codigo enviado por el usuario es real y fue creado ese dia.
  9 - login: Se usa para el login de administrador, verificando la contraseña
*/
import { type FindOptions } from 'sequelize'
import type { ICityInput, ICityUpdate } from '../../types/LocationType'
import type { ICityInstance } from '../../models/Locations/CityModel'
import { modelCity } from '../../models'
import type { IResponseAll } from '../../types/generalType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'

interface ICityService {
  validate(data: any): any
  show(pId: number): Promise<ICityInstance | null>
  create(payload: ICityInput): Promise<ICityInstance>
  update(payload: ICityUpdate): Promise<ICityInstance | null>
}

class CityService implements ICityService {
  async validate(data: any) {
    const dataValidate = modelCity.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAll | ICityInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'City'
      )
      if (pParam?.regionId) {
        whereStatement.where = {
          ...whereStatement.where,
          regionId: pParam.regionId
        }
      }
      const vRes = await modelCity.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelCity.count(whereStatement)
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

  async show(pId: number): Promise<ICityInstance | null> {
    const vResponse: ICityInstance | null = await modelCity.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async create(pData: ICityInput): Promise<ICityInstance> {
    const vResponse: ICityInstance = await modelCity.create(pData)
    return vResponse
  }

  async update(pData: ICityUpdate): Promise<ICityInstance | null> {
    if (pData?.id) {
      const vReponse: ICityInstance | null = await modelCity.findOne({
        where: {
          id: pData.id,
        },
      })
      await vReponse?.update(pData, { where: { id: pData.id } })
      return vReponse
    }
    return null
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelCity.update(
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
export default new CityService()
