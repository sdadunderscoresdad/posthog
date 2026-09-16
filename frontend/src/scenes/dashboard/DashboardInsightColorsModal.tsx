import { useActions, useValues } from 'kea'

import {
    LemonButton,
    LemonColorPicker,
    LemonLabel,
    LemonModal,
    LemonSkeleton,
    LemonTag,
    LemonTable,
    LemonTableColumns,
} from '@posthog/lemon-ui'

import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import stringWithWBR from 'lib/utils/stringWithWBR'
import { BreakdownTag } from 'scenes/insights/filters/BreakdownFilter/BreakdownTag'
import { formatBreakdownLabel } from 'scenes/insights/utils'
import { dataColorThemesLogic } from 'scenes/settings/environment/dataColorThemesLogic'

import { cohortsModel } from '~/models/cohortsModel'
import { propertyDefinitionsModel } from '~/models/propertyDefinitionsModel'
import { BreakdownFilter } from '~/queries/schema/schema-general'
import { DataColorThemeModel } from '~/types'

import {
    BreakdownColorConfig,
    BreakdownValueAndType,
    COHORT_BREAKDOWN_PROPERTY_KEY,
    denormalizeBreakdownValue,
    findBreakdownColorConfig,
    parseBreakdownPropertyKey,
} from './dashboardBreakdownColors'
import { dashboardInsightColorsModalLogic } from './dashboardInsightColorsModalLogic'
import { dashboardLogic } from './dashboardLogic'

type BreakdownColorRow = BreakdownColorConfig & { pinnedConfig?: BreakdownColorConfig }

function ThemeSwatches({ theme }: { theme: DataColorThemeModel }): JSX.Element {
    return (
        <span className="flex shrink-0 items-center gap-0.5">
            {theme.colors.slice(0, 6).map((color, index) => (
                <span
                    key={index}
                    className="h-4 w-1.5 rounded-full"
                    // eslint-disable-next-line react/forbid-dom-props
                    style={{ backgroundColor: color }}
                />
            ))}
        </span>
    )
}

function BreakdownPropertyGroupTitle({ breakdownProperty }: { breakdownProperty?: string }): JSX.Element {
    const { t } = useTranslation()
    if (breakdownProperty == null) {
        // The property-less group holds entries that apply under every property, like the funnel baseline.
        return (
            <LemonTag type="muted">{t('dashboard.colors.allProperties', { defaultValue: 'All properties' })}</LemonTag>
        )
    }
    if (breakdownProperty === COHORT_BREAKDOWN_PROPERTY_KEY) {
        return <LemonTag type="muted">{t('dashboard.colors.cohorts', { defaultValue: 'Cohorts' })}</LemonTag>
    }
    return (
        <div className="flex flex-wrap items-center gap-1">
            {parseBreakdownPropertyKey(breakdownProperty).map((part, index) => (
                <BreakdownTag key={index} breakdown={part.property} breakdownType={part.type} size="small" />
            ))}
        </div>
    )
}

