import clsx from 'clsx'
import { deepEqual as equal } from 'fast-equals'
import { Trans } from 'react-i18next'
import { match } from 'ts-pattern'

import { ActivityChange } from 'lib/components/ActivityLog/humanizeActivity'
import { dayjs } from 'lib/dayjs'
import { i18n } from 'lib/i18n/i18n'
import { LemonTag } from 'lib/lemon-ui/LemonTag'
import { Link } from 'lib/lemon-ui/Link'
import { getExposureConfigDisplayName } from 'scenes/experiments/utils'
import { urls } from 'scenes/urls'

import type { ExperimentExposureCriteria, ExperimentMetric } from '~/queries/schema/schema-general'
import { Experiment, ExperimentConclusion } from '~/types'

import { CONCLUSION_DISPLAY_CONFIG } from 'products/experiments/frontend/constants'

import { ActivityClause, clause, describeUnknownFieldChange } from './clauses'
import { getMetricChanges } from './metricChangeDescriptions'

const ExperimentConclusionTag = ({ conclusion }: { conclusion: ExperimentConclusion }): JSX.Element => (
    <div className="font-semibold inline-flex items-center gap-2">
        <div className={clsx('w-2 h-2 rounded-full', CONCLUSION_DISPLAY_CONFIG[conclusion]?.color || '')} />
        <span>{CONCLUSION_DISPLAY_CONFIG[conclusion]?.title || conclusion}</span>
    </div>
)

/**
 * if an id is provided, it returns a link to the experiemt. Otherwise, just the name.
 */
export const nameOrLinkToExperiment = (name: string | null, id?: string): JSX.Element | string => {
    if (id) {
        return <Link to={urls.experiment(id)}>{name}</Link>
    }
    return name || i18n.t('experimentActivity.unknownName', { defaultValue: '(unknown)' })
}

/**
 * we pick the allowed properties, and shoehorn in deleted because it's missing from the type
 */
type AllowedExperimentFields = Pick<
    Experiment,
    | 'conclusion'
    | 'conclusion_comment'
    | 'status'
    | 'start_date'
    | 'end_date'
    | 'metrics'
    | 'metrics_secondary'
    | 'exposure_criteria'
    | 'parameters'
    | 'running_time_calculation'
    | 'excluded_variants'
    | 'primary_metrics_ordered_uuids'
    | 'secondary_metrics_ordered_uuids'
> & {
    deleted: boolean
}

const RUNNING_TIME_CALCULATION_KEYS = [
    'minimum_detectable_effect',
    'recommended_running_time',
    'recommended_sample_size',
    'exposure_estimate_config',
]

/** Strip the running-time calculator keys, which are mirrored into `parameters` while that field is deprecated. */
function withoutRunningTimeCalculationKeys(value: unknown): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries((value as Record<string, unknown> | null) ?? {}).filter(
            ([key]) => !RUNNING_TIME_CALCULATION_KEYS.includes(key)
        )
    )
}

const DERIVED_RUNNING_TIME_KEYS = ['recommended_running_time', 'recommended_sample_size']

/** Strip the derived calculator outputs so only deliberate input edits (MDE, exposure estimate) count. */
function withoutDerivedRunningTimeKeys(value: unknown): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries((value as Record<string, unknown> | null) ?? {}).filter(
            ([key]) => !DERIVED_RUNNING_TIME_KEYS.includes(key)
        )
    )
}

