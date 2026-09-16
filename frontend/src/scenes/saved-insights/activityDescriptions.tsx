import posthog from 'posthog-js'
import { Fragment } from 'react'
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
import {
    InsightBreakdownSummary,
    PropertiesSummary,
    SeriesSummary,
} from 'lib/components/Cards/InsightCard/InsightDetails'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { areObjectValuesEmpty } from 'lib/utils/objects'
import { urls } from 'scenes/urls'

import { HogQLQuery, InsightQueryNode, QuerySchema } from '~/queries/schema/schema-general'
import {
    isDataTableNodeWithHogQLQuery,
    isDataVisualizationNode,
    isHogQLQuery,
    isInsightQueryNode,
    isInsightVizNode,
} from '~/queries/utils'
import { FilterType, InsightModel, InsightShortId } from '~/types'

const nameOrLinkToInsight = (short_id?: InsightShortId | null, name?: string | null): string | JSX.Element => {
    const displayName = name || i18n.t('insightActivity.emptyName', { defaultValue: '(empty string)' })
    return short_id ? <Link to={urls.insightView(short_id)}>{displayName}</Link> : displayName
}

/** "your insight" for the reader's own activity, "the insight" for everyone else's. */
function insightOwner(asNotification?: boolean): string {
    return asNotification
        ? i18n.t('insightActivity.your', { defaultValue: 'your' })
        : i18n.t('insightActivity.the', { defaultValue: 'the' })
}

interface TileStyleDashboardLink {
    insight: { id: number }
    dashboard: BareDashboardLink
}

interface BareDashboardLink {
    id: number
    name: string
}

// insight activity logs changed the format that dashboard changes were reported in
type DashboardLink = TileStyleDashboardLink | BareDashboardLink

const unboxBareLink = (boxedLink: DashboardLink): BareDashboardLink => {
    if ('dashboard' in boxedLink) {
        return boxedLink.dashboard
    }
    return boxedLink
}

const linkToDashboard = (dashboard: BareDashboardLink): JSX.Element => (
    <div className="highlighted-activity">
        <Link to={urls.dashboard(dashboard.id)}>{dashboard.name}</Link>
    </div>
)

const insightActionsMapping: Record<
    keyof InsightModel,
    (change?: ActivityChange, logItem?: ActivityLogItem, asNotification?: boolean) => ChangeMapping | null
