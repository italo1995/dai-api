import multer from 'multer'

export function upload() {
  return (_req: any, _res: any, next: any) => {
    console.log('en middleware upload')
    const storage = multer.diskStorage({
      destination: function (_req, _file, cb) {
        console.log('hola')
        cb(null, 'src/uploads/temp')
      },
      filename: function (_req, file, cb) {
        console.log('hol')
        const vNormalizedName = file.originalname
          .trim()
          .replace(/ /g, '_')
          .toLowerCase()
        cb(null, `${Date.now()}-${vNormalizedName}`)
      },
    })
    console.log('storage :>> ', storage)
    const upload = multer({ storage })
    upload.any()
    console.log('upload :>> ', upload)
    next()
  }
}