import { deepEqual as equal } from 'fast-equals'

import { formatPropertyLabel } from 'lib/components/PropertyFilters/utils'
import { i18n } from 'lib/i18n/i18n'
import { dateFilterToText } from 'lib/utils/dateFilters'
import { capitalizeFirstLetter } from 'lib/utils/strings'

import type { DashboardFilter, HogQLVariable, MultipleBreakdownType } from '~/queries/schema/schema-general'
import { type AnyPropertyFilter, type BreakdownType, PropertyFilterType } from '~/types'

/** Which dashboard setting a change touches. Drives the icon and the label. */
export type DashboardChangeKind =
    | 'propertyFilter'
    | 'propertyFilters'
    | 'dateRange'
    | 'interval'
    | 'breakdown'
    | 'testAccounts'
    | 'variable'

export interface DashboardSettingsChange {
    kind: DashboardChangeKind
    label: string
    previousValue: string[]
    value: string[]
    status: 'new' | 'changed' | 'removed'
}

export type DashboardFilterChange = DashboardSettingsChange

function formatVariableValue(variable: { isNull?: boolean; value?: unknown } | undefined): string[] {
    if (variable?.isNull) {
        // SQL NULL is an explicit value in the changes UI. An empty array represents an unset variable.
        return ['null']
    }
    if (variable?.value == null) {
        return []
    }
    return [String(variable.value)]
}

export function dashboardVariableValuesEqual(
    previous: { isNull?: boolean; value?: unknown } | undefined,
    current: { isNull?: boolean; value?: unknown } | undefined
): boolean {
    return equal(formatVariableValue(previous), formatVariableValue(current))
}

/**
 * Deep equality that reads null and an absent key as the same setting. Both mean "inherit" for a
 * dashboard filter, and the inherit option on each control writes null rather than dropping the key.
 */
function dashboardFilterValuesEqual(previous: unknown, current: unknown): boolean {
    if (previous == null && current == null) {
        return true
    }
    return equal(previous, current)
}

export function dashboardFiltersEqual(previous: DashboardFilter, current: DashboardFilter): boolean {
    // Property filters are compared with the same rule that builds the change list, so the unsaved
    // count can never disagree with what the change list can show. A reordered AND list holds the
    // same filters, so it is not a change.
    if (getPropertyFilterChanges(previous, current).length > 0) {
        return false
    }

    const keys = new Set([...Object.keys(previous), ...Object.keys(current)])
    return Array.from(keys).every(
        (key) =>
            key === 'properties' ||
            dashboardFilterValuesEqual(
                (previous as Record<string, unknown>)[key],
                (current as Record<string, unknown>)[key]
            )
    )
}

function changeValue(value: string | undefined): string[] {
    return value ? [value] : []
}

export function getDashboardVariableChanges(
    previousVariables: Record<string, HogQLVariable>,
    currentVariables: Record<string, HogQLVariable>,
    defaultVariables: Record<string, HogQLVariable>
): DashboardSettingsChange[] {
    const variableIds = new Set([...Object.keys(previousVariables), ...Object.keys(currentVariables)])

    return Array.from(variableIds).flatMap((variableId) => {
        const previous = previousVariables[variableId] ?? defaultVariables[variableId]
        const current = currentVariables[variableId] ?? defaultVariables[variableId]
        if (dashboardVariableValuesEqual(previous, current)) {
            return []
        }

        return [
            {
                kind: 'variable' as const,
                label: current?.code_name ?? previous?.code_name ?? variableId,
                previousValue: formatVariableValue(previous),
                value: formatVariableValue(current),
                status: getChangeStatus(!!previous, !!current),
            },
        ]
    })
}

