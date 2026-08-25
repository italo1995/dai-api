/*
- File: StoreProductService.ts

- Purpose: Catalogo de productos de una tienda del Marketplace. El endpoint publico solo
  muestra productos disponibles de tiendas aprobadas (join contra stores.is_approved); el panel
  filtra por dueño (rol 'store') o por cualquier tienda (admin/operator).

==========Functions Manifest==========
- StoreProductService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae un producto por id
  3 - all: version publica para la app/cliente, filtrada por storeId, solo isAvailable=true y
      de tiendas aprobadas
  4 - allAdmin: version para el panel, filtrada por storeId y opcionalmente por dueño
  5 - create: crea un producto nuevo
  6 - update: actualiza un producto existente
  7 - softDeleteRecord: elimina (soft delete) un producto
*/
import { type FindOptions, Op } from 'sequelize'
import type { IStoreProductInstance } from '../../models/Store/StoreProductModel'
import sequelize, { modelStoreProduct, modelStore, modelStoreDepartment, modelStoreCategory, modelStoreProductCategory, modelStoreProductModifierGroup, modelStoreProductModifier, modelStoreProductImage } from '../../models'
import type { IStoreProductInput, IResponseAllStoreProduct, IStoreProductPublic } from '../../types/StoreProduct'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

// Campos seguros para exponer a un caller sin privilegios (app/cliente publico). Se usan tanto
// en all() como para achicar la respuesta de show() cuando quien pregunta no es el dueno ni admin.
export const vStoreProductPublicFields = [
  'id', 'name', 'description', 'price', 'currencyId', 'image', 'isInventoryable', 'stockQuantity',
] as const

// include reutilizado por all()/show() para traer nombre de departamento y categorias sin que
// el cliente tenga que pedirlos aparte.
// Grupos de modificadores (con sus opciones) del producto, para que la app arme la pantalla de
// detalle (secciones tipo "¿Como la quieres?", "Adicionales") sin un segundo llamado a
// storeProductModifierGroup/all.
export const vStoreProductModifierInclude = {
  model: modelStoreProductModifierGroup,
  as: 'modifierGroups',
  attributes: ['id', 'name', 'required', 'minSelections', 'maxSelections'],
  include: [
    {
      model: modelStoreProductModifier,
      as: 'modifiers',
      attributes: ['id', 'name', 'extraPrice', 'maxQuantity'],
    },
  ],
}

// Galeria de fotos adicionales del producto (aparte del campo image, que sigue siendo la
// portada usada en listados). Ordenadas por 'order' via el defaultScope del modelo.
export const vStoreProductImagesInclude = {
  model: modelStoreProductImage,
  as: 'images',
  attributes: ['id', 'image', 'order'],
}

export const vStoreProductCategorizationInclude = [
  {
    model: modelStoreDepartment,
    as: 'department',
    attributes: ['id', 'name'],
  },
  {
    model: modelStoreCategory,
    as: 'categories',
    attributes: ['id', 'name'],
    through: { attributes: [] },
  },
  vStoreProductModifierInclude,
  vStoreProductImagesInclude,
]

export function fxToPublicStoreProduct(pProduct: IStoreProductInstance): IStoreProductPublic {
  const vData: any = pProduct.dataValues
  const vPublic: any = {}
  vStoreProductPublicFields.forEach((vField) => {
    vPublic[vField] = vData[vField]
  })
  vPublic.department = vData.department ?? null
  vPublic.categories = vData.categories ?? []
  vPublic.modifierGroups = vData.modifierGroups ?? []
  vPublic.images = vData.images ?? []
  return vPublic as IStoreProductPublic
}