export function DashboardInsightColorsModal(): JSX.Element {
    const { isOpen, insightTilesLoading, breakdownValueGroups } = useValues(dashboardInsightColorsModalLogic)
    const { t } = useTranslation()
    const { hideInsightColorsModal, cancelColorChanges } = useActions(dashboardInsightColorsModalLogic)

    const { themes: _themes, themesLoading } = useValues(dataColorThemesLogic)

    const {
        effectiveBreakdownColors,
        dataColorThemeId,
        dashboardEditing,
        dashboardLoading,
        canEditDashboard,
        hasUnsavedColorChanges,
    } = useValues(dashboardLogic)
    const { setBreakdownColorConfig, setDataColorThemeId, setDashboardEditing } = useActions(dashboardLogic)

    const { formatPropertyValueForDisplay } = useValues(propertyDefinitionsModel)
    const { allCohorts } = useValues(cohortsModel)

    const themes = _themes || []

    const ensureEditMode = (): void => {
        if (!dashboardEditing) {
            setDashboardEditing({ filters: true, layout: false }, DashboardEventSource.DashboardInsightColorsModal)
        }
    }

    const toRow = (breakdownValue: BreakdownValueAndType): BreakdownColorRow => {
        const config = findBreakdownColorConfig(
            effectiveBreakdownColors,
            breakdownValue.breakdownValue,
            breakdownValue.breakdownType,
            breakdownValue.breakdownProperty
        )
        return {
            ...breakdownValue,
            colorToken: config?.colorToken || null,
            source: config?.source,
            pinnedConfig: config,
        }
    }

    const columns: LemonTableColumns<BreakdownColorRow> = [
        {
            title: t('dashboard.colors.breakdownColumn', { defaultValue: 'Breakdown' }),
            key: 'breakdown_value',
            render: (_, { breakdownValue, breakdownType }) => {
                const breakdownFilter: BreakdownFilter = { breakdown_type: breakdownType }
                const breakdownLabel = formatBreakdownLabel(
                    denormalizeBreakdownValue(breakdownValue),
                    breakdownFilter,
                    allCohorts?.results,
                    formatPropertyValueForDisplay
                )
                const formattedLabel = stringWithWBR(breakdownLabel, 20)

                return <span>{formattedLabel}</span>
            },
        },
        {
            title: t('dashboard.colors.colorColumn', { defaultValue: 'Color' }),
            key: 'color',
            render: (_, { colorToken, source, pinnedConfig, ...config }) => {
                return (
                    <div className="flex items-center gap-2">
                        <LemonColorPicker
                            selectedColorToken={colorToken}
                            onSelectColorToken={(colorToken) => {
                                ensureEditMode()
                                setBreakdownColorConfig({
                                    ...config,
                                    colorToken,
                                    source: 'manual',
                                })
                            }}
                            customButton={
                                colorToken === null ? (
                                    <LemonButton type="tertiary">
                                        {t('dashboard.colors.customize', { defaultValue: 'Customize color' })}
                                    </LemonButton>
                                ) : undefined
                            }
                            themeId={dataColorThemeId}
                        />
                        {source === 'auto' ? (
                            <LemonTag type="muted">{t('dashboard.colors.auto', { defaultValue: 'Auto' })}</LemonTag>
                        ) : colorToken !== null ? (
                            <LemonButton
                                size="small"
                                type="tertiary"
                                tooltip={t('dashboard.colors.resetTooltip', {
                                    defaultValue: 'Reset to automatic color',
                                })}
                                onClick={() => {
                                    ensureEditMode()
                                    // Clearing must target the entry that provides the pin: a
                                    // property-less legacy pin cleared from a scoped row would
                                    // otherwise survive and keep coloring other properties.
                                    setBreakdownColorConfig({
                                        ...(pinnedConfig ?? config),
                                        colorToken: null,
                                        source: 'manual',
                                    })
                                }}
                            >
                                {t('dashboard.colors.reset', { defaultValue: 'Reset' })}
                            </LemonButton>
                        ) : null}
                    </div>
                )
            },
        },
    ]

    return (
        <LemonModal
            title={t('dashboard.colors.modalTitle', { defaultValue: 'Customize breakdown colors' })}
            isOpen={isOpen}
            onClose={hideInsightColorsModal}
            maxWidth="42rem"
            footer={
                <>
                    <LemonButton
                        type="secondary"
                        data-attr="dashboard-colors-cancel"
                        onClick={cancelColorChanges}
                        tooltip={t('dashboard.colors.cancelTooltip', {
                            defaultValue: 'Revert the changes made in this dialog',
                        })}
                    >
                        {t('dashboard.editMode.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="primary"
                        data-attr="dashboard-colors-save"
                        onClick={() => {
                            hideInsightColorsModal()
                            setDashboardEditing(null, DashboardEventSource.DashboardInsightColorsModal)
                        }}
                        disabledReason={
                            dashboardLoading
                                ? t('dashboard.editMode.waitForLoading', {
                                      defaultValue: 'Wait for dashboard to finish loading',
                                  })
                                : !canEditDashboard
                                  ? t('dashboard.editMode.notPrivileged', {
                                        defaultValue: 'Not privileged to edit this dashboard',
                                    })
                                  : !hasUnsavedColorChanges
                                    ? t('dashboard.colors.noChanges', { defaultValue: 'No color changes to save' })
                                    : undefined
                        }
                    >
                        {t('dashboard.colors.save', { defaultValue: 'Save' })}
                    </LemonButton>
                </>
            }
        >
            <LemonLabel
                info={t('dashboard.colors.themeInfo', {
                    defaultValue:
                        'Pick a theme to set the colors every insight on this dashboard uses. Anyone who views or shares the dashboard sees the same colors, so series stay recognizable outside PostHog.',
                })}
            >
                {t('dashboard.colors.colorTheme', { defaultValue: 'Color theme' })}
            </LemonLabel>
            <div className="mt-2 flex flex-col gap-1">
                {themesLoading ? (
                    <>
                        <LemonSkeleton.Button className="w-full" />
                        <LemonSkeleton.Button className="w-full" />
                    </>
                ) : (
                    <>
                        <LemonButton
                            type="secondary"
                            fullWidth
                            active={dataColorThemeId == null}
                            onClick={() => {
                                ensureEditMode()
                                setDataColorThemeId(null)
                            }}
                            data-attr="dashboard-colors-theme-none"
                        >
                            {t('dashboard.colors.definedByInsight', { defaultValue: 'Defined by insight' })}
                        </LemonButton>
                        {themes.map((theme) => (
                            <LemonButton
                                key={theme.id}
                                type="secondary"
                                fullWidth
                                active={dataColorThemeId === theme.id}
                                onClick={() => {
                                    ensureEditMode()
                                    setDataColorThemeId(theme.id)
                                }}
                                data-attr={`dashboard-colors-theme-${theme.id}`}
                            >
                                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                    <span className="truncate">{theme.name}</span>
                                    <ThemeSwatches theme={theme} />
                                </span>
                            </LemonButton>
                        ))}
                    </>
                )}
            </div>

            <LemonLabel
                className="mt-4 mb-2"
                info={
                    <>
                        <p className="mb-1">
                            {t('dashboard.colors.groupingInfo', {
                                defaultValue:
                                    'Colors are grouped by breakdown property, so each property picks its colors on its own.',
                            })}
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>
                                {t('dashboard.colors.sharedValueInfo', {
                                    defaultValue:
                                        'A value shown on two or more insights gets one color across the dashboard, and keeps it under every property it appears in, as far as the palette allows.',
                                })}
                            </li>
                            <li>
                                {t('dashboard.colors.singleInsightInfo', {
                                    defaultValue: 'Values on a single insight keep their own colors.',
                                })}
                            </li>
                            <li>
                                {t('dashboard.colors.pinInfo', { defaultValue: 'Pick a color to pin a value to it.' })}
                            </li>
                        </ul>
                    </>
                }
            >
                {t('dashboard.advancedFilters.breakdownColors', { defaultValue: 'Breakdown colors' })}
            </LemonLabel>
            {breakdownValueGroups.length === 0 ? (
                <LemonTable columns={columns} dataSource={[]} loading={insightTilesLoading || undefined} />
            ) : (
                breakdownValueGroups.map((group) => (
                    <div key={group.breakdownProperty ?? ''} className="mb-4">
                        <LemonLabel className="mb-1">
                            <BreakdownPropertyGroupTitle breakdownProperty={group.breakdownProperty} />
                        </LemonLabel>
                        <LemonTable columns={columns} dataSource={group.values.map(toRow)} showHeader={false} />
                    </div>
                ))
            )}
            {insightTilesLoading ? (
                <p className="text-muted-alt mt-2">
                    {t('dashboard.colors.tilesLoading', {
                        defaultValue: 'Tiles are still loading. More breakdown values may appear.',
                    })}
                </p>
            ) : null}
        </LemonModal>
    )
}
import { useTranslation } from 'react-i18next'