function describeExcludedVariantsChange(before: string[] | undefined, after: string[] | undefined): string | null {
    const beforeSet = new Set(before ?? [])
    const afterSet = new Set(after ?? [])
    const added = [...afterSet].filter((k) => !beforeSet.has(k))
    const removed = [...beforeSet].filter((k) => !afterSet.has(k))

    if (added.length === 0 && removed.length === 0) {
        return null
    }
    const parts: string[] = []
    if (added.length === 1) {
        parts.push(
            i18n.t('experimentActivity.excludedVariant.added', {
                defaultValue: 'excluded variant {{ variant }} from analysis',
                variant: added[0],
            })
        )
    } else if (added.length > 1) {
        parts.push(
            i18n.t('experimentActivity.excludedVariant.addedMultiple', {
                defaultValue: 'excluded variants {{ variants }} from analysis',
                variants: added.join(', '),
            })
        )
    }
    if (removed.length === 1) {
        parts.push(
            i18n.t('experimentActivity.excludedVariant.removed', {
                defaultValue: 're-included variant {{ variant }} in analysis',
                variant: removed[0],
            })
        )
    } else if (removed.length > 1) {
        parts.push(
            i18n.t('experimentActivity.excludedVariant.removedMultiple', {
                defaultValue: 're-included variants {{ variants }} in analysis',
                variants: removed.join(', '),
            })
        )
    }
    return parts.join(i18n.t('experimentActivity.and', { defaultValue: ' and ' }))
}

/**
 * Detect a pure metric reorder. Returns the description only when the two
 * arrays contain the same set of UUIDs in a different order — additions,
 * removals, and swaps are described by the `metrics` field matcher instead.
 */
const describeMetricReorder = (before: unknown, after: unknown, description: string): string | null => {
    const b = (before as string[] | null) ?? []
    const a = (after as string[] | null) ?? []
    if (equal(b, a) || !equal([...b].sort(), [...a].sort())) {
        return null
    }
    return description
}