function getDashboardFilterTypeLabels(): Partial<Record<string, string>> {
    return {
        [PropertyFilterType.Cohort]: i18n.t('dashboard.settingsChanges.filterTypes.cohort', {
            defaultValue: 'cohort',
        }),
        [PropertyFilterType.DataWarehouse]: i18n.t('dashboard.settingsChanges.filterTypes.dataWarehouseProperty', {
            defaultValue: 'data warehouse property',
        }),
        [PropertyFilterType.DataWarehousePersonProperty]: i18n.t(
            'dashboard.settingsChanges.filterTypes.dataWarehousePersonProperty',
            { defaultValue: 'data warehouse person property' }
        ),
        [PropertyFilterType.Element]: i18n.t('dashboard.settingsChanges.filterTypes.element', {
            defaultValue: 'element',
        }),
        [PropertyFilterType.Event]: i18n.t('dashboard.settingsChanges.filterTypes.eventProperty', {
            defaultValue: 'event property',
        }),
        [PropertyFilterType.EventMetadata]: i18n.t('dashboard.settingsChanges.filterTypes.eventMetadata', {
            defaultValue: 'event metadata',
        }),
        [PropertyFilterType.Feature]: i18n.t('dashboard.settingsChanges.filterTypes.featureFlag', {
            defaultValue: 'feature flag',
        }),
        [PropertyFilterType.Group]: i18n.t('dashboard.settingsChanges.filterTypes.groupProperty', {
            defaultValue: 'group property',
        }),
        [PropertyFilterType.HogQL]: i18n.t('dashboard.settingsChanges.filterTypes.sqlExpression', {
            defaultValue: 'SQL expression',
        }),
        [PropertyFilterType.Person]: i18n.t('dashboard.settingsChanges.filterTypes.personProperty', {
            defaultValue: 'person property',
        }),
        [PropertyFilterType.RevenueAnalytics]: i18n.t(
            'dashboard.settingsChanges.filterTypes.revenueAnalyticsProperty',
            { defaultValue: 'revenue analytics property' }
        ),
        [PropertyFilterType.Session]: i18n.t('dashboard.settingsChanges.filterTypes.sessionProperty', {
            defaultValue: 'session property',
        }),
    }
}

// The same property name exists in several taxonomies, and the formatted label carries only the
// name, the operator, and the value. Without the taxonomy, moving a filter from one to the other
// reads as the same filter removed and added again.
function formatProperty(property: AnyPropertyFilter): string {
    const label = formatPropertyLabel(property, {}).trim()
    const taxonomy = property.type ? getDashboardFilterTypeLabels()[property.type] : undefined
    return taxonomy
        ? i18n.t('dashboard.settingsChanges.taxonomySuffix', {
              label,
              taxonomy,
              defaultValue: '{{ label }} ({{ taxonomy }})',
          })
        : label
}

function propertyIdentity(property: AnyPropertyFilter): string {
    if (!('key' in property)) {
        return JSON.stringify(property)
    }

    return JSON.stringify({
        key: property.key,
        type: property.type,
        group_type_index: 'group_type_index' in property ? property.group_type_index : undefined,
    })
}

function formatDateRange(filters: DashboardFilter): string {
    const allTime = i18n.t('dashboard.settingsChanges.allTime', { defaultValue: 'All time' })
    const dateRange = dateFilterToText(filters.date_from, filters.date_to, allTime) || allTime
    // explicitDate moves the period boundaries to the current time, so a flip of the "Exact time
    // range" switch alone has to read as a change rather than as the same range twice.
    return filters.explicitDate
        ? i18n.t('dashboard.settingsChanges.exactTimeRangeSuffix', {
              range: dateRange,
              defaultValue: '{{ range }} (exact time range)',
          })
        : dateRange
}

// The same property name exists in several taxonomies, so a breakdown that keeps the name and
// changes the taxonomy would otherwise read as the same value on both sides of the change.
function formatBreakdownValue(
    property: unknown,
    type: BreakdownType | MultipleBreakdownType | null | undefined
): string {
    const name = String(property)
    const label = type ? getDashboardFilterTypeLabels()[type] : undefined
    return label
        ? i18n.t('dashboard.settingsChanges.taxonomySuffix', {
              label: name,
              taxonomy: label,
              defaultValue: '{{ label }} ({{ taxonomy }})',
          })
        : name
}