interface IStoreProductService {
  validate(data: any): any
  show(pId: number): Promise<IStoreProductInstance | null>
  all(pParam: any): Promise<IResponseAllStoreProduct>
  allAdmin(pParam: any, pOwnerId?: string): Promise<IResponseAllStoreProduct | IStoreProductInstance[]>
  create(payload: IStoreProductInput): Promise<IStoreProductInstance>
  update(payload: IStoreProductInput): Promise<IStoreProductInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreProductService implements IStoreProductService {
  async validate(data: any) {
    const dataValidate = modelStoreProduct.build(data)
    await dataValidate.validate()
  }

  // pParam: storeId (requerido), search (opcional, busca por nombre), departmentId (opcional,
  // un solo id), categoryId (opcional, uno o varios ids separados por coma - trae productos que
  // tengan AL MENOS una de esas categorias), limit (default 10), page (default 1). Siempre
  // pagina, a diferencia de allAdmin que solo pagina si viene pag.
  public async all(pParam: any): Promise<IResponseAllStoreProduct> {
    try {
      const vStoreId = Number(pParam?.storeId)
      const vLimit = Number(pParam?.limit) || 10
      const vPage = Number(pParam?.page) || 1
      const vOffset = (vPage - 1) * vLimit

      const vWhere: any = { storeId: vStoreId, isAvailable: true }
      if (pParam?.search) {
        vWhere.name = { [Op.iLike]: `%${pParam.search}%` }
      }
      if (pParam?.departmentId) {
        vWhere.departmentId = Number(pParam.departmentId)
      }
      if (pParam?.categoryId) {
        const vCategoryIds: number[] = String(pParam.categoryId)
          .split(',')
          .map((pId) => Number(pId.trim()))
          .filter((pId) => !Number.isNaN(pId))
        if (vCategoryIds.length) {
          // Se filtra por la tabla puente en vez de meter esto en el include de categories que
          // ya usa la respuesta (ese debe seguir trayendo TODAS las categorias del producto,
          // no solo las que matchean el filtro).
          const vMatches = await modelStoreProductCategory.findAll({
            where: { categoryId: { [Op.in]: vCategoryIds } },
            attributes: ['productId'],
          })
          const vProductIds = [...new Set(vMatches.map((pMatch) => pMatch.dataValues.productId))]
          vWhere.id = { [Op.in]: vProductIds.length ? vProductIds : [-1] }
        }
      }

      const vStoreInclude = {
        model: modelStore,
        as: 'store',
        required: true,
        attributes: [],
        where: { isApproved: true },
      }

      const vCount: number = await modelStoreProduct.count({ where: vWhere, include: [vStoreInclude] })
      // unscoped() para pisar el defaultScope (ordena por createdAt, que no esta en
      // vStoreProductPublicFields y rompe la query) sin afectar el filtro paranoid de deletedAt.
      const vResponse: IStoreProductInstance[] = await modelStoreProduct.unscoped().findAll({
        where: vWhere,
        attributes: [...vStoreProductPublicFields],
        include: [vStoreInclude, ...vStoreProductCategorizationInclude],
        order: [['id', 'DESC']],
        limit: vLimit,
        offset: vOffset,
      })

      return {
        total: vCount,
        totalPage: Math.max(Math.ceil(vCount / vLimit), 1),
        data: vResponse,
        actualPage: vPage,
      } as unknown as IResponseAllStoreProduct
    } catch (error) {
      throw error
    }
  }

  public async allAdmin(
    pParam: any,
    pOwnerId?: string
  ): Promise<IResponseAllStoreProduct | IStoreProductInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'StoreProduct'
      )
      if (pParam?.storeId) {
        whereStatement.where = { ...whereStatement.where, storeId: Number(pParam.storeId) }
      }
      if (pOwnerId) {
        whereStatement.include = [
          {
            model: modelStore,
            as: 'store',
            required: true,
            attributes: [],
            where: { ownerId: pOwnerId },
          },
        ]
      }

