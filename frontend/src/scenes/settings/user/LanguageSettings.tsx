import { LemonSelect } from '@posthog/lemon-ui'

import { setLocale } from 'lib/i18n/i18n'
import { SUPPORTED_LOCALES, type LocaleCode } from 'lib/i18n/supportedLocales'
import { useLocale } from 'lib/i18n/useLocale'

// Each language is listed in its own name, so the option a person needs is readable before they can
// read the current interface language. These labels never translate, so the array is built once.
const LANGUAGE_OPTIONS = (Object.keys(SUPPORTED_LOCALES) as LocaleCode[]).map((code) => ({
    value: code,
    label: SUPPORTED_LOCALES[code].nativeName,
}))

export function LanguageSettings(): JSX.Element {
    const locale = useLocale()

    return (
        <LemonSelect<LocaleCode>
            value={locale}
            onChange={(value) => {
                void setLocale(value)
            }}
            options={LANGUAGE_OPTIONS}
            data-attr="language-select"
        />
    )
}
