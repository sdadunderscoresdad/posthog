import { useValues } from 'kea'

import { LemonBanner } from '@posthog/lemon-ui'

import { FEATURE_FLAGS } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { featureFlagLogic, getFeatureFlagPayload } from 'lib/logic/featureFlagLogic'
import { organizationLogic } from 'scenes/organizationLogic'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { ResourcesAccessControlsV2 } from '~/layout/navigation-3000/sidepanel/panels/access_control/ResourceAccessControlsV2'
import { AvailableFeature } from '~/types'

export function TeamAccessControl(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)
    const { featureFlags } = useValues(featureFlagLogic)
    const { isAdminOrOwner } = useValues(organizationLogic)
    const { hasAvailableFeature } = useValues(userLogic)

    return (
        <div className="space-y-6">
            {featureFlags[FEATURE_FLAGS.ACCESS_CONTROL_RESOLUTION_PREVIEW] &&
                isAdminOrOwner &&
                hasAvailableFeature(AvailableFeature.ACCESS_CONTROL) && (
                    <LemonBanner
                        type="warning"
                        action={{
                            children: i18n.t('settings.environment.accessControl.reviewChanges', {
                                defaultValue: 'Review changes',
                            }),
                            to: urls.settings('organization-access-resolution'),
                            'data-attr': 'access-resolution-banner-review',
                        }}
                    >
                        {getFeatureFlagPayload(FEATURE_FLAGS.ACCESS_CONTROL_RESOLUTION_PREVIEW)?.message ??
                            i18n.t('settings.environment.accessControl.resolutionNotice', {
                                defaultValue:
                                    'Access control will start using the most specific rule. Review the changes before they take effect.',
                            })}
                    </LemonBanner>
                )}
            {currentTeam?.id ? <ResourcesAccessControlsV2 projectId={`${currentTeam.id}`} /> : null}
        </div>
    )
}