export const getExperimentChangeDescription = (experimentChange: ActivityChange): ActivityClause[] | null => {
    /**
     * a little type assertion to force field into the allowed experiment fields
     */
    return match(experimentChange as ActivityChange & { field: keyof AllowedExperimentFields })
        .with({ field: 'start_date' }, ({ action, before, after }) => {
            /**
             * id start date is created, the experiment has been launched
             */
            if (action === 'created' && before === null && after !== null) {
                return [
                    clause(i18n.t('experimentActivity.experiment.launched', { defaultValue: 'launched experiment:' })),
                ]
            }

            /**
             * if start date has changed, we report how much time was added or removed
             */
            if (action === 'changed' && before !== null && after !== null) {
                const beforeDate = dayjs(before as string)
                const afterDate = dayjs(after as string)

                if (beforeDate.isValid() && afterDate.isValid()) {
                    const diff = afterDate.diff(beforeDate, 'minute')
                    const duration = dayjs.duration(Math.abs(diff), 'minute').humanize()
                    const moved =
                        diff > 0
                            ? i18n.t('experimentActivity.experiment.movedStartDateForward', {
                                  defaultValue: 'moved the start date forward by {{ duration }}',
                                  duration,
                              })
                            : i18n.t('experimentActivity.experiment.movedStartDateBack', {
                                  defaultValue: 'moved the start date back by {{ duration }}',
                                  duration,
                              })

                    return [clause(moved, 'for')]
                }
            }

            return [
                clause(
                    i18n.t('experimentActivity.experiment.changedStartDate', {
                        defaultValue: 'changed the start date',
                    }),
                    'for'
                ),
            ]
        })
        .with({ field: 'end_date' }, ({ action, before, after }) => {
            /**
             * if end date is created, the experiment has been stopped
             */
            if (action === 'created' && before === null && after !== null) {
                return [
                    clause(
                        i18n.t('experimentActivity.experiment.stopped', { defaultValue: 'stopped experiment' }),
                        'for'
                    ),
                ]
            }

            return [
                clause(
                    i18n.t('experimentActivity.experiment.changedEndDate', { defaultValue: 'changed the end date' }),
                    'for'
                ),
            ]
        })
        .with({ field: 'conclusion' }, ({ action, before, after }) => {
            /**
             * if conclusion was creted, the experiment was closed. This is usually
             * acompanied by the end date creation
             */
            if (action === 'created' && before === null) {
                return [
                    clause(
                        <Trans
                            i18nKey="experimentActivity.experiment.completedItAs"
                            components={{
                                Conclusion: <ExperimentConclusionTag conclusion={after as ExperimentConclusion} />,
                            }}
                            defaults="completed it as <Conclusion></Conclusion>:"
                        />
                    ),
                ]
            }

            if (action === 'changed' && after !== null) {
                return [
                    clause(
                        <Trans
                            i18nKey="experimentActivity.experiment.changedConclusionTo"
                            components={{
                                Conclusion: <ExperimentConclusionTag conclusion={after as ExperimentConclusion} />,
                            }}
                            defaults="changed the conclusion to <Conclusion></Conclusion>"
                        />,
                        'for'
                    ),
                ]
            }

            return [
                clause(
                    i18n.t('experimentActivity.experiment.changedConclusion', {
                        defaultValue: 'changed the conclusion',
                    }),
                    'for'
                ),
            ]
        })
        .with({ field: 'metrics', action: 'created', before: null }, () => [
            clause(i18n.t('experimentActivity.metric.addedTheFirst', { defaultValue: 'added the first metric' }), 'to'),
        ])
        .with({ field: 'metrics', action: 'changed' }, ({ before, after }) =>
            getMetricChanges(before as ExperimentMetric[], after as ExperimentMetric[])
        )
        .with({ field: 'metrics_secondary', action: 'changed' }, ({ before, after }) =>
            getMetricChanges(before as ExperimentMetric[], after as ExperimentMetric[])
        )
        .with({ field: 'primary_metrics_ordered_uuids', action: 'changed' }, ({ before, after }) => {
            const reordered = describeMetricReorder(
                before,
                after,
                i18n.t('experimentActivity.metric.reorderedPrimary', {
                    defaultValue: 'reordered the primary metrics',
                })
            )
            return reordered ? [clause(reordered, 'for')] : null
        })
        .with({ field: 'secondary_metrics_ordered_uuids', action: 'changed' }, ({ before, after }) => {
            const reordered = describeMetricReorder(
                before,
                after,
                i18n.t('experimentActivity.metric.reorderedSecondary', {
                    defaultValue: 'reordered the secondary metrics',
                })
            )
            return reordered ? [clause(reordered, 'for')] : null
        })
        .with({ field: 'exposure_criteria' }, ({ before, after }) => {
            /**
             * exposure criteria is by default `{filter_test_accounts: true}`,
             * meaning that we use `feature_flag_called` as the event and
             * first seen as the varian handling.
             *
             * if the experiment has a `null` exposure criteria, a created action is logged.
             */
            const typedAfter = after as ExperimentExposureCriteria
            const typedBefore = before as ExperimentExposureCriteria

            const changes: (ActivityClause | null)[] = Object.keys(after || {}).map((key) =>
                match(key as keyof ExperimentExposureCriteria)
                    .with('filterTestAccounts', () => {
                        if (typedAfter?.filterTestAccounts === typedBefore?.filterTestAccounts) {
                            return null
                        }

                        return typedAfter?.filterTestAccounts
                            ? clause(
                                  i18n.t('experimentActivity.exposure.addedTestAccountFilter', {
                                      defaultValue: 'added the test account filter',
                                  }),
                                  'to'
                              )
                            : clause(
                                  i18n.t('experimentActivity.exposure.removedTestAccountFilter', {
                                      defaultValue: 'removed the test account filter',
                                  }),
                                  'from'
                              )
                    })
                    .with('multiple_variant_handling', () => {
                        if (typedAfter?.multiple_variant_handling === typedBefore?.multiple_variant_handling) {
                            return null
                        }

                        return typedAfter?.multiple_variant_handling === 'first_seen'
                            ? clause(
                                  i18n.t('experimentActivity.exposure.variantHandlingFirstSeen', {
                                      defaultValue: 'changed the variant handling to "first seen"',
                                  }),
                                  'for'
                              )
                            : clause(
                                  i18n.t('experimentActivity.exposure.variantHandlingExcludeFromAnalysis', {
                                      defaultValue: 'changed the variant handling to "exclude from analysis"',
                                  }),
                                  'for'
                              )
                    })
                    .with('exposure_config', () => {
                        const afterConfig = typedAfter?.exposure_config
                        const beforeConfig = typedBefore?.exposure_config

                        if (equal(afterConfig, beforeConfig)) {
                            return null
                        }

                        if (afterConfig) {
                            const displayName = getExposureConfigDisplayName(afterConfig)
                            return clause(
                                <Trans
                                    i18nKey="experimentActivity.exposure.setExposureConfiguration"
                                    values={{ config: displayName }}
                                    components={{ Config: <LemonTag color="purple">{null}</LemonTag> }}
                                    defaults="set the exposure configuration to <Config>{{ config }}</Config>"
                                />,
                                'to'
                            )
                        }
                        return null
                    })
                    .with('activation_config', () => {
                        const afterConfig = typedAfter?.activation_config
                        const beforeConfig = typedBefore?.activation_config

                        if (equal(afterConfig, beforeConfig)) {
                            return null
                        }

                        if (afterConfig) {
                            const displayName = getExposureConfigDisplayName(afterConfig)
                            return clause(
                                <Trans
                                    i18nKey="experimentActivity.exposure.setActivationEvent"
                                    values={{ config: displayName }}
                                    components={{ Config: <LemonTag color="purple">{null}</LemonTag> }}
                                    defaults="set the activation event to <Config>{{ config }}</Config>"
                                />,
                                'to'
                            )
                        }
                        return null
                    })
                    .exhaustive()
            )

            // Check if exposure_config was removed (returning to default)
            if (typedBefore?.exposure_config && !typedAfter?.exposure_config) {
                changes.push(
                    clause(
                        <Trans
                            i18nKey="experimentActivity.exposure.setExposureConfigurationDefault"
                            components={{ Config: <LemonTag color="purple">{null}</LemonTag> }}
                            defaults="set the exposure configuration to the <Config>$feature_flag_called</Config> default"
                        />,
                        'to'
                    )
                )
            }
            if (typedBefore?.activation_config && !typedAfter?.activation_config) {
                changes.push(
                    clause(
                        i18n.t('experimentActivity.exposure.removedActivationEvent', {
                            defaultValue: 'removed the activation event',
                        }),
                        'from'
                    )
                )
            }

            return changes.filter(Boolean) as ActivityClause[]
        })
        .with({ field: 'parameters' }, ({ before, after }) => {
            const summary = describeExcludedVariantsChange(
                (before as { excluded_variants?: string[] } | null)?.excluded_variants,
                (after as { excluded_variants?: string[] } | null)?.excluded_variants
            )
            if (summary) {
                return [clause(summary, 'for')]
            }
            // A pure calculator-key sync is already described by the running_time_calculation change
            if (equal(withoutRunningTimeCalculationKeys(before), withoutRunningTimeCalculationKeys(after))) {
                return null
            }
            return [
                clause(
                    i18n.t('experimentActivity.experiment.updatedParameters', { defaultValue: 'updated parameters' }),
                    'for'
                ),
            ]
        })
        .with({ field: 'running_time_calculation' }, ({ before, after }) => {
            // Opening the calculator re-saves the recomputed outputs, so they drift as exposure
            // data changes — a row only earns its place when a calculator input was edited.
            if (equal(withoutDerivedRunningTimeKeys(before), withoutDerivedRunningTimeKeys(after))) {
                return null
            }
            return [
                clause(
                    i18n.t('experimentActivity.experiment.updatedRunningTimeCalculation', {
                        defaultValue: 'updated the running time calculation',
                    }),
                    'for'
                ),
            ]
        })
        .with({ field: 'excluded_variants' }, () => {
            // The change is described by the `parameters` matcher, which the backend keeps
            // mirrored while `parameters` is deprecated — avoid a duplicate line.
            return null
        })
        .with({ field: 'status' }, () => {
            // Status only moves together with a lifecycle change (launch, stop, pause), and those
            // already produce their own descriptions, so an "updated status" clause adds nothing.
            return null
        })
        .with({ field: 'conclusion_comment' }, () => {
            // The describer renders the comment text as the row's extended description instead.
            return null
        })
        .otherwise(({ field, action }) => {
            // Fallback for unhandled fields - ensures all activity is visible
            return describeUnknownFieldChange(field, action)
        })
}
