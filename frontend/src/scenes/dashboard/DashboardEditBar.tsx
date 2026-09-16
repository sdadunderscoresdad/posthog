import clsx from 'clsx'
import { BindLogic, useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconCalendar } from '@posthog/icons'
import { LemonSelect } from '@posthog/lemon-ui'

import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { Shortcut } from 'lib/components/Shortcuts/Shortcut'
import { keyBinds } from 'lib/components/Shortcuts/shortcuts'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { i18n } from 'lib/i18n/i18n'
import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import { getProjectEventExistence } from 'lib/utils/getAppContext'
import { DashboardEditBarAdvancedFilters } from 'scenes/dashboard/DashboardEditBarAdvancedFilters'
import { dashboardLogic } from 'scenes/dashboard/dashboardLogic'
import { TaxonomicBreakdownFilter } from 'scenes/insights/filters/BreakdownFilter/TaxonomicBreakdownFilter'
import { insightLogic } from 'scenes/insights/insightLogic'
import { Scene } from 'scenes/sceneTypes'

import { groupsModel } from '~/models/groupsModel'
import { VariablesForDashboard } from '~/queries/nodes/DataVisualization/Components/Variables/Variables'
import { BreakdownFilter, NodeKind } from '~/queries/schema/schema-general'
import { InsightLogicProps, IntervalType } from '~/types'

interface DashboardEditBarProps {
    showDateFilter?: boolean
    className?: string
}

export function DashboardIntervalFilter(): JSX.Element {
    const { t } = useTranslation()
    const { dashboardEditing, effectiveEditBarFilters } = useValues(dashboardLogic)
    const { setInterval, setDashboardEditing } = useActions(dashboardLogic)

    return (
        <span className="flex items-center gap-2">
            <span className="hidden md:inline">{t('dashboard.editBar.groupedBy', { defaultValue: 'grouped by' })}</span>
            <LemonSelect<IntervalType | null>
                size="small"
                value={effectiveEditBarFilters.interval ?? null}
                dropdownMatchSelectWidth={false}
                onChange={(interval) => {
                    if (!dashboardEditing?.filters) {
                        setDashboardEditing({ filters: true, layout: false }, DashboardEventSource.DashboardFilters)
                    }
                    setInterval(interval)
                }}
                options={[
                    {
                        value: null,
                        label: i18n.t('dashboard.editBar.eachInsightInterval', {
                            defaultValue: "each insight's interval",
                        }),
                    },
                    { value: 'hour', label: i18n.t('interval.hour', { defaultValue: 'hour' }) },
                    { value: 'day', label: i18n.t('interval.day', { defaultValue: 'day' }) },
                    { value: 'week', label: i18n.t('interval.week', { defaultValue: 'week' }) },
                    { value: 'month', label: i18n.t('interval.month', { defaultValue: 'month' }) },
                ]}
            />
        </span>
    )
}

