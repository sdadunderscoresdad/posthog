import { useTranslation } from 'react-i18next'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'

import { TeamSettingToggle } from '../components/TeamSettingToggle'

export function HumanFriendlyComparisonPeriodsSetting(): JSX.Element {
    const { t } = useTranslation()
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <TeamSettingToggle
            field="human_friendly_comparison_periods"
            label={t('settings.environment.humanFriendlyComparisonPeriods.label', {
                defaultValue: 'Use human friendly comparison periods',
            })}
            disabledReason={restrictedReason}
        />
    )
}
