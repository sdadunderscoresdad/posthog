import type { TFunction } from 'i18next'

import type { SettingEnumApi } from '~/generated/core/api.schemas'

export type NotificationRuleValue = 'none' | 'on' | 'off'

export type NotificationConcept = {
    /** Typed against the generated enum, so a setting the API refuses cannot be listed here. */
    setting: SettingEnumApi
    label: string
    description: string
    /** Settings that break down by project are governed per project, the rest per person. */
    perProject: boolean
    /** True when the stored value means "disabled", so the control reads inverted. */
    inverse?: boolean
    /** Shown where a setting has no project dimension to offer. */
    note?: string
}

function noProjectNote(t: TFunction): string {
    return t('settings.organization.notifications.noProjectNote', {
        defaultValue: 'PostHog stores this one as a single value per person, so it cannot be set per project.',
    })
}

/**
 * Kept in step with `LOCKABLE_NOTIFICATION_SETTINGS` in
 * `posthog/models/organization_notification_lock.py`, which is what the API accepts.
 */
/**
 * Built from `t` rather than kept as a constant, because labels read at import time keep whatever
 * language the module happened to load in.
 */
export function notificationConcepts(t: TFunction): NotificationConcept[] {
    return [
        {
            setting: 'pipeline_notifications_disabled',
            label: t('settings.organization.notifications.concepts.pipelineErrors.label', {
                defaultValue: 'Data pipeline errors',
            }),
            description: t('settings.organization.notifications.concepts.pipelineErrors.description', {
                defaultValue: 'Emails when destinations, batch exports, or transformations fail.',
            }),
            perProject: true,
            inverse: true,
        },
        {
            setting: 'project_weekly_digest_disabled',
            label: t('settings.organization.notifications.concepts.weeklyDigest.label', {
                defaultValue: 'Weekly digest',
            }),
            description: t('settings.organization.notifications.concepts.weeklyDigest.description', {
                defaultValue: 'A weekly summary of what happened in a project.',
            }),
            perProject: true,
            inverse: true,
        },
        {
            setting: 'error_tracking_weekly_digest_project_enabled',
            label: t('settings.organization.notifications.concepts.errorTrackingDigest.label', {
                defaultValue: 'Error tracking weekly digest',
            }),
            description: t('settings.organization.notifications.concepts.errorTrackingDigest.description', {
                defaultValue: 'A weekly summary of exceptions caught in a project.',
            }),
            perProject: true,
        },
        {
            setting: 'web_analytics_weekly_digest_project_enabled',
            label: t('settings.organization.notifications.concepts.webAnalyticsDigest.label', {
                defaultValue: 'Web analytics weekly digest',
            }),
            description: t('settings.organization.notifications.concepts.webAnalyticsDigest.description', {
                defaultValue: 'A weekly summary of web traffic in a project.',
            }),
            perProject: true,
        },
        {
            setting: 'error_tracking_issue_assigned',
            label: t('settings.organization.notifications.concepts.issueAssigned.label', {
                defaultValue: 'Issue assigned',
            }),
            description: t('settings.organization.notifications.concepts.issueAssigned.description', {
                defaultValue: 'An email when an error tracking issue is assigned to them.',
            }),
            perProject: false,
            note: noProjectNote(t),
        },
        {
            setting: 'discussions_mentioned',
            label: t('settings.organization.notifications.concepts.commentMentions.label', {
                defaultValue: 'Comment mentions',
            }),
            description: t('settings.organization.notifications.concepts.commentMentions.description', {
                defaultValue: 'An email when someone mentions them in a discussion.',
            }),
            perProject: false,
            note: noProjectNote(t),
        },
        {
            setting: 'organization_member_join_email_disabled',
            label: t('settings.organization.notifications.concepts.memberJoined.label', {
                defaultValue: 'New member joined',
            }),
            description: t('settings.organization.notifications.concepts.memberJoined.description', {
                defaultValue: 'An email when someone joins the organization.',
            }),
            perProject: false,
            inverse: true,
        },
        {
            setting: 'materialized_view_sync_failed',
            label: t('settings.organization.notifications.concepts.matviewFailures.label', {
                defaultValue: 'Materialized view sync failures',
            }),
            description: t('settings.organization.notifications.concepts.matviewFailures.description', {
                defaultValue: 'Emails when a materialized view fails to sync.',
            }),
            perProject: false,
            note: noProjectNote(t),
        },
        {
            setting: 'materialized_view_sync_failed_daily',
            label: t('settings.organization.notifications.concepts.matviewDaily.label', {
                defaultValue: 'Materialized view failures, daily digest',
            }),
            description: t('settings.organization.notifications.concepts.matviewDaily.description', {
                defaultValue: 'One email a day summarizing failing views. Applies to people receiving the failures.',
            }),
            perProject: false,
        },
        {
            setting: 'materialized_view_sync_failed_immediate',
            label: t('settings.organization.notifications.concepts.matviewImmediate.label', {
                defaultValue: 'Materialized view failures, right away',
            }),
            description: t('settings.organization.notifications.concepts.matviewImmediate.description', {
                defaultValue: 'An email each time a view starts failing. Applies to people receiving the failures.',
            }),
            perProject: false,
        },
    ]
}

/**
 * The stored form of a rule. Some settings are stored as "disabled", so a rule that turns a
 * notification on stores `false`. This is the only place that knows which way round each is.
 */
export function storedValueFor(concept: NotificationConcept, value: 'on' | 'off'): boolean {
    const on = value === 'on'
    return concept.inverse ? !on : on
}

export function ruleValueFor(concept: NotificationConcept, stored: boolean): 'on' | 'off' {
    const on = concept.inverse ? !stored : stored
    return on ? 'on' : 'off'
}
