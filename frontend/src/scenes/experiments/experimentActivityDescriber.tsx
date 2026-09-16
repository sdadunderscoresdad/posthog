import { Trans } from 'react-i18next'
import { match } from 'ts-pattern'

import { ActivityLogItem, ActivityLogUserName, HumanizedChange } from 'lib/components/ActivityLog/humanizeActivity'
import { SentenceList } from 'lib/components/ActivityLog/SentenceList'
import { i18n } from 'lib/i18n/i18n'

import { ExperimentStatus } from '~/types'

import { StatusTag } from 'products/experiments/frontend/components/StatusTag'

import {
    getExperimentChangeDescription,
    getHoldoutChangeDescription,
    getSharedMetricChangeDescription,
    nameOrLinkToExperiment,
    nameOrLinkToSharedMetric,
} from './activity-descriptions'
import { ActivityClause, clause, clauseLinkText, splitClauses } from './activity-descriptions/clauses'

/** The name of the experiment an activity happened on, when only the relation is known. */
function experimentLabel(): string {
    return i18n.t('experimentActivity.theExperiment', { defaultValue: 'experiment' })
}

/**
 * Renders change clauses as a sentence. The link of the last clause is what carries the sentence
 * into the item it changed, so that "changed A, removed B, and changed C" ends in "for Experiment".
 */
function ClauseSentence({
    logItem,
    clauses,
    suffix,
}: {
    logItem: ActivityLogItem
    clauses: ActivityClause[]
    suffix: string | JSX.Element | null
}): JSX.Element {
    const { parts, link } = splitClauses(clauses)
    return (
        <SentenceList
            prefix={<ActivityLogUserName logItem={logItem} />}
            listParts={parts}
            suffix={
                link ? (
                    <>
                        {clauseLinkText(link)} {suffix}
                    </>
                ) : (
                    suffix
                )
            }
        />
    )
}

const UnknownAction = ({ logItem }: { logItem: ActivityLogItem }): JSX.Element => (
    <ClauseSentence
        logItem={logItem}
        clauses={[
            clause(i18n.t('experimentActivity.unknownAction', { defaultValue: 'performed an unknown action' }), 'on'),
        ]}
        suffix={nameOrLinkToExperiment(logItem.detail.name, logItem.item_id)}
    />
)

