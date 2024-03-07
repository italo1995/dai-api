import type { IBannerInstance } from '../models/web/BannerModel'
import type { IServiceInstance } from '../models/web/ServiceModel'
import type { ETypeReview, IReviewInstance } from '../models/ReviewModel'
import type { INewInstance } from '../models/web/NewsModel'
import type { IResponseAll } from './generalType'
import type { ITermInstance } from '../models/web/TermModel'

export interface INewInput {
  id: string
  name: string
  image: string
  description: string
  state?: boolean
  isFeatured?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IBannerInput {
  id: string
  name: string
  image: string
  orden?: number
  link?: string
  state?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IReviewInput {
  id: number
  clientId?: string
  driverId?: string
  qualification: number
  comment: string
  icon?: string
  features?: boolean
  tripId?: number
  type?: ETypeReview
  createdAt?: Date
  updatedAt?: Date
}

export interface IResponseAllBanner extends IResponseAll {
  total: number
  totalPage: number
  data: IBannerInstance[]
  actualPage: number
}

export interface IResponseAllService extends IResponseAll {
  total: number
  totalPage: number
  data: IServiceInstance[]
  actualPage: number
}

export interface IResponseAllReview extends IResponseAll {
  total: number
  totalPage: number
  data: IReviewInstance[]
  actualPage: number
}

export interface IResponseAllNew extends IResponseAll {
  total: number
  totalPage: number
  data: INewInstance[]
  actualPage: number
}
export interface ITermInput {
  id: string
  name: string
  description: string
  orden?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
export interface IResponseAllTerm extends IResponseAll {
  total: number
  totalPage: number
  data: ITermInstance[]
  actualPage: number
}