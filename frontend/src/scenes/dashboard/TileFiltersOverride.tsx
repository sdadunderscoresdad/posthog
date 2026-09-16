// scenes/dashboard/TileFiltersOverride.tsx
import './TileFiltersOverride.scss'

import type { TFunction } from 'i18next'
import { BindLogic, useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconCalendar, IconGear } from '@posthog/icons'
import { LemonButton, LemonDivider, LemonSegmentedButton, LemonSelect, LemonSwitch } from '@posthog/lemon-ui'

import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { i18n } from 'lib/i18n/i18n'
import { getProjectEventExistence } from 'lib/utils/getAppContext'
import { TaxonomicBreakdownFilter } from 'scenes/insights/filters/BreakdownFilter/TaxonomicBreakdownFilter'
import { insightLogic } from 'scenes/insights/insightLogic'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { groupsModel } from '~/models/groupsModel'
import { BreakdownFilter, NodeKind } from '~/queries/schema/schema-general'
import { isInsightQueryWithBreakdown, isInsightQueryWithSeries, isInsightVizNode } from '~/queries/utils'
import type { DashboardTile, InsightLogicProps, IntervalType, QueryBasedInsightModel } from '~/types'

import { tileLogic } from './tileLogic'

type TestAccountFilterChoice = 'inherit' | 'filter-out' | 'include'

const CHOICE_TO_FILTER: Record<TestAccountFilterChoice, boolean | null> = {
    inherit: null,
    'filter-out': true,
    include: false,
}

function tileChoiceHint(t: TFunction, choice: TestAccountFilterChoice): string {
    switch (choice) {
        case 'inherit':
            return t('dashboard.tileFilters.hint.inherit', {
                defaultValue: "Uses the dashboard's setting, or the insight's own if the dashboard doesn't set one.",
            })
        case 'filter-out':
            return t('dashboard.tileFilters.hint.filterOut', {
                defaultValue: 'Internal and test users are filtered out of this insight.',
            })
        case 'include':
            return t('dashboard.tileFilters.hint.include', {
                defaultValue: 'Internal and test users are included in this insight.',
            })
    }
}

