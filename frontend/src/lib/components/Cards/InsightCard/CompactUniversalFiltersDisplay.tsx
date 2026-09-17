import './InsightDetails.scss'

import { useValues } from 'kea'
import React from 'react'

import {
    PROPERTY_FILTER_TYPE_TO_TAXONOMIC_FILTER_GROUP_TYPE,
    formatPropertyLabel,
    isAnyPropertyfilter,
    isCohortPropertyFilter,
    isPropertyFilterWithOperator,
} from 'lib/components/PropertyFilters/utils'
import { PropertyKeyInfo } from 'lib/components/PropertyKeyInfo'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { Tooltip } from 'lib/lemon-ui/Tooltip'
import { allOperatorsMapping } from 'lib/utils/operators'
import { capitalizeFirstLetter } from 'lib/utils/strings'
import { urls } from 'scenes/urls'

import { cohortsModel } from '~/models/cohortsModel'
import { propertyDefinitionsModel } from '~/models/propertyDefinitionsModel'
import {
    ActionFilter,
    AnyPropertyFilter,
    FilterLogicalOperator,
    PropertyFilterBaseValue,
    PropertyGroupFilter,
    UniversalFiltersGroup,
    UniversalFiltersGroupValue,
} from '~/types'

function isActionFilter(filter: UniversalFiltersGroupValue): filter is ActionFilter & { type: 'actions' } {
    return (filter as ActionFilter).type === 'actions' && 'id' in filter
}

function isEventFilter(filter: UniversalFiltersGroupValue): filter is ActionFilter & { type: 'events' } {
    // Yeah, it's a legacy mess, ActionFilter actually means a few different things
    return (filter as ActionFilter).type === 'events' && 'id' in filter
}

function isUniversalFiltersGroup(value: UniversalFiltersGroupValue): value is UniversalFiltersGroup {
    return (value as UniversalFiltersGroup).type !== undefined && (value as UniversalFiltersGroup).values !== undefined
}

// A filter value can be a number, boolean, etc.; render it as text with the full value on hover, since
// long values (e.g. URLs) are truncated to one line.
function PropertyValueDisplay({ value }: { value: PropertyFilterBaseValue }): JSX.Element {
    return (
        <Tooltip title={String(value)}>
            <code className="SeriesDisplay__value">{String(value)}</code>
        </Tooltip>
    )
}

