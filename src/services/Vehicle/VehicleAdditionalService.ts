/* 
- File: VehicleAdditionalService.ts

- Purpose: El serivicio auth se encarga de las consultas con los modelos y funcionalidades relacionadas al auth

- Author: Italo Belen

- Creation: 26/01/2024  

==========Functions Manifest==========
- VehicleAdditionalService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del usuario segun el id, puede usarse en el perfil o para verificar informacion del usuario
  3 - create: crea datos del usuario
  4 - update: actualiza datos del usuario
*/
import { Op, type FindOptions } from 'sequelize'
import type { IVehicleAdditionalInstance } from '../../models/Vehicle/VehicleAdditionalModels'
import { modelVehicleAdditional } from '../../models'
import type { IVehicleAdditionalInput } from '../../types/VehicleAdditionalType.js'
import type { IResponseAll } from '../../types/VehicleAdditionalType'


interface IVehicleAdditionalService {
    validate (data: any): any
    show(pId: number): Promise<IVehicleAdditionalInstance | null>
    create(payload: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance>
    update(payload: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance | null>
}

class VehicleAdditionalService implements IVehicleAdditionalService {

    async validate(data: any) {
        const dataValidate = modelVehicleAdditional.build(data)
        await dataValidate.validate()
    }

    public async all(pParam: any): Promise<IResponseAll | IVehicleAdditionalInstance[]> {
        try {            
            const whereStatement: FindOptions = {}
            if (Number(pParam?.pag)) {
                const limit = Number(pParam?.limit) || 10 // Define cuantos registros por pagina quieres mostrar
                whereStatement.limit = limit
                whereStatement.offset = (pParam.pag -1) * limit
            }
            if (Number(pParam?.orden) === 2) {
                whereStatement.order = whereStatement.order instanceof Array ? [
                    ...whereStatement.order,['name', 'ASC']
                ] : [
                    ['name', 'ASC']
                ]
            } else {
                whereStatement.order = whereStatement.order instanceof Array ? [
                    ...whereStatement.order, ['id', 'DESC']
                ] : [
                    ['id', 'DESC']
                ]
            }

            if (pParam?.search) {
                whereStatement.where = { ...whereStatement.where, name: { [Op.like]: `%${pParam.search}%` } }
            }
            const res = await modelVehicleAdditional.findAll(whereStatement)
            if (Number(pParam?.pag)) {
                const limit = Number(pParam?.limit) || 10
                const count = await modelVehicleAdditional.count (whereStatement)
                const resp = {
                    total: count,
                    totalPage: Math.ceil(count / limit),
                    data: res,
                    actualPage: Number(pParam.pag),
                }
                  return resp                 
            }
                return res
        } catch (error) {
          throw error
        }
    }

    async show(pId: number): Promise<IVehicleAdditionalInstance | null> {
        const vResponse: IVehicleAdditionalInstance | null = await modelVehicleAdditional.findone({
            where: {
                id: pId,
            },
        })
        return vResponse
    }

    async create(pData: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance> {
        const vResponse: IVehicleAdditionalInstance = await modelVehicleAdditional.create(pData)
        return vResponse
    }

    async update(pData: IVehicleAdditionalInput): Promise<IVehicleAdditionalInstance | null> {
        if (pData?.Id) {
            const vCountry: IVehicleAdditionalInstance | null = await modelVehicleAdditional.findOne({
                where: {
                    id: pData.Id,
                },
            })
            await vCountry?.update(pData, {where: { id: pData. Id } })
            return vCountry
        }
        return null
    }


}
export default new VehicleAdditionalService() 
