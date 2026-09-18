import { useActions, useValues } from 'kea'
import { useEffect, useMemo } from 'react'

import { IconExternal } from '@posthog/icons'

import { i18n } from 'lib/i18n/i18n'
import { LemonSelect } from 'lib/lemon-ui/LemonSelect'
import { urls } from 'scenes/urls'

import type { DateRange, LogMessage } from '~/queries/schema/schema-general'

import { ServiceFilter } from 'products/logs/frontend/components/LogsViewer/Filters/ServiceFilter'
import { SeverityLevelsFilter } from 'products/logs/frontend/components/LogsViewer/Filters/SeverityLevelsFilter'

import type { WidgetDateFromValue } from '../../widget_types/widgetConfigShared'
import type { DashboardWidgetTileFiltersProps } from '../registry'
import { useWidgetTileConfigPersist } from '../widgetTileFiltersHooks'
import { WidgetTileFilterReadOnlyValue, WidgetTileFiltersBar } from '../widgetTileFiltersReadOnly'
import {
    LOGS_DEFAULT_DATE_FROM,
    parseLogsWidgetConfig,
    patchLogsWidgetFilterFields,
    type LogsOrderByValue,
    type LogsSeverityLevel,
} from './logsWidgetConfigValidation'
import { logsWidgetSavedViewsLogic } from './logsWidgetSavedViewsLogic'

export type LogsWidgetTileFiltersProps = DashboardWidgetTileFiltersProps

const ALL_SEVERITY_LEVELS = 6

const CREATE_SAVED_VIEW_VALUE = '__create_saved_view__'

function getSortOptions(): { value: LogsOrderByValue; label: string }[] {
    return [
        {
            value: 'latest',
            label: i18n.t('dashboardWidgets.tileFilters.newestFirst', { defaultValue: 'Newest first' }),
        },
        {
            value: 'earliest',
            label: i18n.t('dashboardWidgets.tileFilters.oldestFirst', { defaultValue: 'Oldest first' }),
        },
    ]
}

function getNoSavedViewOption(): { value: string | null; label: string } {
    return {
        value: null,
        label: i18n.t('dashboardWidgets.tileFilters.noSavedView', { defaultValue: 'No saved view' }),
    }
}

function severityReadOnlyLabel(levels: LogsSeverityLevel[]): string {
    if (levels.length === 0 || levels.length === ALL_SEVERITY_LEVELS) {
        return i18n.t('dashboardWidgets.tileFilters.allLevels', { defaultValue: 'All levels' })
    }
    return levels.join(', ')
}

function servicesReadOnlyLabel(services: string[]): string {
    if (services.length === 0) {
        return i18n.t('dashboardWidgets.tileFilters.allServices', { defaultValue: 'All services' })
    }
    if (services.length === 1) {
        return services[0]
    }
    return i18n.t('dashboardWidgets.tileFilters.serviceCount', {
        count: services.length,
        defaultValue_one: '{{ count }} service',
        defaultValue_other: '{{ count }} services',
    })
}

