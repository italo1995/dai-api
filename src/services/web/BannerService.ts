/* 
- File: BannerService.ts

- Purpose: El serivicio Banner se encarga de las consultas con los modelos y funcionalidades relacionadas al VehicleAdditional

- Author: Jairo Belen

- Creation: 30/01/2024  

==========Functions Manifest==========
- VehicleAdditionalService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IBannerInstance } from '../../models/web/BannerModel'
import { modelBanner } from '../../models'
import type { IWebInput, IResponseAllBanner } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILikeName, fxReponseServices } from '../../utils/query'

interface IBannerService {
    validate (data: any): any
    show(pId: number): 
}