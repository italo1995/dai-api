import express from 'express'
const router = express.Router()

router.route('/').get((_req, resp) => {
  resp.status(200).json({
    name: 'Api REST',
  })
})
export default router
