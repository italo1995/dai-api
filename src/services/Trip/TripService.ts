/* 
- File: TripService.ts

- Purpose: 

- Author: Italo Belen

- Creation: 05/02/2024  

==========Functions Manifest==========

- TripService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { Op, type FindOptions } from 'sequelize'
import type { UUID } from 'crypto'
import sequelize, { modelCurrency, modelPaymentMethod, modelTrip, modelTripDelivery, modelTripPayment, modelTripRoute, modelTripSpecialRequest, modelUser, modelVehicleAdditional } from '../../models'
import { EStatusTrip, type ITripInstance } from '../../models/Trip/TripModel'
import type { ITripInput, IResponseAllTrip, IParamAllTrip, IParamShowTrip, IParamShowActiveTrip } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'
import type { ITripSpecialRequestAttributes, ITripSpecialRequestInstance } from '../../models/Trip/TripSpecialRequestModel'

interface ITripService {
  validate(data: any): any
  show(pParam: IParamShowTrip): Promise<ITripInstance | null>
  all(pParam: IParamAllTrip): Promise<IResponseAllTrip | ITripInstance[]>
  NearbyTrips(pParam: any): Promise<ITripInstance[]>
  create(payload: ITripInput): Promise<ITripInstance>
  createSpecialRequest(pData: ITripSpecialRequestAttributes[]): Promise<ITripSpecialRequestInstance[]>
  update(payload: ITripInput): Promise<ITripInstance | null>
  softDeleteRecord(pId: number, pUserId: UUID): Promise<boolean>
}

class TripService implements ITripService {

  async validate(data: any) {
    const dataValidate = modelTrip.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: IParamAllTrip): Promise<IResponseAllTrip | ITripInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'name', 'Trip')
      if (pParam.userId) {
        if(pParam.isClient) {
          whereStatement.where = {
            ...whereStatement.where,
            userId: pParam.userId
          }
        } else {
          whereStatement.where = {
            ...whereStatement.where,
            driverId: pParam.userId
          }
        }
      }
      if (pParam?.TripPending) {
        whereStatement.where = { ...whereStatement.where, status: EStatusTrip.PENDIENTE }
      }
      const vRes = await modelTrip.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelTrip.count(whereStatement)
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

  public async NearbyTrips(pParam: any): Promise<ITripInstance[]> {
    try {
      const query = `SELECT trip_id, MIN(distance) AS min_distance, MAX(distance) AS max_distance, AVG(distance) AS distance
      FROM (
        SELECT lat, lon, trip_id, is_init, (6371 * acos(cos(radians(${Number(pParam.lat)})) * cos(radians(lat)) * cos(radians(lon) - radians(${Number(pParam.lon)})) + sin(radians(${Number(pParam.lat)})) * sin(radians(lat)))) as distance
        FROM trip_routes
        WHERE is_init = true
      ) as temp
      WHERE NOT distance IS NULL AND distance > 0 AND distance < ${Number(pParam.distance)}
      GROUP BY trip_id
      ORDER BY trip_id;`
      const vTripRoute: any[] = await sequelize.query(query, {
        mapToModel: true,
        model: modelTripRoute,
      }
      )
      const vtripsIds: any[]  = vTripRoute.map((vTripRoute) => vTripRoute?.dataValues.trip_id)
      const vTrip: any[] = await modelTrip.findAll({
        where: {
          id: vtripsIds,
          status: EStatusTrip.PENDIENTE
        },
        include: [
          {
            model: modelTripRoute,
            as: 'initRoute',
            required: false,
            where: {
              isInit: true
            }
          },
          {
            model: modelTripRoute,
            as: 'endRoute',
            required: false,
            where: {
              isEnd: true
            }
          },
          {
            model: modelTripPayment,
            as: 'tripPayment',
            required: false,
            include: [
              {
                model: modelCurrency,
                required: false,
                as: 'currency'
              },
              {
                model: modelPaymentMethod,
                required: false,
                as: 'paymentMethod'
              }
            ]
          },
          {
            model: modelTripDelivery,
            as: 'delivery',
            required: false,
          },
          {
            model: modelUser,
            as: 'user',
            required: false,
          },
          {
            model: modelTripSpecialRequest,
            as: 'tripSpecialRequest',
            required: false,
            include: [
              {
                model: modelVehicleAdditional,
                as: 'vehicleAdditional',
                required: true,
              }
            ]
          }
        ],
      })
      const vTripJson: any[] = JSON.parse(JSON.stringify(vTrip))
      const vResponse = vTripJson.map((trip) => {
        const distance = vTripRoute.find((route) => route.trip_id === trip.id)?.dataValues?.distance || null
        trip.distance = distance
        return trip
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pParam: IParamShowTrip): Promise<ITripInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      if(pParam.isClient) {
        whereStatement.where = {
          userId: pParam.userId,
          id: pParam.id
        }
      } else {
        whereStatement.where = {
          driverId: pParam.userId,
          id: pParam.id
        }
      }
      whereStatement.include = [
        {
          model: modelTripRoute,
          as: 'initRoute',
          required: false,
          where: {
            isInit: true
          }
        },
        {
          model: modelTripRoute,
          as: 'endRoute',
          required: false,
          where: {
            isEnd: true
          }
        },
        {
          model: modelTripPayment,
          as: 'tripPayment',
          required: false,
          include: [
            {
              model: modelCurrency,
              required: false,
              as: 'currency'
            },
            {
              model: modelPaymentMethod,
              required: false,
              as: 'paymentMethod'
            }
          ]
        },
        {
          model: modelTripDelivery,
          as: 'delivery',
          required: false,
        },
        {
          model: modelUser,
          as: 'user',
          required: false,
        },
        {
          model: modelTripSpecialRequest,
          as: 'tripSpecialRequest',
          required: false,
          include: [
            {
              model: modelVehicleAdditional,
              as: 'vehicleAdditional',
              required: true,
            }
          ]
        }
      ]
      const vResponse: ITripInstance | null = await modelTrip.findOne(whereStatement)
      return vResponse
    } catch (error) {
      console.log('error :>> ', error)
      throw error
    }
  }

  async showActive(pParam: IParamShowActiveTrip): Promise<ITripInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      if(pParam.isClient) {
        whereStatement.where = {
          userId: pParam.userId,
          status:{
            [Op.or]: [EStatusTrip.ACEPTADO, EStatusTrip.PENDIENTE]
          }
        }
      } else {
        whereStatement.where = {
          driverId: pParam.userId,
          status: EStatusTrip.ACEPTADO
        }
      }
      whereStatement.include = [
        {
          model: modelTripRoute,
          as: 'initRoute',
          required: false,
          where: {
            isInit: true
          }
        },
        {
          model: modelTripRoute,
          as: 'endRoute',
          required: false,
          where: {
            isEnd: true
          }
        },
        {
          model: modelTripPayment,
          as: 'tripPayment',
          required: false,
        },
        {
          model: modelTripSpecialRequest,
          as: 'tripSpecialRequest',
          required: false,
          include: [
            {
              model: modelVehicleAdditional,
              as: 'vehicleAdditional',
              required: true,
            }
          ]
        }
      ]
      const vResponse: ITripInstance | null = await modelTrip.findOne(whereStatement)
      return vResponse 
    } catch (error) {
      throw error
    }
  }

  async create(pData: ITripInput): Promise<ITripInstance> {
    try {
      const vResponse: ITripInstance = await modelTrip.create(pData)
      return vResponse
    } catch (error) {
      throw error 
    }

  }

  async createSpecialRequest(pData: ITripSpecialRequestAttributes[]): Promise<ITripSpecialRequestInstance[]> {
    try {
      const vResponse: ITripSpecialRequestInstance[] = await modelTripSpecialRequest.bulkCreate(pData)
      return vResponse
    } catch (error) {
      throw error 
    }

  }

  async update(pData: ITripInput): Promise<ITripInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      if (pData.userId) {
        whereStatement.where = {
          userId: pData.userId,
          id: pData.id
        }
      } else if (pData.driverId) {
        whereStatement.where = {
          driverId: {
            [Op.or]: [pData.userId, null]
          },
          id: pData.id
        }
      }
      if (pData?.id) {
        const vItem: ITripInstance | null = await modelTrip.findOne(whereStatement)
        await vItem?.update(pData)
        return vItem
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number, pUserId: UUID) {
    try {
      const record = await modelTrip.update({ deletedAt: new Date() }, {
        where: { id: pId, userId: pUserId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new TripService()

