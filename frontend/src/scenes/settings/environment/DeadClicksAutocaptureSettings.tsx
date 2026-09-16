import posthog from 'posthog-js'
import { useTranslation } from 'react-i18next'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'

import { TeamSettingToggle } from '../components/TeamSettingToggle'

export function DeadClicksAutocaptureSettings(): JSX.Element {
    const { t } = useTranslation()
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <TeamSettingToggle
            field="capture_dead_clicks"
            label={t('settings.environment.deadClicksAutocapture.label', {
                defaultValue: 'Enable dead clicks autocapture',
            })}
            onChange={(checked) => posthog.capture('dead_clicks_autocapture_toggled', { isEnabled: checked })}
            disabledReason={restrictedReason}
        />
    )
}
