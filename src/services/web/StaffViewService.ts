import { type FindOptions } from 'sequelize'
import { modelStaffView } from '../../models'
import type {
  staffViewInstance,
  staffViewAttributes,
  staffViewReponseAll,
} from '../../models/web/StaffViewModel'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IstaffViewService {
  validate(data: any): any
  show(pId: string): Promise<staffViewInstance | null>
  create(payload: staffViewAttributes): Promise<staffViewInstance>
  createMany(pData: staffViewAttributes[]): Promise<staffViewInstance[]>
  update(payload: staffViewAttributes): Promise<staffViewInstance | null>
}

class staffViewService implements IstaffViewService {
  async validate(data: any) {
    const dataValidate = modelStaffView.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<staffViewReponseAll | staffViewInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'staffView'
      )

      const vResponse: staffViewInstance[] = await modelStaffView.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: staffViewReponseAll = await fxReponseServices(
          pParam,
          whereStatement,
          'staffView',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: string): Promise<staffViewInstance | null> {
    try {
      const vResponse: staffViewInstance | null = await modelStaffView.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: staffViewAttributes): Promise<staffViewInstance> {
    try {
      const vResponse: staffViewInstance = await modelStaffView.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async createMany(pData: staffViewAttributes[]): Promise<staffViewInstance[]> {
    try {
      const vResponse: staffViewInstance[] = await modelStaffView.bulkCreate(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: staffViewAttributes): Promise<staffViewInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: staffViewInstance | null = await modelStaffView.findOne({
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

export default new staffViewService()
