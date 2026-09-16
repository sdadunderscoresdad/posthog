import { useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { CodeSnippet } from 'lib/components/CodeSnippet'
import { i18n } from 'lib/i18n/i18n'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

export function IPAllowListInfo(): JSX.Element {
    const { t } = useTranslation()
    const { preflight } = useValues(preflightLogic)

    if (!preflight?.public_egress_ip_addresses?.length) {
        return <div>{t('settings.environment.ipAllowList.notSupported', { defaultValue: 'Not supported' })}</div>
    }
    return (
        <>
            <p>
                {t('settings.environment.ipAllowList.description', {
                    defaultValue:
                        'Whenever PostHog makes a call to an external service it will come from one of our static IP addresses. If you need to explicitly allowlist these IPs, you can do so by adding them to your firewall rules. This applies to all integrations such as webhooks, apps or batch exports.',
                })}
            </p>

            <CodeSnippet
                thing={i18n.t('settings.environment.ipAllowlist.snippetLabel', {
                    defaultValue: 'IP addresses allowlisting',
                })}
            >
                {preflight.public_egress_ip_addresses.join(' \n')}
            </CodeSnippet>
        </>
    )
}
