import type { ITripInstance } from '../models/Trip/TripModel'
import type { ITripPaymentInstance } from '../models/Trip/TripPaymentModel'
import type { ITripRouteInstance } from '../models/Trip/TripRouteModel'
import type { IResponseAll } from './generalType'

export interface ITripInput {
  id?: string
  typeService: string
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
  id?: string
  tripId: number
  isInit: boolean
  isEnd: boolean
  orden: number
  address: string
  reference: string
  referencePointImage: string
  lat: number
  lon: number
  currencyId: number
  userAddressId: number
}

export interface IResponseAllTripRoute extends IResponseAll {
  total: number
  totalPage: number
  data: ITripRouteInstance[]
  actualPage: number
}