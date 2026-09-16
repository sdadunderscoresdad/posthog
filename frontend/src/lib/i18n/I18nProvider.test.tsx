import '@testing-library/jest-dom'

import { act, render, screen } from '@testing-library/react'

import { setLocale } from './i18n'
import { I18nProvider } from './I18nProvider'

describe('I18nProvider', () => {
    afterEach(async () => {
        await setLocale('en')
        document.documentElement.removeAttribute('lang')
        document.documentElement.removeAttribute('dir')
    })

    it('renders children for the source language and describes the document language', () => {
        render(
            <I18nProvider>
                <span>Ready</span>
            </I18nProvider>
        )

        expect(screen.getByText('Ready')).toBeInTheDocument()
        expect(document.documentElement.lang).toBe('en')
        expect(document.documentElement.dir).toBe('ltr')
    })

    it('follows the document language when the app switches language', async () => {
        render(
            <I18nProvider>
                <span>Ready</span>
            </I18nProvider>
        )

        await act(async () => {
            await setLocale('zh-TW')
        })

        expect(document.documentElement.lang).toBe('zh-TW')
    })
})
