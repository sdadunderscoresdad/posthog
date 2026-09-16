import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSwitch } from '@posthog/lemon-ui'

import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'

import { organizationLogic } from '~/scenes/organizationLogic'

import { orgAdminRequiredTooltip } from './organizationSettingsConstants'

export function OrgIPAnonymizationDefault(): JSX.Element {
    const { t } = useTranslation()
    const { currentOrganization, currentOrganizationLoading } = useValues(organizationLogic)
    const { updateOrganization } = useActions(organizationLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })

    return (
        <LemonSwitch
            onChange={(checked) => {
                updateOrganization({ default_anonymize_ips: checked })
            }}
            checked={!!currentOrganization?.default_anonymize_ips}
            disabledReason={restrictionReason ? orgAdminRequiredTooltip(t) : undefined}
            loading={currentOrganizationLoading}
            label={t('settings.organization.ipAnonymizationDefault.label', {
                defaultValue: 'Discard client IP data by default for new projects',
            })}
            bordered
        />
    )
}
