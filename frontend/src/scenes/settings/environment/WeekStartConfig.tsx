import { useActions, useValues } from 'kea'

import { LemonSelect } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { LemonDialog } from 'lib/lemon-ui/LemonDialog'
import { teamLogic } from 'scenes/teamLogic'

export function WeekStartConfig({ displayWarning = true }: { displayWarning?: boolean }): JSX.Element {
    const { currentTeam } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <LemonSelect
            value={currentTeam?.week_start_day || 0}
            onChange={(value) => {
                if (displayWarning) {
                    LemonDialog.open({
                        title: i18n.t('settings.environment.weekStart.changeTitle', {
                            defaultValue: 'Change the first day of the week to {{ day }}?',
                            day:
                                value === 0
                                    ? i18n.t('settings.environment.weekStart.sunday', { defaultValue: 'Sunday' })
                                    : i18n.t('settings.environment.weekStart.monday', { defaultValue: 'Monday' }),
                        }),
                        description: i18n.t('settings.environment.weekStart.changeDescription', {
                            defaultValue: 'Queries grouped by week will need to be recalculated.',
                        }),
                        primaryButton: {
                            children: i18n.t('settings.environment.weekStart.changeConfirm', {
                                defaultValue: 'Change week definition',
                            }),
                            onClick: () => updateCurrentTeam({ week_start_day: value }),
                        },
                        secondaryButton: { children: i18n.t('common.cancel', { defaultValue: 'Cancel' }) },
                    })
                } else {
                    updateCurrentTeam({ week_start_day: value })
                }
            }}
            options={[
                { value: 0, label: i18n.t('settings.environment.weekStart.sunday', { defaultValue: 'Sunday' }) },
                { value: 1, label: i18n.t('settings.environment.weekStart.monday', { defaultValue: 'Monday' }) },
            ]}
            disabledReason={restrictedReason}
        />
    )
}
