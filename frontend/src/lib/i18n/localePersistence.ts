import { isLocaleCode, type LocaleCode } from './supportedLocales'

// pinned: localStorage key. Renaming it silently resets the language choice of every existing user.
const LOCALE_STORAGE_KEY = 'ph_locale'

/**
 * Storage access throws when the browser blocks site data, which is not an error condition here:
 * it only means this device has no remembered choice, so the browser's own languages decide.
 */
function getStorage(): Storage | null {
    try {
        return window.localStorage
    } catch {
        return null
    }
}

export function readStoredLocale(): LocaleCode | null {
    const stored = getStorage()?.getItem(LOCALE_STORAGE_KEY)
    return stored && isLocaleCode(stored) ? stored : null
}

export function writeStoredLocale(locale: LocaleCode): void {
    getStorage()?.setItem(LOCALE_STORAGE_KEY, locale)
}
