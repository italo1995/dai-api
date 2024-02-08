import type { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import * as fs from 'fs'
import { fxSuccessResponse } from '../utils/helpers'

class FileController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vFileName = pReq.params.fileName
      const vFolder = pReq.params.folder
      return pRes.download(`uploads/${vFolder}/${vFileName}`)
    } catch (error) {
      pNext(error)
    }
  }

  async uploadFile(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const images: string[] = []
      if (pReq.files) {
        const entries = Object.entries(pReq.files)
        for (const item of entries) {
          const element = item[1]
          console.log('element.originalname :>> ', element)
          const format = path.extname(element.originalname)
          const vNormalizedName = uuidv4() + format
          const vFileName = `temp/${Date.now()}-${vNormalizedName}`
          fs.writeFileSync(`uploads/${vFileName}`, element.buffer)
          images.push(`${vFileName}`)
        }
      }
      return pRes.status(200).send(fxSuccessResponse(200, { images }, 'upload'))
    } catch (err) {
      pNext(err)
    }
  }

}
export default new FileController()
