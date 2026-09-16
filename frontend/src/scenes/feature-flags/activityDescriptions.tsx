import { Fragment } from 'react'
import { Trans } from 'react-i18next'

import {
    ActivityChange,
    ActivityLogItem,
    ActivityLogUserName,
    ChangeMapping,
    Description,
    ExpandedView,
    HumanizedChange,
    defaultDescriber,
    detectBoolean,
} from 'lib/components/ActivityLog/humanizeActivity'
import { SentenceList } from 'lib/components/ActivityLog/SentenceList'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { PropertyFilterButton } from 'lib/components/PropertyFilters/components/PropertyFilterButton'
import { getActiveLocale, i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

import { FeatureFlagEvaluationRuntime, FeatureFlagFilters, FeatureFlagGroupType, FeatureFlagType } from '~/types'

import { FeatureFlagReleaseConditionsChange } from 'products/feature_flags/frontend/FeatureFlagReleaseConditionsChange'
import {
    ConditionSetAspect,
    ConditionSetChange,
    changedAspects,
    diffReleaseConditionSets,
    rolloutOf,
} from 'products/feature_flags/frontend/releaseConditionsDiff'

const getChangedPayloadKeys = (
    filtersBefore: FeatureFlagFilters | undefined,
    filtersAfter: FeatureFlagFilters
): string[] =>
    Object.keys(filtersAfter.payloads ?? {}).filter((key) => {
        const before = filtersBefore?.payloads?.[key]?.toString() || null
        const after = filtersAfter.payloads?.[key]?.toString() || null
        return before !== after
    })

const nameOrLinkToFlag = (id: string | undefined, name: string | null | undefined): string | JSX.Element => {
    const displayName = name || i18n.t('featureFlagActivity.emptyName', { defaultValue: '(empty string)' })
    return id ? <Link to={urls.featureFlag(id)}>{displayName}</Link> : displayName
}

const getRuntimeLabel = (runtime: string): string => {
    switch (runtime) {
        case FeatureFlagEvaluationRuntime.ALL:
            return i18n.t('featureFlagActivity.evaluationRuntime.all', { defaultValue: 'both client and server' })
        case FeatureFlagEvaluationRuntime.CLIENT:
            return i18n.t('featureFlagActivity.evaluationRuntime.client', { defaultValue: 'client-side only' })
        case FeatureFlagEvaluationRuntime.SERVER:
            return i18n.t('featureFlagActivity.evaluationRuntime.server', { defaultValue: 'server-side only' })
        default:
            return runtime
    }
}

const rolloutLabel = (rollout: number): JSX.Element => <strong className="tabular-nums">{rollout}%</strong>

const conditionSetLabel = (group: FeatureFlagGroupType): JSX.Element => {
    if (group.description) {
        return <strong>"{group.description}"</strong>
    }
    const properties = group.properties ?? []
    if (properties.length === 0) {
        return (
            <strong>
                {group.aggregation_group_type_index != null
                    ? i18n.t('featureFlagActivity.allGroups', { defaultValue: 'all groups' })
                    : i18n.t('featureFlagActivity.allUsers', { defaultValue: 'all users' })}
            </strong>
        )
    }
    return (
        <>
            <PropertyFilterButton item={properties[0]} />
            {properties.length > 1 && (
                <span className="text-muted">
                    {' '}
                    {i18n.t('featureFlagActivity.moreConditions', {
                        count: properties.length - 1,
                        defaultValue_one: 'and {{ count }} more condition',
                        defaultValue_other: 'and {{ count }} more conditions',
                    })}
                </span>
            )}
        </>
    )
}

const joinInline = (parts: JSX.Element[]): JSX.Element => (
    <>
        {parts.map((part, index) => (
            <Fragment key={index}>
                {index > 0 &&
                    (index === parts.length - 1
                        ? ` ${i18n.t('activityLog.listConjunction', { defaultValue: 'and' })} `
                        : i18n.t('activityLog.listSeparator', { defaultValue: ', ' }))}
                {part}
            </Fragment>
        ))}
    </>
)

const conditionSetsNoun = (count: number): string =>
    i18n.t('featureFlagActivity.conditionSets', {
        count,
        defaultValue_one: '{{ count }} condition set',
        defaultValue_other: '{{ count }} condition sets',
    })

const MAX_DETAILED_SET_CHANGES = 3

// Description comes last because it only ever reads as a tail: "... and its description".
const DESCRIBED_ASPECTS: ConditionSetAspect[] = ['criteria', 'rollout', 'variant', 'description']

const describedAspects = (set: ConditionSetChange): ConditionSetAspect[] => {
    const aspects = changedAspects(set)
    return DESCRIBED_ASPECTS.filter((aspect) => aspects.includes(aspect))
}

const rolloutChangeFragment = (set: ConditionSetChange): JSX.Element => (
    <>
        {i18n.t('featureFlagActivity.from', { defaultValue: 'from' })}{' '}
        {rolloutLabel(rolloutOf(set.previous ?? set.group))} {i18n.t('featureFlagActivity.to', { defaultValue: 'to' })}{' '}
        {rolloutLabel(rolloutOf(set.group))}
    </>
)

const variantChangeFragment = (set: ConditionSetChange): JSX.Element => (
    <>
        {i18n.t('featureFlagActivity.from', { defaultValue: 'from' })}{' '}
        <strong>{set.previous?.variant ?? i18n.t('featureFlagActivity.none', { defaultValue: 'none' })}</strong>{' '}
        {i18n.t('featureFlagActivity.to', { defaultValue: 'to' })}{' '}
        <strong>{set.group.variant ?? i18n.t('featureFlagActivity.none', { defaultValue: 'none' })}</strong>
    </>
)

interface AspectWording {
    verb: string
    noun: string
    subject: (set: ConditionSetChange) => JSX.Element
    fragment?: (set: ConditionSetChange) => JSX.Element
}

/**
 * A description change names its set by position, because the label of a set is its description.
 * Built per language, because a map of messages resolved at import would keep the language the app
 * started in.
 */
function buildAspectWording(): Record<ConditionSetAspect, AspectWording> {
    return {
        criteria: {
            verb: i18n.t('featureFlagActivity.aspect.criteria', { defaultValue: 'changed the criteria for' }),
            noun: i18n.t('featureFlagActivity.aspectNoun.criteria', { defaultValue: 'criteria' }),
            subject: (set) => conditionSetLabel(set.group),
        },
        rollout: {
            verb: i18n.t('featureFlagActivity.aspect.rollout', { defaultValue: 'changed the rollout for' }),
            noun: i18n.t('featureFlagActivity.aspectNoun.rollout', { defaultValue: 'rollout' }),
            subject: (set) => conditionSetLabel(set.group),
            fragment: rolloutChangeFragment,
        },
        variant: {
            verb: i18n.t('featureFlagActivity.aspect.variant', { defaultValue: 'changed the variant for' }),
            noun: i18n.t('featureFlagActivity.aspectNoun.variant', { defaultValue: 'variant' }),
            subject: (set) => conditionSetLabel(set.group),
            fragment: variantChangeFragment,
        },
        description: {
            verb: i18n.t('featureFlagActivity.aspect.description', { defaultValue: 'changed the description of' }),
            noun: i18n.t('featureFlagActivity.aspectNoun.description', { defaultValue: 'description' }),
            subject: (set) => (
                <>
                    {i18n.t('featureFlagActivity.conditionSetIndex', {
                        defaultValue: 'condition set {{ index }}',
                        index: set.index + 1,
                    })}
                </>
            ),
        },
    }
}

let cachedAspectWording: { locale: string; wording: Record<ConditionSetAspect, AspectWording> } | null = null

/** The verbs and nouns that describe condition set changes, in the app's language. */
function getAspectWording(): Record<ConditionSetAspect, AspectWording> {
    const locale = getActiveLocale()
    if (cachedAspectWording?.locale !== locale) {
        cachedAspectWording = { locale, wording: buildAspectWording() }
    }
    return cachedAspectWording.wording
}

const aspectDetail = (set: ConditionSetChange, aspect: ConditionSetAspect): JSX.Element => {
    const { subject, fragment } = getAspectWording()[aspect]
    return fragment ? (
        <>
            {subject(set)} {fragment(set)}
        </>
    ) : (
        subject(set)
    )
}

const aspectHeadClause = (set: ConditionSetChange, aspect: ConditionSetAspect): JSX.Element => (
    <>
        {getAspectWording()[aspect].verb} {aspectDetail(set, aspect)}
    </>
)

const aspectTailClause = (set: ConditionSetChange, aspect: ConditionSetAspect): JSX.Element => {
    const { noun, fragment } = getAspectWording()[aspect]
    const its = i18n.t('featureFlagActivity.its', { defaultValue: 'its' })
    return fragment ? (
        <>
            {its} {noun} {fragment(set)}
        </>
    ) : (
        <>
            {its} {noun}
        </>
    )
}

const conditionSetClause = (set: ConditionSetChange): JSX.Element => {
    const [head, ...rest] = describedAspects(set)
    return joinInline([aspectHeadClause(set, head), ...rest.map((aspect) => aspectTailClause(set, aspect))])
}

const describeConditionSetChanges = (
    filtersBefore: FeatureFlagFilters | undefined,
    filtersAfter: FeatureFlagFilters
): Description[] => {
    const diff = diffReleaseConditionSets(filtersBefore, filtersAfter)
    const added = diff.sets.filter((set) => set.status === 'added')
    const changed = diff.sets.filter((set) => set.status === 'changed')
    const summarize = added.length + changed.length + diff.removed.length > MAX_DETAILED_SET_CHANGES
    // A set that changed in more than one way reads better as a single clause than as an entry in
    // each per-aspect list, where its label would repeat. Counts have no label to repeat.
    const multiAspect: ConditionSetChange[] = summarize ? [] : changed.filter((set) => describedAspects(set).length > 1)
    const withAspect = (aspect: ConditionSetAspect): ConditionSetChange[] =>
        changed.filter((set) => !multiAspect.includes(set) && changedAspects(set).includes(aspect))

    // Past the detail limit every part collapses to "<verb> N condition sets"; the expanded view has the rest.
    const listOrCount = (
        sets: ConditionSetChange[],
        verbs: { detail: string; count?: string },
        detail: (set: ConditionSetChange) => JSX.Element
    ): JSX.Element =>
        summarize ? (
            <>
                {verbs.count ?? verbs.detail} {conditionSetsNoun(sets.length)}
            </>
        ) : (
            <>
                {verbs.detail} {joinInline(sets.map(detail))}
            </>
        )
    const labelOf = (set: ConditionSetChange): JSX.Element => conditionSetLabel(set.group)

    const parts: Description[] = []
    DESCRIBED_ASPECTS.forEach((aspect) => {
        const sets = withAspect(aspect)
        if (sets.length) {
            parts.push(
                listOrCount(sets, { detail: getAspectWording()[aspect].verb }, (set) => aspectDetail(set, aspect))
            )
        }
    })
    parts.push(...multiAspect.map(conditionSetClause))
    if (added.length) {
        const verbs = {
            detail:
                added.length === 1
                    ? i18n.t('featureFlagActivity.added.one', { defaultValue: 'added a condition set for' })
                    : i18n.t('featureFlagActivity.added.other', { defaultValue: 'added condition sets for' }),
            count: i18n.t('featureFlagActivity.added.count', { defaultValue: 'added' }),
        }
        parts.push(
            listOrCount(added, verbs, (set) => (
                <>
                    {labelOf(set)} {i18n.t('featureFlagActivity.at', { defaultValue: 'at' })}{' '}
                    {rolloutLabel(rolloutOf(set.group))}
                </>
            ))
        )
    }
    if (diff.removed.length) {
        parts.push(
            diff.removed.length === 1 && !summarize ? (
                <>
                    {i18n.t('featureFlagActivity.removed.theSet', {
                        defaultValue: 'removed the condition set for',
                    })}{' '}
                    {conditionSetLabel(diff.removed[0].group)}
                </>
            ) : (
                <>
                    {i18n.t('featureFlagActivity.removed.count', { defaultValue: 'removed' })}{' '}
                    {conditionSetsNoun(diff.removed.length)}
                </>
            )
        )
    }
    if (diff.reordered) {
        parts.push(<>{i18n.t('featureFlagActivity.reordered', { defaultValue: 'reordered the condition sets' })}</>)
    }
    return parts
}

// Shared handler for fields the feed deliberately never describes. EXCLUDED_FLAG_FIELDS is
// derived by identity from this function, so excluded fields stay distinguishable from
// describable fields whose handler returned null for one particular change.
const excludedFieldHandler = (): null => null

const featureFlagActionsMapping: Record<
    keyof FeatureFlagType,
    (change?: ActivityChange, logItem?: ActivityLogItem) => ChangeMapping | null
> = {
    name: function onName() {
        return {
            description: [
                <>{i18n.t('featureFlagActivity.changedDescription', { defaultValue: 'changed the description' })}</>,
            ],
        }
    },
    active: function onActive(change, logItem) {
        let isActive: boolean = !!change?.after
        if (typeof change?.after === 'string') {
            isActive = change?.after.toLowerCase() === 'true'
        }
        const describeChange: string = isActive
            ? i18n.t('featureFlagActivity.enabled', { defaultValue: 'enabled' })
            : i18n.t('featureFlagActivity.disabled', { defaultValue: 'disabled' })

        return {
            description: [<>{describeChange}</>],
            suffix: <>{nameOrLinkToFlag(logItem?.item_id, logItem?.detail.name)}</>,
        }
    },
    filters: function onChangedFilter(change, logItem) {
        const filtersBefore = change?.before as FeatureFlagFilters | undefined
        const filtersAfter = change?.after as FeatureFlagFilters

        const hasConditionSets = Array.isArray(filtersAfter?.groups)
        // A flag left with an empty variants list is a boolean flag again, so its payload is the
        // boolean one. Reading the whole `multivariate` object here would leave that payload undescribed.
        const isMultivariateFlag = !!filtersAfter?.multivariate?.variants?.length

        const changes: Description[] = []
        let expandedView: ExpandedView | undefined

        if (hasConditionSets) {
            if (!isMultivariateFlag) {
                getChangedPayloadKeys(filtersBefore, filtersAfter).forEach((key) => {
                    const changedPayload = filtersAfter.payloads?.[key]?.toString() || null
                    changes.push(
                        <SentenceList
                            listParts={[changedPayload]}
                            prefix={i18n.t('featureFlagActivity.changedPayloadTo', {
                                defaultValue: 'changed payload to',
                            })}
                        />
                    )
                })
            }
            const setChanges = describeConditionSetChanges(filtersBefore, filtersAfter)
            changes.push(...setChanges)
            if (setChanges.length > 0) {
                // The expanded view tags what moved between the two condition set lists, so it has
                // nothing to show for a save that left them alone.
                expandedView = {
                    label: i18n.t('featureFlagActivity.releaseConditions', { defaultValue: 'Release conditions' }),
                    content: (
                        <FeatureFlagReleaseConditionsChange
                            flagId={logItem?.item_id ?? ''}
                            activityId={logItem?.id ?? logItem?.created_at ?? ''}
                            before={filtersBefore}
                            after={filtersAfter}
                        />
                    ),
                }
            }
        }

        if (filtersBefore?.multivariate?.variants?.length && !filtersAfter?.multivariate?.variants?.length) {
            changes.push(
                <SentenceList
                    key="remove-variants-list"
                    listParts={[
                        <span key="remove-variants">
                            {filtersBefore.multivariate.variants.length === 1
                                ? i18n.t('featureFlagActivity.removedLastVariant', {
                                      defaultValue: 'removed the last variant',
                                  })
                                : i18n.t('featureFlagActivity.removedAllVariants', {
                                      defaultValue: 'removed all variants',
                                  })}
                        </span>,
                    ]}
                />
            )
        } else if (isMultivariateFlag) {
            getChangedPayloadKeys(filtersBefore, filtersAfter).forEach((key) => {
                const changedPayload = filtersAfter.payloads?.[key]?.toString() || null
                changes.push(
                    <SentenceList
                        listParts={[
                            <span key={key} className="highlighted-activity">
                                {changedPayload}
                            </span>,
                        ]}
                        prefix={
                            <Trans
                                i18nKey="featureFlagActivity.changedPayloadOnVariant"
                                values={{ key }}
                                components={{ Variant: <b /> }}
                                defaults="changed payload on <Variant>variant: {{ key }}</Variant> to"
                            />
                        }
                    />
                )
            })

            // Identify removed variants
            const beforeVariants = new Set((filtersBefore?.multivariate?.variants || []).map((v) => v.key))
            const afterVariants = new Set((filtersAfter?.multivariate?.variants || []).map((v) => v.key))
            const removedVariants = [...beforeVariants].filter((key) => !afterVariants.has(key))

            // Only show rollout percentage changes if they actually changed
            const beforeVariantMap = new Map(
                (filtersBefore?.multivariate?.variants || []).map((v) => [v.key, v.rollout_percentage])
            )
            const changedVariants = (filtersAfter.multivariate?.variants || []).filter(
                (v) => beforeVariantMap.get(v.key) !== v.rollout_percentage
            )
            if (changedVariants.length > 0) {
                changes.push(
                    <SentenceList
                        listParts={changedVariants.map((v) => (
                            <div key={v.key} className="highlighted-activity">
                                {v.key}: <strong className="tabular-nums">{v.rollout_percentage}%</strong>
                            </div>
                        ))}
                        prefix={i18n.t('featureFlagActivity.changedRolloutPercentage', {
                            defaultValue: 'changed the rollout percentage for the variants to',
                        })}
                    />
                )
            }

            // Then add removed variants if any
            if (removedVariants.length > 0) {
                changes.push(
                    <SentenceList
                        listParts={removedVariants.map((key) => (
                            <span key={key} className="highlighted-activity">
                                <strong>{key}</strong>
                            </span>
                        ))}
                        prefix={i18n.t('featureFlagActivity.removedVariants', {
                            count: removedVariants.length,
                            defaultValue_one: 'removed variant',
                            defaultValue_other: 'removed variants',
                        })}
                    />
                )
            }
        }

        if (changes.length > 0) {
            return { description: changes, expandedView }
        }

        console.error({ change }, 'could not describe this change')
        return null
    },
    deleted: function onSoftDelete(change, logItem) {
        const isDeleted = detectBoolean(change?.after)
        return {
            description: [
                <>
                    {isDeleted
                        ? i18n.t('featureFlagActivity.deleted', { defaultValue: 'deleted' })
                        : i18n.t('featureFlagActivity.restored', { defaultValue: 'restored' })}
                </>,
            ],
            suffix: <>{nameOrLinkToFlag(logItem?.item_id, logItem?.detail.name)}</>,
        }
    },
    archived: function onArchived(change, logItem) {
        const isArchived = detectBoolean(change?.after)
        return {
            description: [
                <>
                    {isArchived
                        ? i18n.t('featureFlagActivity.archived', { defaultValue: 'archived' })
                        : i18n.t('featureFlagActivity.unarchived', { defaultValue: 'unarchived' })}
                </>,
            ],
            suffix: <>{nameOrLinkToFlag(logItem?.item_id, logItem?.detail.name)}</>,
        }
    },
    key: function onKey(change, logItem) {
        const changeBefore = change?.before as string
        const changeAfter = change?.after as string
        return {
            description: [
                <>
                    {i18n.t('featureFlagActivity.changedKey', {
                        defaultValue: 'changed flag key on {{ previous }} to',
                        previous: changeBefore,
                    })}
                </>,
            ],
            suffix: <>{nameOrLinkToFlag(logItem?.item_id, changeAfter)}</>,
        }
    },
    ensure_experience_continuity: function onExperienceContinuity(change) {
        const isEnabled = detectBoolean(change?.after)
        const describeChange: string = isEnabled
            ? i18n.t('featureFlagActivity.enabled', { defaultValue: 'enabled' })
            : i18n.t('featureFlagActivity.disabled', { defaultValue: 'disabled' })

        return {
            description: [
                <>
                    {describeChange}{' '}
                    {i18n.t('featureFlagActivity.experienceContinuity', { defaultValue: 'experience continuity' })}
                </>,
            ],
        }
    },
    evaluation_runtime: function onEvaluationRuntime(change) {
        const runtimeAfter = change?.after as string
        const runtimeBefore = change?.before as string

        return {
            description: [
                <Trans
                    i18nKey="featureFlagActivity.changedEvaluationRuntime"
                    values={{ before: getRuntimeLabel(runtimeBefore), after: getRuntimeLabel(runtimeAfter) }}
                    components={{ Before: <strong />, After: <strong /> }}
                    defaults="changed the evaluation runtime from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                />,
            ],
        }
    },
    bucketing_identifier: function onBucketingIdentifier(change) {
        const identifierAfter = change?.after as string
        const identifierBefore = change?.before as string

        const getBucketingLabel = (identifier: string): string => {
            switch (identifier) {
                case 'distinct_id':
                    return i18n.t('featureFlagActivity.bucketingIdentifier.user', { defaultValue: 'User' })
                case 'device_id':
                    return i18n.t('featureFlagActivity.bucketingIdentifier.device', { defaultValue: 'Device' })
                default:
                    return (
                        identifier || i18n.t('featureFlagActivity.bucketingIdentifier.user', { defaultValue: 'User' })
                    )
            }
        }

        return {
            description: [
                <Trans
                    i18nKey="featureFlagActivity.changedBucketingIdentifier"
                    values={{ before: getBucketingLabel(identifierBefore), after: getBucketingLabel(identifierAfter) }}
                    components={{ Before: <strong />, After: <strong /> }}
                    defaults="changed the bucketing identifier from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                />,
            ],
        }
    },
    tags: function onTags(change) {
        const tagsBefore = change?.before as string[]
        const tagsAfter = change?.after as string[]
        const addedTags = tagsAfter.filter((t) => tagsBefore.indexOf(t) === -1)
        const removedTags = tagsBefore.filter((t) => tagsAfter.indexOf(t) === -1)

        const changes: Description[] = []
        if (addedTags.length) {
            changes.push(
                <>
                    {i18n.t('featureFlagActivity.tags.added', {
                        count: addedTags.length,
                        defaultValue_one: 'added {{ count }} tag',
                        defaultValue_other: 'added {{ count }} tags',
                    })}{' '}
                    <ObjectTags tags={addedTags} saving={false} style={{ display: 'inline' }} staticOnly />
                </>
            )
        }
        if (removedTags.length) {
            changes.push(
                <>
                    {i18n.t('featureFlagActivity.tags.removed', {
                        count: removedTags.length,
                        defaultValue_one: 'removed {{ count }} tag',
                        defaultValue_other: 'removed {{ count }} tags',
                    })}{' '}
                    <ObjectTags tags={removedTags} saving={false} style={{ display: 'inline' }} staticOnly />
                </>
            )
        }

        return { description: changes }
    },
    evaluation_contexts: function onEvaluationContexts(change) {
        const contextsBefore = (change?.before as string[]) || []
        const contextsAfter = (change?.after as string[]) || []
        const addedContexts = contextsAfter.filter((c) => contextsBefore.indexOf(c) === -1)
        const removedContexts = contextsBefore.filter((c) => contextsAfter.indexOf(c) === -1)

        const changes: Description[] = []
        if (addedContexts.length) {
            changes.push(
                <>
                    {i18n.t('featureFlagActivity.evaluationContexts.added', {
                        count: addedContexts.length,
                        defaultValue_one: 'added {{ count }} evaluation context',
                        defaultValue_other: 'added {{ count }} evaluation contexts',
                    })}{' '}
                    <ObjectTags tags={addedContexts} saving={false} style={{ display: 'inline' }} staticOnly />
                </>
            )
        }
        if (removedContexts.length) {
            changes.push(
                <>
                    {i18n.t('featureFlagActivity.evaluationContexts.removed', {
                        count: removedContexts.length,
                        defaultValue_one: 'removed {{ count }} evaluation context',
                        defaultValue_other: 'removed {{ count }} evaluation contexts',
                    })}{' '}
                    <ObjectTags tags={removedContexts} saving={false} style={{ display: 'inline' }} staticOnly />
                </>
            )
        }

        return { description: changes }
    },
    // fields that are excluded on the backend
    id: excludedFieldHandler,
    created_at: excludedFieldHandler,
    created_by: excludedFieldHandler,
    updated_at: excludedFieldHandler,
    experiment_set: excludedFieldHandler,
    experiment_set_metadata: excludedFieldHandler,
    features: excludedFieldHandler,
    usage_dashboard: excludedFieldHandler,
    can_edit: excludedFieldHandler,
    has_enriched_analytics: excludedFieldHandler,
    surveys: excludedFieldHandler,
    user_access_level: excludedFieldHandler,
    is_remote_configuration: excludedFieldHandler,
    has_encrypted_payloads: excludedFieldHandler,
    status: excludedFieldHandler,
    version: excludedFieldHandler,
    last_modified_by: excludedFieldHandler,
    last_called_at: excludedFieldHandler,
    is_used_in_replay_settings: excludedFieldHandler,
    _create_in_folder: excludedFieldHandler,
}

const EXCLUDED_FLAG_FIELDS = new Set(
    Object.keys(featureFlagActionsMapping).filter(
        (field) => featureFlagActionsMapping[field as keyof FeatureFlagType] === excludedFieldHandler
    )
)

const getActorName = (logItem: ActivityLogItem): JSX.Element => {
    if (logItem.detail.trigger?.job_type === 'scheduled_change') {
        return (
            <>
                <ActivityLogUserName logItem={logItem} />{' '}
                <span className="text-muted">
                    {i18n.t('featureFlagActivity.viaScheduledChange', { defaultValue: '(via scheduled change)' })}
                </span>
            </>
        )
    }
    return <ActivityLogUserName logItem={logItem} />
}

/** Names the flag an update happened on, wording it as a notification does when asked. */
const flagSuffix = (logItem: ActivityLogItem, asNotification?: boolean): JSX.Element => (
    <>
        {asNotification
            ? i18n.t('featureFlagActivity.onTheFlag', { defaultValue: 'on the flag' })
            : i18n.t('featureFlagActivity.on', { defaultValue: 'on' })}{' '}
        {nameOrLinkToFlag(logItem?.item_id, logItem?.detail.name)}
    </>
)

export function flagActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope != 'FeatureFlag') {
        console.error('feature flag describer received a non-feature flag activity')
        return { description: null }
    }

    if (logItem.activity === 'created') {
        return {
            description: (
                <SentenceList
                    listParts={[
                        <>{i18n.t('featureFlagActivity.created', { defaultValue: 'created a new feature flag:' })}</>,
                    ]}
                    prefix={getActorName(logItem)}
                    suffix={<> {nameOrLinkToFlag(logItem?.item_id, logItem?.detail.name)}</>}
                />
            ),
        }
    }

    if (logItem.activity == 'updated') {
        // A referenced cohort's conditions changed: the flag's own fields are untouched
        // (only its version moved), so describe the cohort change instead of a field diff.
        // job_type must stay in sync with COHORT_CONDITIONS_UPDATED_JOB_TYPE in
        // products/feature_flags/backend/flag_version_sync.py.
        if (logItem.detail.trigger?.job_type === 'cohort_conditions_updated') {
            const { cohort_id, cohort_name } = logItem.detail.trigger.payload ?? {}
            const onSuffix = flagSuffix(logItem, asNotification)
            return {
                description: (
                    <SentenceList
                        listParts={[
                            <Fragment key="cohort-conditions-updated">
                                {i18n.t('featureFlagActivity.changedLinkedCohortConditions', {
                                    defaultValue: 'changed the conditions of linked cohort',
                                })}{' '}
                                {cohort_id ? (
                                    <Link to={urls.cohort(cohort_id)}>{cohort_name || `#${cohort_id}`}</Link>
                                ) : (
                                    <span>
                                        {cohort_name ||
                                            i18n.t('featureFlagActivity.unknown', { defaultValue: 'unknown' })}
                                    </span>
                                )}
                            </Fragment>,
                        ]}
                        prefix={getActorName(logItem)}
                        suffix={onSuffix}
                    />
                ),
            }
        }
        // A flag this one depends on changed its definition: same story as above, only
        // this flag's version moved. job_type must stay in sync with
        // FLAG_DEPENDENCY_UPDATED_JOB_TYPE in
        // products/feature_flags/backend/flag_version_sync.py.
        if (logItem.detail.trigger?.job_type === 'flag_dependency_updated') {
            const { flag_id, flag_key } = logItem.detail.trigger.payload ?? {}
            const onSuffix = flagSuffix(logItem, asNotification)
            return {
                description: (
                    <SentenceList
                        listParts={[
                            <Fragment key="flag-dependency-updated">
                                {i18n.t('featureFlagActivity.changedLinkedFlagDefinition', {
                                    defaultValue: 'changed the definition of linked flag',
                                })}{' '}
                                {flag_id ? (
                                    <Link to={urls.featureFlag(flag_id)}>{flag_key || `#${flag_id}`}</Link>
                                ) : (
                                    <span>
                                        {flag_key || i18n.t('featureFlagActivity.unknown', { defaultValue: 'unknown' })}
                                    </span>
                                )}
                            </Fragment>,
                        ]}
                        prefix={getActorName(logItem)}
                        suffix={onSuffix}
                    />
                ),
            }
        }
        let changes: Description[] = []
        let changeSuffix: Description = flagSuffix(logItem, asNotification)
        let expandedView: ExpandedView | undefined

        for (const change of logItem.detail.changes || []) {
            if (!change?.field) {
                continue // feature flag updates have to have a "field" to be described
            }

            const fieldHandler = featureFlagActionsMapping[change.field as keyof FeatureFlagType]
            if (!fieldHandler) {
                console.error({ field: change.field, change }, 'No activity describer found for feature flag field')
            }
            const possibleLogItem = fieldHandler ? fieldHandler(change, logItem) : null
            if (possibleLogItem) {
                const { description, suffix, expandedView: view } = possibleLogItem
                if (description) {
                    changes = changes.concat(description)
                }
                if (suffix) {
                    changeSuffix = suffix
                }
                if (view) {
                    expandedView = view
                }
            }
        }

        if (changes.length) {
            return {
                description: <SentenceList listParts={changes} prefix={getActorName(logItem)} suffix={changeSuffix} />,
                expandedView,
            }
        }

        const updateChanges = logItem.detail.changes || []
        if (
            updateChanges.length > 0 &&
            updateChanges.every((change) => change.field && EXCLUDED_FLAG_FIELDS.has(change.field))
        ) {
            // Every change is to an excluded field, which happens when a save only bumps the
            // optimistic-concurrency `version`. The fallback would render a contentless
            // "updated <flag>" row, so drop the entry instead. A describable change whose
            // handler produced no text still falls through to the generic fallback.
            return { description: null }
        }
    }

    return defaultDescriber(logItem, asNotification, nameOrLinkToFlag(logItem?.item_id, logItem?.detail.name))
}
