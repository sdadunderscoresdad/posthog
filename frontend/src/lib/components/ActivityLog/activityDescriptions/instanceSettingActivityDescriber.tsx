import {
    ActivityLogItem,
    ActivityLogUserName,
    Describer,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

import { ActivityScope } from '~/types'

// Kept in sync with the sentinels the backend records in posthog/api/instance_settings.py.
const REDACTED = '<redacted>'
const UNSET = '<unset>'

// Secret settings are never logged in cleartext — the backend records these
// sentinels instead of the value. Translate the before/after sentinel pair into
// the operation that happened so the audit line is legible without exposing the
// raw markers. Returns null for any non-secret transition.
const describeSecretTransition = (before: unknown, after: unknown): string | null => {
    if (before === UNSET && after === REDACTED) {
        return 'set'
    }
    if (before === REDACTED && after === REDACTED) {
        return 'rotated'
    }
    if (before === REDACTED && after === UNSET) {
        return 'cleared'
    }
    return null
}

const isSentinel = (value: unknown): boolean => value === REDACTED || value === UNSET

export const instanceSettingActivityDescriber: Describer = (
    logItem: ActivityLogItem,
    asNotification?: boolean
): HumanizedChange => {
    if (logItem.scope !== ActivityScope.INSTANCE_SETTING || logItem.activity !== 'updated') {
        return defaultDescriber(logItem, asNotification)
    }

    const change = logItem.detail.changes?.[0]
    if (!change) {
        return defaultDescriber(logItem, asNotification)
    }

    const key =
        change.field || logItem.detail.name || i18n.t('activityLog.unknownSetting', { defaultValue: 'unknown setting' })
    const transition = describeSecretTransition(change.before, change.after)
    const actor = <ActivityLogUserName logItem={logItem} />

    if (transition) {
        return {
            description: (
                <>
                    {actor} {transition}{' '}
                    {i18n.t('activityLog.instanceSettings.instanceSetting', { defaultValue: 'instance setting' })}{' '}
                    <code>{key}</code>
                </>
            ),
        }
    }

    // A secret transition we don't have a verb for: render a generic line rather than
    // echo the raw sentinel into the audit log.
    if (isSentinel(change.before) || isSentinel(change.after)) {
        return {
            description: (
                <>
                    {actor}{' '}
                    {i18n.t('activityLog.instanceSettings.updated', { defaultValue: 'updated instance setting' })}{' '}
                    <code>{key}</code>
                </>
            ),
        }
    }

    return {
        description: (
            <>
                {actor} {i18n.t('activityLog.instanceSettings.changed', { defaultValue: 'changed instance setting' })}{' '}
                <code>{key}</code> {i18n.t('activityLog.from', { defaultValue: 'from' })}{' '}
                <code>{JSON.stringify(change.before)}</code> {i18n.t('activityLog.to', { defaultValue: 'to' })}{' '}
                <code>{JSON.stringify(change.after)}</code>
            </>
        ),
    }
}
