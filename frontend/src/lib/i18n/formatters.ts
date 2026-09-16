import type { LocaleCode } from './supportedLocales'

type DurationUnit = 'day' | 'hour' | 'minute' | 'second' | 'millisecond'

const DURATION_UNITS: ReadonlyArray<{ unit: DurationUnit; milliseconds: number }> = [
    { unit: 'day', milliseconds: 86_400_000 },
    { unit: 'hour', milliseconds: 3_600_000 },
    { unit: 'minute', milliseconds: 60_000 },
    { unit: 'second', milliseconds: 1_000 },
    { unit: 'millisecond', milliseconds: 1 },
]

/**
 * A scene formats thousands of values per render, and building an `Intl` formatter costs far more
 * than formatting with one, so every locale and option set is built once and kept.
 */
function createFormatterCache<Formatter>(): (
    locale: LocaleCode,
    options: object | undefined,
    build: () => Formatter
) => Formatter {
    const entries = new Map<string, Formatter>()
    return (locale, options, build) => {
        const key = `${locale}|${optionKey(options)}`
        const cached = entries.get(key)
        if (cached !== undefined) {
            return cached
        }
        const formatter = build()
        entries.set(key, formatter)
        return formatter
    }
}

/** Sorted so that callers passing the same options in a different order share one cache entry. */
function optionKey(options: object | undefined): string {
    if (!options) {
        return ''
    }
    const record = options as Record<string, unknown>
    return Object.keys(record)
        .sort()
        .map((name) => `${name}=${String(record[name])}`)
        .join('&')
}

const numberFormats = createFormatterCache<Intl.NumberFormat>()
const dateTimeFormats = createFormatterCache<Intl.DateTimeFormat>()
const relativeTimeFormats = createFormatterCache<Intl.RelativeTimeFormat>()
const listFormats = createFormatterCache<Intl.ListFormat>()
const pluralRulesCache = createFormatterCache<Intl.PluralRules>()

function numberFormat(locale: LocaleCode, options: Intl.NumberFormatOptions): Intl.NumberFormat {
    return numberFormats(locale, options, () => new Intl.NumberFormat(locale, options))
}

function dateTimeFormat(locale: LocaleCode, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    return dateTimeFormats(locale, options, () => new Intl.DateTimeFormat(locale, options))
}

function relativeTimeFormat(locale: LocaleCode, options: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
    return relativeTimeFormats(locale, options, () => new Intl.RelativeTimeFormat(locale, options))
}

function listFormat(locale: LocaleCode, options: Intl.ListFormatOptions): Intl.ListFormat {
    return listFormats(locale, options, () => new Intl.ListFormat(locale, options))
}

function unitFormat(locale: LocaleCode, unit: DurationUnit, maximumFractionDigits: number): Intl.NumberFormat {
    // `Intl.NumberFormat` localizes unit names itself (`1d`, `1天`), so durations need no catalog entry.
    return numberFormat(locale, { style: 'unit', unitDisplay: 'narrow', unit, maximumFractionDigits })
}

interface DurationPart {
    readonly unit: DurationUnit
    readonly milliseconds: number
    readonly amount: number
}

/**
 * Split a span into the units to render, largest first.
 *
 * `maximumUnits` caps the count so that a long duration does not become a wide label, and the units
 * the cap cuts off are dropped: 1 day 10 hours 9 minutes reads as `1d 10h` under a cap of two.
 *
 * The one remainder that survives is the one the units cannot express, which is a fraction of a
 * millisecond. Without it, a value such as 3.5 milliseconds would round to a wrong number.
 */
function durationParts(totalMilliseconds: number, maximumUnits: number): DurationPart[] {
    const parts: DurationPart[] = []
    let remaining = Math.abs(totalMilliseconds)
    let ranOutOfUnits = true

    for (const { unit, milliseconds } of DURATION_UNITS) {
        if (parts.length === maximumUnits) {
            ranOutOfUnits = false
            break
        }
        const amount = Math.floor(remaining / milliseconds)
        if (amount > 0) {
            parts.push({ unit, milliseconds, amount })
            remaining -= amount * milliseconds
        }
    }

    if (ranOutOfUnits && remaining > 0 && parts.length > 0) {
        const smallest = parts[parts.length - 1]
        parts[parts.length - 1] = { ...smallest, amount: smallest.amount + remaining / smallest.milliseconds }
    }
    if (totalMilliseconds < 0 && parts.length > 0) {
        // Carrying the sign on the largest unit lets the locale format it, which keeps right-to-left
        // marks and non-ASCII minus signs correct.
        parts[0] = { ...parts[0], amount: -parts[0].amount }
    }
    return parts
}

