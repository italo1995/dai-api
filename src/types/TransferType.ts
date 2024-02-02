import type { IUserAddressInstance } from '../models/Transfer/UserAddress'
import type { IResponseAll } from './generalType'

export interface IUserAddressInput {
  id?: string
  userId: number
  name: string
  address: string
  reference: string
  lat: number
  lon: number
  file?: string
}

export interface IResponseAllUserAddress extends IResponseAll {
  total: number
  totalPage: number
  data: IUserAddressInstance[]
  actualPage: number
}