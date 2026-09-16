import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { LemonSwitch } from 'lib/lemon-ui/LemonSwitch/LemonSwitch'
import { organizationLogic } from 'scenes/organizationLogic'

import { AvailableFeature } from '~/types'

import { verifiedDomainImpactLogic } from './verifiedDomainImpactLogic'
import { EnforceVerifiedDomainsModal } from './VerifiedDomainImpactModals'
import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function EnforceVerifiedDomains(): JSX.Element {
    const { t } = useTranslation()
    const { currentOrganization, currentOrganizationLoading } = useValues(organizationLogic)
    const { updateOrganization } = useActions(organizationLogic)
    const { verifiedDomains, verifiedDomainsLoading, ownVerifiedDomain } = useValues(verifiedDomainsLogic)
    const { enforcementImpactLoading } = useValues(verifiedDomainImpactLogic)
    const { promptEnforceVerifiedDomains } = useActions(verifiedDomainImpactLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })

    const hasVerifiedDomains = verifiedDomains.some((domain) => domain.is_verified)

    // Only gates turning it on — an organization that ends up misconfigured must still be able to turn it off.
    let enableBlockedReason: string | undefined
    if (!verifiedDomainsLoading && !currentOrganization?.enforce_verified_domains) {
        if (!hasVerifiedDomains) {
            enableBlockedReason = t('settings.organization.verifiedDomains.verifyOneDomainFirst', {
                defaultValue: 'Verify at least one domain to enable this setting',
            })
        } else if (!ownVerifiedDomain) {
            enableBlockedReason = t('settings.organization.verifiedDomains.verifyOwnDomainFirst', {
                defaultValue: 'Verify the domain of your own email address first, otherwise this would lock you out',
            })
        }
    }

    return (
        <PayGateMini feature={AvailableFeature.AUTOMATIC_PROVISIONING} featureDetail="enforce-verified-domains">
            <p>
                {t('settings.organization.verifiedDomains.enforceDescription', {
                    defaultValue:
                        'Only allow people with an email address on a verified domain into this organization. Invites to other domains are blocked, and existing members on other domains lose access.',
                })}
            </p>
            <LemonSwitch
                label={t('settings.organization.verifiedDomains.enforceLabel', {
                    defaultValue: 'Restrict membership to verified email domains',
                })}
                bordered
                checked={!!currentOrganization?.enforce_verified_domains}
                onChange={(enforce_verified_domains) =>
                    // Turning it on can remove members, so it goes through an impact check and confirmation first.
                    enforce_verified_domains
                        ? promptEnforceVerifiedDomains()
                        : updateOrganization({ enforce_verified_domains })
                }
                loading={currentOrganizationLoading || enforcementImpactLoading}
                disabledReason={restrictionReason ?? enableBlockedReason}
            />
            <EnforceVerifiedDomainsModal />
        </PayGateMini>
    )
}
