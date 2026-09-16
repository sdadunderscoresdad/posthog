import { useActions } from 'kea'
import { useTranslation } from 'react-i18next'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { TeamSettingToggle } from '../components/TeamSettingToggle'

export function HeatmapsSettings(): JSX.Element {
    const { t } = useTranslation()
    const { reportHeatmapsToggled } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <TeamSettingToggle
            field="heatmaps_opt_in"
            label={t('settings.environment.heatmaps.label', { defaultValue: 'Enable heatmaps for web' })}
            onChange={reportHeatmapsToggled}
            disabledReason={restrictedReason}
        />
    )
}
