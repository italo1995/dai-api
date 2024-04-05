import { type FindOptions } from 'sequelize'
import { modelStaff, modelView } from '../../models'
import type { staffInstance, staffAttributes, staffReponseAll } from '../../models/web/StaffModel'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IstaffService {
  validate(data: any): any
  show(pId: string): Promise<staffInstance | null>
  create(payload: staffAttributes): Promise<staffInstance>
  update(payload: staffAttributes): Promise<staffInstance | null>
  softDeleteRecord(pId: string): Promise<boolean>
}

class staffService implements IstaffService {
  async validate(data: any) {
    const dataValidate = modelStaff.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<staffReponseAll | staffInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'staff'
      )
      whereStatement.include = [
        {
          model: modelView,
          as: 'views',
          attributes: ['icon', 'title', 'url'],
        },
      ]
      const vResponse: staffInstance[] = await modelStaff.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: staffReponseAll = await fxReponseServices(
          pParam,
          whereStatement,
          'staff',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: string): Promise<staffInstance | null> {
    try {
      const vResponse: staffInstance | null = await modelStaff.findOne({
        where: {
          id: pId,
        },
        include: [
          {
            model: modelView,
            as: 'views',
            attributes: ['icon', 'title', 'url'],
          },
        ],
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: staffAttributes): Promise<staffInstance> {
    try {
      const vResponse: staffInstance = await modelStaff.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: staffAttributes): Promise<staffInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: staffInstance | null = await modelStaff.findOne({
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

  async softDeleteRecord(pId: string) {
    try {
      const record = await modelStaff.update(
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

export default new staffService()
