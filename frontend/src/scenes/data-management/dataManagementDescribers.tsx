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
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { i18n } from 'lib/i18n/i18n'
import { IconVerifiedEvent } from 'lib/lemon-ui/icons'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

import { ActivityScope } from '~/types'

const dataManagementActionsMapping: Record<
    string,
    (change?: ActivityChange, logItem?: ActivityLogItem) => ChangeMapping | null
> = {
    description: (change) => {
        return {
            description: [
                <>
                    {i18n.t('dataManagementActivity.changedDescriptionTo', { defaultValue: 'changed description to' })}{' '}
                    <strong>"{change?.after as string}"</strong>
                </>,
            ],
        }
    },
    tags: function onTags(change) {
        const tagsBefore = (change?.before as string[] | null) ?? []
        const tagsAfter = (change?.after as string[] | null) ?? []
        const addedTags = tagsAfter.filter((t) => !tagsBefore.includes(t))
        const removedTags = tagsBefore.filter((t) => !tagsAfter.includes(t))

        const changes: Description[] = []
        if (addedTags.length) {
            changes.push(
                <>
                    {i18n.t('dataManagementActivity.tags.added', {
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
                    {i18n.t('dataManagementActivity.tags.removed', {
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
    verified: (change, logItem) => {
        const verified = detectBoolean(change?.after)
        return {
            description: [
                <>
                    {i18n.t('dataManagementActivity.marked', { defaultValue: 'marked' })} {nameAndLink(logItem)}{' '}
                    {i18n.t('dataManagementActivity.as', { defaultValue: 'as' })}{' '}
                    <strong>
                        {verified
                            ? i18n.t('dataManagementActivity.verified', { defaultValue: 'verified' })
                            : i18n.t('dataManagementActivity.unverified', { defaultValue: 'unverified' })}
                    </strong>{' '}
                    {verified && <IconVerifiedEvent />}
                </>,
            ],
            suffix: <></>,
        }
    },
}

function unknownName(): string {
    return i18n.t('dataManagementActivity.unknown', { defaultValue: 'unknown' })
}

function nameAndLink(logItem?: ActivityLogItem): JSX.Element {
    return logItem?.item_id ? (
        <Link to={urls.eventDefinition(logItem.item_id)}>{logItem?.detail.name || unknownName()}</Link>
    ) : logItem?.detail.name ? (
        <>{logItem?.detail.name}</>
    ) : (
        <>{unknownName()}</>
    )
}

function DescribeType({ logItem }: { logItem: ActivityLogItem }): JSX.Element {
    if (logItem.scope === ActivityScope.EVENT_DEFINITION) {
        return <>{i18n.t('dataManagementActivity.eventDefinition', { defaultValue: 'event definition' })}</>
    }
    return (
        <>
            <span className="highlighted-activity">{logItem.detail?.type}</span>{' '}
            {i18n.t('dataManagementActivity.propertyDefinition', { defaultValue: 'property definition' })}
        </>
    )
}

export function dataManagementActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope !== ActivityScope.EVENT_DEFINITION && logItem.scope !== ActivityScope.PROPERTY_DEFINITION) {
        console.error('data management describer received a non-data-management activity')
        return { description: null }
    }

    if (logItem.activity == 'changed') {
        let changes: Description[] = []
        let changeSuffix: Description = (
            <>
                {i18n.t('dataManagementActivity.on', { defaultValue: 'on' })} <DescribeType logItem={logItem} />{' '}
                {nameAndLink(logItem)}
            </>
        )

        for (const change of logItem.detail.changes || []) {
            if (!change?.field || !dataManagementActionsMapping[change.field]) {
                continue //  updates have to have a "field" to be described
            }

            const actionHandler = dataManagementActionsMapping[change.field]
            const processedChange = actionHandler(change, logItem)
            if (processedChange === null) {
                continue // // unexpected log from backend is indescribable
            }

            const { description, suffix } = processedChange
            if (description) {
                changes = changes.concat(description)
            }

            if (suffix) {
                changeSuffix = suffix
            }
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
            }
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('activityLog.deleted', { defaultValue: 'deleted' })} <DescribeType logItem={logItem} />{' '}
                    {nameAndLink(logItem)}
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, nameAndLink(logItem))
}
