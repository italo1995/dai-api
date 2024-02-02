import type { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import nodeHtmlToImage from 'node-html-to-image'

class TransferController {
  async show(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const auth = _pReq.auth
      const image: any = fs.readFileSync('uploads/resources/marcador-de-posicion.png')
      let avatar: any = fs.readFileSync('uploads/resources/logo.png')
      if (auth?.avatar) {
        avatar = fs.readFileSync(`uploads/${auth?.avatar}`)
      }
      const base64Image: any = Buffer.from(image).toString('base64')
      const dataURI = 'data:image/jpeg;base64,' + base64Image
      const base64ImageAvatar: any = Buffer.from(avatar).toString('base64')
      const dataURIAvatar = 'data:image/jpeg;base64,' + base64ImageAvatar
      const generatedMarket = await nodeHtmlToImage({
        output: './image.png',
        html: '<html><body style="width: 50px;height: 50px;background:transparent;"><div style="position:absolute;"><img src="{{{imageSource}}}" style="width: 50px;height: 50px;"/><img src="{{{dataURIAvatar}}}" style="width: 20px;height: 20px;position: absolute;top: 17%;left: 30%;border-radius: 50%;"></img></div></body></html>',
        content: { imageSource: dataURI, dataURIAvatar },
        transparent: true
      })
      pRes.writeHead(200, { 'Content-Type': 'image/png' })
      return pRes.end(generatedMarket, 'binary')
    } catch (error) {
      pNext(error)
    }
  }
}
export default new TransferController()