import type { ECouponType } from '../models/Coupon/CouponModel'
import type { IResponseAll } from './generalType'
import type { ICouponInstance } from '../models/Coupon/CouponModel'

export interface ICouponInput {
  id?: number
  code: string
  type: ECouponType
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  expiresAt?: Date
  isActive?: boolean
}

export interface IResponseAllCoupon extends IResponseAll {
  total: number
  totalPage: number
  data: ICouponInstance[]
  actualPage: number
}
