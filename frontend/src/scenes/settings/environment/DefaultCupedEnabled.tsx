import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonCheckbox } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'

import { experimentsConfigLogic } from './experimentsConfigLogic'

export function DefaultCupedEnabled(): JSX.Element | null {
    const { t } = useTranslation()
    const { experimentsConfig, experimentsConfigLoading } = useValues(experimentsConfigLogic)
    const { updateExperimentsConfig } = useActions(experimentsConfigLogic)

    const restrictionReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <LemonCheckbox
            label={t('settings.environment.defaultCuped.label', { defaultValue: 'Enable CUPED by default' })}
            checked={experimentsConfig?.default_cuped_enabled ?? false}
            onChange={(checked) => {
                updateExperimentsConfig({ default_cuped_enabled: checked })
            }}
            disabled={!!restrictionReason || experimentsConfigLoading}
        />
    )
}
