import multer from 'multer'

export function upload() {
  return (_req: any, _res: any, next: any) => {
    const storage = multer.diskStorage({
      destination: function (_req, _file, cb) {
        cb(null, 'src/uploads/temp')
      },
      filename: function (_req, file, cb) {
        const vNormalizedName = file.originalname
          .trim()
          .replace(/ /g, '_')
          .toLowerCase()
        cb(null, `${Date.now()}-${vNormalizedName}`)
      },
    })
    const upload = multer({ storage })
    upload.any()
    next()
  }
}