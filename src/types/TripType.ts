import type { ITripInstance } from '../models/Trip/TripModel'
import type { ITripPaymentInstance } from '../models/Trip/TripPaymentModel'
import type { ITripRouteInstance } from '../models/Trip/TripRouteModel'
import type { IResponseAll } from './generalType'

export interface IParamAllTrip {
  userId: string
  isClient?: boolean
  isDriver?: boolean
  search?: string | null
  typeSearch?: string | null
  pag?: number | null
  limit?: number | null
}

export interface IParamShowTrip {
  userId: string
  id: number
  isClient?: boolean
  isDriver?: boolean
}

enum ETypeService {
  MOTO = 'moto',
  CAR = 'car',
  DELIVERY = 'delivery',
  TRAVEL = 'travel',
}

export interface ITripInput {
  id?: string
  typeService: ETypeService
  userId: string
  driverId?: string
  date?: Date
  status?: string
  price?: number
  currencyId?: number
  isPayment: number
}

export interface IResponseAllTrip extends IResponseAll {
  total: number
  totalPage: number
  data: ITripInstance[]
  actualPage: number
}

export interface ITripPaymentInput {
  id?: string
  tripId: number
  type: string
  amount: number
  currencyId?: number
  paymentMethodsId?: number
  isAprobed?: boolean
}


export interface IResponseAllTripPayment extends IResponseAll {
  total: number
  totalPage: number
  data: ITripPaymentInstance[]
  actualPage: number
}

export interface ITripRouteInput {
  id: string
  tripId: number
  isInit: boolean
  isEnd: boolean
  orden?: number
  address: string
  reference: string
  referencePointImage: string
  lat: number
  lon: number
  userAddressId: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllTripRoute extends IResponseAll {
  total: number
  totalPage: number
  data: ITripRouteInstance[]
  actualPage: number
}

export interface ITripTravelInput {
  id: string
  tripId: string
  toSearch?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllTripTravel extends IResponseAll {
  total: number
  totalPage: number
  data: ITripRouteInstance[]
  actualPage: number
}

export interface ITripDeliveryInput {
  id: string
  tripId: string
  toSearch?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllTripDelivery extends IResponseAll {
  total: number
  totalPage: number
  data: ITripRouteInstance[]
  actualPage: number
}