export interface DurationFormatOptions {
    /** How many units to render, largest first. Defaults to 2. */
    maximumUnits?: number
    /** Digits after the decimal point for the unit holding a fractional remainder. Defaults to 2. */
    maximumFractionDigits?: number
}

function formatDuration(
    locale: LocaleCode,
    totalMilliseconds: number,
    options: DurationFormatOptions | undefined
): string {
    const maximumFractionDigits = options?.maximumFractionDigits ?? 2
    const parts = durationParts(totalMilliseconds, options?.maximumUnits ?? 2)
    if (parts.length === 0) {
        return unitFormat(locale, 'second', maximumFractionDigits).format(0)
    }
    return parts.map(({ unit, amount }) => unitFormat(locale, unit, maximumFractionDigits).format(amount)).join(' ')
}

/** The options that select individual date or time parts, which a date or time style may not combine with. */
const COMPONENT_OPTIONS = [
    'weekday',
    'era',
    'year',
    'month',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'fractionalSecondDigits',
    'timeZoneName',
] as const

/**
 * Apply a style default unless the caller selected individual parts.
 *
 * `Intl` throws when a style such as `dateStyle` is combined with a part such as `year`, and a
 * caller who passes something orthogonal such as `timeZone` still expects the usual style.
 */
function withStyleDefaults(
    options: Intl.DateTimeFormatOptions | undefined,
    defaults: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
    if (!options) {
        return defaults
    }
    return COMPONENT_OPTIONS.some((name) => options[name] !== undefined) ? options : { ...defaults, ...options }
}

export interface LocaleFormatters {
    number(value: number, options?: Intl.NumberFormatOptions): string
    /** `currency` is an ISO 4217 code. The symbol, its placement, and the separators all follow. */
    currency(value: number, currency: string, options?: Intl.NumberFormatOptions): string
    compactNumber(value: number, options?: Intl.NumberFormatOptions): string
    /** Takes a fraction, so `0.25` renders as `25%`. Not a value that is already in percent. */
    percent(fraction: number, options?: Intl.NumberFormatOptions): string
    date(value: Date | number, options?: Intl.DateTimeFormatOptions): string
    time(value: Date | number, options?: Intl.DateTimeFormatOptions): string
    dateTime(value: Date | number, options?: Intl.DateTimeFormatOptions): string
    relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions): string
    durationSeconds(seconds: number, options?: DurationFormatOptions): string
    durationMilliseconds(milliseconds: number, options?: DurationFormatOptions): string
    list(items: readonly string[], options?: Intl.ListFormatOptions): string
    /** The plural category of `count`, which decides which message form `t` selects. */
    pluralRule(count: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule
}

/**
 * Build every locale-aware formatter for one language.
 *
 * Use this through `useFormatters()` in React so that a language change re-renders, and directly
 * with a locale in code that runs outside a render.
 */
export function createLocaleFormatters(locale: LocaleCode): LocaleFormatters {
    return {
        number: (value, options) => numberFormat(locale, options ?? {}).format(value),
        currency: (value, currency, options) =>
            numberFormat(locale, { ...options, style: 'currency', currency }).format(value),
        compactNumber: (value, options) =>
            numberFormat(locale, { compactDisplay: 'short', ...options, notation: 'compact' }).format(value),
        percent: (fraction, options) => numberFormat(locale, { ...options, style: 'percent' }).format(fraction),
        date: (value, options) =>
            dateTimeFormat(locale, withStyleDefaults(options, { dateStyle: 'medium' })).format(value),
        time: (value, options) =>
            dateTimeFormat(locale, withStyleDefaults(options, { timeStyle: 'short' })).format(value),
        dateTime: (value, options) =>
            dateTimeFormat(locale, withStyleDefaults(options, { dateStyle: 'medium', timeStyle: 'short' })).format(
                value
            ),
        relativeTime: (value, unit, options) =>
            relativeTimeFormat(locale, { numeric: 'auto', ...options }).format(value, unit),
        durationSeconds: (seconds, options) => formatDuration(locale, seconds * 1000, options),
        durationMilliseconds: (milliseconds, options) => formatDuration(locale, milliseconds, options),
        list: (items, options) =>
            listFormat(locale, options ?? { style: 'long', type: 'conjunction' }).format([...items]),
        pluralRule: (count, options) =>
            pluralRulesCache(locale, options, () => new Intl.PluralRules(locale, options)).select(count),
    }
}