> = {
    name: function onName(change, logItem, asNotification) {
        return {
            description: [
                <>
                    {i18n.t('insightActivity.renamed', { defaultValue: 'renamed' })}{' '}
                    {asNotification ? (
                        <>{i18n.t('insightActivity.theInsight', { defaultValue: 'the insight' })} </>
                    ) : null}
                    "{change?.before}" {i18n.t('insightActivity.to', { defaultValue: 'to' })}{' '}
                    <strong>"{nameOrLinkToInsight(logItem?.detail.short_id, change?.after as string)}"</strong>
                </>,
            ],
            suffix: <></>,
        }
    },
    filters: function onChangedFilter(change) {
        const filtersAfter = change?.after as Partial<FilterType>

        // Only an insight written before queries logs this field, so these entries are years old and
        // no new one can be written. Summarizing the definition would mean converting legacy filters,
        // which no other read path still does, and the headline reads the same either way.
        return areObjectValuesEmpty(filtersAfter)
            ? null
            : {
                  description: [
                      i18n.t('insightActivity.changedQueryDefinition', { defaultValue: 'changed query definition' }),
                  ],
              }
    },
    query: function onChangedQuery(change) {
        if (change?.action === 'deleted') {
            // if the query was deleted, then someone has added a filter and that will be summarized
            return null
        }

        const queryAfter = change?.after as QuerySchema
        // saved insights store the actual query wrapped in an InsightVizNode (or in a
        // DataVisualizationNode / DataTableNode for SQL insights), so summarize the source
        const source =
            isInsightVizNode(queryAfter) ||
            isDataVisualizationNode(queryAfter) ||
            isDataTableNodeWithHogQLQuery(queryAfter)
                ? queryAfter.source
                : queryAfter
        return isInsightQueryNode(source) || isHogQLQuery(source)
            ? summarizeQueryChanges(source)
            : { description: [i18n.t('insightActivity.changedTheQuery', { defaultValue: 'changed the query' })] }
    },
    deleted: function onSoftDelete(change, logItem, asNotification) {
        const isDeleted = detectBoolean(change?.after)
        const describeChange = isDeleted
            ? i18n.t('activityLog.deleted', { defaultValue: 'deleted' })
            : i18n.t('activityLog.restored', { defaultValue: 'restored' })
        return {
            description: [
                <>
                    {describeChange}{' '}
                    {asNotification ? i18n.t('insightActivity.theInsight', { defaultValue: 'the insight' }) : null}
                </>,
            ],
            suffix: <>{nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)}</>,
        }
    },
    short_id: function onShortId(change, _, asNotification) {
        return {
            description: [
                <>
                    {i18n.t('insightActivity.changedTheShortId', { defaultValue: 'changed the short id' })}{' '}
                    {asNotification ? i18n.t('insightActivity.ofTheInsight', { defaultValue: 'of the insight' }) : null}{' '}
                    {i18n.t('insightActivity.to', { defaultValue: 'to' })} <strong>"{change?.after as string}"</strong>
                </>,
            ],
        }
    },
    derived_name: function onDerivedName(change, logItem, asNotification) {
        return {
            description: [
                <>
                    {i18n.t('insightActivity.renamed', { defaultValue: 'renamed' })}{' '}
                    {asNotification ? (
                        <>{i18n.t('insightActivity.theInsight', { defaultValue: 'the insight' })} </>
                    ) : null}
                    "{change?.before}" {i18n.t('insightActivity.to', { defaultValue: 'to' })}{' '}
                    <strong>"{nameOrLinkToInsight(logItem?.detail.short_id, change?.after as string)}"</strong>
                </>,
            ],
            suffix: <></>,
        }
    },
    description: function onDescription(change, _, asNotification) {
        return {
            description: [
                <>
                    {i18n.t('insightActivity.changedTheDescription', { defaultValue: 'changed the description' })}{' '}
                    {asNotification ? i18n.t('insightActivity.ofTheInsight', { defaultValue: 'of the insight' }) : null}{' '}
                    {i18n.t('insightActivity.to', { defaultValue: 'to' })} <strong>"{change?.after as string}"</strong>
                </>,
            ],
        }
    },
    favorited: function onFavorited(change, logItem, asNotification) {
        const isFavoriteAfter = detectBoolean(change?.after)
        return {
            description: [
                <>
                    <div className="highlighted-activity">
                        {isFavoriteAfter
                            ? i18n.t('insightActivity.favorited', { defaultValue: 'favorited' })
                            : i18n.t('insightActivity.unfavorited', { defaultValue: 'un-favorited' })}{' '}
                        {asNotification ? i18n.t('insightActivity.theInsight', { defaultValue: 'the insight' }) : null}
                    </div>
                </>,
            ],
            suffix: <>{nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)}</>,
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
                    {i18n.t('insightActivity.tags.added', {
                        count: addedTags.length,
                        defaultValue_one: 'added tag',
                        defaultValue_other: 'added tags',
                    })}{' '}
                    <ObjectTags tags={addedTags} saving={false} style={{ display: 'inline' }} staticOnly />
                </>
            )
        }
        if (removedTags.length) {
            changes.push(
                <>
                    {i18n.t('insightActivity.tags.removed', {
                        count: removedTags.length,
                        defaultValue_one: 'removed tag',
                        defaultValue_other: 'removed tags',
                    })}{' '}
                    <ObjectTags tags={removedTags} saving={false} style={{ display: 'inline' }} staticOnly />
                </>
            )
        }

        return { description: changes }
    },
    dashboards: function onDashboardsChange(change, logItem, asNotification) {
        const dashboardsBefore = (change?.before as DashboardLink[]).map(unboxBareLink)
        const dashboardsAfter = (change?.after as DashboardLink[]).map(unboxBareLink)

        const addedDashboards = dashboardsAfter.filter(
            (after) => !dashboardsBefore.some((before) => before.id === after.id)
        )
        const removedDashboards = dashboardsBefore.filter(
            (before) => !dashboardsAfter.some((after) => after.id === before.id)
        )

        const addedSentence = addedDashboards.length ? (
            <SentenceList
                prefix={
                    <>
                        {i18n.t('insightActivity.added', { defaultValue: 'added' })}{' '}
                        {asNotification ? i18n.t('insightActivity.theInsight', { defaultValue: 'the insight' }) : null}{' '}
                        {nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)}{' '}
                        {i18n.t('insightActivity.to', { defaultValue: 'to' })}
                    </>
                }
                listParts={addedDashboards.map((d) => (
                    <Fragment key={d.id}>{linkToDashboard(d)}</Fragment>
                ))}
            />
        ) : null

        const removedSentence = removedDashboards.length ? (
            <SentenceList
                prefix={
                    <>
                        {i18n.t('insightActivity.removed', { defaultValue: 'removed' })}{' '}
                        {asNotification ? i18n.t('insightActivity.theInsight', { defaultValue: 'the insight' }) : null}{' '}
                        {nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)}{' '}
                        {i18n.t('insightActivity.from', { defaultValue: 'from' })}
                    </>
                }
                listParts={removedDashboards.map((d) => (
                    <Fragment key={d.id}>{linkToDashboard(d)}</Fragment>
                ))}
            />
        ) : null

        return { description: [addedSentence, removedSentence], suffix: <></> }
    },
    alerts: () => null,
    // fields that are excluded on the backend
    id: () => null,
    created_at: () => null,
    created_by: () => null,
    updated_at: () => null,
    last_modified_at: () => null,
    order: () => null,
    result: () => null,
    last_refresh: () => null,
    cache_target_age: () => null,
    next_allowed_client_refresh: () => null,
    last_modified_by: () => null,
    next: () => null,
    saved: () => null,
    is_sample: () => null,
    timezone: () => null,
    disable_baseline: () => null,
    dashboard_tiles: () => null,
    query_status: () => null,
    query_scan: () => null,
    user_access_level: () => null,
    _create_in_folder: () => null,
    last_viewed_at: () => null,
    viewers: () => null,
    view_count: () => null,
    is_cached: () => null,
    filter_override_context: () => null,
    columns: () => null,
    types: () => null,
    resolved_date_range: () => null,
}

