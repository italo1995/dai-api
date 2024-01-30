import type { IBannerInstance } from '../models/web/BannerModel'
import type { IServiceInstances } from '../models/web/ServiceModel'
import type { IReviewInstance } from '../models/ReviewModel'
import type { IResponseAll } from './generalType'

export interface IWebInput {
    id?: number
    name: string
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
  data: IServiceInstances[]
  actualPage: number
}
export interface IResponseAllReview extends IResponseAll {
  total: number
  totalPage: number
  data: IReviewInstance[]
  actualPage: number
}