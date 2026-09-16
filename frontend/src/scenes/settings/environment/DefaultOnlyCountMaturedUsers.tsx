import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonCheckbox } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'

import { experimentsConfigLogic } from './experimentsConfigLogic'

export function DefaultOnlyCountMaturedUsers(): JSX.Element | null {
    const { t } = useTranslation()
    const { experimentsConfig, experimentsConfigLoading } = useValues(experimentsConfigLogic)
    const { updateExperimentsConfig } = useActions(experimentsConfigLogic)

    const restrictionReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <LemonCheckbox
            label={t('settings.environment.defaultOnlyCountMaturedUsers.label', {
                defaultValue: 'Require completed conversion window',
            })}
            checked={experimentsConfig?.default_only_count_matured_users ?? false}
            onChange={(checked) => {
                updateExperimentsConfig({ default_only_count_matured_users: checked })
            }}
            disabled={!!restrictionReason || experimentsConfigLoading}
        />
    )
}
