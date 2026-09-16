import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSwitch } from '@posthog/lemon-ui'

import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { organizationLogic } from 'scenes/organizationLogic'

import { orgAdminRequiredTooltip } from './organizationSettingsConstants'

export function OrganizationAI(): JSX.Element {
    const { t } = useTranslation()
    const { currentOrganization, currentOrganizationLoading } = useValues(organizationLogic)
    const { updateOrganization } = useActions(organizationLogic)

    const restrictionReason = useRestrictedArea({ minimumAccessLevel: OrganizationMembershipLevel.Admin })

    return (
        <div className="max-w-160">
            <LemonSwitch
                label={t('settings.organization.ai.enable', {
                    defaultValue: 'Enable PostHog features that use third-party AI services',
                })}
                data-attr="organization-ai-enabled"
                onChange={(checked) => {
                    updateOrganization({ is_ai_data_processing_approved: checked })
                }}
                checked={!!currentOrganization?.is_ai_data_processing_approved}
                disabledReason={restrictionReason ? orgAdminRequiredTooltip(t) : undefined}
                loading={currentOrganizationLoading}
                bordered
            />
        </div>
    )
}
