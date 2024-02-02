import type { IBannerInstance } from '../models/web/BannerModel'
import type { IServiceInstance } from '../models/web/ServiceModel'
import type { IReviewInstance } from '../models/ReviewModel'
import type { INewInstance } from '../models/web/NewsModel'
import type { IResponseAll } from './generalType'

export interface IWebInput {
    id?: string
    name: string
    image: string
    description: string
    isFeatured?: boolean
    state?: boolean
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date
}

export interface IReviewInput {
  id: number
  clientId: number
  driverId: number
  qualification: string
  comment: string
  features?: string
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