export function LogsWidgetTileFilters({
    config,
    onUpdateConfig,
    disabledReason,
}: LogsWidgetTileFiltersProps): JSX.Element {
    const parsed = parseLogsWidgetConfig(config)
    const severityLevels = (parsed.severityLevels ?? []) as LogsSeverityLevel[]
    const serviceNames = parsed.serviceNames ?? []
    const orderBy = (parsed.orderBy ?? 'latest') as LogsOrderByValue
    const dateFrom = (parsed.dateRange?.date_from ?? LOGS_DEFAULT_DATE_FROM) as WidgetDateFromValue
    const savedViewId = parsed.savedViewId ?? null
    const hasSavedView = !!savedViewId

    const { savedViewOptions, savedViewsLoading, savedViewLabelById } = useValues(logsWidgetSavedViewsLogic)
    const { ensureSavedViewsLoaded } = useActions(logsWidgetSavedViewsLogic)

    useEffect(() => {
        ensureSavedViewsLoaded()
    }, [ensureSavedViewsLoaded])

    const savedViewSelectOptions = useMemo(
        () => [
            getNoSavedViewOption(),
            ...savedViewOptions,
            {
                value: CREATE_SAVED_VIEW_VALUE,
                label: i18n.t('dashboardWidgets.tileFilters.createSavedView', {
                    defaultValue: 'Create a saved view',
                }),
                sideIcon: <IconExternal className="size-3.5" />,
            },
        ],
        [savedViewOptions]
    )
    const savedViewLabel = savedViewId ? (savedViewLabelById[savedViewId] ?? savedViewId) : savedViewId

    const { getLatestConfig, persistConfigNow } = useWidgetTileConfigPersist(onUpdateConfig, config)

    // Severity and service pickers can't render a disabled state, so when editing is unavailable
    // (view-only dashboard, or no edit permission) show the read-only summary instead of dead controls.
    const canUpdate = !!onUpdateConfig && !disabledReason

    const applyPatch = async (patch: {
        severityLevels?: LogsSeverityLevel[]
        serviceNames?: string[]
        orderBy?: LogsOrderByValue
        savedViewId?: string | null
    }): Promise<void> => {
        const nextConfig = patchLogsWidgetFilterFields(getLatestConfig(), patch)
        await persistConfigNow(nextConfig)
    }

    const applySavedView = async (value: string | null): Promise<void> => {
        // The "create" item is a navigation shortcut, not a persisted value.
        if (value === CREATE_SAVED_VIEW_VALUE) {
            window.open(urls.logs(), '_blank', 'noopener,noreferrer')
            return
        }
        await applyPatch({ savedViewId: value })
    }

    if (!canUpdate) {
        return (
            <WidgetTileFiltersBar dataAttr="logs-widget-tile-filters-readonly">
                {hasSavedView ? (
                    <WidgetTileFilterReadOnlyValue>
                        <span className="text-secondary">
                            {i18n.t('dashboardWidgets.tileFilters.savedViewLabel', { defaultValue: 'Saved view:' })}
                        </span>{' '}
                        {savedViewLabel}
                    </WidgetTileFilterReadOnlyValue>
                ) : (
                    <>
                        <WidgetTileFilterReadOnlyValue>
                            <span className="text-secondary">
                                {i18n.t('dashboardWidgets.tileFilters.levelsLabel', { defaultValue: 'Levels:' })}
                            </span>{' '}
                            {severityReadOnlyLabel(severityLevels)}
                        </WidgetTileFilterReadOnlyValue>
                        <WidgetTileFilterReadOnlyValue>
                            <span className="text-secondary">
                                {i18n.t('dashboardWidgets.tileFilters.servicesLabel', { defaultValue: 'Services:' })}
                            </span>{' '}
                            {servicesReadOnlyLabel(serviceNames)}
                        </WidgetTileFilterReadOnlyValue>
                    </>
                )}
                <WidgetTileFilterReadOnlyValue>
                    {getSortOptions().find((option) => option.value === orderBy)?.label ?? orderBy}
                </WidgetTileFilterReadOnlyValue>
            </WidgetTileFiltersBar>
        )
    }

    const serviceDateRange: DateRange = { date_from: dateFrom, date_to: null }

    return (
        <WidgetTileFiltersBar dataAttr="logs-widget-tile-filters">
            <LemonSelect
                size="small"
                value={savedViewId}
                loading={savedViewsLoading}
                options={savedViewSelectOptions}
                placeholder={i18n.t('dashboardWidgets.tileFilters.savedViewPlaceholder', {
                    defaultValue: 'Saved view',
                })}
                onChange={(value) => void applySavedView(value ?? null)}
            />
            {!hasSavedView ? (
                <>
                    <SeverityLevelsFilter
                        value={severityLevels as LogMessage['severity_text'][]}
                        onChange={(levels) => void applyPatch({ severityLevels: levels as LogsSeverityLevel[] })}
                    />
                    <ServiceFilter
                        value={serviceNames}
                        dateRange={serviceDateRange}
                        onChange={(services) => void applyPatch({ serviceNames: services ?? [] })}
                    />
                </>
            ) : null}
            <LemonSelect
                size="small"
                value={orderBy}
                options={getSortOptions()}
                onChange={(value) => {
                    if (value) {
                        void applyPatch({ orderBy: value })
                    }
                }}
            />
        </WidgetTileFiltersBar>
    )
}
