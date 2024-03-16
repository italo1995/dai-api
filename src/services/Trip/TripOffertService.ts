/* 
- File: TripOffertService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 15/02/2024  

==========Functions Manifest==========

- TripOffertService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { Op, type FindOptions } from 'sequelize'
import sequelize, { modelCurrency, modelTripOffert, modelUser } from '../../models'
import { ETripOffertStatus, type ITripOffertInstance } from '../../models/Trip/TripOffertModel'
import type { IResponseAllTripOffert, ITripOffertInput, ITripOffertUpdate } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ITripOffertService {
  validate(data: any): any
  show(pId: number): Promise<ITripOffertInstance | null>
  all(pParam: any): Promise<IResponseAllTripOffert | ITripOffertInstance[]>
  create(payload: ITripOffertInput): Promise<ITripOffertInstance>
  update(payload: ITripOffertUpdate): Promise<ITripOffertInstance | null>
  softDeleteRecord(pId:string): Promise<boolean>

}

class TripOffertService implements ITripOffertService {
  private model = modelTripOffert
  async validate(data: any) {
    const dataValidate = this.model.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<ITripOffertInstance | null> {
    try {
      const vResponse: ITripOffertInstance | null = await this.model.findOne({
        attributes: ['id', 'tripId', 'currencyId', 'amount', 'createdAt'],
        where: {
          id: pId,
        },
        include: [
          {
            model: modelCurrency,
            required: false,
            as: 'currency',
            attributes: ['id', 'name', 'symbol']
          },
        ]
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async showDriver(pId: number): Promise<ITripOffertInstance | null> {
    try {
      const vResponse: ITripOffertInstance | null = await this.model.findOne({
        attributes: ['id', 'tripId', 'driverId', 'clientId', 'currencyId', 'amount', 'createdAt'],
        where: {
          id: pId,
        },
        include: [
          {
            model: modelUser,
            required: true,
            as: 'driver',
            attributes: ['id', 'socketId', 'tokenPush']
          }
        ]
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async showAcept(pId: number): Promise<ITripOffertInstance | null> {
    try {
      const vResponse: ITripOffertInstance | null = await this.model.findOne({
        attributes: ['id', 'tripId', 'driverId', 'clientId', 'currencyId', 'amount', 'createdAt', 'distance', 'duration', 'durationInMs'],
        where: {
          tripId: pId,
          status: ETripOffertStatus.ACEPTADA
        },
        include: [
          {
            model: modelUser,
            required: true,
            as: 'driver',
            attributes: ['id', 'socketId', 'tokenPush']
          },
          {
            model: modelCurrency,
            required: false,
            as: 'currency',
            attributes: ['id', 'name', 'symbol']
          },
        ]
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async all(pParam: any): Promise<IResponseAllTripOffert | ITripOffertInstance[]> {
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

      const vResponse: ITripOffertInstance[] = await this.model.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTripOffert = await fxReponseServices(
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

  async create(pData: ITripOffertInput): Promise<ITripOffertInstance> {
    try {
      const vResponse: ITripOffertInstance = await this.model.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }

  }

  async update(pData: ITripOffertUpdate): Promise<ITripOffertInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      if (pData.tripId) {
        whereStatement.where = {
          tripId: pData.id,
          // id: pData.id
        }
      } else if (pData.id) {
        whereStatement.where = {
          driverId: {
            [Op.or]: [pData.driverId, null]
          },
          id: pData.id
        }
      }
      if (pData?.id) {
        const vItem: ITripOffertInstance | null = await this.model.findOne(whereStatement)
        await vItem?.update(pData)
        return vItem
      }
      return null
    } catch (error) {
      throw error
    }
  }
  async softDeleteRecord(pId: string) {
    try {
      const record = await this.model.update({ deletedAt: new Date() }, {
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
  async getTimeRemaining(id: number) {
    try {
      const offer = await this.model.findByPk(id)
      if (!offer) {
        return null
      }
      const vCreatedAt: string = offer?.dataValues?.createdAt?.toString() || ''
      const vCreatedAtParse = new Date(vCreatedAt)
      const duration = Number(offer.dataValues.durationInMs)
      const vNow: any = await sequelize.query('SELECT NOW()')
      const vNowTimeString: string = vNow[0][0].now.toString() || new Date().toISOString()
      const currentDate = new Date(vNowTimeString)
      const diff = currentDate.getTime() - vCreatedAtParse.getTime()
      const remaining = duration - (diff / 1000)
      return remaining
    } catch (error) {
      throw error
    }
  }
}

export default new TripOffertService()

