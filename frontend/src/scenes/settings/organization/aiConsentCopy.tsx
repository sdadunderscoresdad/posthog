import { Trans } from 'react-i18next'

import { LemonDialog, LemonDialogProps } from '@posthog/lemon-ui'

import { dayjs } from 'lib/dayjs'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'

export function getExternalAIProvidersTooltipTitle(): string {
    return i18n.t('settings.organization.aiConsent.providersTooltip', {
        defaultValue: 'As of {{ date }}: Alphabet, Anthropic, Microsoft, and OpenAI',
        date: dayjs().format('MMMM YYYY'),
    })
}

export function AIHipaaDisclaimer(): JSX.Element {
    return (
        <span className="block">
            {i18n.t('settings.organization.aiConsent.hipaaDisclaimer', {
                defaultValue:
                    'This feature is not HIPAA-compliant and is not intended for the processing of Protected Health Information ("PHI"). Any Business Associate Agreement ("BAA") you may have entered into with PostHog does not apply to this functionality. You are responsible for ensuring your use complies with applicable laws and regulations.',
            })}
        </span>
    )
}

export function aiConsentLegalDialogProps({ onConfirm }: { onConfirm: () => void }): LemonDialogProps {
    return {
        title: i18n.t('settings.organization.aiConsent.legalTitle', { defaultValue: 'The legal bits' }),
        maxWidth: '65ch',
        content: (
            <div className="flex flex-col gap-2">
                <p className="mb-0">
                    <Trans
                        i18nKey="settings.organization.aiConsent.dpaNote"
                        components={{
                            DpaLink: <Link to="https://posthog.com/dpa" target="_blank" />,
                        }}
                        defaults="If your org requires a Data Processing Agreement (DPA) for compliance (and your existing DPA doesn't already cover AI subprocessors), <DpaLink>you can get a fresh DPA here</DpaLink>."
                    />
                </p>
                <AIHipaaDisclaimer />
            </div>
        ),
        primaryButton: {
            children: i18n.t('settings.organization.aiConsent.enable', { defaultValue: 'Enable AI analysis' }),
            'data-attr': 'ai-consent-legal-confirm',
            onClick: onConfirm,
        },
        secondaryButton: {
            children: i18n.t('settings.cancel', { defaultValue: 'Cancel' }),
            'data-attr': 'ai-consent-legal-cancel',
        },
    }
}

export function openAIConsentLegalDialog(args: { onConfirm: () => void }): void {
    LemonDialog.open(aiConsentLegalDialogProps(args))
}
