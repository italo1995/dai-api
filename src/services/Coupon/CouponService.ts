import { type FindOptions, Op } from 'sequelize'
import { modelCoupon } from '../../models'
import type { ICouponInstance } from '../../models/Coupon/CouponModel'
import type { ICouponInput, IResponseAllCoupon } from '../../types/Coupon'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

class CouponService {
  async all(pParam: any): Promise<IResponseAllCoupon | ICouponInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'code', 'Coupon')
      const vResponse: ICouponInstance[] = await modelCoupon.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        return fxReponseServices(pParam, whereStatement, 'Coupon', vResponse)
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ICouponInstance | null> {
    return modelCoupon.findOne({ where: { id: pId } })
  }

  async showByCode(pCode: string): Promise<ICouponInstance | null> {
    return modelCoupon.findOne({ where: { code: { [Op.iLike]: pCode.trim() } } })
  }

  async create(pData: ICouponInput): Promise<ICouponInstance> {
    return modelCoupon.create({ ...pData, code: pData.code.trim().toUpperCase() })
  }

  async update(pData: ICouponInput): Promise<ICouponInstance | null> {
    const vCoupon = await modelCoupon.findOne({ where: { id: pData.id } })
    if (!vCoupon) {
      return null
    }
    const vUpdateData = { ...pData }
    if (vUpdateData.code) {
      vUpdateData.code = vUpdateData.code.trim().toUpperCase()
    }
    await vCoupon.update(vUpdateData)
    return vCoupon
  }

  async softDeleteRecord(pId: number): Promise<boolean> {
    const vCoupon = await modelCoupon.findOne({ where: { id: pId } })
    if (!vCoupon) {
      return false
    }
    await vCoupon.destroy()
    return true
  }
}

export default new CouponService()
