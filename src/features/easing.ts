export type EasingPreset = {
  name: string
  values: [number, number, number, number]
  note: string
}

export const easingPresets: EasingPreset[] = [
  { name: 'Standard', values: [0.2, 0, 0, 1], note: 'Material-style default' },
  { name: 'Arrive', values: [0.16, 1, 0.3, 1], note: 'Fast out, soft landing' },
  { name: 'Depart', values: [0.7, 0, 0.84, 0], note: 'Slow out, quick exit' },
  { name: 'Snap', values: [0.25, 0.1, 0.25, 1], note: 'Familiar CSS ease' },
  { name: 'Emphasis', values: [0.65, 0, 0.35, 1], note: 'Balanced in and out' },
  { name: 'Linear', values: [0, 0, 1, 1], note: 'Only for progress or rotation' },
]

export const formatEasing = (values: [number, number, number, number]) =>
  `cubic-bezier(${values.map((value) => Number(value.toFixed(2))).join(', ')})`

export const easingCss = (values: [number, number, number, number], duration: number) =>
  `transition: transform ${duration}ms ${formatEasing(values)};`

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
