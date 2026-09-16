import { useActions, useValues } from 'kea'

import { LemonSelect } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { teamLogic } from 'scenes/teamLogic'

export function BusinessModelConfig(): JSX.Element {
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <LemonSelect
            value={currentTeam?.business_model || null}
            onChange={(value) => updateCurrentTeam({ business_model: value })}
            disabledReason={
                currentTeamLoading ? i18n.t('common.loading', { defaultValue: 'Loading...' }) : restrictedReason
            }
            fullWidth
            className="max-w-160"
            options={[
                {
                    value: null,
                    label: i18n.t('settings.environment.businessModel.notSpecified', { defaultValue: 'Not specified' }),
                },
                { value: 'b2b', label: 'B2B' },
                { value: 'b2c', label: 'B2C' },
                { value: 'other', label: 'Other' },
            ]}
        />
    )
}
