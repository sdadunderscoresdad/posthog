import { useActions, useValues } from 'kea'

import { IconArchive, IconCheckCircle } from '@posthog/icons'
import { Tooltip } from '@posthog/lemon-ui'

import {
    NotificationActionButton,
    ROW_ACTION_REVEAL_CLASSES,
} from 'lib/components/NotificationsMenu/NotificationActionButton'
import { getNotificationDescriber } from 'lib/components/NotificationsMenu/notificationDescribers'
import { getNotificationIcon } from 'lib/components/NotificationsMenu/notificationToasts'
import { useAutoMarkRead } from 'lib/components/NotificationsMenu/useAutoMarkRead'
import { dayjs } from 'lib/dayjs'
import { getActiveLocale, i18n } from 'lib/i18n/i18n'
import { IconOpenInNew, IconRadioButtonUnchecked } from 'lib/lemon-ui/icons'

import { sidePanelNotificationsLogic } from '~/layout/navigation-3000/sidepanel/panels/activity/sidePanelNotificationsLogic'
import { InAppNotification } from '~/types'

/**
 * The label and description each realtime notification type shows in the preferences. Built per
 * language, because a map of messages resolved at import would keep the language the app started in.
 */
function buildRealtimeNotificationTypeMeta(): Record<string, { label: string; description: string }> {
    return {
        comment_mention: {
            label: i18n.t('notifications.type.commentMention.label', { defaultValue: 'Comment mentions' }),
            description: i18n.t('notifications.type.commentMention.description', {
                defaultValue: 'When someone @mentions you in a discussion',
            }),
        },
        alert_firing: {
            label: i18n.t('notifications.type.alertFiring.label', { defaultValue: 'Alerts firing' }),
            description: i18n.t('notifications.type.alertFiring.description', {
                defaultValue: 'When an alert you subscribe to triggers',
            }),
        },
        approval_requested: {
            label: i18n.t('notifications.type.approvalRequested.label', { defaultValue: 'Approvals requested' }),
            description: i18n.t('notifications.type.approvalRequested.description', {
                defaultValue: 'When a change is awaiting your approval',
            }),
        },
        approval_resolved: {
            label: i18n.t('notifications.type.approvalResolved.label', { defaultValue: 'Approvals resolved' }),
            description: i18n.t('notifications.type.approvalResolved.description', {
                defaultValue: 'When an approval you requested is decided',
            }),
        },
        pipeline_failure: {
            label: i18n.t('notifications.type.pipelineFailure.label', { defaultValue: 'Pipeline failures' }),
            description: i18n.t('notifications.type.pipelineFailure.description', {
                defaultValue: 'When a data pipeline or batch export fails',
            }),
        },
        materialization_failure: {
            label: i18n.t('notifications.type.materializationFailure.label', {
                defaultValue: 'Materialized view failures',
            }),
            description: i18n.t('notifications.type.materializationFailure.description', {
                defaultValue: 'When a materialized view in your project fails to refresh',
            }),
        },
        issue_assigned: {
            label: i18n.t('notifications.type.issueAssigned.label', { defaultValue: 'Issues assigned' }),
            description: i18n.t('notifications.type.issueAssigned.description', {
                defaultValue: 'When an error tracking issue is assigned to you',
            }),
        },
        experiment_concluded: {
            label: i18n.t('notifications.type.experimentConcluded.label', { defaultValue: 'Experiments concluded' }),
            description: i18n.t('notifications.type.experimentConcluded.description', {
                defaultValue: 'When an experiment you created ends',
            }),
        },
        project_created: {
            label: i18n.t('notifications.type.projectCreated.label', { defaultValue: 'Projects created' }),
            description: i18n.t('notifications.type.projectCreated.description', {
                defaultValue: 'When a member creates a new project in your organization',
            }),
        },
        usage_spike: {
            label: i18n.t('notifications.type.usageSpike.label', { defaultValue: 'Usage spikes' }),
            description: i18n.t('notifications.type.usageSpike.description', {
                defaultValue: 'When billing detects a usage spike for one of your accounts',
            }),
        },
        reminder: {
            label: i18n.t('notifications.type.reminder.label', { defaultValue: 'Reminders' }),
            description: i18n.t('notifications.type.reminder.description', {
                defaultValue: 'When a reminder you scheduled is due',
            }),
        },
        web_analytics_digest: {
            label: i18n.t('notifications.type.webAnalyticsDigest.label', { defaultValue: 'Web analytics digest' }),
            description: i18n.t('notifications.type.webAnalyticsDigest.description', {
                defaultValue: 'Your weekly Web analytics summary is ready!',
            }),
        },
        achievement_unlocked: {
            label: i18n.t('notifications.type.achievementUnlocked.label', { defaultValue: 'Achievement unlocked' }),
            description: i18n.t('notifications.type.achievementUnlocked.description', {
                defaultValue: 'When you unlock a new achievement',
            }),
        },
        subscription_nudge: {
            label: i18n.t('notifications.type.subscriptionNudge.label', { defaultValue: 'Subscription suggestions' }),
            description: i18n.t('notifications.type.subscriptionNudge.description', {
                defaultValue: 'When PostHog suggests subscribing to a dashboard you keep coming back to',
            }),
        },
        data_quality_check_failure: {
            label: i18n.t('notifications.type.dataQualityCheckFailure.label', {
                defaultValue: 'Data quality check failures',
            }),
            description: i18n.t('notifications.type.dataQualityCheckFailure.description', {
                defaultValue: 'When a data quality check on a warehouse table or view starts failing',
            }),
        },
    }
}

