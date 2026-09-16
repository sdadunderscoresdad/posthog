import { matchSupportedLocale, resolveLocale } from './localeResolution'

describe('locale resolution', () => {
    it.each([
        ['en', 'en'],
        ['en-US', 'en'],
        ['EN-gb', 'en'],
        ['de-DE', 'de-DE'],
        ['de-AT', 'de-DE'],
        ['ja_JP', 'ja-JP'],
        ['pt-PT', 'pt-BR'],
        ['zh-CN', 'zh-CN'],
        ['zh-Hans-CN', 'zh-CN'],
        ['zh-Hant', 'zh-TW'],
        ['zh-Hant-TW', 'zh-TW'],
        ['zh', 'zh-CN'],
        ['zh-HK', 'zh-CN'],
        ['sv-SE', null],
        ['', null],
    ])('matches %s to %s', (tag, expected) => {
        expect(matchSupportedLocale(tag)).toBe(expected)
    })

    it('prefers the account language, because that is the only choice that follows the user between devices', () => {
        expect(
            resolveLocale({
                userPreference: 'ja-JP',
                storedPreference: 'de-DE',
                browserLanguages: ['fr-FR'],
            })
        ).toBe('ja-JP')
    })

    it('falls back to this device when the account has no language', () => {
        expect(
            resolveLocale({
                storedPreference: 'de-DE',
                browserLanguages: ['fr-FR'],
            })
        ).toBe('de-DE')
    })

    it('walks the browser preferences in order and skips languages we do not offer', () => {
        expect(resolveLocale({ browserLanguages: ['sv-SE', 'ko-KR', 'ja-JP'] })).toBe('ko-KR')
    })

    it('ends at English when nothing matches', () => {
        expect(resolveLocale({ userPreference: 'sv-SE', browserLanguages: ['fi-FI'] })).toBe('en')
    })
})
