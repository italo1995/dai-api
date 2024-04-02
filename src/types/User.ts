import type { EStatusDriver, IUserInstance } from '../models/User/User'
import type { IUserRatingInstance } from '../models/User/UserRatingModel'
import type { EtransactionType, EStatusType } from '../models/User/UserTransactionModel'
import type { ICommentInstance } from '../models/User/CommentModel'
import type { ISuspensionInstance, ETypeTime } from '../models/User/SuspensionModel'
import type { IVerifyInstance, EStatusVerify } from '../models/User/VerifyModel'
import type { IResponseAll } from './generalType'
import type { IDriverReportInstance } from '../models/User/driverReportModel'
export interface IUserInput {
  id?: string
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
  statusDriver?: EStatusDriver
  verifiedDriver: boolean
  typeUser: ETypeUser
  isNewUser: boolean
  token?: string
  socketId?: string
  balance?: number
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
  lat?: number
  lon?: number
  socketId?: string | null
  statusDriver?: EStatusDriver
  discount?: number
}

export interface IUserCodeInput {
  code: string
  userId?: string
  phoneNumber?: string
}

export enum ETypeUser {
  both = '0',
  passenger = '1',
  driver = '2',
  all = '3',
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
  userId: string
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

export interface IUserTransactionInput {
  id: string
  userId: string
  operatorId: string
  amount: number
  transactionType: EtransactionType
  status: EStatusType
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllUserTransaction {
  total: number
  totalPage: number
  data: IUserTransactionInput[]
  actualPage: number
}

export interface ICommentInput {
  id: string
  userId: string
  name: string
  description: string
  parentId: string
  serviceId: string
}
export interface IResponseAllComment {
  total: number
  totalPage: number
  data: ICommentInstance[]
  actualPage: number
}

export interface ISuspensionInput {
  id: number
  driverId: string
  reason: string
  timeFrame: ETypeTime
  init: Date
  end: Date
  isCanceled?: boolean
  hours?: number
}

export interface IResponseAllSuspension extends IResponseAll {
  total: number
  totalPage: number
  data: ISuspensionInstance[]
  actualPage: number
}

export interface IVerifyInput {
  id?: string
  userId: string
  apelacion?: string
  reason?: string
  status: EStatusVerify
}

export interface IResponseAllVerify extends IResponseAll {
  total: number
  totalPage: number
  data: IVerifyInstance[]
}
export interface IResponseAllUser extends IResponseAll {
  total: number
  totalPage: number
  data: IUserInstance[]
  actualPage: number
}

export interface IDriverReportInput {
  id: string
  userId: string
  ammount: number
  quantity: number
}

export interface IResponseAllDriverReport extends IResponseAll {
  total: number
  totalPage: number
  data: IDriverReportInstance[]
  actualPage: number
}
