/* 
- File: DriverDetailsService.ts

- Purpose: El serivicio auth se encarga de las consultas con los modelos y funcionalidades relacionadas al auth

- Author: Italo Belen

- Creation: 17/01/2024  

==========Functions Manifest==========

- DriverDetailsService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del usuario segun el id, puede usarse en el perfil o para verificar informacion del usuario
  3 - create: crea datos del usuario
  4 - update: actualiza datos del usuario
*/
import { Op, type FindOptions } from 'sequelize'
import type { IDriverDetailInstance } from '../../models/User/DriverDetail'
import { modelDriverDetail } from '../../models'
import type { IDriverDetailInput } from '../../types/User'
import type { IResponseAll } from '../../types/generalType'

interface IDriverDetailService {
  validate(data: any): any
  show(pId: number): Promise<IDriverDetailInstance | null>
  create(payload: IDriverDetailInput): Promise<IDriverDetailInstance>
  update(payload: IDriverDetailInput): Promise<IDriverDetailInstance | null>
  createMany(pData: IDriverDetailInput[], pUserId: string): Promise<IDriverDetailInstance[]>
}

class DriverDetailsService implements IDriverDetailService {
  async validate(data: any) {
    const dataValidate = modelDriverDetail.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAll | IDriverDetailInstance[]> {
    try {
      const whereStatement: FindOptions = {}
      if (Number(pParam?.pag)) {
        const limit = Number(pParam?.limit) || 10 // Define cuántos registros por página quieres mostrar
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
      const res = await modelDriverDetail.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const limit = Number(pParam?.limit) || 10
        const count = await modelDriverDetail.count(whereStatement)
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

  async show(pId: number): Promise<IDriverDetailInstance | null> {
    const vResponse: IDriverDetailInstance | null = await modelDriverDetail.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async create(pData: IDriverDetailInput): Promise<IDriverDetailInstance> {
    const vResponse: IDriverDetailInstance = await modelDriverDetail.create(pData)
    return vResponse
  }

  async createMany(pData: IDriverDetailInput[], pUserId: string): Promise<IDriverDetailInstance[]> {
    modelDriverDetail.destroy({
      where: {
        userId: pUserId,
      },
    })
    const vResponse: IDriverDetailInstance[] = await modelDriverDetail.bulkCreate(pData)
    return vResponse
  }

  async update(pData: IDriverDetailInput): Promise<IDriverDetailInstance | null> {
    if (pData?.id) {
      const vReponse: IDriverDetailInstance | null = await modelDriverDetail.findOne({
        where: {
          id: pData.id,
        },
      })
      await vReponse?.update(pData, { where: { id: pData.id } })
      return vReponse
    }
    return null
  }
}
export default new DriverDetailsService()
