import type { IResponseAll } from './generalType'
import type { IMediaLibraryItemInstance } from '../models/Media/MediaLibraryItemModel'

export interface IMediaLibraryItemInput {
  id?: number
  name: string
  image: string
  type: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllMediaLibraryItem extends IResponseAll {
  total: number
  totalPage: number
  data: IMediaLibraryItemInstance[]
  actualPage: number
}