function formatBreakdown(filters: DashboardFilter): string[] {
    const { breakdown_filter } = filters
    if (!breakdown_filter?.breakdown && !breakdown_filter?.breakdowns?.length) {
        return []
    }

    if (breakdown_filter.breakdowns?.length) {
        return breakdown_filter.breakdowns.map((breakdown) => formatBreakdownValue(breakdown.property, breakdown.type))
    }

    if (Array.isArray(breakdown_filter.breakdown)) {
        return breakdown_filter.breakdown.map((breakdown) =>
            formatBreakdownValue(breakdown, breakdown_filter.breakdown_type)
        )
    }
    return [formatBreakdownValue(breakdown_filter.breakdown, breakdown_filter.breakdown_type)]
}

function formatTestAccounts(filterTestAccounts: DashboardFilter['filterTestAccounts']): string {
    if (filterTestAccounts === null || filterTestAccounts === undefined) {
        return i18n.t('dashboard.settingsChanges.defaultValue', { defaultValue: 'Default' })
    }
    // A true filterTestAccounts filters internal and test users out.
    return filterTestAccounts
        ? i18n.t('dashboard.settingsChanges.excluded', { defaultValue: 'Excluded' })
        : i18n.t('dashboard.settingsChanges.included', { defaultValue: 'Included' })
}

function formatInterval(interval: string | null | undefined): string | undefined {
    switch (interval) {
        case 'hour':
            return i18n.t('dashboard.settingsChanges.interval.hour', { defaultValue: 'Hour' })
        case 'day':
            return i18n.t('dashboard.settingsChanges.interval.day', { defaultValue: 'Day' })
        case 'week':
            return i18n.t('dashboard.settingsChanges.interval.week', { defaultValue: 'Week' })
        case 'month':
            return i18n.t('dashboard.settingsChanges.interval.month', { defaultValue: 'Month' })
        case null:
        case undefined:
            return undefined
        default:
            return capitalizeFirstLetter(interval)
    }
}

function getChangeStatus(previousExists: boolean, currentExists: boolean): DashboardFilterChange['status'] {
    if (!previousExists) {
        return 'new'
    }
    if (!currentExists) {
        return 'removed'
    }
    return 'changed'
}

function getPropertyChanges(previous: AnyPropertyFilter[], current: AnyPropertyFilter[]): DashboardFilterChange[] {
    const unmatchedPrevious = [...previous]
    const changes: DashboardFilterChange[] = []

    current.forEach((property) => {
        const previousIndex = unmatchedPrevious.findIndex(
            (previousProperty) => propertyIdentity(previousProperty) === propertyIdentity(property)
        )

        if (previousIndex === -1) {
            changes.push({
                kind: 'propertyFilter',
                label: i18n.t('dashboard.settingsChanges.filter.propertyFilter', {
                    defaultValue: 'Property filter',
                }),
                previousValue: [],
                value: [formatProperty(property)],
                status: 'new',
            })
            return
        }

        const previousProperty = unmatchedPrevious.splice(previousIndex, 1)[0]
        if (!equal(previousProperty, property)) {
            changes.push({
                kind: 'propertyFilter',
                label: i18n.t('dashboard.settingsChanges.filter.propertyFilter', {
                    defaultValue: 'Property filter',
                }),
                previousValue: [formatProperty(previousProperty)],
                value: [formatProperty(property)],
                status: 'changed',
            })
        }
    })

    unmatchedPrevious.forEach((property) => {
        changes.push({
            kind: 'propertyFilter',
            label: i18n.t('dashboard.settingsChanges.filter.propertyFilter', {
                defaultValue: 'Property filter',
            }),
            previousValue: [formatProperty(property)],
            value: [],
            status: 'removed',
        })
    })

    return changes
}

function getPropertyFilterChanges(
    previousFilters: DashboardFilter,
    currentFilters: DashboardFilter
): DashboardFilterChange[] {
    const previousProperties = previousFilters.properties ?? []
    const currentProperties = currentFilters.properties ?? []
    const changes = getPropertyChanges(previousProperties, currentProperties)
    const previousPropertiesAreExplicit = previousFilters.properties != null
    const currentPropertiesAreExplicit = currentFilters.properties != null
    const noPropertyFilters = i18n.t('dashboard.settingsChanges.noPropertyFilters', {
        defaultValue: 'No property filters',
    })
    if (
        !changes.length &&
        previousPropertiesAreExplicit !== currentPropertiesAreExplicit &&
        (previousProperties.length === 0 || currentProperties.length === 0)
    ) {
        changes.push({
            kind: 'propertyFilters',
            label: i18n.t('dashboard.settingsChanges.filter.propertyFilters', {
                defaultValue: 'Property filters',
            }),
            previousValue: previousPropertiesAreExplicit ? [noPropertyFilters] : [],
            value: currentPropertiesAreExplicit ? [noPropertyFilters] : [],
            status: getChangeStatus(previousPropertiesAreExplicit, currentPropertiesAreExplicit),
        })
    }

    return changes
}

