import { useValues } from 'kea'
import { Fragment } from 'react'

import { i18n } from 'lib/i18n/i18n'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

import { queryScanDashboardEntries } from '~/queries/nodes/DataNode/queryScan'

import { dashboardLogic } from './dashboardLogic'

export function DashboardQueryScanBanner(): JSX.Element | null {
    const { dashboard, insightTiles, canEditDashboard } = useValues(dashboardLogic)
    if (!dashboard || !canEditDashboard) {
        return null
    }

    const entries = queryScanDashboardEntries(insightTiles)
    if (entries.length === 0) {
        return null
    }

    const single = entries.length === 1
    return (
        <LemonBanner type="warning" className="mt-4 mb-2">
            {single
                ? i18n.t('dashboard.queryScan.single', {
                      defaultValue:
                          '1 insight on this dashboard reads a large number of events, which can slow down dashboard loads: ',
                  })
                : i18n.t('dashboard.queryScan.multiple', {
                      defaultValue:
                          '{{ count }} insights on this dashboard read a large number of events, which can slow down dashboard loads: ',
                      count: entries.length,
                  })}
            {entries.map((entry, index) => (
                <Fragment key={entry.tileId}>
                    {index > 0 ? ', ' : ''}
                    <Link to={urls.insightView(entry.shortId)}>{entry.name}</Link>
                </Fragment>
            ))}
            {single
                ? i18n.t('dashboard.queryScan.singleAdvice', { defaultValue: '. Open it to see the advice.' })
                : i18n.t('dashboard.queryScan.multipleAdvice', {
                      defaultValue: '. Open an insight to see the advice.',
                  })}
        </LemonBanner>
    )
}