let cachedRealtimeNotificationTypeMeta: {
    locale: string
    meta: Record<string, { label: string; description: string }>
} | null = null

/** The notification type preferences, in the language the app is rendering. */
export function getRealtimeNotificationTypeMeta(): Record<string, { label: string; description: string }> {
    const locale = getActiveLocale()
    if (cachedRealtimeNotificationTypeMeta?.locale !== locale) {
        cachedRealtimeNotificationTypeMeta = { locale, meta: buildRealtimeNotificationTypeMeta() }
    }
    return cachedRealtimeNotificationTypeMeta.meta
}

export function NotificationTitle({
    notificationType,
    title,
}: {
    notificationType: string
    title: string
}): JSX.Element {
    // Float the icon so wrapped lines flow back under it (not a hanging indent),
    // break "Prefix: Name" titles at the colon
    const splitAt = title.indexOf(': ')
    return (
        <span className="block text-xs leading-snug font-semibold">
            {getNotificationIcon(notificationType, 'size-3.5 mt-px mr-1.5 float-left')}
            {splitAt === -1 ? (
                title
            ) : (
                <>
                    <span className="whitespace-nowrap">{title.slice(0, splitAt + 1)}</span>{' '}
                    <span className="whitespace-nowrap">{title.slice(splitAt + 2)}</span>
                </>
            )}
        </span>
    )
}

export function NotificationReadToggle({
    read,
    onToggle,
    target,
}: {
    read: boolean
    onToggle: (e: React.MouseEvent) => void
    target?: string
}): JSX.Element {
    const markLabel = target
        ? read
            ? i18n.t('notifications.markGroupAsUnread', { defaultValue: 'Mark group as unread' })
            : i18n.t('notifications.markGroupAsRead', { defaultValue: 'Mark group as read' })
        : read
          ? i18n.t('notifications.markAsUnread', { defaultValue: 'Mark as unread' })
          : i18n.t('notifications.markAsRead', { defaultValue: 'Mark as read' })

    return (
        <Tooltip title={markLabel}>
            <button
                className="group/read shrink-0 flex size-5 items-center justify-center rounded hover:bg-fill-highlight-200 cursor-pointer"
                onClick={onToggle}
            >
                {read ? (
                    <IconCheckCircle className="size-4 text-success" />
                ) : (
                    <>
                        <IconRadioButtonUnchecked className="size-4 text-muted opacity-40 group-hover/read:hidden" />
                        <IconCheckCircle className="size-4 text-muted opacity-60 hidden group-hover/read:block" />
                    </>
                )}
            </button>
        </Tooltip>
    )
}

