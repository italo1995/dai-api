/* 
- File: CancellationOptionService.ts

- Purpose: 

- Author: Italo Belen

- Creation: 27/02/204  

==========Functions Manifest==========
*/
import { type FindOptions } from 'sequelize'
import { modelCancellationOption } from '../../models'
import type { ICancellationOptionInstance } from '../../models/Trip/CancellationOptionModel'
import type { ICancellationOptionInput, IResponseAllCancellationOption } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxReponseServices, fxSearchILike } from '../../utils/query'

interface ITripDeliveryService {
  validate(data: any): any
  show(pId: number): Promise<ICancellationOptionInstance | null>
  all(pParam: any): Promise<IResponseAllCancellationOption | ICancellationOptionInstance[]>
  create(payload: ICancellationOptionInput): Promise<ICancellationOptionInstance>
  update(payload: ICancellationOptionInput): Promise<ICancellationOptionInstance | null>
  destroy(id: string): Promise<number>
}

class TripDeliveryService implements ITripDeliveryService {
  private model = modelCancellationOption

  async validate(data: any) {
    const dataValidate = this.model.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<ICancellationOptionInstance | null> {
    try {
      const vResponse: ICancellationOptionInstance | null = await this.model.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async all(
    pParam: any
  ): Promise<IResponseAllCancellationOption | ICancellationOptionInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        this.model.name
      )
      if (pParam.isClient || pParam.isDriver) {
        whereStatement.where = {
          ...whereStatement.where,
          isClient: pParam?.isClient || false,
          isDriver: pParam?.isDriver || false,
        }
      }
      const vResponse: ICancellationOptionInstance[] = await this.model.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllCancellationOption = await fxReponseServices(
          pParam,
          whereStatement,
          this.model.name,
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ICancellationOptionInput): Promise<ICancellationOptionInstance> {
    const vResponse: ICancellationOptionInstance = await this.model.create(pData)
    return vResponse
  }

  async update(pData: ICancellationOptionInput): Promise<ICancellationOptionInstance | null> {
    const whereStatement: FindOptions = {}
    whereStatement.where = {
      id: pData.id,
    }
    if (pData?.id) {
      const vItem: ICancellationOptionInstance | null = await this.model.findOne(whereStatement)
      await vItem?.update(pData)
      return vItem
    }
    return null
  }
  async destroy(id: string): Promise<number> {
    try {
      const result: number = await this.model.destroy({
        where: { id: id },
      })
      return result
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
export default new TripDeliveryService()
