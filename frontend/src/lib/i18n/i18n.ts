import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { CATALOG_LOADERS } from './catalogLoaders'
import { unwrapCatalog } from './catalogs'
import { readStoredLocale, writeStoredLocale } from './localePersistence'
import { resolveLocale } from './localeResolution'
import { DEFAULT_NAMESPACE, NAMESPACES } from './namespaces'
import { SOURCE_LOCALE, type LocaleCode } from './supportedLocales'

function browserLanguages(): string[] {
    if (typeof navigator === 'undefined') {
        return []
    }
    const preferred = navigator.languages ?? []
    if (preferred.length > 0) {
        return [...preferred]
    }
    return navigator.language ? [navigator.language] : []
}

/**
 * The language the app is set to.
 *
 * i18next resolves its own language against the resources it holds, so it would report English
 * before the requested catalog has arrived. This tracks the choice itself, which is what the
 * provider needs in order to know which catalog to wait for.
 */
let activeLocale: LocaleCode = resolveLocale({
    storedPreference: readStoredLocale(),
    browserLanguages: browserLanguages(),
})

i18n.use(initReactI18next).init({
    lng: activeLocale,
    fallbackLng: SOURCE_LOCALE,
    ns: [...NAMESPACES],
    defaultNS: DEFAULT_NAMESPACE,
    // React escapes every interpolated value already, and escaping again would render entities.
    interpolation: { escapeValue: false },
    // Synchronous init is what lets the first render know its language. Left asynchronous, i18next
    // waits on a resource backend that does not exist here, and the language is unknown until that
    // settles. Catalogs arrive later, through addResourceBundle.
    initAsync: false,
    returnNull: false,
    // Catalog loading is the provider's job, so react-i18next must not run a second, competing load.
    react: { useSuspense: false },
})

export function getActiveLocale(): LocaleCode {
    return activeLocale
}

const inFlightLoads = new Map<LocaleCode, Promise<void>>()

/**
 * Start loading a language's catalogs, or return `null` when the instance already holds them.
 *
 * A `null` return means the caller can render immediately. The source language always takes that
 * path, because it has no catalog: its messages are the English text at each call site.
 */
export function ensureLocaleCatalogs(locale: LocaleCode): Promise<void> | null {
    const loaders = CATALOG_LOADERS[locale]
    const missing = Object.entries(loaders).filter(([namespace]) => !i18n.hasResourceBundle(locale, namespace))
    if (missing.length === 0) {
        return null
    }

    const alreadyLoading = inFlightLoads.get(locale)
    if (alreadyLoading) {
        return alreadyLoading
    }

    const load: Promise<void> = Promise.all(
        missing.map(async ([namespace, loader]) => {
            if (!loader) {
                return
            }
            i18n.addResourceBundle(locale, namespace, unwrapCatalog(await loader()), true, true)
        })
    )
        .then(() => undefined)
        .finally(() => {
            // Cleared on failure as well, so that a failed fetch can be retried by a later render.
            inFlightLoads.delete(locale)
        })
    inFlightLoads.set(locale, load)
    return load
}

/**
 * Switch the app to another language.
 *
 * The catalog is fetched first so that `languageChanged` fires once, with the messages already in
 * place, which keeps the switch from rendering a frame of keys or of the previous language.
 */
export async function setLocale(locale: LocaleCode): Promise<void> {
    if (locale === activeLocale) {
        return
    }
    await ensureLocaleCatalogs(locale)
    activeLocale = locale
    writeStoredLocale(locale)
    await i18n.changeLanguage(locale)
}

export { i18n }
