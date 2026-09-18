import posthog from 'posthog-js'
import { Trans } from 'react-i18next'
import { DashboardFilter, HogQLVariable } from 'src/queries/schema/schema-general'

import { Link } from '@posthog/lemon-ui'
import {
    getDashboardGridCompactionLabels,
    getDashboardTileSpacingLabels,
} from '@posthog/products-dashboards/frontend/dashboardCustomization'

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
    BreakdownSummary,
    DateRangeSummary,
    PropertiesSummary,
    VariablesSummary,
} from 'lib/components/Cards/InsightCard/InsightDetails'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { i18n } from 'lib/i18n/i18n'
import { isKeyOf } from 'lib/utils/guards'
import { urls } from 'scenes/urls'

import { DashboardType } from '~/types'

function unknownDashboard(): string {
    return i18n.t('dashboardActivity.unknownDashboard', { defaultValue: 'Unknown dashboard' })
}

function nameAndLink(logItem?: ActivityLogItem): JSX.Element {
    return logItem?.item_id ? (
        <Link to={urls.dashboard(logItem.item_id)}>{logItem?.detail?.name || unknownDashboard()}</Link>
    ) : logItem?.detail?.name ? (
        <>{logItem.detail.name}</>
    ) : (
        <i>{unknownDashboard()}</i>
    )
}

/** The dashboard name on its own, for strings that render it inside a markup slot. */
function dashboardName(logItem?: ActivityLogItem): string {
    return logItem?.detail?.name || unknownDashboard()
}

/** The link the dashboard name renders into, or a plain wrapper when the item has no id. */
function dashboardNameLink(logItem?: ActivityLogItem): JSX.Element {
    if (logItem?.item_id) {
        return <Link to={urls.dashboard(logItem.item_id)} />
    }
    return logItem?.detail?.name ? <></> : <i />
}

const dashboardActionsMapping: Record<
    keyof DashboardType,
    (change?: ActivityChange, logItem?: ActivityLogItem, asNotification?: boolean) => ChangeMapping | null
