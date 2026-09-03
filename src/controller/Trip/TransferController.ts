import type { NextFunction, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import nodeHtmlToImage from 'node-html-to-image'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import ClassTripService from '../../services/Trip/TripService'
import ClassAuthService from '../../services/User/AuthService'
import imageThumbnail from 'image-thumbnail'

// Resuelve una ruta dentro de uploads/ tolerando que el archivo haya quedado colocado un nivel
// mas adentro, en src/uploads/ (paso en produccion con los recursos estaticos - ubicacion_inicio.svg,
// logo.png - que quedaron copiados ahi por error en algun deploy manual, y por decision de Italo
// no se van a mover en el servidor). Primero prueba la ruta canonica (uploads/ al mismo nivel que
// src/, coincide con como FileController.ts sirve el resto de los uploads del proyecto); si no
// existe, prueba la misma ruta pero adentro de src/uploads/. Si ninguna existe, devuelve la
// canonica igual - así el error que tira fs.readFileSync/existsSync sigue siendo el mismo de
// siempre (no se oculta un archivo realmente faltante).
function fxResolveUploadPath(pRelativePath: string): string {
  const vCanonical = path.resolve(__dirname, '../../../uploads', pRelativePath)
  if (fs.existsSync(vCanonical)) {
    return vCanonical
  }
  const vFallback = path.resolve(__dirname, '../../../src/uploads', pRelativePath)
  if (fs.existsSync(vFallback)) {
    return vFallback
  }
  return vCanonical
}

class TransferController {
  async marker(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const auth = _pReq.auth
      const image: any = fs.readFileSync(fxResolveUploadPath('resources/ubicacion_inicio.svg'))
      let avatar: any = fs.readFileSync(fxResolveUploadPath('resources/logo.png'))
      if (auth?.avatar) {
        avatar = fs.readFileSync(fxResolveUploadPath(auth.avatar))
        const extname = path.extname(auth.avatar)
        const avatarName = path.basename(auth.avatar, extname)
        if (fs.existsSync(fxResolveUploadPath(`user/${avatarName}user_u64pxv2.png`))) {
          return pRes
            .status(200)
            .send(fxSuccessResponse(200, { img: `user/${avatarName}user_u64pxv2.png` }, 'Correcto'))
        }
        const base64Image: any = Buffer.from(image).toString('base64')
        const dataURI = 'data:image/svg+xml;base64,' + base64Image
        const base64ImageAvatar: any = Buffer.from(avatar).toString('base64')
        const dataURIAvatar = 'data:image/jpeg;base64,' + base64ImageAvatar
        await nodeHtmlToImage({
          output: path.resolve(__dirname, `../../../uploads/user/${avatarName}user_u64pxv2.png`),
          html: '<html><body style="width: 64px;height: 64px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 64px;height: 64px;"/><img src="{{{dataURIAvatar}}}" style="width: 42px;height: 42px;position: absolute;top: 4%;left: 17%;border-radius: 50%;object-fit: cover;"></img></div></body></html>',
          content: { imageSource: dataURI, dataURIAvatar },
          transparent: true,
          puppeteerArgs: { args: ['--no-sandbox'] },
        })
        return pRes
          .status(200)
          .send(fxSuccessResponse(200, { img: `user/${avatarName}user_u64pxv2.png` }, 'Correcto'))
      } else {
        if (fs.existsSync(fxResolveUploadPath('user/marker_u.png'))) {
          return pRes
            .status(200)
            .send(fxSuccessResponse(200, { img: 'user/marker_u.png' }, 'Correcto'))
        }
        const base64Image: any = Buffer.from(image).toString('base64')
        const dataURI = 'data:image/svg+xml;base64,' + base64Image
        const base64ImageAvatar: any = Buffer.from(avatar).toString('base64')
        const dataURIAvatar = 'data:image/jpeg;base64,' + base64ImageAvatar
        await nodeHtmlToImage({
          output: path.resolve(__dirname, '../../../uploads/user/marker_u.png'),
          html: '<html><body style="width: 64px;height: 64px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 64px;height: 64px;"/><img src="{{{dataURIAvatar}}}" style="width: 42px;height: 42px;position: absolute;top: 4%;left: 17%;border-radius: 50%;object-fit: cover;background:#fff;"></img></div></body></html>',
          content: { imageSource: dataURI, dataURIAvatar },
          transparent: true,
          puppeteerArgs: { args: ['--no-sandbox'] },
        })
        return pRes
          .status(200)
          .send(fxSuccessResponse(200, { img: 'user/marker_u.png' }, 'Correcto'))
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
          userId: vUser?.id,
          isDriver: true,
        }
        const vTrip = await ClassTripService.showId(vParamTripShow)
        if (vTrip) {
          const vClientId = vTrip.dataValues.userId
          const vClient = await ClassAuthService.show(vClientId)
          const avatar = vClient?.dataValues.avatar
          const vAvatarPath = fxResolveUploadPath(String(avatar))
          const extname = path.extname(vAvatarPath)
          const avatarName = path.basename(vAvatarPath, extname)
          if (fs.existsSync(fxResolveUploadPath(`user/${avatarName}user_u64pxv2.png`))) {
            return pRes
              .status(200)
              .send(fxSuccessResponse(200, { img: `user/${avatarName}user_u64pxv2.png` }, 'Correcto'))
          } else {
            return pRes
              .status(200)
              .send(fxSuccessResponse(200, { img: 'user/marker_u.png' }, 'Correcto'))
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
  async prueba(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const avatar = fs.readFileSync(path.resolve(__dirname, '../../../uploads/1712685080145-bc49c68f-99e7-4899-86ad-1f94c6a36b51.jpeg'))
      const options: any = { width: 45, responseType: 'base64', percentage: 100, jpegOptions: { force:true, quality: 100 } }
      const resizedImage = await imageThumbnail(avatar, options)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // const sharp = require('sharp')
      // const resizedImage = await sharp(avatar)
      //   .resize(45, 45)
      //   .toBuffer()
      const image: any = fs.readFileSync(fxResolveUploadPath('resources/ubicacion_inicio.svg'))
      const base64Image: any = Buffer.from(image).toString('base64')
      const dataURI = 'data:image/svg+xml;base64,' + base64Image
      // const base64ImageAvatar: any = Buffer.from(resizedImage).toString('base64')
      const dataURIAvatar = 'data:image/jpeg;base64,' + resizedImage
      await nodeHtmlToImage({
        output: path.resolve(__dirname, '../../../uploads/user/pruebas4user_u64pxv2.png'),
        html: '<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><foreignObject width="100%" height="100%"><html xmlns="http://www.w3.org/1999/xhtml"><body style="width: 64px;height: 64px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 64px;height: 64px;"/><img src="{{{dataURIAvatar}}}" style="width: 42px;height: 42px;position: absolute;top: 4%;left: 17%;border-radius: 50%;object-fit: cover;"></img></div></body></html></foreignObject></svg>',
        content: { imageSource: dataURI, dataURIAvatar },
        transparent: true,
        puppeteerArgs: { args: ['--no-sandbox'] },
      })
      // await nodeHtmlToImage({
      //   output: path.resolve(__dirname, '../../../uploads/user/pruebas2user_u64pxv2.png'),
      //   html: '<html><body style="width: 64px;height: 64px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 64px;height: 64px;"/><img src="{{{dataURIAvatar}}}" style="width: 45px;height: 45px;position: absolute;top: 7%;left: 22%;border-radius: 50%;object-fit: cover;"></img></div></body></html>',
      //   content: { imageSource: dataURI, dataURIAvatar },
      //   transparent: true,
      //   puppeteerArgs: { args: ['--no-sandbox'] },
      // })
      return pRes
        .status(200)
        .send(fxSuccessResponse(200, { img: 'user/prueba2user_u64pxv2.png' }, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }
}
export default new TransferController()
