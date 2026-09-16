import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonBanner, LemonButton, LemonDialog, Spinner } from '@posthog/lemon-ui'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature } from '~/types'

import { notificationConcepts } from '../shared/notificationSettingDescriptors'
import { NotificationConceptRow } from './NotificationConceptRow'
import { notificationGovernanceLogic } from './notificationGovernanceLogic'

export function NotificationGovernanceSetting(): JSX.Element {
    const { hasAvailableFeature } = useValues(userLogic)
    // PayGateMini falls through to its children when billing carries no metadata for the feature,
    // so the entitlement is checked here too. Otherwise the list below mounts and its first
    // request comes back as a payment prompt.
    const entitled = hasAvailableFeature(AvailableFeature.ORGANIZATION_SECURITY_SETTINGS)

    return (
        <PayGateMini
            feature={AvailableFeature.ORGANIZATION_SECURITY_SETTINGS}
            featureDetail="organization-member-notifications"
        >
            {entitled ? <MemberNotifications /> : null}
        </PayGateMini>
    )
}

function MemberNotifications(): JSX.Element {
    const { t } = useTranslation()
    const { members, pendingChangeCount, affectedMemberCount, savingChanges, loadFailed } =
        useValues(notificationGovernanceLogic)
    const { discardChanges, saveChanges, loadMembers } = useActions(notificationGovernanceLogic)

    if (loadFailed) {
        return (
            <LemonBanner
                type="error"
                action={{
                    children: t('settings.organization.notifications.tryAgain', { defaultValue: 'Try again' }),
                    onClick: loadMembers,
                }}
                data-attr="notification-governance-load-failed"
            >
                {t('settings.organization.notifications.loadFailed', {
                    defaultValue: "Couldn't load your members. Try again, and if it keeps happening contact support.",
                })}
            </LemonBanner>
        )
    }

    if (members === null) {
        return (
            <div className="flex items-center gap-2 py-2">
                <Spinner className="text-lg" />
                <span className="text-muted text-sm">
                    {t('settings.organization.notifications.loadingMembers', { defaultValue: 'Loading members...' })}
                </span>
            </div>
        )
    }

    if (members.length === 0) {
        return (
            <p className="text-muted text-sm">
                {t('settings.organization.notifications.noMembers', {
                    defaultValue: 'This organization has no members yet.',
                })}
            </p>
        )
    }

    const confirmSave = (): void => {
        LemonDialog.open({
            title: t('settings.organization.notifications.saveTitle', {
                defaultValue: 'Save these notification settings?',
            }),
            description: t('settings.organization.notifications.saveDescription', {
                defaultValue:
                    'This changes email notifications for {{ count }} member. Everyone affected gets a notification in the app.',
                defaultValue_other:
                    'This changes email notifications for {{ count }} members. Everyone affected gets a notification in the app.',
                count: affectedMemberCount,
            }),
            primaryButton: {
                children: t('settings.save', { defaultValue: 'Save' }),
                onClick: saveChanges,
            },
            secondaryButton: { children: t('settings.cancel', { defaultValue: 'Cancel' }) },
        })
    }

    return (
        <div className="deprecated-space-y-3">
            <LemonBanner type="info">
                {t('settings.organization.notifications.scopeNotice', {
                    defaultValue:
                        "These settings belong to the person rather than to one organization, so an override you set here also applies to that member's other organizations, if they belong to any.",
                })}
            </LemonBanner>

            {notificationConcepts(t).map((concept) => (
                <NotificationConceptRow key={concept.setting} concept={concept} />
            ))}

            {pendingChangeCount > 0 && (
                <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border rounded p-3 bg-surface-primary">
                    <span className="text-sm">
                        {t('settings.organization.notifications.pendingChanges', {
                            defaultValue: '{{ changes }} pending for {{ members }}',
                            changes: t('settings.organization.notifications.changeCount', {
                                defaultValue: '{{ count }} change',
                                defaultValue_other: '{{ count }} changes',
                                count: pendingChangeCount,
                            }),
                            members: t('settings.organization.notifications.memberCount', {
                                defaultValue: '{{ count }} member',
                                defaultValue_other: '{{ count }} members',
                                count: affectedMemberCount,
                            }),
                        })}
                    </span>
                    <div className="flex gap-2">
                        <LemonButton
                            type="secondary"
                            onClick={discardChanges}
                            disabledReason={
                                savingChanges
                                    ? t('settings.organization.notifications.saving', { defaultValue: 'Saving' })
                                    : undefined
                            }
                            data-attr="notification-governance-discard"
                        >
                            {t('settings.organization.notifications.discard', { defaultValue: 'Discard' })}
                        </LemonButton>
                        <LemonButton
                            type="primary"
                            onClick={confirmSave}
                            loading={savingChanges}
                            disabledReason={
                                savingChanges
                                    ? t('settings.organization.notifications.saving', { defaultValue: 'Saving' })
                                    : undefined
                            }
                            data-attr="notification-governance-save"
                        >
                            {t('settings.save', { defaultValue: 'Save' })}
                        </LemonButton>
                    </div>
                </div>
            )}
        </div>
    )
}
