import { useEffect, type ReactNode } from 'react'

import { ensureLocaleCatalogs } from './i18n'
import { SUPPORTED_LOCALES } from './supportedLocales'
import { useLocale } from './useLocale'

export interface I18nProviderProps {
    children: ReactNode
}

/**
 * Holds the app's language: waits for the active language's catalogs, and keeps `<html>` describing
 * it so that assistive technology, hyphenation and text direction follow.
 *
 * Children render only after the catalogs reach the i18next instance, which is what stops a
 * component from rendering a raw key. The source language has no catalog and never suspends.
 *
 * The provider must sit above everything that renders text, and inside a `Suspense` boundary.
 */
export function I18nProvider({ children }: I18nProviderProps): JSX.Element {
    const locale = useLocale()

    useEffect(() => {
        document.documentElement.lang = locale
        document.documentElement.dir = SUPPORTED_LOCALES[locale].direction
    }, [locale])

    const pendingCatalogs = ensureLocaleCatalogs(locale)
    if (pendingCatalogs) {
        throw pendingCatalogs
    }

    return <>{children}</>
}
