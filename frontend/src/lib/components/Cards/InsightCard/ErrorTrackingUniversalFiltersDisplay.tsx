import { IconFilter, IconList, IconSort } from '@posthog/icons'

import { i18n } from 'lib/i18n/i18n'
import { LemonTag } from 'lib/lemon-ui/LemonTag/LemonTag'

import { MaxErrorTrackingSearchResponse } from '~/queries/schema/schema-assistant-error-tracking'

import { DateRangeSummary, InsightDetailSectionDisplay } from './InsightDetails'

/** Built per language, because labels resolved at import would keep the language the app started in. */
function orderableFieldLabels(): Record<string, string> {
    return {
        last_seen: i18n.t('insightFilters.lastSeen', { defaultValue: 'Last seen' }),
        first_seen: i18n.t('insightFilters.firstSeen', { defaultValue: 'First seen' }),
        occurrences: i18n.t('insightFilters.occurrences', { defaultValue: 'Occurrences' }),
        users: i18n.t('insightFilters.users', { defaultValue: 'Users' }),
        sessions: i18n.t('insightFilters.sessions', { defaultValue: 'Sessions' }),
        revenue: i18n.t('insightFilters.revenue', { defaultValue: 'Revenue' }),
    }
}

function StatusSummary({ filters }: { filters: MaxErrorTrackingSearchResponse }): JSX.Element | null {
    if (!filters.status) {
        return null
    }

    const statusLabel =
        filters.status === 'all'
            ? i18n.t('insightFilters.allStatuses', { defaultValue: 'All statuses' })
            : filters.status

    return (
        <InsightDetailSectionDisplay
            icon={<IconFilter />}
            label={i18n.t('insightFilters.status', { defaultValue: 'Status' })}
        >
            <div className="font-medium capitalize">{statusLabel}</div>
        </InsightDetailSectionDisplay>
    )
}

function SearchQuerySummary({ filters }: { filters: MaxErrorTrackingSearchResponse }): JSX.Element | null {
    if (!filters.search_query) {
        return null
    }

    return (
        <InsightDetailSectionDisplay
            icon={<IconFilter />}
            label={i18n.t('insightFilters.search', { defaultValue: 'Search' })}
        >
            <div className="font-medium">"{filters.search_query}"</div>
        </InsightDetailSectionDisplay>
    )
}

function OrderingSummary({ filters }: { filters: MaxErrorTrackingSearchResponse }): JSX.Element | null {
    if (!filters.order_by) {
        return null
    }

    const orderLabel = orderableFieldLabels()[filters.order_by] || filters.order_by
    const direction =
        filters.order_direction === 'ASC'
            ? i18n.t('insightFilters.ascending', { defaultValue: 'ascending' })
            : i18n.t('insightFilters.descending', { defaultValue: 'descending' })

    return (
        <InsightDetailSectionDisplay
            icon={<IconSort />}
            label={i18n.t('insightFilters.sortOrder', { defaultValue: 'Sort order' })}
        >
            <div className="font-medium">
                {orderLabel} ({direction})
            </div>
        </InsightDetailSectionDisplay>
    )
}

function LimitSummary({ filters }: { filters: MaxErrorTrackingSearchResponse }): JSX.Element | null {
    if (!filters.limit) {
        return null
    }

    return (
        <InsightDetailSectionDisplay
            icon={<IconList />}
            label={i18n.t('insightFilters.limit', { defaultValue: 'Limit' })}
        >
            <div className="font-medium">
                {i18n.t('insightFilters.issueCount', {
                    count: filters.limit,
                    defaultValue_one: '{{ count }} issue',
                    defaultValue_other: '{{ count }} issues',
                })}
            </div>
        </InsightDetailSectionDisplay>
    )
}

function IssueCountSummary({ filters }: { filters: MaxErrorTrackingSearchResponse }): JSX.Element | null {
    const issueCount = filters.issues?.length ?? 0
    if (issueCount === 0) {
        return null
    }

    return (
        <div className="flex items-center gap-2">
            <LemonTag size="small" type="highlight">
                {i18n.t('insightFilters.issuesFound', {
                    count: issueCount,
                    defaultValue_one: '{{ count }} issue found',
                    defaultValue_other: '{{ count }} issues found',
                })}
                {filters.has_more &&
                    ` ${i18n.t('insightFilters.moreIssuesAvailable', { defaultValue: '(more available)' })}`}
            </LemonTag>
        </div>
    )
}

export function ErrorTrackingUniversalFiltersDisplay({
    filters,
    className,
}: {
    filters: MaxErrorTrackingSearchResponse
    className?: string
}): JSX.Element {
    return (
        <div className={className ?? 'p-2 space-y-1.5'}>
            <DateRangeSummary dateFrom={filters.date_from} dateTo={filters.date_to} />
            <StatusSummary filters={filters} />
            <SearchQuerySummary filters={filters} />
            <OrderingSummary filters={filters} />
            <LimitSummary filters={filters} />
            <IssueCountSummary filters={filters} />
        </div>
    )
}
