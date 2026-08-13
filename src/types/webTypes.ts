import type { IBannerInstance } from '../models/web/BannerModel'
import type { IServiceInstance } from '../models/web/ServiceModel'
import type { ETypeReview, IReviewInstance } from '../models/web/ReviewModel'
import type { INewInstance } from '../models/web/NewsModel'
import type { IResponseAll } from './generalType'
import type { ITermInstance } from '../models/web/TermModel'
import type { IHelpInformationInstance } from '../models/web/HelpInfomationModel'
import type { EDataType, IDataContentInstance } from '../models/web/DataContentModel'
import type { IPopupInstance } from '../models/web/PopupModel'

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
  isPriority?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

// Forma que recibe la app (endpoint publico /api/banner/all): hasta MAX_BANNERS activos,
// los de isPriority=true primero, el resto elegido al azar en cada consulta.
export interface IBannerPublic {
  id: number
  name: string
  image: string
  orden?: number | null
  link?: string | null
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

export interface IHelpInformationInput {
  id: string
  name: string
  description: string
  orden?: number
}

export interface IResponseAllHelpInformation extends IResponseAll {
  total: number
  totalPage: number
  data: IHelpInformationInstance[]
  actualPage: number
}

export interface IDataContentInput {
  id: string
  name: string
  description: string
  image?: string
  orden?: number
  type: EDataType
}

export interface IResponseAllDataContent extends IResponseAll {
  total: number
  totalPage: number
  data: IDataContentInstance[]
  actualPage: number
}

export interface IPopupInput {
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

export interface IPopupOrderInput {
  id: number
  orden: number
}

// Forma minima que recibe la app (endpoint publico /api/popup/all)
export interface IPopupPublic {
  id: number
  image: string
  link?: string | null
  orden?: number | null
}

export interface IResponseAllPopup extends IResponseAll {
  total: number
  totalPage: number
  data: IPopupInstance[]
  actualPage: number
}