export function CompactUniversalFiltersDisplay({
    groupFilter,
    embedded,
}: {
    groupFilter: UniversalFiltersGroup | PropertyGroupFilter | null
    embedded?: boolean
}): JSX.Element {
    const { cohortsById } = useValues(cohortsModel)
    const { formatPropertyValueForDisplay } = useValues(propertyDefinitionsModel)

    if (!groupFilter || !groupFilter.values?.length) {
        return <i>{i18n.t('insightFilters.none', { defaultValue: 'None' })}</i>
    }

    return (
        <>
            {groupFilter.values.map((filterOrGroup, index) => {
                const isFirstFilterOverall = index === 0
                if (isUniversalFiltersGroup(filterOrGroup)) {
                    // Nested group
                    return (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <em className="text-[11px] font-semibold leading-5">
                                    {groupFilter.type === FilterLogicalOperator.Or ? 'OR' : 'AND'}
                                </em>
                            )}
                            <CompactUniversalFiltersDisplay groupFilter={filterOrGroup} embedded={embedded} />
                        </React.Fragment>
                    )
                }

                if (isActionFilter(filterOrGroup) || isEventFilter(filterOrGroup)) {
                    return (
                        <div key={index} className="SeriesDisplay__condition">
                            <span>
                                {embedded && index === 0
                                    ? i18n.t('insightFilters.where', { defaultValue: 'where' }) + ' '
                                    : null}
                                {index > 0
                                    ? groupFilter.type === FilterLogicalOperator.Or
                                        ? i18n.t('insightFilters.or', { defaultValue: 'or' }) + ' '
                                        : i18n.t('insightFilters.and', { defaultValue: 'and' }) + ' '
                                    : null}
                                {isActionFilter(filterOrGroup) ? (
                                    <>
                                        {isFirstFilterOverall
                                            ? i18n.t('insightFilters.performedActionCapitalized', {
                                                  defaultValue: 'Performed action',
                                              })
                                            : i18n.t('insightFilters.performedAction', {
                                                  defaultValue: 'performed action',
                                              })}
                                        <Link
                                            to={urls.action(filterOrGroup.id as number)}
                                            className="SeriesDisplay__raw-name SeriesDisplay__raw-name--action"
                                        >
                                            {filterOrGroup.name || filterOrGroup.id}
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        {isFirstFilterOverall
                                            ? i18n.t('insightFilters.hadEventCapitalized', {
                                                  defaultValue: 'Had event',
                                              })
                                            : i18n.t('insightFilters.hadEvent', { defaultValue: 'had event' })}
                                        <span className="SeriesDisplay__raw-name SeriesDisplay__raw-name--event">
                                            <PropertyKeyInfo
                                                value={filterOrGroup.id as string}
                                                type={TaxonomicFilterGroupType.Events}
                                            />
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>
                    )
                }
                const propertyFilter = filterOrGroup as AnyPropertyFilter

                // Property filter
                return (
                    <div key={index} className="SeriesDisplay__condition">
                        <span>
                            {isFirstFilterOverall && embedded
                                ? i18n.t('insightFilters.where', { defaultValue: 'where' }) + ' '
                                : null}
                            {index > 0 ? (
                                <strong>
                                    {groupFilter.type === FilterLogicalOperator.Or
                                        ? i18n.t('insightFilters.or', { defaultValue: 'or' }) + ' '
                                        : i18n.t('insightFilters.and', { defaultValue: 'and' }) + ' '}
                                </strong>
                            ) : null}
                            {isCohortPropertyFilter(propertyFilter) ? (
                                <>
                                    {isFirstFilterOverall && !embedded
                                        ? i18n.t('insightFilters.personBelongsToCohortCapitalized', {
                                              defaultValue: 'Person belongs to cohort',
                                          })
                                        : i18n.t('insightFilters.personBelongsToCohort', {
                                              defaultValue: 'person belongs to cohort',
                                          })}
                                    <span className="SeriesDisplay__raw-name">
                                        {formatPropertyLabel(
                                            propertyFilter,
                                            cohortsById,
                                            (s) =>
                                                formatPropertyValueForDisplay(propertyFilter.key, s)?.toString() || '?'
                                        )}
                                    </span>
                                </>
                            ) : (
                                <>
                                    {isFirstFilterOverall && !embedded
                                        ? capitalizeFirstLetter(propertyFilter.type || 'event')
                                        : propertyFilter.type || 'event'}
                                    's
                                    <span className="SeriesDisplay__raw-name">
                                        {isAnyPropertyfilter(propertyFilter) && propertyFilter.key && (
                                            <PropertyKeyInfo
                                                value={propertyFilter.key}
                                                type={
                                                    PROPERTY_FILTER_TYPE_TO_TAXONOMIC_FILTER_GROUP_TYPE[
                                                        propertyFilter.type
                                                    ]
                                                }
                                            />
                                        )}
                                    </span>
                                    <em>
                                        {
                                            allOperatorsMapping[
                                                (isPropertyFilterWithOperator(propertyFilter) &&
                                                    propertyFilter.operator) ||
                                                    'exact'
                                            ]
                                        }
                                    </em>{' '}
                                    {isAnyPropertyfilter(propertyFilter) &&
                                        (Array.isArray(propertyFilter.value) ? (
                                            propertyFilter.value.map((subValue, index) => (
                                                <React.Fragment key={index}>
                                                    <PropertyValueDisplay value={subValue} />
                                                    {index <
                                                        (propertyFilter.value as PropertyFilterBaseValue[]).length -
                                                            1 &&
                                                        ` ${i18n.t('insightFilters.or', {
                                                            defaultValue: 'or',
                                                        })} `}
                                                </React.Fragment>
                                            ))
                                        ) : propertyFilter.value != undefined ? (
                                            <PropertyValueDisplay value={propertyFilter.value} />
                                        ) : null)}
                                </>
                            )}
                        </span>
                    </div>
                )
            })}
        </>
    )
}
