import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSwitch } from '@posthog/lemon-ui'

import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { projectLogic } from 'scenes/projectLogic'

import { desktopBetaTermsLogic } from './desktopBetaTermsLogic'
import { orgAdminRequiredTooltip } from './organizationSettingsConstants'

export function OrganizationDesktopBetaTerms(): JSX.Element {
    const { t } = useTranslation()
    const { currentProjectId } = useValues(projectLogic)
    const logic = desktopBetaTermsLogic({ projectId: String(currentProjectId ?? '@current') })
    const { desktopBetaTermsAccepted, desktopBetaTermsAcceptedLoading } = useValues(logic)
    const { acceptDesktopBetaTerms } = useActions(logic)
    const restrictionReason = useRestrictedArea({ minimumAccessLevel: OrganizationMembershipLevel.Admin })

    const disabledReason = restrictionReason
        ? orgAdminRequiredTooltip(t)
        : desktopBetaTermsAccepted
          ? t('settings.organization.desktopBetaTerms.alreadyAccepted', {
                defaultValue: 'The PostHog Desktop beta terms have already been accepted for this organization.',
            })
          : undefined

    return (
        <div className="max-w-160">
            <LemonSwitch
                label={t('settings.organization.desktopBetaTerms.accept', { defaultValue: 'Accept beta terms' })}
                data-attr="organization-desktop-beta-terms-accepted"
                onChange={(checked) => {
                    if (checked) {
                        acceptDesktopBetaTerms()
                    }
                }}
                checked={desktopBetaTermsAccepted === true}
                disabledReason={disabledReason}
                loading={desktopBetaTermsAcceptedLoading}
                bordered
            />
        </div>
    )
}
