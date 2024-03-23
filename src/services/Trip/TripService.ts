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
import sequelize, { modelCurrency, modelPaymentMethod, modelReview, modelTrip, modelTripDelivery, modelTripPanic, modelTripPayment, modelTripRoute, modelTripSpecialRequest, modelTripTravel, modelUser, modelUserRating, modelVehicleAdditional } from '../../models'
import { EStatusTrip, ETypeService, type ITripInstance } from '../../models/Trip/TripModel'
import type { ITripInput, IResponseAllTrip, IParamAllTrip, IParamShowTrip, IParamShowActiveTrip, ITripUpdate } from '../../types/TripType'
import { fxFilterDate, fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'
import type { ITripSpecialRequestAttributes, ITripSpecialRequestInstance } from '../../models/Trip/TripSpecialRequestModel'
import { ETypeUser } from '../../types/User'
import { ETypeReview } from '../../models/ReviewModel'
import type { ITripPanicInstance } from '../../models/Trip/TripPanicModel'

interface ITripService {
  validate(data: any): any
  show(pParam: IParamShowTrip): Promise<ITripInstance | null>
  all(pParam: IParamAllTrip): Promise<IResponseAllTrip | ITripInstance[]>
  NearbyTrips(pParam: any): Promise<ITripInstance[]>
  create(payload: ITripInput): Promise<ITripInstance>
  createSpecialRequest(pData: ITripSpecialRequestAttributes[]): Promise<ITripSpecialRequestInstance[]>
  update(payload: ITripUpdate): Promise<ITripInstance | null>
  softDeleteRecord(pId: number, pUserId: UUID): Promise<boolean>
  hidden(pParam: { userId: string, id: number }): Promise<boolean | null>
  showPanic(pParam: { tripId: number }): Promise<ITripPanicInstance[] | null>
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
      whereStatement.where = fxFilterDate(pParam, whereStatement)
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
      if (Number(pParam?.pag)) {
        whereStatement.include = [
          {
            model: modelTripDelivery,
            as: 'delivery',
            required: false,
          },
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
            include: [
              {
                model: modelUserRating,
                as: 'clientRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'clientId'
                }
              },
              {
                model: modelUserRating,
                as: 'driverRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'driverId'
                }
              }
            ]
          },
          {
            model: modelUser,
            as: 'driver',
            required: false,
            include: [
              {
                model: modelUserRating,
                as: 'clientRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'clientId'
                }
              },
              {
                model: modelUserRating,
                as: 'driverRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'driverId'
                }
              }
            ]
          },
          {
            model: modelTripSpecialRequest,
            as: 'tripSpecialRequest',
            required: false,
            include: [
              {
                model: modelVehicleAdditional,
                as: 'vehicleAdditional',
                required: false,
              }
            ]
          }
        ]
      }
      if (pParam?.isClient) {
        whereStatement.where = {
          ...whereStatement.where,
          visibility: 1
        }
      }
      const vRes = await modelTrip.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelTrip.count({
          ...whereStatement,
          distinct: true,
          col: 'id'
        })
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
        INNER JOIN trips on trip_id = trips.id
        WHERE is_init = true AND trips.status = '${EStatusTrip.PENDIENTE}'
      ) as temp
      WHERE NOT distance IS NULL AND distance >= 0 AND distance < ${Number(pParam.distance)}
      GROUP BY trip_id
      ORDER BY trip_id;`
      const vTripRoute: any[] = await sequelize.query(query, {
        mapToModel: true,
        model: modelTripRoute,
      }
      )
      const vtripsIds: any[]  = vTripRoute.map((vTripRoute) => vTripRoute?.dataValues.trip_id)
      const whereStatement: FindOptions = {
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
            include: [
              {
                model: modelUserRating,
                as: 'clientRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'clientId'
                }
              },
              {
                model: modelUserRating,
                as: 'driverRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'driverId'
                }
              }
            ]
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
      }
      if (pParam?.isCar) {
        whereStatement.where = {
          ...whereStatement.where,
          typeService: {
            [Op.or]: [ETypeService.CAR, ETypeService.DELIVERY, ETypeService.TRAVEL]
          }
        }
      }
      if (pParam?.isMoto) {
        whereStatement.where = {
          ...whereStatement.where,
          typeService: {
            [Op.or]: [ETypeService.MOTO, ETypeService.DELIVERY, ETypeService.TRAVEL]
          }
        }
      }
      const vTrip: any[] = await modelTrip.findAll(whereStatement)
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
          model: modelTripDelivery,
          as: 'delivery',
          required: false,
        },
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
          include: [
            {
              model: modelUserRating,
              as: 'clientRating',
              required: false,
              attributes: ['quantity', 'ratings'],
              where: {
                type: 'clientId'
              }
            },
            {
              model: modelUserRating,
              as: 'driverRating',
              required: false,
              attributes: ['quantity', 'ratings'],
              where: {
                type: 'driverId'
              }
            }
          ]
        },
        {
          model: modelUser,
          as: 'driver',
          required: false,
          include: [
            {
              model: modelUserRating,
              as: 'clientRating',
              required: false,
              attributes: ['quantity', 'ratings'],
              where: {
                type: 'clientId'
              }
            },
            {
              model: modelUserRating,
              as: 'driverRating',
              required: false,
              attributes: ['quantity', 'ratings'],
              where: {
                type: 'driverId'
              }
            }
          ]
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
        },
        {
          model: modelReview,
          as: 'review',
          required: false,
          where: {
            type: ETypeReview.PASSENGER
          }
        }
      ]
      const vResponse: ITripInstance | null = await modelTrip.findOne(whereStatement)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async showId(pParam: IParamShowTrip): Promise<ITripInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      whereStatement.where = {
        id: pParam.id
      }
      if (pParam?.needClient) {
        whereStatement.include = [
          {
            model: modelUser,
            as: 'user',
            required: false,
            attributes: ['id', 'name', 'socketId', 'tokenPush']
          }
        ]
      }
      if (pParam.panic) {
        whereStatement.include = [
          {
            model: modelTripDelivery,
            as: 'delivery',
            required: false,
          },
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
            include: [
              {
                model: modelUserRating,
                as: 'clientRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'clientId'
                }
              },
              {
                model: modelUserRating,
                as: 'driverRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'driverId'
                }
              }
            ]
          },
          {
            model: modelUser,
            as: 'driver',
            required: false,
            include: [
              {
                model: modelUserRating,
                as: 'clientRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'clientId'
                }
              },
              {
                model: modelUserRating,
                as: 'driverRating',
                required: false,
                attributes: ['quantity', 'ratings'],
                where: {
                  type: 'driverId'
                }
              }
            ]
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
          },
          {
            model: modelReview,
            as: 'review',
            required: false,
            where: {
              type: ETypeReview.PASSENGER
            }
          }
        ]
      }
      const vResponse: ITripInstance | null = await modelTrip.findOne(whereStatement)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async showActive(pParam: IParamShowActiveTrip): Promise<ITripInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      if (pParam.isClient) {
        whereStatement.where = {
          userId: pParam.userId,
          status:{
            [Op.or]: [EStatusTrip.ACEPTADO, EStatusTrip.PENDIENTE, EStatusTrip.INPLACE]
          }
        }
      } else if (pParam?.id && pParam.driverId) {
        whereStatement.where = {
          id: pParam.id,
          driverId: pParam?.driverId,
        }
      } else if (pParam?.id) {
        whereStatement.where = {
          id: pParam.id,
          userId: pParam?.userId,
        }
      } else {
        whereStatement.where = {
          driverId: pParam.userId,
          status:{
            [Op.or]: [EStatusTrip.ACEPTADO, EStatusTrip.INPLACE]
          }
        }
      }
      whereStatement.include = [
        {
          model: modelTripDelivery,
          as: 'delivery',
          required: false,
        },
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
              as: 'currency',
              attributes: ['id', 'name', 'symbol', 'icon']
            },
            {
              model: modelPaymentMethod,
              required: false,
              as: 'paymentMethod',
            },
          ]
        },
        {
          model: modelTripSpecialRequest,
          as: 'tripSpecialRequest',
          required: false,
          include: [
            {
              model: modelVehicleAdditional,
              as: 'vehicleAdditional',
              required: false,
            }
          ]
        },
        {
          model: modelTripTravel,
          as: 'tripTravel',
          required: false,
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

  async update(pData: ITripUpdate): Promise<ITripInstance | null> {
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
            [Op.or]: [pData.driverId, null]
          },
          id: pData.id
        }
      }
      if (pData?.id) {
        const vItem: ITripInstance | null = await modelTrip.findOne(whereStatement)
        if (!pData?.price) {
          pData.price = vItem?.price || 0
        }
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

  async countTrip(pId: string, type: ETypeUser = ETypeUser.driver): Promise<number> {
    try {
      const whereStatement: FindOptions = {}
      if (type === ETypeUser.driver) {
        whereStatement.where = {
          driverId: pId,
          status: EStatusTrip.FINALIZADO
        }
      } else {
        whereStatement.where = {
          userId: pId,
          status: EStatusTrip.FINALIZADO
        }
      }
      const count = await modelTrip.count(whereStatement)
      return count
    } catch (error) {
      throw error
    }
  }

  async hidden(pParam: { userId: string, id: number }): Promise<boolean | null> {
    try {
      await modelTrip.update({ visibility: 0 }, {
        where: {
          id: pParam.userId,
          userId: pParam.userId
        }
      })
      return true
    } catch (error) {
      throw error
    }
  }

  async showPanic(pParam: { tripId: number }): Promise<ITripPanicInstance[] | null> {
    try {
      if (pParam.tripId) {
        const vResponse: ITripPanicInstance[] | null = await modelTripPanic.findAll({
          where: {
            tripId: pParam.tripId
          }
        })
        return vResponse
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async deletePanic(pParam: { socketId: string }): Promise<boolean> {
    try {
      if (pParam.socketId) {
        await modelTripPanic.destroy({
          where: { socketId: pParam.socketId }
        })
        return true
      }
      return false
    } catch (error) {
      throw error
    }
  }

  async updatePanic(pParam: { tripId: number, socketId: string }): Promise<boolean> {
    try {
      if (pParam.tripId) {
        const vItem: ITripPanicInstance | null = await modelTripPanic.findOne({
          where: {
            tripId: pParam.tripId,
            socketId: pParam.socketId
          }
        })
        if (vItem) {
          await vItem?.update({ socketId: pParam.socketId })
        } else {
          await modelTripPanic.create({
            tripId: pParam.tripId,
            socketId: pParam.socketId
          })
        }
        return true
      }
      return false
    } catch (error) {
      throw error
    }
  }
}
export default new TripService()

