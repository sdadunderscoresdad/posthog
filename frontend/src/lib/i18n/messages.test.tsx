// Registers the app's i18next instance with react-i18next, which `Trans` looks up by default.
import './i18n'
import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import { Trans } from 'react-i18next'

describe('message rendering', () => {
    it('renders a sentence that mixes text, a placeholder, and markup as one message', () => {
        const count = 3

        render(
            <Trans i18nKey="insights.eventLimit" count={count}>
                Your project has used {{ count }} of its events. <strong>Upgrade</strong> to keep them.
            </Trans>
        )

        expect(screen.getByText(/used 3 of its events/)).toBeInTheDocument()
        expect(screen.getByText('Upgrade').tagName).toBe('STRONG')
    })
})
