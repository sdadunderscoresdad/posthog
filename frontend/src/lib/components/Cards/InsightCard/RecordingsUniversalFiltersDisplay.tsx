import React from 'react'

import { IconClock, IconFilter, IconList, IconSort } from '@posthog/icons'

import { i18n } from 'lib/i18n/i18n'
import { LemonTag } from 'lib/lemon-ui/LemonTag/LemonTag'
import { humanFriendlyDurationFilter } from 'scenes/session-recordings/filters/DurationFilter'

import { DurationType, RecordingUniversalFilters } from '~/types'

import { CompactUniversalFiltersDisplay } from './CompactUniversalFiltersDisplay'
import { DateRangeSummary, InsightDetailSectionDisplay } from './InsightDetails'

function DurationSummary({ filters }: { filters: RecordingUniversalFilters }): JSX.Element | null {
    if (!filters.duration || filters.duration.length === 0) {
        return null
    }

    return (
        <InsightDetailSectionDisplay
            icon={<IconClock />}
            label={i18n.t('insightFilters.duration', { defaultValue: 'Duration' })}
        >
            {filters.duration.map((durationFilter, index) => (
                <React.Fragment key={index}>
                    <span className="font-medium">
                        {humanFriendlyDurationFilter(durationFilter, durationFilter.key as DurationType)}
                    </span>
                    {index < filters.duration.length - 1 &&
                        ` ${i18n.t('insightFilters.and', { defaultValue: 'and' })} `}
                </React.Fragment>
            ))}
        </InsightDetailSectionDisplay>
    )
}

function FiltersSummary({ filters }: { filters: RecordingUniversalFilters }): JSX.Element | null {
    const hasFilters = !!filters.filter_group?.values?.length

    if (!hasFilters && !filters.filter_test_accounts) {
        return null
    }

    return (
        <InsightDetailSectionDisplay
            icon={<IconFilter />}
            label={i18n.t('insightDetails.filters', { defaultValue: 'Filters' })}
        >
            <CompactUniversalFiltersDisplay groupFilter={filters.filter_group} />
            {filters.filter_test_accounts && (
                <div>
                    <LemonTag size="small">
                        {i18n.t('insightFilters.testAccountsExcluded', { defaultValue: 'Test accounts excluded' })}
                    </LemonTag>
                </div>
            )}
        </InsightDetailSectionDisplay>
    )
}

/** Built per language, because labels resolved at import would keep the language the app started in. */
function orderableFieldLabels(): Record<string, string> {
    return {
        start_time: i18n.t('insightFilters.startTime', { defaultValue: 'Start time' }),
        console_error_count: i18n.t('insightFilters.consoleErrors', { defaultValue: 'Console errors' }),
        click_count: i18n.t('insightFilters.clicks', { defaultValue: 'Clicks' }),
        keypress_count: i18n.t('insightFilters.keyPresses', { defaultValue: 'Key presses' }),
        mouse_activity_count: i18n.t('insightFilters.mouseActivity', { defaultValue: 'Mouse activity' }),
        activity_score: i18n.t('insightFilters.activityScore', { defaultValue: 'Activity score' }),
        recording_ttl: i18n.t('insightFilters.recordingTtl', { defaultValue: 'Recording TTL' }),
    }
}

function OrderingSummary({ filters }: { filters: RecordingUniversalFilters }): JSX.Element | null {
    if (!filters.order && !filters.order_direction) {
        return null
    }

    const labels = orderableFieldLabels()
    const orderLabel = filters.order
        ? labels[filters.order] || filters.order
        : i18n.t('insightFilters.startTime', { defaultValue: 'Start time' })
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

function LimitSummary({ filters }: { filters: RecordingUniversalFilters }): JSX.Element | null {
    if (!filters.limit) {
        return null
    }

    return (
        <InsightDetailSectionDisplay
            icon={<IconList />}
            label={i18n.t('insightFilters.limit', { defaultValue: 'Limit' })}
        >
            <div className="font-medium">
                {i18n.t('insightFilters.recordingsCount', {
                    count: filters.limit,
                    defaultValue_one: '{{ count }} recording',
                    defaultValue_other: '{{ count }} recordings',
                })}
            </div>
        </InsightDetailSectionDisplay>
    )
}

export function RecordingsUniversalFiltersDisplay({
    filters,
    className,
}: {
    filters: RecordingUniversalFilters
    className?: string
}): JSX.Element {
    return (
        <div className={className ?? 'p-2 space-y-1.5'}>
            <DateRangeSummary dateFrom={filters.date_from} dateTo={filters.date_to} />
            <DurationSummary filters={filters} />
            <FiltersSummary filters={filters} />
            <OrderingSummary filters={filters} />
            <LimitSummary filters={filters} />
        </div>
    )
}
