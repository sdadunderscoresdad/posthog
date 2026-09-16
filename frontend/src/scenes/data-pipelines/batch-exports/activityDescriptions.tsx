import { Trans } from 'react-i18next'

import {
    ActivityChange,
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

import { dayOptions, formatHourString } from './utils'

const nameOrLinkToBatchExport = (id?: string | null, name?: string | null): string | JSX.Element => {
    const displayName = name || i18n.t('batchExport.unnamed', { defaultValue: '(unnamed export)' })
    return id ? <Link to={urls.batchExport(id)}>{displayName}</Link> : `${displayName}`
}

// ---------------------------------------------------------------------------
// Schedule display helpers
// ---------------------------------------------------------------------------

const SCHEDULE_FIELDS = new Set(['interval', 'interval_offset', 'timezone'])

interface ScheduleValues {
    interval?: string
    offset?: number
    timezone?: string
}

function parseScheduleChanges(changes: ActivityChange[]): {
    before: ScheduleValues
    after: ScheduleValues
    hasIntervalChange: boolean
} {
    const before: ScheduleValues = {}
    const after: ScheduleValues = {}
    let hasIntervalChange = false

    for (const change of changes) {
        switch (change.field) {
            case 'interval':
                hasIntervalChange = true
                if (typeof change.before === 'string') {
                    before.interval = change.before
                }
                if (typeof change.after === 'string') {
                    after.interval = change.after
                }
                break
            case 'interval_offset':
                // null means default (midnight), so treat as 0
                before.offset = typeof change.before === 'number' ? change.before : 0
                after.offset = typeof change.after === 'number' ? change.after : 0
                break
            case 'timezone':
                if (typeof change.before === 'string') {
                    before.timezone = change.before
                }
                if (typeof change.after === 'string') {
                    after.timezone = change.after
                }
                break
        }
    }

    return { before, after, hasIntervalChange }
}

function isSubDayInterval(interval: string | undefined): boolean {
    return interval === 'hour' || (!!interval && interval.startsWith('every'))
}

/** The weekday a weekly schedule starts on, in the language the app is rendering. */
function weekdayLabel(day: number): string {
    switch (day) {
        case 0:
            return i18n.t('batchExport.weekday.sunday', { defaultValue: 'Sunday' })
        case 1:
            return i18n.t('batchExport.weekday.monday', { defaultValue: 'Monday' })
        case 2:
            return i18n.t('batchExport.weekday.tuesday', { defaultValue: 'Tuesday' })
        case 3:
            return i18n.t('batchExport.weekday.wednesday', { defaultValue: 'Wednesday' })
        case 4:
            return i18n.t('batchExport.weekday.thursday', { defaultValue: 'Thursday' })
        case 5:
            return i18n.t('batchExport.weekday.friday', { defaultValue: 'Friday' })
        default:
            return i18n.t('batchExport.weekday.saturday', { defaultValue: 'Saturday' })
    }
}

function formatOffsetTime(seconds: number): string {
    return formatHourString(Math.floor((seconds % 86400) / 3600))
}

/**
 * Build a human-readable schedule string from typed schedule values.
 * Examples: "hourly", "daily at 14:00 (Asia/Muscat)", "weekly on Monday at 01:00 (UTC)"
 */
export function formatSchedule(interval: string | undefined, offset?: number, timezone?: string): string | null {
    if (!interval) {
        return null
    }

    if (isSubDayInterval(interval)) {
        return interval === 'hour' ? i18n.t('batchExport.schedule.hourly', { defaultValue: 'hourly' }) : interval
    }

    let schedule =
        interval === 'day'
            ? i18n.t('batchExport.schedule.daily', { defaultValue: 'daily' })
            : interval === 'week'
              ? i18n.t('batchExport.schedule.weekly', { defaultValue: 'weekly' })
              : interval

    if (offset !== undefined) {
        const day = Math.floor(offset / 86400)
        const hourStr = formatOffsetTime(offset)

        if (interval === 'week') {
            const dayValue = dayOptions.find((d) => d.value === day)?.value ?? dayOptions[0].value
            schedule += i18n.t('batchExport.schedule.onDayAt', {
                defaultValue: ' on {{ day }} at {{ time }}',
                day: weekdayLabel(dayValue),
                time: hourStr,
            })
        } else {
            schedule += i18n.t('batchExport.schedule.at', {
                defaultValue: ' at {{ time }}',
                time: hourStr,
            })
        }
    }

    if (timezone) {
        schedule += ` (${timezone})`
    }

    return schedule
}

/**
 * Produce descriptions for schedule-related changes.
 *
 * When the interval changes, we combine all schedule fields into one "schedule" description
 * (e.g. "changed schedule from hourly to daily at 14:00 (UTC)").
 *
 * When only timezone or start time changes (no interval change), we describe them individually
 * since we don't have enough context to build a full schedule string.
 */
function describeScheduleChanges(scheduleChanges: ActivityChange[]): ChangeDescription[] {
    if (scheduleChanges.length === 0) {
        return []
    }

    const { before, after, hasIntervalChange } = parseScheduleChanges(scheduleChanges)

    // When the interval changes, combine everything into a single "schedule" description
    if (hasIntervalChange) {
        // When coming from a sub-day interval, offset and timezone weren't previously configurable,
        // so we can safely assume defaults (0 = midnight, UTC) for the "after" side if they're
        // not in the changes. We can't do this when switching between daily/weekly since those
        // fields may have been previously set to non-default values.
        const comingFromSubDay = isSubDayInterval(before.interval)
        const afterWithDefaults: ScheduleValues = comingFromSubDay
            ? { ...after, offset: after.offset ?? 0, timezone: after.timezone ?? 'UTC' }
            : after

        const beforeStr = formatSchedule(before.interval, before.offset, before.timezone)
        const afterStr = formatSchedule(
            afterWithDefaults.interval,
            afterWithDefaults.offset,
            afterWithDefaults.timezone
        )

        if (beforeStr && afterStr && beforeStr !== afterStr) {
            return [
                describeFieldChange(
                    i18n.t('batchExport.field.schedule', { defaultValue: 'schedule' }),
                    beforeStr,
                    afterStr
                ),
            ]
        }
        if (afterStr) {
            return [
                describeFieldChange(i18n.t('batchExport.field.schedule', { defaultValue: 'schedule' }), null, afterStr),
            ]
        }
        return [
            {
                inline: (
                    <>{i18n.t('batchExport.updatedTheScheduleFor', { defaultValue: 'updated the schedule for' })}</>
                ),
                inlist: <>{i18n.t('batchExport.updatedSchedule', { defaultValue: 'updated schedule' })}</>,
            },
        ]
    }

    // No interval change — describe each schedule field individually
    const descriptions: ChangeDescription[] = []

    if (before.timezone !== undefined || after.timezone !== undefined) {
        descriptions.push(
            describeFieldChange(
                i18n.t('batchExport.field.scheduleTimezone', { defaultValue: 'schedule timezone' }),
                before.timezone ?? null,
                after.timezone ?? null
            )
        )
    }
    if (before.offset !== undefined || after.offset !== undefined) {
        const beforeStr = before.offset !== undefined ? formatOffsetTime(before.offset) : null
        const afterStr = after.offset !== undefined ? formatOffsetTime(after.offset) : null
        descriptions.push(
            describeFieldChange(
                i18n.t('batchExport.field.scheduleStartTime', { defaultValue: 'schedule start time' }),
                beforeStr,
                afterStr
            )
        )
    }

    return descriptions
}

// ---------------------------------------------------------------------------
// Generic value formatting
// ---------------------------------------------------------------------------

/** Format a raw change value for display. Returns null if the value can't be meaningfully shown. */
function humanizeValue(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }
    if (typeof value === 'string') {
        return value
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false'
    }
    return JSON.stringify(value)
}