> = {
    name: function onName(change, logItem, asNotification) {
        return {
            description: [
                <>
                    {asNotification
                        ? i18n.t('dashboardActivity.name.renamedOnDashboard', {
                              defaultValue: 'renamed the dashboard ',
                          })
                        : i18n.t('dashboardActivity.name.renamed', { defaultValue: 'renamed ' })}
                    "{change?.before}" {i18n.t('dashboardActivity.name.to', { defaultValue: 'to' })}{' '}
                    <strong>"{nameAndLink(logItem)}"</strong>
                </>,
            ],
            suffix: <></>,
        }
    },
    deleted: function onSoftDelete(change, logItem, asNotification) {
        const isDeleted = detectBoolean(change?.after)
        const describeChange = isDeleted
            ? i18n.t('dashboardActivity.deleted', { defaultValue: 'deleted' })
            : i18n.t('dashboardActivity.restored', { defaultValue: 'restored' })
        return {
            description: [
                <>
                    {describeChange}
                    {asNotification
                        ? i18n.t('dashboardActivity.theDashboard', { defaultValue: ' the dashboard ' })
                        : ''}
                </>,
            ],
            suffix: <>{nameAndLink(logItem)}</>,
        }
    },
    description: function onDescription(change, _, asNotification) {
        return {
            description: [
                <>
                    {i18n.t('dashboardActivity.description.changed', { defaultValue: 'changed the description' })}
                    {asNotification
                        ? i18n.t('dashboardActivity.description.ofDashboard', { defaultValue: ' of the dashboard ' })
                        : ' '}
                    {i18n.t('dashboardActivity.description.to', { defaultValue: 'to' })}{' '}
                    <strong>"{change?.after as string}"</strong>
                </>,
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
                    {i18n.t('dashboardActivity.tags.added', {
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
                    {i18n.t('dashboardActivity.tags.removed', {
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
    pinned: function onPinned(change, logItem, asNotification) {
        const isFavoriteAfter = detectBoolean(change?.after)
        return {
            description: [
                <>
                    <div className="highlighted-activity">
                        {isFavoriteAfter
                            ? i18n.t('dashboardActivity.pinned', { defaultValue: 'pinned' })
                            : i18n.t('dashboardActivity.unpinned', { defaultValue: 'un-pinned' })}
                        {asNotification
                            ? i18n.t('dashboardActivity.theDashboard', { defaultValue: ' the dashboard ' })
                            : ''}
                    </div>
                </>,
            ],
            suffix: <>{nameAndLink(logItem)}</>,
        }
    },
    filters: function onChangedFilters(change, logItem) {
        const filtersAfter = change?.after as DashboardFilter
        return {
            description: [
                i18n.t('dashboardActivity.filters.changed', { defaultValue: 'changed the dashboard filters' }),
            ],
            extendedDescription: (
                <div className="ActivityDescription">
                    <PropertiesSummary properties={filtersAfter.properties} />
                    <BreakdownSummary breakdownFilter={filtersAfter.breakdown_filter} />
                    <DateRangeSummary dateFrom={filtersAfter.date_from} dateTo={filtersAfter.date_to} />
                </div>
            ),
            suffix: (
                <>
                    {i18n.t('dashboardActivity.suffix.on', { defaultValue: 'on the dashboard ' })}
                    {nameAndLink(logItem)} {i18n.t('dashboardActivity.suffix.to', { defaultValue: 'to' })}
                </>
            ),
        }
    },
    variables: function onChangedVariables(change, logItem) {
        const variablesAfter = change?.after as Record<string, HogQLVariable>
        return {
            description: [
                i18n.t('dashboardActivity.variables.changed', { defaultValue: 'changed the dashboard variables' }),
            ],
            extendedDescription: (
                <div className="ActivityDescription">
                    <VariablesSummary variables={variablesAfter} />
                </div>
            ),
            suffix: (
                <>
                    {i18n.t('dashboardActivity.suffix.on', { defaultValue: 'on the dashboard ' })}
                    {nameAndLink(logItem)} {i18n.t('dashboardActivity.suffix.to', { defaultValue: 'to' })}
                </>
            ),
        }
    },
    id: () => null,
    created_at: () => null,
    created_by: () => null,
    persisted_filters: () => null,
    persisted_variables: () => null,
    breakdown_colors: () => null,
    data_color_theme_id: () => null,
    last_accessed_at: () => null,
    folder: () => null,
    file_system_id: () => null,
    file_system_path: () => null,
    is_shared: () => null,
    creation_mode: () => null,
    user_access_level: () => null,
    _highlight: () => null,
    last_refresh: () => null,
    tiles: () => null,
    last_viewed_at: () => null,
    quick_filter_ids: () => null,
    customization: function onChangedCustomization(change) {
        const before = change?.before as DashboardType['customization']
        const after = change?.after as DashboardType['customization']
        const description: Description[] = []
        if (after?.layout_compaction && after.layout_compaction !== before?.layout_compaction) {
            description.push(
                <>
                    {i18n.t('dashboardActivity.customization.tileMovement', {
                        defaultValue: 'changed tile movement to ',
                    })}
                    <strong>{getDashboardGridCompactionLabels()[after.layout_compaction]}</strong>
                </>
            )
        }
        if (after?.tile_spacing && after.tile_spacing !== before?.tile_spacing) {
            if (description.length > 0) {
                description.push(i18n.t('dashboardActivity.customization.and', { defaultValue: ' and ' }))
            }
            description.push(
                <>
                    {i18n.t('dashboardActivity.customization.tileDensity', {
                        defaultValue: 'changed tile density to ',
                    })}
                    <strong>{getDashboardTileSpacingLabels()[after.tile_spacing]}</strong>
                </>
            )
        }
        return description.length > 0 ? { description } : null
    },
}

export function dashboardActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope != 'Dashboard') {
        console.error('dashboard describer received a non-dashboard activity')
        return { description: null }
    }

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('dashboardActivity.created', { defaultValue: 'created the dashboard' })}{' '}
                    {nameAndLink(logItem)}
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        let changes: Description[] = []
        let extendedDescription: JSX.Element | undefined
        let changeSuffix: Description = (
            <>
                {i18n.t('dashboardActivity.suffix.on', { defaultValue: 'on the dashboard ' })}
                {asNotification ? i18n.t('dashboardActivity.theDashboard', { defaultValue: ' the dashboard ' }) : ''}
                {nameAndLink(logItem)}
            </>
        )

        try {
            for (const change of logItem.detail.changes || []) {
                if (!change?.field || !isKeyOf(change.field, dashboardActionsMapping)) {
                    continue // dashboard updates have to have a "field" to be described
                }

                const actionHandler = dashboardActionsMapping[change.field]
                const processedChange = actionHandler(change, logItem, asNotification)
                if (processedChange === null) {
                    continue // // unexpected log from backend is indescribable
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
            console.error('Error while summarizing dashboard update', e)
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

    if (logItem.activity === 'sharing enabled') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('dashboardActivity.shared', { defaultValue: 'shared' })}{' '}
                    {asNotification
                        ? i18n.t('dashboardActivity.your', { defaultValue: 'your' })
                        : i18n.t('dashboardActivity.the', { defaultValue: 'the' })}{' '}
                    {i18n.t('dashboardActivity.sharedDashboard', { defaultValue: 'dashboard' })} {nameAndLink(logItem)}
                </>
            ),
        }
    }

    if (logItem.activity === 'sharing disabled') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('dashboardActivity.deletedSharedLinkFor', { defaultValue: 'deleted shared link for' })}{' '}
                    {asNotification
                        ? i18n.t('dashboardActivity.your', { defaultValue: 'your' })
                        : i18n.t('dashboardActivity.the', { defaultValue: 'the' })}{' '}
                    {i18n.t('dashboardActivity.sharedDashboard', { defaultValue: 'dashboard' })} {nameAndLink(logItem)}
                </>
            ),
        }
    }

    if (logItem.activity === 'access token refreshed') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('dashboardActivity.refreshedSharedLinkFor', {
                        defaultValue: 'refreshed the shared link for',
                    })}{' '}
                    {asNotification
                        ? i18n.t('dashboardActivity.your', { defaultValue: 'your' })
                        : i18n.t('dashboardActivity.the', { defaultValue: 'the' })}{' '}
                    {i18n.t('dashboardActivity.sharedDashboard', { defaultValue: 'dashboard' })} {nameAndLink(logItem)}
                </>
            ),
        }
    }

    if (logItem.activity === 'share_login_success') {
        const afterData = logItem.detail.changes?.[0]?.after as any
        const clientIp = afterData?.client_ip || i18n.t('dashboardActivity.unknownIp', { defaultValue: 'unknown IP' })
        const passwordNote =
            afterData?.password_note ||
            i18n.t('dashboardActivity.unknownpassword', { defaultValue: 'unknown password' })

        return {
            description: (
                <Trans
                    i18nKey="dashboardActivity.shareLoginSuccess"
                    values={{ ip: clientIp, name: dashboardName(logItem), password: passwordNote }}
                    components={{
                        Bold: <strong />,
                        NameBold: <b />,
                        NameLink: dashboardNameLink(logItem),
                    }}
                    defaults="<Bold>Anonymous user</Bold> successfully authenticated to shared dashboard <NameBold><NameLink>{{ name }}</NameLink></NameBold> from {{ ip }} using password <Bold>{{ password }}</Bold>"
                />
            ),
        }
    }

    if (logItem.activity === 'share_login_failed') {
        const afterData = logItem.detail.changes?.[0]?.after as any
        const clientIp = afterData?.client_ip || i18n.t('dashboardActivity.unknownIp', { defaultValue: 'unknown IP' })

        return {
            description: (
                <Trans
                    i18nKey="dashboardActivity.shareLoginFailed"
                    values={{ ip: clientIp, name: dashboardName(logItem) }}
                    components={{ Bold: <strong />, NameBold: <b />, NameLink: dashboardNameLink(logItem) }}
                    defaults="<Bold>Anonymous user</Bold> failed to authenticate to shared dashboard <NameBold><NameLink>{{ name }}</NameLink></NameBold> from {{ ip }}"
                />
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, nameAndLink(logItem))
}