export function DashboardEditBar({ showDateFilter = true, className }: DashboardEditBarProps): JSX.Element {
    const { dashboard, dashboardEditing, hasVariables, effectiveEditBarFilters } = useValues(dashboardLogic)
    const { setDates, setProperties, setBreakdownFilter, setDashboardEditing } = useActions(dashboardLogic)
    const { groupsTaxonomicTypes } = useValues(groupsModel)

    const { hasPageview, hasScreen } = getProjectEventExistence()

    const insightProps: InsightLogicProps = {
        dashboardItemId: 'new',
        dashboardId: dashboard?.id,
        cachedInsight: null,
        query: {
            kind: NodeKind.InsightVizNode,
            source: {
                kind: NodeKind.TrendsQuery,
                series: [],
            },
        },
    }

    return (
        <div
            className={
                className ??
                clsx(
                    'flex gap-2 items-end flex-wrap border',
                    dashboardEditing?.filters
                        ? '-m-1.5 p-1.5 border-primary border-dashed rounded-lg'
                        : 'border-transparent'
                )
            }
        >
            {showDateFilter && (
                <div className={clsx('content-end min-w-0', { 'h-[61px]': hasVariables })}>
                    <Shortcut
                        name="DashboardDateFilter"
                        keybind={[keyBinds.dateFilter]}
                        intent={i18n.t('dashboard.editBar.dateFilter', { defaultValue: 'Date filter' })}
                        interaction="click"
                        scope={Scene.Dashboard}
                    >
                        <DateFilter
                            showCustom
                            showExplicitDateToggle
                            allowTimePrecision
                            allowFixedRangeWithTime
                            dateFrom={effectiveEditBarFilters.date_from}
                            dateTo={effectiveEditBarFilters.date_to}
                            explicitDate={effectiveEditBarFilters.explicitDate}
                            onChange={(from_date, to_date, explicitDate) => {
                                if (!dashboardEditing?.filters) {
                                    setDashboardEditing(
                                        { filters: true, layout: false },
                                        DashboardEventSource.DashboardFilters
                                    )
                                }
                                setDates(from_date, to_date, explicitDate)
                            }}
                            makeLabel={(key) => (
                                <>
                                    <IconCalendar />
                                    <span className="hide-when-small"> {key}</span>
                                </>
                            )}
                        />
                    </Shortcut>
                </div>
            )}
            {showDateFilter && (
                <div className={clsx('content-end', { 'h-[61px]': hasVariables })}>
                    <DashboardIntervalFilter />
                </div>
            )}
            <div className={clsx('content-end', { 'h-[61px]': hasVariables })}>
                <PropertyFilters
                    onChange={(properties) => {
                        if (!dashboardEditing?.filters) {
                            setDashboardEditing({ filters: true, layout: false }, DashboardEventSource.DashboardFilters)
                        }
                        setProperties(properties)
                    }}
                    pageKey={'dashboard_' + dashboard?.id}
                    propertyFilters={effectiveEditBarFilters.properties}
                    taxonomicGroupTypes={[
                        TaxonomicFilterGroupType.EventProperties,
                        TaxonomicFilterGroupType.PersonProperties,
                        TaxonomicFilterGroupType.EventFeatureFlags,
                        TaxonomicFilterGroupType.EventMetadata,
                        ...(hasPageview ? [TaxonomicFilterGroupType.PageviewUrls] : []),
                        ...(hasScreen ? [TaxonomicFilterGroupType.Screens] : []),
                        TaxonomicFilterGroupType.EmailAddresses,
                        ...groupsTaxonomicTypes,
                        TaxonomicFilterGroupType.Cohorts,
                        TaxonomicFilterGroupType.Elements,
                        TaxonomicFilterGroupType.SessionProperties,
                        TaxonomicFilterGroupType.HogQLExpression,
                        TaxonomicFilterGroupType.DataWarehousePersonProperties,
                    ]}
                />
            </div>
            <div className={clsx('content-end', { 'h-[61px]': hasVariables })}>
                <BindLogic logic={insightLogic} props={insightProps}>
                    <TaxonomicBreakdownFilter
                        insightProps={insightProps}
                        breakdownFilter={effectiveEditBarFilters.breakdown_filter}
                        isTrends={false}
                        isFunnels={false}
                        showLabel={false}
                        updateBreakdownFilter={(breakdown_filter) => {
                            if (!dashboardEditing?.filters) {
                                setDashboardEditing(
                                    { filters: true, layout: false },
                                    DashboardEventSource.DashboardFilters
                                )
                            }
                            let saved_breakdown_filter: BreakdownFilter | null = breakdown_filter
                            // taxonomicBreakdownFilterLogic can generate an empty breakdown_filter object
                            if (breakdown_filter && !breakdown_filter.breakdown_type && !breakdown_filter.breakdowns) {
                                saved_breakdown_filter = null
                            }
                            setBreakdownFilter(saved_breakdown_filter)
                        }}
                        updateDisplay={() => {}}
                        disablePropertyInfo
                        size="small"
                    />
                </BindLogic>
            </div>

            <VariablesForDashboard />
            <div className={clsx('content-end', { 'h-[61px]': hasVariables })}>
                <DashboardEditBarAdvancedFilters />
            </div>
        </div>
    )
}
