import { Trans } from 'react-i18next'

import { LemonBanner, Link } from '@posthog/lemon-ui'

import { urls } from 'scenes/urls'

export function ErrorTrackingConfigurationMovedBanner(): JSX.Element {
    return (
        <LemonBanner type="info">
            <p>
                <Trans
                    i18nKey="settings.environment.errorTrackingConfigurationMoved.message"
                    components={{
                        Strong: <strong />,
                        ConfigLink: <Link to={urls.errorTrackingConfiguration()} />,
                    }}
                    defaults="<Strong>Error tracking configuration has moved.</Strong> Configurations for alerting, suppression rules, spike detection, assignment rules, grouping rules, symbol sets, and releases are now on the <ConfigLink>Error tracking configuration</ConfigLink> page."
                />
            </p>
            <p>
                <Trans
                    i18nKey="settings.environment.errorTrackingConfigurationMoved.whereToFind"
                    components={{ Strong: <strong /> }}
                    defaults="You can get there via the sidebar: <Strong>Error tracking &rarr; Configuration</Strong>."
                />
            </p>
        </LemonBanner>
    )
}
