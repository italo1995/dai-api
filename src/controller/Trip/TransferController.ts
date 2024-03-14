import type { NextFunction, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import nodeHtmlToImage from 'node-html-to-image'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import ClassTripService from '../../services/Trip/TripService'
import ClassAuthService from '../../services/User/AuthService'
class TransferController {
  async marker(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const auth = _pReq.auth
      // const rutaYAML = path.resolve(__dirname, './documentation/*.yaml')
      const image: any = fs.readFileSync(path.resolve(__dirname,'../../../uploads/resources/ubicacion_inicio.png'))
      let avatar: any = fs.readFileSync(path.resolve(__dirname, '../../../uploads/resources/logo.png'))
      if (auth?.avatar) {
        avatar = fs.readFileSync(path.resolve(__dirname,`../../../uploads/${auth?.avatar}`))
        const extname = path.extname(path.resolve(__dirname, `../../../uploads/${auth?.avatar}`))
        const avatarName = path.basename(path.resolve(__dirname, `../../../uploads/${auth?.avatar}`), extname)
        if (fs.existsSync(path.resolve(__dirname,`../../../uploads/user/${avatarName}-user_u.png`))) {
          return pRes.status(200).send(fxSuccessResponse(200, { img: `user/${avatarName}-user_u.png` }, 'Correcto'))
        }
        const base64Image: any = Buffer.from(image).toString('base64')
        const dataURI = 'data:image/jpeg;base64,' + base64Image
        const base64ImageAvatar: any = Buffer.from(avatar).toString('base64')
        const dataURIAvatar = 'data:image/jpeg;base64,' + base64ImageAvatar
        await nodeHtmlToImage({
          output: path.resolve(__dirname,`../../../uploads/user/${avatarName}-user_u.png`),
          html: '<html><body style="width: 80px;height: 80px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 80px;height: 80px;"/><img src="{{{dataURIAvatar}}}" style="width: 45px;height: 45px;position: absolute;top: 7%;left: 22%;border-radius: 50%;object-fit: cover;"></img></div></body></html>',
          content: { imageSource: dataURI, dataURIAvatar },
          transparent: true,
          puppeteerArgs: { args: ['--no-sandbox'] }
        })
        return pRes.status(200).send(fxSuccessResponse(200, { img: `user/${avatarName}-user_u.png` }, 'Correcto'))
      } else {
        if (fs.existsSync(path.resolve(__dirname,'../../../uploads/user/marker_u.png'))) {
          return pRes.status(200).send(fxSuccessResponse(200, { img: 'user/marker_u.png' }, 'Correcto'))
        }
        const base64Image: any = Buffer.from(image).toString('base64')
        const dataURI = 'data:image/jpeg;base64,' + base64Image
        const base64ImageAvatar: any = Buffer.from(avatar).toString('base64')
        const dataURIAvatar = 'data:image/jpeg;base64,' + base64ImageAvatar
        await nodeHtmlToImage({
          output: path.resolve(__dirname,'../../../uploads/user/marker_u.png'),
          html: '<html><body style="width: 80px;height: 80px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 80px;height: 80px;"/><img src="{{{dataURIAvatar}}}" style="width: 45px;height: 45px;position: absolute;top: 7%;left: 22%;border-radius: 50%;object-fit: cover;background:#fff;"></img></div></body></html>',
          content: { imageSource: dataURI, dataURIAvatar },
          transparent: true,
          puppeteerArgs: { args: ['--no-sandbox'] }
        })
        return pRes.status(200).send(fxSuccessResponse(200, { img: 'user/marker_u.png' }, 'Correcto'))
      }
    } catch (error) {
      pNext(error)
    }
  }
  async clientMarker(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUser = pReq.auth
      const tripId: number = pReq.input('tripId', 'number')
      if (tripId) {
        const vParamTripShow = {
          id: tripId,
          userId: vUser.id,
          isDriver: true
        }
        const vTrip = await ClassTripService.showId(vParamTripShow)
        if (vTrip) {
          const vClientId = vTrip.dataValues.userId
          const vClient = await ClassAuthService.show(vClientId)
          const avatar = vClient?.dataValues.avatar
          const extname = path.extname(path.resolve(__dirname, `../../../uploads/${avatar}`))
          const avatarName = path.basename(path.resolve(__dirname, `../../../uploads/${avatar}`), extname)
          if (fs.existsSync(path.resolve(__dirname,`../../../uploads/user/${avatarName}-user_u.png`))) {
            return pRes.status(200).send(fxSuccessResponse(200, { img: `user/${avatarName}-user_u.png` }, 'Correcto'))
          } else {
            return pRes.status(200).send(fxSuccessResponse(200, { img: 'user/marker_u.png' }, 'Correcto'))
          }
        } else {
          return pRes.status(400).send(fxErrorResponse(400, null, 'Trip no existe'))
        }
      } else {
        return pRes.status(400).send(fxErrorResponse(400, null, 'Se requiere tripId'))
      }
    } catch (error) {
      pNext(error)
    }
  }
}
export default new TransferController()