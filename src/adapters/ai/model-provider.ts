import type { CarryProfileRequest, Item } from '@/domain/types'

export interface ModelProvider {
  readonly name: 'openai'
  infer(request: CarryProfileRequest, items: Item[]): Promise<unknown>
}
