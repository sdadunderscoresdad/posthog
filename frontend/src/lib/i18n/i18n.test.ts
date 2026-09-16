import { ensureLocaleCatalogs, getActiveLocale, i18n, setLocale } from './i18n'

describe('i18n runtime', () => {
    afterEach(async () => {
        await setLocale('en')
    })

    it('starts initialized, so that the first render already knows its language', () => {
        expect(i18n.isInitialized).toBe(true)
        expect(getActiveLocale()).toBe('en')
    })

    it('renders the English text at the call site when a message has no translation', () => {
        expect(i18n.t('dashboard.delete', { defaultValue: 'Delete dashboard' })).toBe('Delete dashboard')
    })

    it('returns the key when a message carries no English text, which surfaces the omission', () => {
        expect(i18n.t('dashboard.forgotten')).toBe('dashboard.forgotten')
    })

    it('never fetches a catalog for the source language, which carries its messages inline', () => {
        expect(ensureLocaleCatalogs('en')).toBeNull()
    })

    it('reads a catalog through the generated loader map, then reports it as loaded', async () => {
        const pending = ensureLocaleCatalogs('zh-CN')
        expect(pending).not.toBeNull()
        await pending
        expect(ensureLocaleCatalogs('zh-CN')).toBeNull()
    })

    it('translates a message once its language catalog is loaded, and falls back for a missing key', async () => {
        await setLocale('zh-CN')

        expect(i18n.t('activity.tabs.events', { defaultValue: 'Events' })).toBe('事件')
        expect(i18n.t('activity.tabs.notTranslatedYet', { defaultValue: 'Still English' })).toBe('Still English')
    })

    it('falls back to the English text for a message the language has not translated yet', async () => {
        i18n.addResourceBundle('ko-KR', 'common', { untranslated: '' }, true, true)
        await setLocale('ko-KR')

        expect(i18n.t('untranslated', { defaultValue: 'Not translated yet' })).toBe('Not translated yet')
    })

    it('selects the plural form each language requires rather than one form for every count', async () => {
        i18n.addResourceBundle(
            'ru-RU',
            'common',
            {
                items_one: '{{count}} товар',
                items_few: '{{count}} товара',
                items_many: '{{count}} товаров',
                items_other: '{{count}} товара',
            },
            true,
            true
        )
        await setLocale('ru-RU')

        expect(i18n.t('items', { count: 1 })).toBe('1 товар')
        expect(i18n.t('items', { count: 3 })).toBe('3 товара')
        expect(i18n.t('items', { count: 5 })).toBe('5 товаров')
    })
})