function humanizeFieldName(field: string): string {
    switch (field) {
        case 'destination':
            return i18n.t('batchExport.field.destination', { defaultValue: 'destination config' })
        case 'start_at':
            return i18n.t('batchExport.field.startAt', { defaultValue: 'start time' })
        case 'end_at':
            return i18n.t('batchExport.field.endAt', { defaultValue: 'end time' })
        default:
            return field.replace(/_/g, ' ')
    }
}

// ---------------------------------------------------------------------------
// Change description builder
// ---------------------------------------------------------------------------

type ChangeDescription = { inline: string | JSX.Element; inlist: string | JSX.Element }

function describeFieldChange(label: string, before: string | null, after: string | null): ChangeDescription {
    if (before && after) {
        return {
            inline: (
                <Trans
                    i18nKey="batchExport.fieldChange.changedInline"
                    values={{ label, before, after }}
                    components={{ Before: <strong />, After: <strong /> }}
                    defaults="changed the {{ label }} from <Before>{{ before }}</Before> to <After>{{ after }}</After> for"
                />
            ),
            inlist: (
                <Trans
                    i18nKey="batchExport.fieldChange.changedInList"
                    values={{ label, before, after }}
                    components={{ Before: <strong />, After: <strong /> }}
                    defaults="changed {{ label }} from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                />
            ),
        }
    }
    if (after) {
        return {
            inline: (
                <Trans
                    i18nKey="batchExport.fieldChange.setInline"
                    values={{ label, after }}
                    components={{ After: <strong /> }}
                    defaults="changed the {{ label }} to <After>{{ after }}</After> for"
                />
            ),
            inlist: (
                <Trans
                    i18nKey="batchExport.fieldChange.setInList"
                    values={{ label, after }}
                    components={{ After: <strong /> }}
                    defaults="changed {{ label }} to <After>{{ after }}</After>"
                />
            ),
        }
    }
    return {
        inline: (
            <Trans
                i18nKey="batchExport.fieldChange.updatedInline"
                values={{ label }}
                defaults="updated the {{ label }} for"
            />
        ),
        inlist: (
            <Trans i18nKey="batchExport.fieldChange.updatedInList" values={{ label }} defaults="updated {{ label }}" />
        ),
    }
}