export const experimentActivityDescriber = (logItem: ActivityLogItem): HumanizedChange => {
    /**
     * Item types: `shared_metric`, `saved_metric_config`, `holdout`, or the `null` default for experiments.
     */
    const isSharedMetric = logItem.detail.type === 'shared_metric'

    return match(logItem)
        .with({ activity: 'created', detail: { type: 'saved_metric_config' } }, () => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                <>
                                    {i18n.t('experimentActivity.savedMetric.added', {
                                        defaultValue: 'added shared metric',
                                    })}{' '}
                                    <strong>{logItem.detail.name}</strong>
                                </>,
                                'to'
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(experimentLabel(), logItem.item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'updated', detail: { type: 'saved_metric_config' } }, () => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                <>
                                    {i18n.t('experimentActivity.savedMetric.updatedConfiguration', {
                                        defaultValue: 'updated configuration for shared metric',
                                    })}{' '}
                                    <strong>{logItem.detail.name}</strong>
                                </>,
                                'on'
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(experimentLabel(), logItem.item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'created', detail: { type: 'holdout' } }, () => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.holdout.created', {
                                    defaultValue: 'created a new experiment holdout:',
                                })
                            ),
                        ]}
                        suffix={<strong>{logItem.detail.name}</strong>}
                    />
                ),
            }
        })
        .with({ activity: 'created' }, () => {
            /**
             * we handle both experiments and shared metrics creation here.
             */
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            isSharedMetric
                                ? clause(
                                      i18n.t('experimentActivity.sharedMetric.created', {
                                          defaultValue: 'created a new shared metric:',
                                      })
                                  )
                                : clause(
                                      <Trans
                                          i18nKey="experimentActivity.experiment.created"
                                          components={{ Status: <StatusTag status={ExperimentStatus.Draft} /> }}
                                          defaults="created a new <Status></Status> experiment:"
                                      />
                                  ),
                        ]}
                        suffix={(isSharedMetric ? nameOrLinkToSharedMetric : nameOrLinkToExperiment)(
                            logItem.detail.name,
                            logItem.item_id
                        )}
                    />
                ),
            }
        })
        .with({ activity: 'updated', detail: { changes: [{ field: 'deleted', before: false, after: true }] } }, () => {
            /**
             * Experiment deletion is a spacial case of `updated`. If `deleted` has been changed
             * from false to true, the experiment has been deleted.
             */
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.experiment.deleted', { defaultValue: 'deleted experiment:' })
                            ),
                        ]}
                        suffix={logItem.detail.name}
                    />
                ),
            }
        })
        .with({ activity: 'deleted', detail: { type: 'saved_metric_config' } }, () => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                <>
                                    {i18n.t('experimentActivity.savedMetric.removed', {
                                        defaultValue: 'removed shared metric',
                                    })}{' '}
                                    <strong>{logItem.detail.name}</strong>
                                </>,
                                'from'
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(experimentLabel(), logItem.item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'deleted', detail: { type: 'shared_metric' } }, () => {
            /**
             * Shared metrics are not soft deleted.
             */
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.sharedMetric.deleted', {
                                    defaultValue: 'deleted shared metric:',
                                })
                            ),
                        ]}
                        suffix={logItem.detail.name}
                    />
                ),
            }
        })
        .with({ activity: 'deleted', detail: { type: 'holdout' } }, () => {
            /**
             * Holdouts are not soft deleted.
             */
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.holdout.deleted', {
                                    defaultValue: 'deleted experiment holdout:',
                                })
                            ),
                        ]}
                        suffix={<strong>{logItem.detail.name}</strong>}
                    />
                ),
            }
        })
        .with({ activity: 'deleted' }, ({ item_id, detail }) => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.experiment.deleted', { defaultValue: 'deleted experiment:' })
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(detail.name, item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'restored' }, ({ item_id, detail }) => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.experiment.restored', {
                                    defaultValue: 'restored experiment:',
                                })
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(detail.name, item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'paused' }, ({ item_id, detail }) => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.experiment.paused', { defaultValue: 'paused experiment:' })
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(detail.name, item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'resumed' }, ({ item_id, detail }) => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.experiment.resumed', {
                                    defaultValue: 'resumed experiment:',
                                })
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(detail.name, item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'exposure_frozen' }, ({ item_id, detail }) => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.experiment.frozeExposure', {
                                    defaultValue: 'froze exposure',
                                }),
                                'for'
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(detail.name, item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'exposure_unfrozen' }, ({ item_id, detail }) => {
            return {
                description: (
                    <ClauseSentence
                        logItem={logItem}
                        clauses={[
                            clause(
                                i18n.t('experimentActivity.experiment.unfrozeExposure', {
                                    defaultValue: 'unfroze exposure',
                                }),
                                'for'
                            ),
                        ]}
                        suffix={nameOrLinkToExperiment(detail.name, item_id)}
                    />
                ),
            }
        })
        .with({ activity: 'updated' }, ({ item_id, detail: updateLogDetail }) => {
            /**
             * This is the catch all for all experiment updates
             */
            const changes = updateLogDetail.changes || []

            const isExperiment =
                updateLogDetail.type !== 'shared_metric' &&
                updateLogDetail.type !== 'holdout' &&
                updateLogDetail.type !== 'saved_metric_config'

            const conclusionCommentChange = isExperiment
                ? changes.find((change) => change.field === 'conclusion_comment')
                : undefined
            const conclusionComment =
                typeof conclusionCommentChange?.after === 'string' && conclusionCommentChange.after.trim()
                    ? conclusionCommentChange.after
                    : undefined
            const conclusionCommentRemoved =
                !conclusionComment &&
                typeof conclusionCommentChange?.before === 'string' &&
                Boolean(conclusionCommentChange.before.trim())

            let clauses: ActivityClause[]
            if (changes.length === 0) {
                clauses = [clause(i18n.t('experimentActivity.updated', { defaultValue: 'updated' }))]
            } else if (isExperiment) {
                // Flatten each change into its clauses. Only the last clause carries the link into
                // the experiment, so the sentence reads "changed A, changed B, and changed C for
                // Experiment" instead of repeating the link inside every clause.
                clauses = changes.flatMap((change) => getExperimentChangeDescription(change) ?? [])
            } else {
                clauses = changes.flatMap(
                    (change) =>
                        match(updateLogDetail.type)
                            .with('shared_metric', () => getSharedMetricChangeDescription(change))
                            .with('holdout', () => getHoldoutChangeDescription(change))
                            .otherwise(() => null) ?? []
                )
            }

            if (isExperiment && changes.length > 0 && clauses.length === 0) {
                if (conclusionComment) {
                    // A comment-only edit still gets a row; the comment renders below it.
                    clauses = [
                        clause(
                            i18n.t('experimentActivity.experiment.changedConclusion', {
                                defaultValue: 'changed the conclusion',
                            }),
                            'for'
                        ),
                    ]
                } else if (conclusionCommentRemoved) {
                    clauses = [
                        clause(
                            i18n.t('experimentActivity.conclusionComment.removed', {
                                defaultValue: 'removed the conclusion comment',
                            }),
                            'from'
                        ),
                    ]
                } else {
                    // humanize() skips log items with a null description
                    return { description: null }
                }
            }

            const suffix = match(updateLogDetail.type)
                .with('shared_metric', () => nameOrLinkToSharedMetric(updateLogDetail.name, item_id))
                .with('holdout', () => <strong>{updateLogDetail.name}</strong>)
                .otherwise(() => nameOrLinkToExperiment(updateLogDetail.name, item_id))

            return {
                description: <ClauseSentence logItem={logItem} clauses={clauses} suffix={suffix} />,
                extendedDescription: conclusionComment ? (
                    <blockquote className="border-l-2 pl-2 text-secondary">{conclusionComment}</blockquote>
                ) : undefined,
            }
        })
        .otherwise(() => {
            return {
                description: <UnknownAction logItem={logItem} />,
            }
        })
}