export function NotificationRow({
    notification,
    onNavigate,
    readOnly = false,
}: {
    notification: InAppNotification
    onNavigate?: () => void
    readOnly?: boolean
}): JSX.Element {
    const { navigateToNotification, notificationClicked, toggleRead, markAsRead, archiveNotification } =
        useActions(sidePanelNotificationsLogic)
    const { projectNameForNotification, sourcePathForNotification, manuallyToggledIds, archivingEnabled } =
        useValues(sidePanelNotificationsLogic)

    // Don't auto-mark a notification the user deliberately toggled this session — respect their intent.
    const autoMarkRef = useAutoMarkRead(!notification.read && !manuallyToggledIds.has(notification.id), () =>
        markAsRead(notification.id)
    )

    const otherProjectName = projectNameForNotification(notification)
    const describer = getNotificationDescriber(notification)
    const customBody = describer ? <describer.Component notification={notification} onNavigate={onNavigate} /> : null
    const rich = !!describer?.takesOverRow && !!notification.metadata

    const hasNavigationTarget = !!sourcePathForNotification(notification)
    const handleOpen = (): void => {
        // Sits outside the navigation guard below: a click on a notification with no target
        // is still engagement
        notificationClicked(notification)
        // Clicking the card marks it read and navigates to its source
        if (!notification.read) {
            toggleRead(notification.id)
        }
        if (hasNavigationTarget) {
            navigateToNotification(notification)
            onNavigate?.()
        }
    }

    const handleToggleRead = (e: React.MouseEvent): void => {
        e.stopPropagation()
        toggleRead(notification.id)
    }

    const handleArchive = (e: React.MouseEvent): void => {
        e.stopPropagation()
        archiveNotification(notification.id)
    }

    const handleNavigate = (e: React.MouseEvent): void => {
        e.stopPropagation()
        handleOpen()
    }

    const resourceLabel = notification.resource_type
        ? i18n.t('notifications.viewResource', {
              defaultValue: 'View {{ resource }}',
              resource: notification.resource_type.replace(/_/g, ' '),
          })
        : i18n.t('notifications.goToSource', { defaultValue: 'Go to source' })

    return (
        <div
            ref={autoMarkRef}
            className={`group/row @container/row relative flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                notification.read ? 'hover:bg-fill-highlight-100' : 'bg-fill-highlight-50 hover:bg-fill-highlight-100'
            }`}
            onClick={handleOpen}
        >
            <div className="flex-1 min-w-0">
                <NotificationTitle
                    notificationType={notification.notification_type}
                    title={
                        rich
                            ? i18n.t('notifications.type.webAnalyticsDigest.label', {
                                  defaultValue: 'Web analytics digest',
                              })
                            : notification.title
                    }
                />
                {rich
                    ? customBody
                    : notification.body && (
                          <div className="text-xs text-secondary mt-2 text-pretty">{notification.body}</div>
                      )}
                {/* Meta and actions sit side by side, and only the meta half wraps: the tag drops to a
                    second line rather than squeezing the timestamp into "a / month / ago", while the
                    actions can never claim a line of their own. Keeping the actions in flow also means
                    the wrap point tracks their real width, where a fixed padding either wrapped early
                    or left them overlapping. */}
                {/* items-end keeps the actions on the last line when the meta wraps, rather than
                    floating them to the vertical middle of a two-line block */}
                <div className="flex items-end gap-1.5 mt-2">
                    <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="shrink-0 text-[10px] text-muted">
                            {dayjs(notification.created_at).fromNow()}
                        </span>
                        {/* One flex item so the tag and the link wrap to the second line together,
                            rather than the tag staying up beside the timestamp and stranding the icon */}
                        {(otherProjectName || hasNavigationTarget) && (
                            <div className="min-w-0 flex items-center gap-x-1.5">
                                {otherProjectName && (
                                    <Tooltip
                                        title={i18n.t('notifications.notifiedOnProject', {
                                            defaultValue: 'Notified on project {{ project }}',
                                            project: otherProjectName,
                                        })}
                                    >
                                        <span className="text-[10px] text-muted bg-fill-highlight-100 px-1 py-px rounded truncate">
                                            {otherProjectName}
                                        </span>
                                    </Tooltip>
                                )}
                                {/* A narrow panel can't fit the label next to the timestamp and project
                                    tag, so it drops to an icon-only button rather than crowding the
                                    actions. The label stays as the accessible name and tooltip. */}
                                {hasNavigationTarget && (
                                    <Tooltip title={resourceLabel}>
                                        <button
                                            onClick={handleNavigate}
                                            aria-label={resourceLabel}
                                            className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-secondary transition-colors hover:text-primary"
                                        >
                                            <span className="hidden @[20rem]:inline">{resourceLabel}</span>
                                            <IconOpenInNew className="size-3" />
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        )}
                    </div>
                    {!readOnly && (
                        <div className={`shrink-0 flex items-center gap-1 ${ROW_ACTION_REVEAL_CLASSES}`}>
                            {archivingEnabled && (
                                <NotificationActionButton
                                    icon={<IconArchive className="size-4" />}
                                    tooltip={i18n.t('notifications.archive', { defaultValue: 'Archive' })}
                                    onClick={handleArchive}
                                    tone="danger"
                                />
                            )}
                            <NotificationReadToggle read={notification.read} onToggle={handleToggleRead} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
