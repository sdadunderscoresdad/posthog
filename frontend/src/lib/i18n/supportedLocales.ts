export type TextDirection = 'ltr' | 'rtl'

export interface LocaleMeta {
    /** The language's name in English, for logs and internal tooling. */
    readonly englishName: string
    /** The language's name in that language, which is what a language picker shows. */
    readonly nativeName: string
    readonly direction: TextDirection
    /**
     * The script this locale is written in, for languages that use more than one. A tag such as
     * `zh-Hant` names a script instead of a region, so it can only be matched against this field.
     * Null when the language has a single script.
     */
    readonly script: string | null
}

/**
 * The languages PostHog offers.
 *
 * `en` is the source language. Every message is written in English at the call site, and the
 * English text is the message's fallback, so no English catalog is loaded at runtime. The
 * extraction tool still writes `locales/en/` because translators need the full source list.
 *
 * Adding a language takes an entry here and a matching `locales/<code>/` directory. The catalog
 * build script fails when the list and the directories disagree in either direction.
 */
export const SUPPORTED_LOCALES = {
    en: { englishName: 'English', nativeName: 'English', direction: 'ltr', script: null },
    'zh-CN': { englishName: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr', script: 'Hans' },
    'zh-TW': { englishName: 'Chinese (Traditional)', nativeName: '繁體中文', direction: 'ltr', script: 'Hant' },
    'ja-JP': { englishName: 'Japanese', nativeName: '日本語', direction: 'ltr', script: null },
    'ko-KR': { englishName: 'Korean', nativeName: '한국어', direction: 'ltr', script: null },
    'de-DE': { englishName: 'German', nativeName: 'Deutsch', direction: 'ltr', script: null },
    'fr-FR': { englishName: 'French', nativeName: 'Français', direction: 'ltr', script: null },
    'es-ES': { englishName: 'Spanish', nativeName: 'Español', direction: 'ltr', script: null },
    'pt-BR': { englishName: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', direction: 'ltr', script: null },
    'ru-RU': { englishName: 'Russian', nativeName: 'Русский', direction: 'ltr', script: null },
} as const satisfies Record<string, LocaleMeta>

export type LocaleCode = keyof typeof SUPPORTED_LOCALES

export const SOURCE_LOCALE: LocaleCode = 'en'

export function isLocaleCode(value: string): value is LocaleCode {
    return Object.prototype.hasOwnProperty.call(SUPPORTED_LOCALES, value)
}
