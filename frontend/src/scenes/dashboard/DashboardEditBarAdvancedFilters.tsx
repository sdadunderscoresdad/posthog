import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconEllipsis, IconGear, IconPalette } from '@posthog/icons'
import { LemonBadge, LemonButton, LemonDivider, LemonLabel, LemonSegmentedButton } from '@posthog/lemon-ui'

import { useFeatureFlag } from 'lib/hooks/useFeatureFlag'
import { Popover } from 'lib/lemon-ui/Popover'
import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import { dashboardInsightColorsModalLogic } from 'scenes/dashboard/dashboardInsightColorsModalLogic'
import { dashboardLogic } from 'scenes/dashboard/dashboardLogic'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { DashboardPlacement } from '~/types'

type TestAccountFilterChoice = 'inherit' | 'filter-out' | 'include'

const CHOICE_TO_FILTER: Record<TestAccountFilterChoice, boolean | null> = {
    inherit: null,
    'filter-out': true,
    include: false,
}

function choiceHint(t: TFunction, choice: TestAccountFilterChoice): string {
    switch (choice) {
        case 'inherit':
            return t('dashboard.advancedFilters.hint.inherit', {
                defaultValue: 'Each insight keeps its own "Filter out internal and test users" setting.',
            })
        case 'filter-out':
            return t('dashboard.advancedFilters.hint.filterOut', {
                defaultValue: 'Internal and test users are filtered out of every insight on this dashboard.',
            })
        case 'include':
            return t('dashboard.advancedFilters.hint.include', {
                defaultValue: 'Internal and test users are included in every insight on this dashboard.',
            })
    }
}

/**
 * "…" at the end of the dashboard edit bar, opening a panel for overrides that are too rarely
 * used to earn a spot in the bar itself. Hosts the test account filter override and the
 * breakdown color override.
 */
export function DashboardEditBarAdvancedFilters(): JSX.Element {
    const { t } = useTranslation()
    const { dashboard, dashboardEditing, placement, canEditDashboard, effectiveEditBarFilters } =
        useValues(dashboardLogic)
    const { setFilterTestAccounts, setDashboardEditing } = useActions(dashboardLogic)
    const { showInsightColorsModal } = useActions(dashboardInsightColorsModalLogic)
    const { currentTeam } = useValues(teamLogic)
    const hasDashboardColors = useFeatureFlag('PRODUCT_ANALYTICS_DASHBOARD_COLORS')
    const [visible, setVisible] = useState(false)

    const filterTestAccounts = effectiveEditBarFilters.filterTestAccounts ?? null
    const choice: TestAccountFilterChoice =
        filterTestAccounts === null ? 'inherit' : filterTestAccounts ? 'filter-out' : 'include'
    const hasTestAccountFilters = (currentTeam?.test_account_filters || []).length > 0
    // Only the full dashboard scene mounts DashboardInsightColorsModal, so elsewhere the button would no-op.
    const showColors =
        hasDashboardColors && canEditDashboard && !!dashboard && placement === DashboardPlacement.Dashboard
    // Color customizations don't count towards the badge: they are visible on the charts
    // themselves, while a forced test account filter changes the data with no other visible cue.
    const overrideCount = choice === 'inherit' ? 0 : 1

    return (
        <Popover
            visible={visible}
            onClickOutside={() => setVisible(false)}
            placement="bottom-end"
            overlay={
                <div className="flex w-80 flex-col gap-2 p-2">
                    <div>
                        <h4 className="mb-0 font-semibold">
                            {t('dashboard.advancedFilters.title', { defaultValue: 'Advanced options' })}
                        </h4>
                        <p className="mb-0 text-xs text-secondary">
                            {t('dashboard.advancedFilters.description', {
                                defaultValue: 'Overrides applied to every insight on this dashboard.',
                            })}
                        </p>
                    </div>
                    <LemonDivider className="my-0" />
                    <div className="flex items-center justify-between gap-2">
                        <LemonLabel
                            info={t('dashboard.advancedFilters.testAccountInfo', {
                                defaultValue:
                                    'Force test account filtering on or off for every insight, or let each insight keep its own setting.',
                            })}
                        >
                            {t('dashboard.advancedFilters.testAccount', { defaultValue: 'Test account filtering' })}
                        </LemonLabel>
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
                        fullWidth
                        size="small"
                        value={choice}
                        onChange={(next) => {
                            if (!dashboardEditing?.filters) {
                                setDashboardEditing(
                                    { filters: true, layout: false },
                                    DashboardEventSource.DashboardFilters
                                )
                            }
                            setFilterTestAccounts(CHOICE_TO_FILTER[next])
                        }}
                        options={[
                            {
                                value: 'inherit',
                                label: t('dashboard.advancedFilters.inherit', { defaultValue: 'Inherit' }),
                                tooltip: t('dashboard.advancedFilters.inheritTooltip', {
                                    defaultValue: 'Each insight keeps its own setting',
                                }),
                                'data-attr': 'dashboard-test-account-filter-inherit',
                            },
                            {
                                value: 'filter-out',
                                label: t('dashboard.advancedFilters.filterOut', { defaultValue: 'Filter out' }),
                                tooltip: t('dashboard.advancedFilters.filterOutTooltip', {
                                    defaultValue: 'Force test account filtering on for every insight',
                                }),
                                disabledReason: !hasTestAccountFilters
                                    ? t('dashboard.advancedFilters.noTestFilters', {
                                          defaultValue:
                                              "You haven't set any internal test filters. Click the gear icon to configure.",
                                      })
                                    : undefined,
                                'data-attr': 'dashboard-test-account-filter-out',
                            },
                            {
                                value: 'include',
                                label: t('dashboard.advancedFilters.include', { defaultValue: 'Include' }),
                                tooltip: t('dashboard.advancedFilters.includeTooltip', {
                                    defaultValue: 'Force test account filtering off for every insight',
                                }),
                                'data-attr': 'dashboard-test-account-filter-include',
                            },
                        ]}
                    />
                    <p className="mb-0 text-xs text-secondary">{choiceHint(t, choice)}</p>
                    {showColors && (
                        <>
                            <LemonDivider className="my-0" />
                            <LemonLabel
                                info={t('dashboard.advancedFilters.breakdownColorsInfo', {
                                    defaultValue:
                                        'Pin a breakdown value to a color, or pick a color theme, so every insight on this dashboard draws it the same way.',
                                })}
                            >
                                {t('dashboard.advancedFilters.breakdownColors', {
                                    defaultValue: 'Breakdown colors',
                                })}
                            </LemonLabel>
                            <LemonButton
                                type="secondary"
                                size="small"
                                fullWidth
                                center
                                icon={<IconPalette />}
                                onClick={() => {
                                    setVisible(false)
                                    showInsightColorsModal(dashboard.id)
                                }}
                                data-attr="dashboard-advanced-customize-colors"
                            >
                                {t('dashboard.menuBar.customizeColors', { defaultValue: 'Customize colors' })}
                            </LemonButton>
                        </>
                    )}
                </div>
            }
        >
            <LemonButton
                size="small"
                icon={<IconEllipsis />}
                tooltip={t('dashboard.advancedFilters.title', { defaultValue: 'Advanced options' })}
                active={visible}
                onClick={() => setVisible(!visible)}
                sideIcon={overrideCount ? <LemonBadge.Number count={overrideCount} size="small" /> : undefined}
                data-attr="dashboard-advanced-filters"
            />
        </Popover>
    )
}
