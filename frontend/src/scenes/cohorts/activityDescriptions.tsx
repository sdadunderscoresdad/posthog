import { Trans } from 'react-i18next'

import {
    ActivityChange,
    ActivityLogItem,
    ActivityLogUserName,
    ChangeMapping,
    Description,
    HumanizedChange,
    defaultDescriber,
    detectBoolean,
} from 'lib/components/ActivityLog/humanizeActivity'
import { SentenceList } from 'lib/components/ActivityLog/SentenceList'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

import { CohortType } from '~/types'

const nameOrLinkToCohort = (id?: string | null, name?: string | null): string | JSX.Element => {
    const displayName = name || i18n.t('cohortActivity.emptyName', { defaultValue: '(empty string)' })
    return id ? <Link to={urls.cohort(id)}>{displayName}</Link> : displayName
}

const countCohortCriteria = (filters: CohortType['filters'] | undefined): number => {
    const groups = filters?.properties?.values ?? []
    return groups.reduce((total, group) => {
        const values = (group as { values?: unknown[] })?.values
        return total + (Array.isArray(values) ? values.length : 0)
    }, 0)
}

const cohortFieldMapping: Record<string, (change?: ActivityChange) => ChangeMapping | null> = {
    name: function onName(change) {
        const before = change?.before as string | null | undefined
        const after = change?.after as string | null | undefined
        return {
            description: [
                <Trans
                    i18nKey="cohortActivity.renamed"
                    values={{
                        before: before || i18n.t('cohortActivity.emptyName', { defaultValue: '(empty string)' }),
                        after: after || i18n.t('cohortActivity.emptyName', { defaultValue: '(empty string)' }),
                    }}
                    components={{ Bold: <strong /> }}
                    defaults="renamed from <Bold>{{ before }}</Bold> to <Bold>{{ after }}</Bold>"
                />,
            ],
        }
    },
    description: function onDescription(change) {
        const before = (change?.before as string | null | undefined) || ''
        const after = (change?.after as string | null | undefined) || ''
        if (!before && after) {
            return { description: [i18n.t('cohortActivity.descriptionAdded', { defaultValue: 'added a description' })] }
        }
        if (before && !after) {
            return {
                description: [i18n.t('cohortActivity.descriptionCleared', { defaultValue: 'cleared the description' })],
            }
        }
        return {
            description: [i18n.t('cohortActivity.descriptionUpdated', { defaultValue: 'updated the description' })],
        }
    },
    filters: function onFilters(change) {
        const before = countCohortCriteria(change?.before as CohortType['filters'])
        const after = countCohortCriteria(change?.after as CohortType['filters'])
        if (before === after) {
            return {
                description: [
                    i18n.t('cohortActivity.criteriaUpdated', { defaultValue: 'updated the matching criteria' }),
                ],
            }
        }
        return {
            description: [
                <Trans
                    i18nKey="cohortActivity.criteriaChanged"
                    values={{ before, after }}
                    components={{ Bold: <strong /> }}
                    defaults="changed the matching criteria from <Bold>{{ before }}</Bold> to <Bold>{{ after }}</Bold>"
                />,
            ],
        }
    },
    query: function onQuery() {
        return { description: [i18n.t('cohortActivity.queryUpdated', { defaultValue: 'updated the cohort query' })] }
    },
    is_static: function onIsStatic(change) {
        const isStatic = detectBoolean(change?.after)
        return {
            description: [
                <Trans
                    i18nKey="cohortActivity.typeChanged"
                    values={{
                        type: isStatic
                            ? i18n.t('cohortActivity.static', { defaultValue: 'static' })
                            : i18n.t('cohortActivity.dynamic', { defaultValue: 'dynamic' }),
                    }}
                    components={{ Bold: <strong /> }}
                    defaults="changed the cohort type to <Bold>{{ type }}</Bold>"
                />,
            ],
        }
    },
    cohort_type: function onCohortType(change) {
        const after = change?.after as string | null | undefined
        if (!after) {
            return null
        }
        return {
            description: [
                <Trans
                    i18nKey="cohortActivity.typeChanged"
                    values={{ type: after }}
                    components={{ Bold: <strong /> }}
                    defaults="changed the cohort type to <Bold>{{ type }}</Bold>"
                />,
            ],
        }
    },
    groups: function onGroups() {
        return {
            description: [i18n.t('cohortActivity.criteriaUpdated', { defaultValue: 'updated the matching criteria' })],
        }
    },
    // fields that we don't want to surface (excluded on backend or noisy)
    id: () => null,
    team_id: () => null,
    deleted: () => null,
    created_by_id: () => null,
    created_at: () => null,
    last_error_at: () => null,
}

export function cohortActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope != 'Cohort') {
        console.error('cohort describer received a non-cohort activity')
        return { description: null }
    }

    const actor = <ActivityLogUserName logItem={logItem} />
    const cohortLink = nameOrLinkToCohort(logItem?.item_id, logItem?.detail.name)

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    {actor} {i18n.t('cohortActivity.created', { defaultValue: 'created the cohort:' })} {cohortLink}
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    {actor} {i18n.t('cohortActivity.deleted', { defaultValue: 'deleted the cohort:' })} {cohortLink}
                </>
            ),
        }
    }

    if (logItem.activity == 'restored') {
        return {
            description: (
                <>
                    {actor} {i18n.t('cohortActivity.restored', { defaultValue: 'restored the cohort:' })} {cohortLink}
                </>
            ),
        }
    }

    if (logItem.activity == 'persons_added_manually') {
        return {
            description: (
                <>
                    {actor} {i18n.t('cohortActivity.personsAdded', { defaultValue: 'added users to the cohort:' })}{' '}
                    {cohortLink}
                </>
            ),
        }
    }

    if (logItem.activity == 'person_removed_manually') {
        return {
            description: (
                <>
                    {actor}{' '}
                    {i18n.t('cohortActivity.personRemoved', { defaultValue: 'removed a user from the cohort:' })}{' '}
                    {cohortLink}
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        const detailChanges = logItem.detail.changes || []
        // is_static and cohort_type both render as "changed the cohort type to X" — when a flip
        // co-emits both, drop is_static so we don't print the line twice.
        const fieldsPresent = new Set(detailChanges.map((c) => c?.field))
        const changes: Description[] = []
        for (const change of detailChanges) {
            if (!change?.field) {
                continue
            }
            if (change.field === 'is_static' && fieldsPresent.has('cohort_type')) {
                continue
            }
            const handler = cohortFieldMapping[change.field]
            const result = handler ? handler(change) : null
            if (result?.description) {
                changes.push(...result.description)
            } else if (!handler) {
                // unknown field — surface it generically rather than dumping JSON
                changes.push(
                    <Trans
                        i18nKey="cohortActivity.updatedField"
                        values={{ field: change.field }}
                        components={{ Bold: <strong /> }}
                        defaults="updated <Bold>{{ field }}</Bold>"
                    />
                )
            }
        }

        if (changes.length) {
            return {
                description: (
                    <SentenceList
                        listParts={changes}
                        prefix={actor}
                        suffix={
                            <>
                                {asNotification
                                    ? i18n.t('cohortActivity.onCohort', { defaultValue: 'on the cohort ' })
                                    : i18n.t('cohortActivity.on', { defaultValue: 'on ' })}
                                {cohortLink}
                            </>
                        }
                    />
                ),
            }
        }

        return {
            description: (
                <>
                    {actor} {i18n.t('cohortActivity.updated', { defaultValue: 'updated the cohort:' })} {cohortLink}
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, cohortLink)
}
