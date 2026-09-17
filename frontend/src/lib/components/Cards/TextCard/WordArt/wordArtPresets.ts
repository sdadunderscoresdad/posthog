import { i18n } from 'lib/i18n/i18n'

interface WordArtPreset {
    id: string
    label: string
}

const WORD_ART_PRESET_IDS = [
    'rainbow',
    'sunset',
    'chrome',
    'neon',
    'outline',
    'extrude',
    'shadow',
    'fire',
    'ice',
    'stripes',
    'arch',
] as const

type WordArtPresetId = (typeof WORD_ART_PRESET_IDS)[number]

/**
 * Style labels are thunks: a map read at import would keep whatever language the app started in,
 * and the extractor only finds message keys that appear literally.
 */
const PRESET_LABELS: Record<WordArtPresetId, () => string> = {
    rainbow: () => i18n.t('wordArt.styles.rainbow', { defaultValue: 'Rainbow' }),
    sunset: () => i18n.t('wordArt.styles.sunset', { defaultValue: 'Sunset' }),
    chrome: () => i18n.t('wordArt.styles.chrome', { defaultValue: 'Chrome' }),
    neon: () => i18n.t('wordArt.styles.neon', { defaultValue: 'Neon sign' }),
    outline: () => i18n.t('wordArt.styles.outline', { defaultValue: 'Outline' }),
    extrude: () => i18n.t('wordArt.styles.extrude', { defaultValue: '3D blocks' }),
    shadow: () => i18n.t('wordArt.styles.shadow', { defaultValue: 'Hard shadow' }),
    fire: () => i18n.t('wordArt.styles.fire', { defaultValue: 'Fire' }),
    ice: () => i18n.t('wordArt.styles.ice', { defaultValue: 'Ice' }),
    stripes: () => i18n.t('wordArt.styles.stripes', { defaultValue: 'Retro stripes' }),
    arch: () => i18n.t('wordArt.styles.arch', { defaultValue: 'Arch' }),
}

export function wordArtPresets(): WordArtPreset[] {
    return WORD_ART_PRESET_IDS.map((id) => ({ id, label: PRESET_LABELS[id]() }))
}

export const DEFAULT_WORD_ART_STYLE = 'rainbow'

export function normalizeWordArtStyle(value: string | null | undefined): string {
    return value && WORD_ART_PRESET_IDS.includes(value as WordArtPresetId) ? value : DEFAULT_WORD_ART_STYLE
}

export type WordArtSize = 'small' | 'medium' | 'large'

export const WORD_ART_SIZES: WordArtSize[] = ['small', 'medium', 'large']

export const DEFAULT_WORD_ART_SIZE: WordArtSize = 'medium'

export function wordArtSizeLabel(size: WordArtSize): string {
    switch (size) {
        case 'small':
            return i18n.t('wordArt.sizes.small', { defaultValue: 'Small' })
        case 'medium':
            return i18n.t('wordArt.sizes.medium', { defaultValue: 'Medium' })
        case 'large':
            return i18n.t('wordArt.sizes.large', { defaultValue: 'Large' })
    }
}

export function normalizeWordArtSize(value: string | null | undefined): WordArtSize {
    return WORD_ART_SIZES.includes(value as WordArtSize) ? (value as WordArtSize) : DEFAULT_WORD_ART_SIZE
}
