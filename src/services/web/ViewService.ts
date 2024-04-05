import { type FindOptions } from 'sequelize'
import { modelView } from '../../models'
import type { ViewInstance, ViewAttributes, ViewReponseAll } from '../../models/web/ViewModel'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IViewService {
  validate(data: any): any
  show(pId: string): Promise<ViewInstance | null>
  create(payload: ViewAttributes): Promise<ViewInstance>
  createMany(): Promise<ViewInstance[]>
  update(payload: ViewAttributes): Promise<ViewInstance | null>
  softDeleteRecord(pId: string): Promise<boolean>
}

class ViewService implements IViewService {
  private modelname = modelView.name
  async validate(data: any) {
    const dataValidate = modelView.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<ViewReponseAll | ViewInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        this.modelname
      )
      const vResponse: ViewInstance[] = await modelView.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: ViewReponseAll = await fxReponseServices(
          pParam,
          whereStatement,
          this.modelname,
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: string): Promise<ViewInstance | null> {
    try {
      const vResponse: ViewInstance | null = await modelView.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ViewAttributes): Promise<ViewInstance> {
    try {
      const vResponse: ViewInstance = await modelView.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async createMany(): Promise<ViewInstance[]> {
    try {
      const vData = [
        {
          icon: 'assets/image/capa2.png',
          title: 'Pasajeros',
          url: 'pasajeros',
          route: 'user',
        },
        {
          icon: 'assets/image/capa1.png',
          title: 'Conductores',
          url: 'conductores',
          route: 'user',
        },
        {
          icon: 'assets/image/receipt-outline.png',
          title: 'Solicitudes de Servicios',
          url: 'solicitudes',
          route: 'trip',
        },
        {
          icon: 'assets/image/grid-outline.png',
          title: 'Tipos de Servicios',
          url: 'tipoServicio',
          route: 'trip',
        },
        {
          icon: 'assets/image/location-outline.png',
          title: 'Conductores Activos',
          url: 'conductorAct',
          route: 'user',
        },
        {
          icon: 'assets/image/wallet-outline.png',
          title: 'Recargas',
          url: 'recargas',
          route: '',
        },
        {
          icon: 'assets/image/globe-outline.png',
          title: 'Paises',
          url: 'paises',
          route: 'location',
        },
        {
          icon: 'assets/image/add-circle-outline.png',
          title: 'Peticiones Especiales',
          url: 'peticionEsp',
          route: 'vehicleAdditional',
        },
        {
          icon: 'assets/image/camada1.png',
          title: 'Cuentas Bancarias',
          url: 'cuentasBanc',
          route: 'bank',
        },
        {
          icon: 'assets/image/camada2.png',
          title: 'Multimoneda',
          url: 'multimoneda',
          route: 'currency',
        },
        {
          icon: 'assets/image/list-outline.png',
          title: 'Opciones de Cancelacion',
          url: 'opCancel',
          route: 'cancellationOption',
        },
        {
          icon: 'assets/image/people-circle-outline.png',
          title: 'Staff',
          url: 'staff',
          route: 'staff',
        },
        {
          icon: 'assets/image/trazado-list.png',
          title: 'Reportes',
          url: 'reportes',
          route: 'report',
        },
        {
          icon: 'assets/image/log-in-outline.png',
          title: 'Cerrar Sesión',
          url: 'logout',
          route: 'user',
        },
      ]
      const vResponse: ViewInstance[] = await modelView.bulkCreate(vData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ViewAttributes): Promise<ViewInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: ViewInstance | null = await modelView.findOne({
          where: {
            id: pData.id,
          },
        })
        await vCountry?.update(pData, { where: { id: pData.id } })
        return vCountry
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: string) {
    try {
      const record = await modelView.update(
        { deletedAt: new Date() },
        {
          where: { id: pId },
        }
      )
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}

export default new ViewService()
