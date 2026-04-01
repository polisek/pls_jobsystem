export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Ingredient {
  itemName: string
  itemCount: number
}

export interface CraftingAnimation {
  anim: string
  dict: string
}

export interface CraftingItem {
  itemName: string
  itemCount: number
  ingedience: Ingredient[]
  animation?: CraftingAnimation
}

export interface CraftingTable {
  id: string
  label: string
  coords: Vec3
  items: CraftingItem[]
}

export interface ShopItem {
  itemName: string
  price: number
}

export interface Shop {
  id: string
  label: string
  coords: Vec3
  items: ShopItem[]
}

export interface Stash {
  id: string
  label: string
  coords: Vec3
  slots: number
  weight: number
  job: boolean
}

export interface Ped {
  label: string
  model: string
  coords: Vec3
  heading: number
  animAnim?: string
  animDict?: string
}

export interface Job {
  label: string
  job: string
  coords: Vec3
  area: number
  balance?: number
  craftings: CraftingTable[]
  register?: Vec3
  alarm?: Vec3
  bossmenu?: Vec3
  stashes?: Stash[]
  peds?: Ped[]
  shops?: Shop[]
}

export interface Item {
  name: string
  label: string
}

export interface Toast {
  id: string
  title: string
  description: string
  type: 'success' | 'error' | 'inform'
}

export type EditorPanel =
  | 'jobCreator'
  | 'craftingEditor'
  | 'stashEditor'
  | 'pedEditor'
  | 'shopEditor'
  | 'featureEditor'
  | null

export type PlayerPanel =
  | 'crafting'
  | 'cashRegister'
  | 'confirm'
  | 'shop'
  | null
