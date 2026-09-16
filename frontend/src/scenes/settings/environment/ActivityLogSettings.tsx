import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconInfo } from '@posthog/icons'
import { LemonButton, LemonSwitch, Tooltip } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel, TeamMembershipLevel } from 'lib/constants'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { LinkedHogFunctions } from 'scenes/hog-functions/list/LinkedHogFunctions'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

// These settings are gated as a whole. The AUDIT_LOGS pay gate is declared on the
// `environment-activity-logs` section in SettingsMap, not on each component here.

export function ActivityLogSettings(): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })
    const effectiveRestriction = user?.is_impersonated ? null : restrictedReason

    return (
        <div className="flex">
            <p>
                <LemonButton to={urls.advancedActivityLogs()} type="primary" disabledReason={effectiveRestriction}>
                    {t('settings.environment.activityLog.browseAll', { defaultValue: 'Browse all activity logs' })}
                </LemonButton>
            </p>
        </div>
    )
}

export function ActivityLogOrgLevelSettings(): JSX.Element {
    const { t } = useTranslation()
    const { currentTeam } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const { reportActivityLogSettingToggled } = useActions(eventUsageLogic)

    const restrictionReason = useRestrictedArea({ minimumAccessLevel: OrganizationMembershipLevel.Admin })

    const handleToggle = (checked: boolean): void => {
        updateCurrentTeam({ receive_org_level_activity_logs: checked })
        reportActivityLogSettingToggled(checked)
    }

    return (
        <div>
            <p className="flex items-center gap-1">
                {t('settings.environment.activityLog.orgLevelDescription', {
                    defaultValue: 'Include organization-level activity logs in this project.',
                })}
                <Tooltip
                    title={
                        <>
                            {t('settings.environment.activityLog.orgLevelTooltip', {
                                defaultValue:
                                    "When enabled, activity logs from organization-level changes (such as organization settings, domains, and members) will be included in this project's activity logs page, exports, and notifications subscriptions.",
                            })}
                        </>
                    }
                >
                    <IconInfo className="text-lg" />
                </Tooltip>
            </p>

            <LemonSwitch
                id="posthog-activity-log-org-level-switch"
                onChange={handleToggle}
                checked={!!currentTeam?.receive_org_level_activity_logs}
                disabledReason={restrictionReason || undefined}
                label={t('settings.environment.activityLog.orgLevelLabel', {
                    defaultValue: 'Include organization-level activity',
                })}
                bordered
            />
        </div>
    )
}

export function ActivityLogNotifications(): JSX.Element | null {
    const { t } = useTranslation()
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    if (restrictedReason) {
        return null
    }

    return (
        <div>
            <p className="flex items-center gap-1">
                {t('settings.environment.activityLog.notificationsDescription', {
                    defaultValue: 'Create notifications to get notified of activity logs.',
                })}
                <Tooltip
                    title={
                        <>
                            {t('settings.environment.activityLog.notificationsTooltip', {
                                defaultValue:
                                    'You can filter by activity type, resource, and other properties to receive only the notifications you need.',
                            })}
                        </>
                    }
                >
                    <IconInfo className="text-lg" />
                </Tooltip>
            </p>

            <LinkedHogFunctions
                type="internal_destination"
                subTemplateIds={['activity-log']}
                queryParams={{
                    returnTo: urls.settings('environment-activity-logs', 'activity-log-notifications'),
                }}
            />
        </div>
    )
}