      const vResponse: IStoreProductInstance[] = await modelStoreProduct.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStoreProduct = await fxReponseServices(
          pParam,
          whereStatement,
          'StoreProduct',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IStoreProductInstance | null> {
    try {
      const vResponse: IStoreProductInstance | null = await modelStoreProduct.findOne({
        where: { id: pId },
        include: vStoreProductCategorizationInclude,
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  // Valida que departmentId (si viene) y todos los categoryIds (si vienen) pertenezcan a la
  // misma tienda del producto. Tira un error legible en vez de guardar datos inconsistentes.
  private async fxValidateCategorization(pStoreId: number, pDepartmentId?: number | null, pCategoryIds?: number[]) {
    if (pDepartmentId) {
      const vDepartment = await modelStoreDepartment.findOne({ where: { id: pDepartmentId } })
      if (!vDepartment || vDepartment.dataValues.storeId !== pStoreId) {
        throw new Error('El departamento no pertenece a esta tienda')
      }
    }
    if (pCategoryIds?.length) {
      const vCategories = await modelStoreCategory.findAll({ where: { id: pCategoryIds } })
      if (vCategories.length !== pCategoryIds.length || vCategories.some((pCat) => pCat.dataValues.storeId !== pStoreId)) {
        throw new Error('Una o mas categorias no pertenecen a esta tienda')
      }
    }
  }

  private async fxSetCategories(pProductId: number, pCategoryIds?: number[]) {
    if (pCategoryIds === undefined) {
      return
    }
    console.log('pCategoryIds :>> ', pCategoryIds)
    await sequelize.transaction(async (pTransaction) => {
      await modelStoreProductCategory.destroy({ where: { productId: pProductId }, transaction: pTransaction })
      if (pCategoryIds?.length) {
        await modelStoreProductCategory.bulkCreate(
          pCategoryIds.map((pCategoryId) => ({ productId: pProductId, categoryId: pCategoryId })),
          { transaction: pTransaction }
        )
      }
    })
  }

  // images: reemplaza por completo la galeria del producto (destroy + bulkCreate), igual que
  // categorias/modificadores - no hay CRUD por foto individual. El orden del array define el
  // campo 'order' (asi la app las muestra en el mismo orden que las subieron).
  private async fxSetImages(pProductId: number, pImages?: string[]) {
    if (pImages === undefined) {
      return
    }
    await sequelize.transaction(async (pTransaction) => {
      await modelStoreProductImage.destroy({ where: { productId: pProductId }, transaction: pTransaction })
      if (pImages.length) {
        await modelStoreProductImage.bulkCreate(
          pImages.map((pImage, pIndex) => ({ productId: pProductId, image: pImage, order: pIndex })),
          { transaction: pTransaction }
        )
      }
    })
  }

  async create(pData: IStoreProductInput): Promise<IStoreProductInstance> {
    try {
      await this.fxValidateCategorization(pData.storeId, pData.departmentId, pData.categoryIds)
      const { categoryIds, images, ...vProductData } = pData
      const vResponse: IStoreProductInstance = await modelStoreProduct.create(vProductData)
      await this.fxSetCategories(vResponse.dataValues.id, categoryIds)
      await this.fxSetImages(vResponse.dataValues.id, images)
      return (await this.show(vResponse.dataValues.id)) as IStoreProductInstance
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreProductInput): Promise<IStoreProductInstance | null> {
    try {
      if (pData?.id) {
        const vExisting: IStoreProductInstance | null = await modelStoreProduct.findOne({
          where: { id: pData.id },
        })
        if (!vExisting) {
          return null
        }
        const vStoreId = vExisting.dataValues.storeId
        await this.fxValidateCategorization(vStoreId, pData.departmentId, pData.categoryIds)
        const { categoryIds, images, ...vProductData } = pData
        await vExisting.update(vProductData)
        await this.fxSetCategories(vExisting.dataValues.id, categoryIds)
        await this.fxSetImages(vExisting.dataValues.id, images)
        return await this.show(vExisting.dataValues.id)
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelStoreProduct.update(
        { deletedAt: new Date() },
        { where: { id: pId } }
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
export default new StoreProductService()