export function TileFiltersOverride({ tile }: { tile: DashboardTile<QueryBasedInsightModel> }): JSX.Element {
    const { t } = useTranslation()
    const { overrides } = useValues(tileLogic)
    const { setDates, setProperties, setBreakdown, setInterval, setFilterTestAccounts, setIgnoreDashboardFilters } =
        useActions(tileLogic)
    const { groupsTaxonomicTypes } = useValues(groupsModel)
    const { currentTeam } = useValues(teamLogic)

    const { hasPageview, hasScreen } = getProjectEventExistence()

    const query = tile.insight?.query
    const querySource = isInsightVizNode(query) ? query.source : query
    const supportsInterval = isInsightQueryWithSeries(querySource ?? undefined)
    const supportsBreakdown = isInsightQueryWithBreakdown(querySource)

    const filterTestAccounts = overrides.filterTestAccounts ?? null
    const testAccountChoice: TestAccountFilterChoice =
        filterTestAccounts === null ? 'inherit' : filterTestAccounts ? 'filter-out' : 'include'
    const hasTestAccountFilters = (currentTeam?.test_account_filters || []).length > 0

    // The breakdown picker needs a mounted insightLogic. Bind a throwaway one, like DashboardEditBar,
    // keyed per tile so it can't collide with the edit bar's `dashboardItemId: 'new'` binding.
    const breakdownInsightProps: InsightLogicProps = {
        dashboardItemId: `new-tile-override-${tile.id}`,
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
        <div className="space-y-4 tile-filters-override">
            <div>
                <p className="text-sm text-muted mb-4">
                    {t('dashboard.tileFilters.description', {
                        defaultValue:
                            "Set custom filters for this tile. Property filters apply on top of the dashboard's, while the tile's date range, interval, breakdown, and test account filtering replace the dashboard's.",
                    })}
                </p>
            </div>

            <div>
                <LemonDivider label={t('dashboard.tileFilters.scope', { defaultValue: 'Scope' })} />
                <div className="flex flex-col gap-4 pb-4">
                    <div>
                        <LemonSwitch
                            checked={!!overrides.ignoreDashboardFilters}
                            onChange={setIgnoreDashboardFilters}
                            label={t('dashboard.tileFilters.ignoreDashboardFilters', {
                                defaultValue: 'Ignore dashboard filters',
                            })}
                            bordered
                            fullWidth
                            data-attr="tile-ignore-dashboard-filters"
                        />
                        <p className="text-xs text-muted mt-1 mb-0">
                            {t('dashboard.tileFilters.ignoreDashboardFiltersHint', {
                                defaultValue:
                                    "When on, none of the dashboard's filters apply to this insight. The overrides below still do.",
                            })}
                        </p>
                    </div>
                </div>

                <LemonDivider label={t('dashboard.tileFilters.time', { defaultValue: 'Time' })} />
                <div className="flex flex-col gap-4 pb-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {t('dashboard.tileFilters.dateRange', { defaultValue: 'Date range' })}
                        </label>
                        <DateFilter
                            showCustom
                            showExplicitDateToggle
                            dateFrom={overrides.date_from ?? null}
                            dateTo={overrides.date_to ?? null}
                            explicitDate={overrides.explicitDate}
                            onChange={(from, to, explicitDate) => setDates(from, to, explicitDate)}
                            makeLabel={(key) => (
                                <>
                                    <IconCalendar />
                                    <span className="hide-when-small"> {key}</span>
                                </>
                            )}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {t('dashboard.tileFilters.interval', { defaultValue: 'Interval' })}
                        </label>
                        <LemonSelect<IntervalType | null>
                            size="small"
                            value={overrides.interval ?? null}
                            dropdownMatchSelectWidth={false}
                            disabledReason={
                                supportsInterval
                                    ? undefined
                                    : t('dashboard.tileFilters.intervalUnsupported', {
                                          defaultValue: "This insight type doesn't support an interval override",
                                      })
                            }
                            onChange={(interval) => setInterval(interval)}
                            options={[
                                { value: null, label: t('dashboard.tileFilters.inherit', { defaultValue: 'inherit' }) },
                                { value: 'hour', label: t('interval.hour', { defaultValue: 'hour' }) },
                                { value: 'day', label: t('interval.day', { defaultValue: 'day' }) },
                                { value: 'week', label: t('interval.week', { defaultValue: 'week' }) },
                                { value: 'month', label: t('interval.month', { defaultValue: 'month' }) },
                            ]}
                            data-attr="tile-override-interval"
                        />
                    </div>
                </div>

                <LemonDivider label={t('dashboard.tileFilters.filters', { defaultValue: 'Filters' })} />
                <div className="flex flex-col gap-4 pb-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {t('dashboard.tileFilters.properties', { defaultValue: 'Properties' })}
                        </label>
                        <PropertyFilters
                            onChange={(properties) => setProperties(properties)}
                            pageKey={`tile_${tile.id}_properties`}
                            propertyFilters={overrides.properties ?? []}
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

                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <label className="text-sm font-medium">
                                {t('dashboard.advancedFilters.testAccount', { defaultValue: 'Test account filtering' })}
                            </label>
                            <LemonButton
                                icon={<IconGear />}
                                size="xsmall"
                                noPadding
                                to={urls.settings('project-product-analytics', 'internal-user-filtering')}
                                tooltip={t('dashboard.advancedFilters.configureTooltip', {
                                    defaultValue: 'Configure internal and test account filters',
                                })}
                            />
                        </div>
                        <LemonSegmentedButton<TestAccountFilterChoice>
                            size="small"
                            value={testAccountChoice}
                            onChange={(next) => setFilterTestAccounts(CHOICE_TO_FILTER[next])}
                            options={[
                                {
                                    value: 'inherit',
                                    label: t('dashboard.advancedFilters.inherit', { defaultValue: 'Inherit' }),
                                    tooltip: t('dashboard.tileFilters.inheritTooltip', {
                                        defaultValue: "Use the dashboard's setting, or the insight's own",
                                    }),
                                    'data-attr': 'tile-test-account-filter-inherit',
                                },
                                {
                                    value: 'filter-out',
                                    label: t('dashboard.advancedFilters.filterOut', { defaultValue: 'Filter out' }),
                                    tooltip: t('dashboard.tileFilters.filterOutTooltip', {
                                        defaultValue: 'Force test account filtering on for this insight',
                                    }),
                                    disabledReason: !hasTestAccountFilters
                                        ? t('dashboard.advancedFilters.noTestFilters', {
                                              defaultValue:
                                                  "You haven't set any internal test filters. Click the gear icon to configure.",
                                          })
                                        : undefined,
                                    'data-attr': 'tile-test-account-filter-out',
                                },
                                {
                                    value: 'include',
                                    label: t('dashboard.advancedFilters.include', { defaultValue: 'Include' }),
                                    tooltip: t('dashboard.tileFilters.includeTooltip', {
                                        defaultValue: 'Force test account filtering off for this insight',
                                    }),
                                    'data-attr': 'tile-test-account-filter-include',
                                },
                            ]}
                        />
                        <p className="text-xs text-muted mt-1 mb-0">{tileChoiceHint(t, testAccountChoice)}</p>
                    </div>
                </div>

                <LemonDivider label={t('dashboard.tileFilters.display', { defaultValue: 'Display' })} />
                <div className="flex flex-col gap-4 pb-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {t('dashboard.tileFilters.breakdown', { defaultValue: 'Breakdown' })}
                        </label>
                        <BindLogic logic={insightLogic} props={breakdownInsightProps}>
                            <TaxonomicBreakdownFilter
                                insightProps={breakdownInsightProps}
                                breakdownFilter={overrides.breakdown_filter}
                                isTrends={false}
                                isFunnels={false}
                                showLabel={false}
                                disabledReason={
                                    supportsBreakdown
                                        ? undefined
                                        : i18n.t('dashboard.tileFilters.breakdownUnsupported', {
                                              defaultValue: "This insight type doesn't support a breakdown override",
                                          })
                                }
                                updateBreakdownFilter={(breakdown_filter) => {
                                    let newBreakdownFilter: BreakdownFilter | null = breakdown_filter
                                    // taxonomicBreakdownFilterLogic can generate an empty breakdown_filter object
                                    if (
                                        breakdown_filter &&
                                        !breakdown_filter.breakdown_type &&
                                        !breakdown_filter.breakdowns
                                    ) {
                                        newBreakdownFilter = null
                                    }
                                    setBreakdown(newBreakdownFilter)
                                }}
                                updateDisplay={() => {}}
                                disablePropertyInfo
                                size="small"
                            />
                        </BindLogic>
                    </div>
                </div>
            </div>
        </div>
    )
}
