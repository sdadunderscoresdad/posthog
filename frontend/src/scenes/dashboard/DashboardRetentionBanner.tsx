import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { LemonBanner } from '@posthog/lemon-ui'

import { urls } from 'scenes/urls'

import { dataRetentionBannerLogic } from '../insights/dataRetention/dataRetentionBannerLogic'
import { dashboardLogic } from './dashboardLogic'

export const DashboardRetentionBanner = (): JSX.Element | null => {
    const { t } = useTranslation()
    const { showRetentionBanner, retentionPeriodLabel } = useValues(dashboardLogic)
    const { snooze } = useActions(dataRetentionBannerLogic)

    if (!showRetentionBanner || !retentionPeriodLabel) {
        return null
    }

    return (
        <LemonBanner
            type="warning"
            className="mt-4 mb-2"
            onClose={snooze}
            action={{
                children: t('dashboard.retentionBanner.upgrade', { defaultValue: 'Upgrade plan' }),
                to: urls.organizationBilling(),
            }}
        >
            <Trans i18nKey="dashboard.retentionBanner.message" values={{ retentionPeriodLabel }}>
                Some insights on this dashboard have date ranges that go beyond your {{ retentionPeriodLabel }} data
                retention, so events older than that aren't included.
            </Trans>
        </LemonBanner>
    )
}
