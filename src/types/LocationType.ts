export interface ICountryInput {
  name: string
  flag?: string
  state: boolean
}

export interface ICountryUpdate {
  id: number
  name: string
  flag?: string
  phoneCode?: string
  state?: boolean
}

export interface IRegionInput {
  name: string
  flag?: string
  countryId?: string
  state?: boolean
}

export interface ICityInput {
  name: string
  flag?: string
  regionId?: string
  state?: boolean
}