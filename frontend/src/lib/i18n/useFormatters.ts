import { useMemo } from 'react'

import { createLocaleFormatters, type LocaleFormatters } from './formatters'
import { useLocale } from './useLocale'

/**
 * Number, date, time, duration, and list formatting for the language the app renders in.
 *
 * Reach for this whenever a value or a duration would otherwise be joined into a sentence with
 * string concatenation, which is the shape that cannot be translated.
 */
export function useFormatters(): LocaleFormatters {
    const locale = useLocale()
    return useMemo(() => createLocaleFormatters(locale), [locale])
}