// ---------------------------------------------------------------------------
// Main describer
// ---------------------------------------------------------------------------

export function batchExportActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    const exportName = nameOrLinkToBatchExport(logItem?.item_id, logItem?.detail.name)

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('batchExport.created', { defaultValue: 'created' })}{' '}
                    {i18n.t('batchExport.noun', { defaultValue: 'batch export' })} {exportName}
                </>
            ),
        }
    }

    if (logItem.detail?.changes?.some((change) => change.field === 'deleted')) {
        const displayName = logItem.detail.name || i18n.t('batchExport.unnamed', { defaultValue: '(unnamed export)' })
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('batchExport.deleted', { defaultValue: 'deleted' })}{' '}
                    {i18n.t('batchExport.noun', { defaultValue: 'batch export' })} <strong>{displayName}</strong>
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        const changes: ChangeDescription[] = []
        const scheduleChanges: ActivityChange[] = []

        for (const change of logItem.detail.changes ?? []) {
            if (change.field && SCHEDULE_FIELDS.has(change.field)) {
                scheduleChanges.push(change)
                continue
            }

            switch (change.field) {
                case 'enabled': {
                    // Raw value is "paused" — true means paused/disabled
                    if (change.after) {
                        changes.push({
                            inline: i18n.t('batchExport.disabled', { defaultValue: 'disabled' }),
                            inlist: `${i18n.t('batchExport.disabled', { defaultValue: 'disabled' })} ${i18n.t('batchExport.theNoun', { defaultValue: 'the batch export' })}`,
                        })
                    } else {
                        changes.push({
                            inline: i18n.t('batchExport.enabled', { defaultValue: 'enabled' }),
                            inlist: `${i18n.t('batchExport.enabled', { defaultValue: 'enabled' })} ${i18n.t('batchExport.theNoun', { defaultValue: 'the batch export' })}`,
                        })
                    }
                    break
                }
                case 'deleted': {
                    changes.push({
                        inline: i18n.t('batchExport.deletedInline', { defaultValue: 'deleted' }),
                        inlist: `${i18n.t('batchExport.deletedInline', { defaultValue: 'deleted' })} ${i18n.t('batchExport.theNoun', { defaultValue: 'the batch export' })}`,
                    })
                    break
                }
                default: {
                    changes.push(
                        describeFieldChange(
                            humanizeFieldName(change.field ?? ''),
                            humanizeValue(change.before),
                            humanizeValue(change.after)
                        )
                    )
                }
            }
        }

        changes.push(...describeScheduleChanges(scheduleChanges))

        if (changes.length === 0) {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('batchExport.updated', { defaultValue: 'updated' })}{' '}
                        {i18n.t('batchExport.noun', { defaultValue: 'batch export' })} {exportName}
                    </>
                ),
            }
        }

        const updatedExport = `${i18n.t('batchExport.updated', { defaultValue: 'updated' })} ${i18n.t(
            'batchExport.noun',
            { defaultValue: 'batch export' }
        )}`
        return {
            description:
                changes.length === 1 ? (
                    <>
                        <ActivityLogUserName logItem={logItem} /> {changes[0].inline}{' '}
                        {i18n.t('batchExport.noun', { defaultValue: 'batch export' })} {exportName}
                    </>
                ) : (
                    <div>
                        <ActivityLogUserName logItem={logItem} /> {updatedExport} {exportName}
                        <ul className="ml-5 list-disc">
                            {changes.map((c, i) => (
                                <li key={i}>{c.inlist}</li>
                            ))}
                        </ul>
                    </div>
                ),
        }
    }

    return defaultDescriber(logItem, asNotification, exportName)
}
