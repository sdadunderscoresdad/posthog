import './ProjectHomepage.scss'

import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { CompactList } from 'lib/components/CompactList/CompactList'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { useFormatters } from 'lib/i18n/useFormatters'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { InsightIcon } from 'scenes/saved-insights/SavedInsights'
import { urls } from 'scenes/urls'

import { QueryBasedInsightModel } from '~/types'

import { ProjectHomePageCompactListItem } from './ProjectHomePageCompactListItem'
import { projectHomepageLogic } from './projectHomepageLogic'

interface InsightRowProps {
    insight: QueryBasedInsightModel
    dataAttr?: string
    /** When true, text wraps instead of truncating and the row height grows to fit. */
    allowWrap?: boolean
}

export function InsightRow({ insight, dataAttr, allowWrap }: InsightRowProps): JSX.Element {
    const { t } = useTranslation()
    const { relativeTimeFromNow } = useFormatters()
    const { reportInsightOpenedFromRecentInsightList } = useActions(eventUsageLogic)

    return (
        <ProjectHomePageCompactListItem
            title={
                insight.name ||
                insight.derived_name ||
                t('homepage.recentInsights.untitled', { defaultValue: 'Insight' })
            }
            subtitle={t('homepage.recentInsights.lastModified', {
                defaultValue: 'Last modified {{ time }}',
                time: relativeTimeFromNow(insight.last_modified_at),
            })}
            prefix={<InsightIcon insight={insight} />}
            to={urls.insightView(insight.short_id)}
            onClick={() => {
                reportInsightOpenedFromRecentInsightList()
            }}
            dataAttr={dataAttr}
            allowWrap={allowWrap}
        />
    )
}

export function RecentInsights(): JSX.Element {
    const { t } = useTranslation()
    const { recentInsights, recentInsightsLoading } = useValues(projectHomepageLogic)
    const { loadRecentInsights } = useActions(projectHomepageLogic)
    useOnMountEffect(loadRecentInsights)

    return (
        <>
            <CompactList
                title={t('homepage.recentInsights.title', { defaultValue: 'Your recently viewed insights' })}
                viewAllURL={urls.savedInsights()}
                loading={recentInsightsLoading}
                emptyMessage={{
                    title: t('homepage.recentInsights.emptyTitle', {
                        defaultValue: 'You have no recently viewed insights',
                    }),
                    description: t('homepage.recentInsights.emptyDescription', {
                        defaultValue: "Explore this project's insights by clicking below.",
                    }),
                    buttonText: t('homepage.recentInsights.emptyButton', { defaultValue: 'View insights' }),
                    buttonTo: urls.savedInsights(),
                }}
                items={recentInsights.slice(0, 5)}
                renderRow={(insight: QueryBasedInsightModel, index) => (
                    <InsightRow key={index} insight={insight} dataAttr="recent-insight-item" />
                )}
            />
        </>
    )
}
