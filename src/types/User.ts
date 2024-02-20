import { type IUserRatingInstance } from '../models/User/UserRatingModel'
export interface IUserInput {
  name: string
  avatar?: string
  email?: string
  password?: string
  phoneCode: string
  phoneNumber: string
  vehicleType: number
  isTaxi?: boolean
  isVip?: boolean
  isAc?: boolean
  seats?: number
  availabilityToTravel?: boolean
  rolId: number
  status?: boolean
  verifiedDriver: boolean
  typeUser: ETypeUser
  isNewUser: boolean
  token?: string
  socketId?: string
}

export interface IUserInputUpdate {
  id: string
  name: string
  avatar?: string
  email?: string
  password?: string
  phoneCode: string
  phoneNumber: string
  vehicleType: number
  isTaxi?: boolean
  isVip?: boolean
  isAc?: boolean
  seats?: number
  availabilityToTravel?: boolean
  typeUser?: ETypeUser
  rolId: number
  isNewUser: boolean
}

export interface IUserUpdateSocket {
  id: string
  socketId: string
}

export interface IUserCodeInput {
  code: string
  userId?: string
  phoneNumber?: string
}

export enum ETypeUser {
  passenger = '1',
  driver = '2',
}

export interface ITypeFileUserInput {
  id?: number
  name: string
  description?: string
  isVisibility?: boolean
  required?: boolean
}

export interface IDriverDetailInput {
  id?: string
  sectionName: string
  fieldName: string
  type: string
  value: string
  userId: string
}

export interface IUserRatingInput {
  id?: number
  userId: number
  type: string
  ratings: number
  averageRating: number
  quantity: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllUserRating {
  total: number
  totalPage: number
  data: IUserRatingInstance[]
  actualPage: number
}