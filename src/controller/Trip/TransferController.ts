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
      console.log('holaa')
      const auth = _pReq.auth
      const image: any = fs.readFileSync('uploads/resources/marcador-de-posicion.png')
      let avatar: any = fs.readFileSync('uploads/resources/logo.png')
      if (auth?.avatar) {
        avatar = fs.readFileSync(`uploads/${auth?.avatar}`)
        const extname = path.extname(`uploads/${auth?.avatar}`)
        const avatarName = path.basename(`uploads/${auth?.avatar}`, extname)
        if (fs.existsSync(`./uploads/user/${avatarName}-user.png`)) {
          return pRes.status(200).send(fxSuccessResponse(200, { img: `user/${avatarName}-user.png` }, 'Correcto'))
        }
        const base64Image: any = Buffer.from(image).toString('base64')
        const dataURI = 'data:image/jpeg;base64,' + base64Image
        const base64ImageAvatar: any = Buffer.from(avatar).toString('base64')
        const dataURIAvatar = 'data:image/jpeg;base64,' + base64ImageAvatar
        await nodeHtmlToImage({
          output: `./uploads/user/${avatarName}-user.png`,
          html: '<html><body style="width: 50px;height: 50px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 50px;height: 50px;"/><img src="{{{dataURIAvatar}}}" style="width: 20px;height: 20px;position: absolute;top: 17%;left: 30%;border-radius: 50%;"></img></div></body></html>',
          content: { imageSource: dataURI, dataURIAvatar },
          transparent: true
        })
        // pRes.writeHead(200, { 'Content-Type': 'image/png' })
        // return pRes.end(generatedMarket, 'base64')
        return pRes.status(200).send(fxSuccessResponse(200, { img: `user/${avatarName}-user.png` }, 'Correcto'))
      } else {
        if (fs.existsSync('uploads/user/marker.png')) {
          return pRes.status(200).send(fxSuccessResponse(200, { img: 'user/marker.png' }, 'Correcto'))
        }
        const base64Image: any = Buffer.from(image).toString('base64')
        const dataURI = 'data:image/jpeg;base64,' + base64Image
        const base64ImageAvatar: any = Buffer.from(avatar).toString('base64')
        const dataURIAvatar = 'data:image/jpeg;base64,' + base64ImageAvatar
        await nodeHtmlToImage({
          output: './uploads/user/marker.png',
          html: '<html><body style="width: 50px;height: 50px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 50px;height: 50px;"/><img src="{{{dataURIAvatar}}}" style="width: 20px;height: 20px;position: absolute;top: 17%;left: 30%;border-radius: 50%;"></img></div></body></html>',
          content: { imageSource: dataURI, dataURIAvatar },
          transparent: true
        })
        // pRes.writeHead(200, { 'Content-Type': 'image/png' })
        // return pRes.end(generatedMarket, 'binary')
        return pRes.status(200).send(fxSuccessResponse(200, { img: 'user/marker.png' }, 'Correcto'))
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
        console.log('vParamTripShow :>> ', vParamTripShow)
        const vTrip = await ClassTripService.showId(vParamTripShow)
        if (vTrip) {
          const vClientId = vTrip.dataValues.userId
          console.log('vClientId :>> ', vClientId)
          const vClient = await ClassAuthService.show(vClientId)
          const avatarName = vClient?.dataValues.avatar
          if (fs.existsSync(`./uploads/user/${avatarName}-user.png`)) {
            return pRes.status(200).send(fxSuccessResponse(200, { img: `user/${avatarName}-user.png` }, 'Correcto'))
          } else {
            return pRes.status(200).send(fxSuccessResponse(200, { img: 'user/marker.png' }, 'Correcto'))
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