function summarizeQueryChanges(query: InsightQueryNode | HogQLQuery): ChangeMapping {
    return {
        description: [i18n.t('insightActivity.changedQueryDefinition', { defaultValue: 'changed query definition' })],
        extendedDescription: (
            <div className="ActivityDescription">
                <SeriesSummary query={query} />
                <PropertiesSummary properties={isHogQLQuery(query) ? query.filters?.properties : query.properties} />
                <InsightBreakdownSummary query={query} />
            </div>
        ),
    }
}

export function insightActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope != 'Insight') {
        console.error('insight describer received a non-insight activity')
        return { description: null }
    }

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('insightActivity.created', { defaultValue: 'created the insight:' })}{' '}
                    {nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)}
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.deleted', { defaultValue: 'deleted' })} {insightOwner(asNotification)}{' '}
                    {i18n.t('insightActivity.insightWithColon', { defaultValue: 'insight:' })} {logItem.detail.name}
                </>
            ),
        }
    }

    if (logItem.activity == 'exported for opengraph image') {
        return {
            description: (
                <>
                    <strong>PostHog</strong> {i18n.t('insightActivity.exported', { defaultValue: 'exported' })}{' '}
                    {insightOwner(asNotification)}{' '}
                    {i18n.t('insightActivity.insightWithColon', { defaultValue: 'insight:' })} {logItem.detail.name}{' '}
                    {i18n.t('insightActivity.asAnImageForTheSharedLink', {
                        defaultValue: 'as an image for the shared insight link.',
                    })}
                </>
            ),
        }
    }

    if (logItem.activity == 'sharing enabled') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('insightActivity.shared', { defaultValue: 'shared' })} {insightOwner(asNotification)}{' '}
                    {i18n.t('insightActivity.insightWithColon', { defaultValue: 'insight:' })} {logItem.detail.name}
                    {i18n.t('insightActivity.period', { defaultValue: '.' })}
                </>
            ),
        }
    }

    if (logItem.activity == 'sharing disabled') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('insightActivity.deletedSharedLinkFor', { defaultValue: 'deleted shared link for' })}{' '}
                    {insightOwner(asNotification)}{' '}
                    {i18n.t('insightActivity.insightWithColon', { defaultValue: 'insight:' })} {logItem.detail.name}
                    {i18n.t('insightActivity.period', { defaultValue: '.' })}
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        let changes: Description[] = []
        let extendedDescription: JSX.Element | undefined
        let changeSuffix: Description = (
            <>
                {i18n.t('insightActivity.on', { defaultValue: 'on' })}{' '}
                {asNotification ? i18n.t('insightActivity.theInsight', { defaultValue: 'the insight' }) : null}{' '}
                {nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)}
            </>
        )

        try {
            for (const change of logItem.detail.changes || []) {
                const insightAction = insightActionsMapping[change.field as keyof InsightModel]
                if (!change?.field || !insightAction) {
                    continue // insight updates have to have a "field" to be described
                }

                const actionHandler = insightAction
                const processedChange = actionHandler(change, logItem, asNotification)
                if (processedChange === null) {
                    continue // unexpected log from backend is indescribable
                }

                const { description, extendedDescription: _extendedDescription, suffix } = processedChange
                if (description) {
                    changes = changes.concat(description)
                }
                if (_extendedDescription) {
                    extendedDescription = _extendedDescription
                }
                if (suffix) {
                    changeSuffix = suffix
                }
            }
        } catch (e) {
            console.error('Error while summarizing insight update', e)
            posthog.captureException(e)
        }

        if (changes.length) {
            return {
                description: (
                    <SentenceList
                        listParts={changes}
                        prefix={<ActivityLogUserName logItem={logItem} />}
                        suffix={changeSuffix}
                    />
                ),
                extendedDescription,
            }
        }
    }
    if (logItem.activity === 'exported') {
        const exportFormat = logItem.detail.changes?.[0]?.after
        let exportType = i18n.t('insightActivity.unknownFormat', { defaultValue: 'in an unknown format' })
        if (typeof exportFormat === 'string') {
            exportType = exportFormat.split('/')[1]
        }

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('insightActivity.exported', { defaultValue: 'exported' })}{' '}
                    {nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)}{' '}
                    {i18n.t('insightActivity.asA', { defaultValue: 'as a' })} {exportType}
                </>
            ),
        }
    }

    if (logItem.activity === 'share_login_success') {
        const afterData = logItem.detail.changes?.[0]?.after as any
        const clientIp = afterData?.client_ip || i18n.t('insightActivity.unknownIp', { defaultValue: 'unknown IP' })
        const passwordNote =
            afterData?.password_note || i18n.t('insightActivity.unknownpassword', { defaultValue: 'unknown password' })
        const name = logItem.detail.name || i18n.t('insightActivity.emptyName', { defaultValue: '(empty string)' })

        return {
            description: (
                <Trans
                    i18nKey="insightActivity.shareLoginSuccess"
                    values={{ ip: clientIp, name, password: passwordNote }}
                    components={{
                        Bold: <strong />,
                        NameBold: logItem.detail.short_id ? (
                            <Link to={urls.insightView(logItem.detail.short_id)} />
                        ) : (
                            <b />
                        ),
                    }}
                    defaults="<Bold>Anonymous user</Bold> successfully authenticated to shared insight <NameBold>{{ name }}</NameBold> from {{ ip }} using password <Bold>{{ password }}</Bold>"
                />
            ),
        }
    }

    if (logItem.activity === 'share_login_failed') {
        const afterData = logItem.detail.changes?.[0]?.after as any
        const clientIp = afterData?.client_ip || i18n.t('insightActivity.unknownIp', { defaultValue: 'unknown IP' })
        const name = logItem.detail.name || i18n.t('insightActivity.emptyName', { defaultValue: '(empty string)' })

        return {
            description: (
                <Trans
                    i18nKey="insightActivity.shareLoginFailed"
                    values={{ ip: clientIp, name }}
                    components={{
                        Bold: <strong />,
                        NameBold: logItem.detail.short_id ? (
                            <Link to={urls.insightView(logItem.detail.short_id)} />
                        ) : (
                            <b />
                        ),
                    }}
                    defaults="<Bold>Anonymous user</Bold> failed to authenticate to shared insight <NameBold>{{ name }}</NameBold> from {{ ip }}"
                />
            ),
        }
    }

    return defaultDescriber(
        logItem,
        asNotification,
        nameOrLinkToInsight(logItem?.detail.short_id, logItem?.detail.name)
    )
}
