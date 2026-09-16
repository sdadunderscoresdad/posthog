import './i18n'
import '@testing-library/jest-dom'

import { act, render } from '@testing-library/react'
import { Trans } from 'react-i18next'

import { i18n, setLocale } from './i18n'

describe('Trans component mapping', () => {
    afterEach(async () => {
        await setLocale('en')
    })

    it('maps a numbered tag in a catalog back to the element inline in the children', async () => {
        i18n.addResourceBundle(
            'de-DE',
            'common',
            { 'transMapping.inline': 'Stream mit <1>posthog-live</1>. <3>Mehr erfahren</3>' },
            true,
            true
        )
        await act(async () => {
            await setLocale('de-DE')
        })

        const { container } = render(
            <Trans i18nKey="transMapping.inline">
                Stream with <code>posthog-live</code>. <strong>Learn more</strong>
            </Trans>
        )

        expect(container.querySelector('code')).toHaveTextContent('posthog-live')
        expect(container.querySelector('strong')).toHaveTextContent('Mehr erfahren')
        expect(container).toHaveTextContent('Stream mit posthog-live. Mehr erfahren')
    })

    it('maps a named tag in a defaults string to the matching component', async () => {
        i18n.addResourceBundle(
            'ja-JP',
            'common',
            { 'transMapping.slot': '<BotCount>{{ n }}</BotCount> 件のボットイベント' },
            true,
            true
        )
        await act(async () => {
            await setLocale('ja-JP')
        })

        const { container } = render(
            <Trans
                i18nKey="transMapping.slot"
                values={{ n: 5 }}
                components={{ BotCount: <span className="emphasised" /> }}
                defaults="<BotCount>{{ n }}</BotCount> bot events"
            />
        )

        expect(container.querySelector('span.emphasised')).toHaveTextContent('5')
        expect(container).toHaveTextContent('件のボットイベント')
    })
})
