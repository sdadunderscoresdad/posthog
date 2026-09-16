import { createLocaleFormatters } from './formatters'

describe('locale formatters', () => {
    const english = createLocaleFormatters('en')
    const german = createLocaleFormatters('de-DE')
    const chinese = createLocaleFormatters('zh-CN')

    describe('numbers', () => {
        it('groups digits and closes decimals the way the language does', () => {
            expect(english.number(1234.5)).toBe('1,234.5')
            expect(german.number(1234.5)).toBe('1.234,5')
        })

        it('puts the currency symbol where the language puts it', () => {
            expect(english.currency(1234.5, 'USD')).toBe('$1,234.50')
            expect(german.currency(1234.5, 'USD')).toBe('1.234,50\u00a0$')
        })

        it('abbreviates large numbers with the words the language uses', () => {
            expect(english.compactNumber(1_200_000)).toBe('1.2M')
            expect(german.compactNumber(1_200_000)).toBe('1,2\u00a0Mio.')
        })

        it('reads its argument as a fraction, so 0.256 is 26%', () => {
            expect(english.percent(0.256)).toBe('26%')
        })
    })

    describe('durations', () => {
        it('names each unit the way the language does', () => {
            expect(english.durationSeconds(90)).toBe('1m 30s')
            expect(chinese.durationSeconds(90)).toBe('1分钟 30秒')
            expect(english.durationSeconds(86_400 + 3_600 * 10 + 60 * 9 + 8)).toBe('1d 10h')
        })

        it('caps how many units a long duration renders', () => {
            expect(english.durationSeconds(3_661, { maximumUnits: 4 })).toBe('1h 1m 1s')
            expect(english.durationSeconds(3_661, { maximumUnits: 2 })).toBe('1h 1m')
        })

        it('keeps the fraction the units cannot express, and drops what the cap cuts off', () => {
            expect(english.durationMilliseconds(3.5)).toBe('3.5ms')
            expect(english.durationMilliseconds(1_500)).toBe('1s 500ms')
            expect(english.durationMilliseconds(1_500, { maximumUnits: 1 })).toBe('1s')
        })

        it('renders zero and negative spans', () => {
            expect(english.durationSeconds(0)).toBe('0s')
            expect(english.durationSeconds(-90)).toBe('-1m 30s')
        })
    })

    describe('dates and lists', () => {
        it('joins a list with the language conjunction', () => {
            expect(english.list(['a', 'b', 'c'])).toBe('a, b, and c')
            expect(chinese.list(['a', 'b', 'c'])).toBe('a、b和c')
        })

        it('counts backwards in time in the language', () => {
            expect(english.relativeTime(-3, 'minute')).toBe('3 minutes ago')
            expect(chinese.relativeTime(-3, 'minute')).toBe('3分钟前')
        })

        it('picks the largest unit that still reads as a number', () => {
            jest.useFakeTimers()
            jest.setSystemTime(new Date('2026-01-15T12:00:00Z'))
            try {
                const minuteAgo = new Date('2026-01-15T11:59:00Z')
                const dayAgo = new Date('2026-01-14T12:00:00Z')
                const inThreeHours = new Date('2026-01-15T15:00:00Z')

                expect(english.relativeTimeFromNow(minuteAgo)).toBe('1 minute ago')
                expect(english.relativeTimeFromNow(dayAgo)).toBe('yesterday')
                expect(english.relativeTimeFromNow(inThreeHours)).toBe('in 3 hours')
                expect(chinese.relativeTimeFromNow(minuteAgo)).toBe('1分钟前')
            } finally {
                jest.useRealTimers()
            }
        })

        it('formats a timestamp in the language rather than in a fixed locale', () => {
            const timestamp = Date.UTC(2026, 0, 15, 12, 30)
            expect(english.date(timestamp, { timeZone: 'UTC' })).toBe('Jan 15, 2026')
            expect(german.date(timestamp, { timeZone: 'UTC' })).toBe('15.01.2026')
        })
    })

    describe('plurals', () => {
        it('reports the plural category, which is what selects a translated form', () => {
            expect(english.pluralRule(1)).toBe('one')
            expect(english.pluralRule(2)).toBe('other')
            expect(chinese.pluralRule(1)).toBe('other')
        })
    })
})