export function getDashboardFilterChanges(
    previousFilters: DashboardFilter,
    currentFilters: DashboardFilter
): DashboardFilterChange[] {
    const changes = getPropertyFilterChanges(previousFilters, currentFilters)
    const previousHasDate = !!previousFilters.date_from || !!previousFilters.date_to || !!previousFilters.explicitDate
    const currentHasDate = !!currentFilters.date_from || !!currentFilters.date_to || !!currentFilters.explicitDate

    if (
        !dashboardFilterValuesEqual(previousFilters.date_from, currentFilters.date_from) ||
        !dashboardFilterValuesEqual(previousFilters.date_to, currentFilters.date_to) ||
        !dashboardFilterValuesEqual(previousFilters.explicitDate, currentFilters.explicitDate)
    ) {
        changes.push({
            kind: 'dateRange',
            label: i18n.t('dashboard.settingsChanges.filter.dateRange', { defaultValue: 'Date range' }),
            previousValue: previousHasDate ? [formatDateRange(previousFilters)] : [],
            value: currentHasDate ? [formatDateRange(currentFilters)] : [],
            status: getChangeStatus(previousHasDate, currentHasDate),
        })
    }

    if (!dashboardFilterValuesEqual(previousFilters.interval, currentFilters.interval)) {
        changes.push({
            kind: 'interval',
            label: i18n.t('dashboard.settingsChanges.filter.groupedBy', { defaultValue: 'Grouped by' }),
            previousValue: changeValue(formatInterval(previousFilters.interval)),
            value: changeValue(formatInterval(currentFilters.interval)),
            status: getChangeStatus(!!previousFilters.interval, !!currentFilters.interval),
        })
    }

    if (!dashboardFilterValuesEqual(previousFilters.breakdown_filter, currentFilters.breakdown_filter)) {
        const previousHasBreakdown =
            !!previousFilters.breakdown_filter?.breakdown || !!previousFilters.breakdown_filter?.breakdowns?.length
        const currentHasBreakdown =
            !!currentFilters.breakdown_filter?.breakdown || !!currentFilters.breakdown_filter?.breakdowns?.length
        changes.push({
            kind: 'breakdown',
            label: i18n.t('dashboard.settingsChanges.filter.breakdownBy', { defaultValue: 'Breakdown by' }),
            previousValue: previousHasBreakdown ? formatBreakdown(previousFilters) : [],
            value: currentHasBreakdown ? formatBreakdown(currentFilters) : [],
            status: getChangeStatus(previousHasBreakdown, currentHasBreakdown),
        })
    }

    if (!dashboardFilterValuesEqual(previousFilters.filterTestAccounts, currentFilters.filterTestAccounts)) {
        const previousHasTestAccountSetting =
            previousFilters.filterTestAccounts !== null && previousFilters.filterTestAccounts !== undefined
        const currentHasTestAccountSetting =
            currentFilters.filterTestAccounts !== null && currentFilters.filterTestAccounts !== undefined
        changes.push({
            kind: 'testAccounts',
            label: i18n.t('dashboard.settingsChanges.filter.testAccounts', { defaultValue: 'Test accounts' }),
            previousValue: previousHasTestAccountSetting
                ? [formatTestAccounts(previousFilters.filterTestAccounts)]
                : [],
            value: currentHasTestAccountSetting ? [formatTestAccounts(currentFilters.filterTestAccounts)] : [],
            status: getChangeStatus(previousHasTestAccountSetting, currentHasTestAccountSetting),
        })
    }

    return changes
}
