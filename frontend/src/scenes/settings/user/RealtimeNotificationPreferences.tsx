import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconChevronRight } from '@posthog/icons'
import { LemonButton, LemonCheckbox, LemonTag } from '@posthog/lemon-ui'

import { getRealtimeNotificationTypeMeta } from 'lib/components/NotificationsMenu/NotificationRow'
import { userLogic } from 'scenes/userLogic'

import { TeamBasicType } from '~/types'

import { realtimeNotificationPreferencesLogic } from './realtimeNotificationPreferencesLogic'

export function RealtimeNotificationPreferences(): JSX.Element {
    const { t } = useTranslation()
    const { userLoading } = useValues(userLogic)
    const { updateRealtimeNotificationForTeam, updateRealtimeNotificationForProject, updateAllRealtimeNotifications } =
        useActions(userLogic)
    const { activeTypes, isTypeEnabledForTeam, projectState, teams, teamIds, isProjectExpanded, allOn, allOff } =
        useValues(realtimeNotificationPreferencesLogic)
    const { setProjectExpanded } = useActions(realtimeNotificationPreferencesLogic)

    if (activeTypes.length === 0) {
        return (
            <div className="text-muted text-sm">
                {t('settings.user.realtimeNotifications.empty', {
                    defaultValue: 'No real-time notifications are wired up for your account yet.',
                })}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-row items-center gap-2">
                <LemonButton
                    size="xsmall"
                    type="secondary"
                    disabled={userLoading || allOn}
                    onClick={() => updateAllRealtimeNotifications(teamIds, activeTypes, true)}
                >
                    {t('settings.user.realtimeNotifications.enableAll', { defaultValue: 'Enable all' })}
                </LemonButton>
                <LemonButton
                    size="xsmall"
                    type="secondary"
                    disabled={userLoading || allOff}
                    onClick={() => updateAllRealtimeNotifications(teamIds, activeTypes, false)}
                >
                    {t('settings.user.realtimeNotifications.disableAll', { defaultValue: 'Disable all' })}
                </LemonButton>
            </div>

            <div className="space-y-2">
                {teams.map((team: TeamBasicType) => {
                    const state = projectState(team.id)
                    const isOpen = isProjectExpanded(team.id)
                    return (
                        <div key={team.id}>
                            <div className="flex items-center gap-2">
                                <LemonButton
                                    size="xsmall"
                                    type="tertiary"
                                    icon={
                                        <IconChevronRight
                                            className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                        />
                                    }
                                    onClick={() => setProjectExpanded(team.id, !isOpen)}
                                />
                                <LemonCheckbox
                                    id={`realtime-project-${team.id}`}
                                    checked={state === 'partial' ? 'indeterminate' : state === 'on'}
                                    disabled={userLoading}
                                    onChange={() =>
                                        updateRealtimeNotificationForProject(team.id, activeTypes, state === 'off')
                                    }
                                    label={
                                        <div className="flex items-center gap-2">
                                            <span>{team.name}</span>
                                            <LemonTag type="muted">
                                                {t('settings.user.emailPreferences.idTag', {
                                                    defaultValue: 'id: {{ id }}',
                                                    id: String(team.id),
                                                })}
                                            </LemonTag>
                                        </div>
                                    }
                                />
                            </div>
                            {isOpen && (
                                <div className="ml-16 mt-1 space-y-1">
                                    {activeTypes.map((type) => {
                                        const meta = getRealtimeNotificationTypeMeta()[type] ?? {
                                            label: type,
                                            description: '',
                                        }
                                        return (
                                            <LemonCheckbox
                                                key={`${team.id}-${type}`}
                                                id={`realtime-${type}-${team.id}`}
                                                checked={isTypeEnabledForTeam(type, team.id)}
                                                disabled={userLoading}
                                                onChange={(checked) =>
                                                    updateRealtimeNotificationForTeam(type, team.id, checked)
                                                }
                                                label={
                                                    <div className="flex flex-col">
                                                        <span>{meta.label}</span>
                                                        {meta.description && (
                                                            <span className="text-muted text-xs">
                                                                {meta.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
