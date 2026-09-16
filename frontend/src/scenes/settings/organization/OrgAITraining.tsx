import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { IconExternal } from '@posthog/icons'
import { LemonButton, LemonSwitch } from '@posthog/lemon-ui'

import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { organizationLogic } from 'scenes/organizationLogic'

import { AI_TRAINING_URL } from './aiTrainingConstants'
import { orgAdminRequiredTooltip } from './organizationSettingsConstants'

function AITrainingDescription({ hasSignedBaa, isLocked }: { hasSignedBaa: boolean; isLocked: boolean }): JSX.Element {
    const { t } = useTranslation()
    if (hasSignedBaa) {
        return (
            <p className="mb-2 text-sm text-secondary">
                {t('settings.organization.aiTraining.signedBaa', {
                    defaultValue:
                        'You are opted out of internal AI training because you have a signed BAA with PostHog.',
                })}
            </p>
        )
    }

    if (isLocked) {
        return (
            <p className="mb-2 text-sm text-secondary">
                {t('settings.organization.aiTraining.locked', {
                    defaultValue:
                        "Your organization's internal AI training preference is fixed by your contract and cannot be changed. Please contact us if you need to discuss this.",
                })}
            </p>
        )
    }

    return (
        <div className="mb-2 text-sm text-secondary">
            <p>
                <Trans
                    i18nKey="settings.organization.aiTraining.description"
                    components={{ strong: <strong /> }}
                    defaults="Enable PostHog to use anonymized aggregated data to train AI features that benefit all PostHog customers. <strong>Your and your customers' data stays with PostHog.</strong>"
                />
            </p>
            <p className="mt-2">
                {t('settings.organization.aiTraining.optOutNote', {
                    defaultValue: 'Opting out means that you cannot access certain AI features.',
                })}
            </p>
        </div>
    )
}

export function OrganizationAITrainingOptOut(): JSX.Element {
    const { t } = useTranslation()
    const { currentOrganization, currentOrganizationLoading } = useValues(organizationLogic)
    const { updateOrganization } = useActions(organizationLogic)

    const restrictionReason = useRestrictedArea({ minimumAccessLevel: OrganizationMembershipLevel.Admin })
    const hasSignedBaa = !!currentOrganization?.has_signed_baa
    const isLocked = !!currentOrganization?.is_ai_training_locked

    const disabledReason = hasSignedBaa
        ? t('settings.organization.aiTraining.signedBaaReason', {
              defaultValue:
                  'Organizations with a signed BAA stay opted out of AI training. Contact us if this needs to change.',
          })
        : isLocked
          ? t('settings.organization.aiTraining.contactUs', {
                defaultValue: 'Please contact us to change this setting.',
            })
          : restrictionReason
            ? orgAdminRequiredTooltip(t)
            : undefined

    const checked = !hasSignedBaa && !!currentOrganization?.is_ai_training_opted_in

    return (
        <div className="max-w-160">
            <AITrainingDescription hasSignedBaa={hasSignedBaa} isLocked={isLocked} />
            <div className="my-4">
                <LemonSwitch
                    label={t('settings.organization.aiTraining.enable', {
                        defaultValue: 'Enable AI training on anonymized data',
                    })}
                    data-attr="organization-ai-training-opt-in"
                    onChange={(value) => {
                        updateOrganization({ is_ai_training_opted_in: value })
                    }}
                    checked={checked}
                    disabledReason={disabledReason}
                    loading={currentOrganizationLoading}
                    bordered
                />
            </div>
            <LemonButton type="primary" className="inline-block" sideIcon={<IconExternal />} to={AI_TRAINING_URL}>
                {t('settings.organization.aiTraining.whatsThis', { defaultValue: "What's this?" })}
            </LemonButton>
        </div>
    )
}
