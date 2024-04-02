/* 
- File: TripCancellationOptionService.ts

- Purpose: 

- Author: Italo Belen

- Creation: 27/02/204  

==========Functions Manifest==========
*/
import { type FindOptions } from 'sequelize'
import { modelTripCancellationOption } from '../../models'
import type { ITripCancellationOptionInstance } from '../../models/Trip/TripCancellationOptionModel'
import type {
  ITripCancellationOptionInput,
  IResponseAllTripCancellationOption,
} from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxReponseServices, fxSearchILike } from '../../utils/query'

interface ITripDeliveryService {
  validate(data: any): any
  show(id: number): Promise<ITripCancellationOptionInstance | null>
  all(pParam: any): Promise<IResponseAllTripCancellationOption | ITripCancellationOptionInstance[]>
  create(payload: ITripCancellationOptionInput): Promise<ITripCancellationOptionInstance>
  update(payload: ITripCancellationOptionInput): Promise<ITripCancellationOptionInstance | null>
  destroy(id: string): Promise<number>
}

class TripDeliveryService implements ITripDeliveryService {
  private model = modelTripCancellationOption

  async validate(data: any) {
    const dataValidate = this.model.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<ITripCancellationOptionInstance | null> {
    try {
      const vResponse: ITripCancellationOptionInstance | null = await this.model.findOne({
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
  ): Promise<IResponseAllTripCancellationOption | ITripCancellationOptionInstance[]> {
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

      const vResponse: ITripCancellationOptionInstance[] = await this.model.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTripCancellationOption = await fxReponseServices(
          pParam,
          whereStatement,
          'TripOffert',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ITripCancellationOptionInput): Promise<ITripCancellationOptionInstance> {
    const vResponse: ITripCancellationOptionInstance = await this.model.create(pData)
    return vResponse
  }

  async update(
    pData: ITripCancellationOptionInput
  ): Promise<ITripCancellationOptionInstance | null> {
    const whereStatement: FindOptions = {}
    whereStatement.where = {
      id: pData.id,
    }
    if (pData?.id) {
      const vItem: ITripCancellationOptionInstance | null = await this.model.findOne(whereStatement)
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
