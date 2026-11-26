export type CrateStatus = 'ok' | 'underweight' | 'overweight' | 'void'
export type Crate = { id: string; gross: number; net: number; status: CrateStatus; createdAt: string; voidReason?: string }
export type Delivery = { id: string; supplier: string; plate: string; expected: number; startedAt: string; closedAt?: string; crates: Crate[] }
export type Settings = { tare: number; minNet: number; maxNet: number }

const DELIVERY_KEY = 'cratetrack.deliveries.v1'
const SETTINGS_KEY = 'cratetrack.settings.v1'
const isoAgo = (days: number, hour: number) => { const date = new Date(); date.setDate(date.getDate() - days); date.setHours(hour, 20, 0, 0); return date.toISOString() }
const seedDeliveries: Delivery[] = [
  { id: 'DLV-2408', supplier: 'Sunrise Tropical Co.', plate: 'KCA 482D', expected: 32, startedAt: isoAgo(0, 8), closedAt: isoAgo(0, 10), crates: Array.from({ length: 28 }, (_, i) => { const gross = Number((18.1 + ((i * 17) % 46) / 10).toFixed(1)); return { id: `A-${String(i + 1).padStart(3, '0')}`, gross, net: Number((gross - 1.5).toFixed(1)), status: i === 5 ? 'underweight' : 'ok', createdAt: isoAgo(0, 8) } }) },
  { id: 'DLV-2407', supplier: 'Golden Grove Produce', plate: 'KDA 193F', expected: 24, startedAt: isoAgo(1, 13), closedAt: isoAgo(1, 14), crates: Array.from({ length: 24 }, (_, i) => { const gross = Number((18.8 + ((i * 13) % 36) / 10).toFixed(1)); return { id: `B-${String(i + 1).padStart(3, '0')}`, gross, net: Number((gross - 1.5).toFixed(1)), status: i === 12 ? 'overweight' : 'ok', createdAt: isoAgo(1, 13) } }) },
  { id: 'DLV-2406', supplier: 'Coastal Harvest Ltd.', plate: 'KCD 775A', expected: 30, startedAt: isoAgo(2, 9), closedAt: isoAgo(2, 11), crates: Array.from({ length: 26 }, (_, i) => { const gross = Number((18.3 + ((i * 11) % 40) / 10).toFixed(1)); return { id: `C-${String(i + 1).padStart(3, '0')}`, gross, net: Number((gross - 1.5).toFixed(1)), status: i === 2 ? 'underweight' : 'ok', createdAt: isoAgo(2, 9) } }) },
]

export const dataService = {
  getDeliveries(): Delivery[] {
    if (typeof window === 'undefined') return seedDeliveries
    try { const raw = window.localStorage.getItem(DELIVERY_KEY); if (raw) return JSON.parse(raw) as Delivery[]; window.localStorage.setItem(DELIVERY_KEY, JSON.stringify(seedDeliveries)); return seedDeliveries }
    catch { return seedDeliveries }
  },
  saveDeliveries(deliveries: Delivery[]) { if (typeof window !== 'undefined') window.localStorage.setItem(DELIVERY_KEY, JSON.stringify(deliveries)) },
  getSettings(): Settings {
    if (typeof window === 'undefined') return { tare: 1.5, minNet: 15, maxNet: 25 }
    try { return { tare: 1.5, minNet: 15, maxNet: 25, ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}') } }
    catch { return { tare: 1.5, minNet: 15, maxNet: 25 } }
  },
  saveSettings(settings: Settings) { if (typeof window !== 'undefined') window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) },
}

/** Adapter contract for connecting an approved scale-reading source in a future version. */
export interface ScaleInputAdapter {
  subscribe(onReading: (kilograms: number) => void): () => void
  placeCrate(weight?: number, bad?: boolean): void
}

export class SimulatorScaleAdapter implements ScaleInputAdapter {
  private listeners = new Set<(kilograms: number) => void>()
  subscribe(listener: (kilograms: number) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  private emit(value: number) { this.listeners.forEach((listener) => listener(Number(value.toFixed(2)))) }
  placeCrate(weight?: number, bad = false) {
    const target = weight ?? (bad ? (Math.random() > 0.5 ? 14.2 + Math.random() * 1.3 : 26.6 + Math.random() * 2.1) : 16 + Math.random() * 8)
    const readings = [0, target * .32, target * .68, target * .91, target - .12, target + .07, target - .04, target + .03, target - .02, target + .02, target - .01, target, 0]
    readings.forEach((reading, index) => window.setTimeout(() => this.emit(reading), index * 300))
  }
}
