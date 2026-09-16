import { SOURCE_LOCALE, SUPPORTED_LOCALES, type LocaleCode } from './supportedLocales'

const LOCALE_CODES = Object.keys(SUPPORTED_LOCALES) as LocaleCode[]

/** Browsers, `Accept-Language` headers, and stored user records spell the same tag differently. */
function normalizeTag(tag: string): string {
    return tag.trim().replace(/_/g, '-')
}

function languageOf(tag: string): string {
    return normalizeTag(tag).split('-')[0].toLowerCase()
}

/**
 * The script subtag, when the tag carries one. Scripts are four letters, which is what separates
 * them from a two-letter region (`zh-Hant-CN` carries both).
 */
function scriptOf(tag: string): string | null {
    const script = normalizeTag(tag)
        .split('-')
        .slice(1)
        .find((part) => part.length === 4)
    return script ? script[0].toUpperCase() + script.slice(1).toLowerCase() : null
}

function regionOf(tag: string): string | null {
    const region = normalizeTag(tag)
        .split('-')
        .slice(1)
        .find((part) => part.length === 2 || part.length === 3)
    return region?.toUpperCase() ?? null
}

/**
 * How well one supported locale answers a requested tag. A lower number is a weaker match and zero
 * means the locale does not offer the requested language at all.
 */
function matchStrength(
    code: LocaleCode,
    normalizedTag: string,
    language: string,
    script: string | null,
    region: string | null
): number {
    if (languageOf(code) !== language) {
        return 0
    }
    if (code.toLowerCase() === normalizedTag) {
        return 4
    }
    if (region !== null && regionOf(code) === region) {
        return 3
    }
    if (script !== null && SUPPORTED_LOCALES[code].script === script) {
        return 2
    }
    return 1
}

/**
 * Resolve one BCP 47 tag to a supported locale, or `null` when PostHog does not offer its language.
 *
 * Matching runs from specific to broad: the identical tag, then the same language and region, then
 * the same language and script, then the language alone. `de-AT` therefore lands on `de-DE`, and
 * `zh-Hant` lands on `zh-TW` because the registered Traditional locale declares that script.
 *
 * A tag that names only a language, such as `zh` or `zh-HK`, resolves to the first registered
 * locale for that language, so registry order decides the default within a language.
 */
export function matchSupportedLocale(tag: string): LocaleCode | null {
    const language = languageOf(tag)
    if (!language) {
        return null
    }
    const normalizedTag = normalizeTag(tag).toLowerCase()
    const script = scriptOf(tag)
    const region = regionOf(tag)

    let best: LocaleCode | null = null
    let bestStrength = 0
    for (const code of LOCALE_CODES) {
        const strength = matchStrength(code, normalizedTag, language, script, region)
        if (strength > bestStrength) {
            best = code
            bestStrength = strength
        }
    }
    return best
}

export interface LocaleResolutionInput {
    /** The language saved on the user's account. */
    userPreference?: string | null
    /** The language this device remembers from the last explicit choice. */
    storedPreference?: string | null
    /** `navigator.languages`, most preferred first. */
    browserLanguages?: readonly string[]
}

/**
 * Pick the locale to start in.
 *
 * The account preference wins because it is the only choice that follows the user between devices.
 * The device preference fills in before an account has one, so a language changed elsewhere is not
 * overridden by a stale local value. The browser's own preferences come next, and English is last.
 */
export function resolveLocale(input: LocaleResolutionInput): LocaleCode {
    const { userPreference, storedPreference, browserLanguages = [] } = input

    for (const preferred of [userPreference, storedPreference]) {
        const match = preferred ? matchSupportedLocale(preferred) : null
        if (match) {
            return match
        }
    }
    for (const browserLanguage of browserLanguages) {
        const match = matchSupportedLocale(browserLanguage)
        if (match) {
            return match
        }
    }
    return SOURCE_LOCALE
}
