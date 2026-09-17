import { Trans } from 'react-i18next'

import {
    ActivityChange,
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { SentenceList } from 'lib/components/ActivityLog/SentenceList'
import { i18n } from 'lib/i18n/i18n'

// Mirrors backend `sync_frequency_to_sync_frequency_interval` in
// products/data_warehouse/backend/models/external_data_schema.py — the values arrive
// as `str(timedelta(...))` ("H:MM:SS" or "X day(s), H:MM:SS"). Falls through to the raw
// string for any unmapped interval, so the UI degrades gracefully if a new bucket lands
// on the backend before this map is updated.
function humanizeInterval(raw: string | null | undefined): string {
    if (!raw) {
        return i18n.t('savedQueryActivity.none', { defaultValue: 'none' })
    }
    const buckets: Record<string, string> = {
        '0:01:00': i18n.t('savedQueryActivity.interval.oneMinute', { defaultValue: '1 minute' }),
        '0:05:00': i18n.t('savedQueryActivity.interval.fiveMinutes', { defaultValue: '5 minutes' }),
        '0:15:00': i18n.t('savedQueryActivity.interval.fifteenMinutes', { defaultValue: '15 minutes' }),
        '0:30:00': i18n.t('savedQueryActivity.interval.thirtyMinutes', { defaultValue: '30 minutes' }),
        '1:00:00': i18n.t('savedQueryActivity.interval.oneHour', { defaultValue: '1 hour' }),
        '6:00:00': i18n.t('savedQueryActivity.interval.sixHours', { defaultValue: '6 hours' }),
        '12:00:00': i18n.t('savedQueryActivity.interval.twelveHours', { defaultValue: '12 hours' }),
        '1 day, 0:00:00': i18n.t('savedQueryActivity.interval.oneDay', { defaultValue: '1 day' }),
        '7 days, 0:00:00': i18n.t('savedQueryActivity.interval.sevenDays', { defaultValue: '7 days' }),
        '30 days, 0:00:00': i18n.t('savedQueryActivity.interval.thirtyDays', { defaultValue: '30 days' }),
    }
    return buckets[raw] ?? raw
}

function describeChange(change: ActivityChange): JSX.Element | null {
    if (change.field === 'sync_frequency_interval') {
        const before = humanizeInterval(change.before as string | null)
        const after = humanizeInterval(change.after as string | null)
        return (
            <Trans
                i18nKey="savedQueryActivity.syncFrequencyChanged"
                values={{ before, after }}
                components={{ Bold: <strong /> }}
                defaults="changed sync frequency from <Bold>{{ before }}</Bold> to <Bold>{{ after }}</Bold>"
            />
        )
    }
    if (change.field === 'is_materialized') {
        return (
            <>
                {change.after
                    ? i18n.t('savedQueryActivity.materializationEnabled', { defaultValue: 'enabled materialization' })
                    : i18n.t('savedQueryActivity.materializationDisabled', {
                          defaultValue: 'disabled materialization',
                      })}
            </>
        )
    }
    if (change.field === 'query') {
        return <>{i18n.t('savedQueryActivity.queryUpdated', { defaultValue: 'updated the query' })}</>
    }
    return (
        <>{i18n.t('savedQueryActivity.changedField', { field: change.field, defaultValue: 'changed {{ field }}' })}</>
    )
}

export function dataWarehouseSavedQueryActivityDescriber(
    logItem: ActivityLogItem,
    asNotification?: boolean
): HumanizedChange {
    if (logItem.scope !== 'DataWarehouseSavedQuery') {
        console.error('data warehouse saved query describer received a non-data warehouse saved query activity')
        return { description: null }
    }

    const user = <ActivityLogUserName logItem={logItem} />
    const viewName = logItem.detail?.name ? (
        <strong>{logItem.detail.name}</strong>
    ) : (
        <i>{i18n.t('savedQueryActivity.aView', { defaultValue: 'a view' })}</i>
    )

    if (logItem.activity === 'created') {
        return {
            description: (
                <SentenceList
                    listParts={[
                        <>
                            {i18n.t('savedQueryActivity.created', { defaultValue: 'created' })} {viewName}
                        </>,
                    ]}
                    prefix={user}
                />
            ),
        }
    }

    if (logItem.activity === 'updated') {
        const changes = logItem.detail?.changes ?? []
        const parts = changes.map(describeChange).filter((p): p is JSX.Element => p !== null)
        return {
            description: (
                <SentenceList
                    listParts={
                        parts.length > 0
                            ? parts
                            : [<>{i18n.t('savedQueryActivity.updatedTheView', { defaultValue: 'updated the view' })}</>]
                    }
                    prefix={user}
                    suffix={
                        <>
                            {i18n.t('savedQueryActivity.onView', { defaultValue: 'on' })} {viewName}
                        </>
                    }
                />
            ),
        }
    }

    if (logItem.activity === 'sync_triggered') {
        return {
            description: (
                <SentenceList
                    listParts={[
                        <>
                            {i18n.t('savedQueryActivity.syncTriggered', {
                                defaultValue: 'triggered an ad-hoc sync on',
                            })}{' '}
                            {viewName}
                        </>,
                    ]}
                    prefix={user}
                />
            ),
        }
    }

    if (logItem.activity === 'sync_cancelled') {
        return {
            description: (
                <SentenceList
                    listParts={[
                        <>
                            {i18n.t('savedQueryActivity.syncCancelled', {
                                defaultValue: 'cancelled a running sync on',
                            })}{' '}
                            {viewName}
                        </>,
                    ]}
                    prefix={user}
                />
            ),
        }
    }

    if (logItem.activity === 'materialization_enabled') {
        const changes = logItem.detail?.changes ?? []
        const freqChange = changes.find((c) => c.field === 'sync_frequency_interval')
        const parts: JSX.Element[] = [
            <>
                {i18n.t('savedQueryActivity.materializationEnabledFor', {
                    defaultValue: 'enabled materialization for',
                })}{' '}
                {viewName}
            </>,
        ]
        if (freqChange) {
            const after = humanizeInterval(freqChange.after as string | null)
            parts.push(
                <>
                    {i18n.t('savedQueryActivity.withSyncFrequency', { defaultValue: 'with sync frequency' })}{' '}
                    <strong>{after}</strong>
                </>
            )
        }
        return { description: <SentenceList listParts={parts} prefix={user} /> }
    }

    if (logItem.activity === 'materialization_disabled') {
        return {
            description: (
                <SentenceList
                    listParts={[
                        <>
                            {i18n.t('savedQueryActivity.materializationDisabledFor', {
                                defaultValue: 'disabled materialization for',
                            })}{' '}
                            {viewName}
                        </>,
                    ]}
                    prefix={user}
                />
            ),
        }
    }

    if (logItem.activity === 'sync_frequency_reset') {
        const changes = logItem.detail?.changes ?? []
        const freqChange = changes.find((c) => c.field === 'sync_frequency_interval')
        const after = freqChange ? humanizeInterval(freqChange.after as string | null) : 'default'
        return {
            description: (
                <SentenceList
                    listParts={[
                        <>
                            {i18n.t('savedQueryActivity.syncFrequencyAutoReset', {
                                defaultValue: 'auto-reset sync frequency to',
                            })}{' '}
                            <strong>{after}</strong> {i18n.t('savedQueryActivity.forView', { defaultValue: 'for' })}{' '}
                            {viewName}
                        </>,
                    ]}
                    prefix={user}
                />
            ),
        }
    }

    if (logItem.activity === 'deleted') {
        return {
            description: (
                <SentenceList
                    listParts={[
                        <>
                            {i18n.t('savedQueryActivity.deleted', { defaultValue: 'deleted' })} {viewName}
                        </>,
                    ]}
                    prefix={user}
                />
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, viewName)
}
