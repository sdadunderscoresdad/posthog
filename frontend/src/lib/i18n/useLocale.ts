import { useEffect, useState } from 'react'

import { getActiveLocale, i18n } from './i18n'
import { SOURCE_LOCALE, isLocaleCode, type LocaleCode } from './supportedLocales'

/** The language the app renders in, re-rendering the caller when it changes. */
export function useLocale(): LocaleCode {
    const [locale, setLocaleState] = useState<LocaleCode>(getActiveLocale)

    useEffect(() => {
        const onLanguageChanged = (next: string): void => {
            // i18next reports whatever tag it settled on, which is a supported code for us because
            // `setLocale` is the only caller that changes the language.
            setLocaleState(isLocaleCode(next) ? next : SOURCE_LOCALE)
        }
        i18n.on('languageChanged', onLanguageChanged)
        return () => {
            i18n.off('languageChanged', onLanguageChanged)
        }
    }, [])

    return locale
}
