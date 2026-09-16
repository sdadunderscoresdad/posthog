import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { CountedPaginatedResponse } from 'lib/api'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonTable, LemonTableColumns } from 'lib/lemon-ui/LemonTable'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { membershipLevelToName } from 'lib/utils/permissioning'
import { fullName } from 'lib/utils/strings'
import { userLogic } from 'scenes/userLogic'

import { OrganizationMemberType } from '~/types'

import { verifiedDomainImpactLogic } from './verifiedDomainImpactLogic'

function impactedMemberColumns(t: TFunction, currentUserUuid?: string): LemonTableColumns<OrganizationMemberType> {
    return [
        {
            key: 'user_profile_picture',
            width: 32,
            render: function ProfilePictureRender(_, member) {
                return <ProfilePicture user={member.user} />
            },
        },
        {
            key: 'user',
            title: t('settings.organization.members.columns.name', { defaultValue: 'Name' }),
            render: function NameRender(_, member) {
                return (
                    <div className="ph-no-capture">
                        <div>
                            {member.user.uuid === currentUserUuid
                                ? t('settings.organization.members.you', {
                                      defaultValue: '{{ name }} (you)',
                                      name: fullName(member.user),
                                  })
                                : fullName(member.user)}
                        </div>
                        <div className="text-secondary">{member.user.email}</div>
                    </div>
                )
            },
        },
        {
            key: 'level',
            title: t('settings.organization.members.columns.level', { defaultValue: 'Level' }),
            render: function LevelRender(_, member) {
                return membershipLevelToName.get(member.level) ?? `unknown (${member.level})`
            },
        },
    ]
}

function ImpactedMembersTable({
    impact,
    loading,
}: {
    impact: CountedPaginatedResponse<OrganizationMemberType> | null
    loading: boolean
}): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const members = impact?.results ?? []
    const count = impact?.count ?? members.length
    return (
        <>
            <LemonTable
                dataSource={members}
                columns={impactedMemberColumns(t, user?.uuid)}
                loading={loading}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 8, hideOnSinglePage: true }}
                embedded
            />
            {count > members.length && (
                <div className="text-secondary text-xs mt-1">
                    {t('settings.organization.verifiedDomains.impact.showingMembers', {
                        defaultValue: 'Showing {{ shown }} of {{ total }} members.',
                        shown: members.length,
                        total: count,
                    })}
                </div>
            )}
        </>
    )
}

export function RemoveDomainModal(): JSX.Element {
    const { t } = useTranslation()
    const { removeDomainPrompt, domainImpact, domainImpactLoading, currentOrganization } =
        useValues(verifiedDomainImpactLogic)
    const { closeRemoveDomainPrompt, confirmRemoveDomain } = useActions(verifiedDomainImpactLogic)

    const impactedCount = domainImpact?.count ?? 0
    const showImpact =
        !!currentOrganization?.enforce_verified_domains &&
        !!removeDomainPrompt?.is_verified &&
        (domainImpactLoading || impactedCount > 0)

    return (
        <LemonModal
            title={t('settings.organization.verifiedDomains.removeDomainTitle', {
                defaultValue: 'Remove {{ domain }}?',
                domain:
                    removeDomainPrompt?.domain ??
                    t('settings.organization.verifiedDomains.domainFallback', { defaultValue: 'domain' }),
            })}
            isOpen={!!removeDomainPrompt}
            onClose={closeRemoveDomainPrompt}
            width={showImpact ? 600 : undefined}
            footer={
                <>
                    <LemonButton type="secondary" onClick={closeRemoveDomainPrompt}>
                        {t('settings.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        status="danger"
                        type="primary"
                        onClick={confirmRemoveDomain}
                        loading={domainImpactLoading}
                    >
                        {t('settings.organization.verifiedDomains.removeDomain', { defaultValue: 'Remove domain' })}
                    </LemonButton>
                </>
            }
        >
            <div className="space-y-2">
                <p>
                    {removeDomainPrompt?.is_verified
                        ? t('settings.organization.verifiedDomains.removeVerifiedWarning', {
                              defaultValue:
                                  'This cannot be undone. If you have SAML configured or SSO enforced, it will be immediately disabled.',
                          })
                        : t('settings.organization.verifiedDomains.removeWarning', {
                              defaultValue: 'This cannot be undone.',
                          })}
                </p>
                {showImpact && (
                    <>
                        <p>
                            {impactedCount === 1
                                ? t('settings.organization.verifiedDomains.removeImpactOne', {
                                      defaultValue:
                                          'Logins are restricted to verified email domains. Removing this domain means this member can no longer log in:',
                                  })
                                : t('settings.organization.verifiedDomains.removeImpactMany', {
                                      defaultValue:
                                          'Logins are restricted to verified email domains. Removing this domain means these {{ count }} members can no longer log in:',
                                      count: impactedCount,
                                  })}
                        </p>
                        <ImpactedMembersTable impact={domainImpact} loading={domainImpactLoading} />
                    </>
                )}
            </div>
        </LemonModal>
    )
}

export function EnforceVerifiedDomainsModal(): JSX.Element {
    const { t } = useTranslation()
    const { enforcementPromptOpen, enforcementImpact, enforcementImpactLoading, enforcementRemovalLoading } =
        useValues(verifiedDomainImpactLogic)
    const { closeEnforcementPrompt, confirmEnforceVerifiedDomains } = useActions(verifiedDomainImpactLogic)

    const impactedCount = enforcementImpact?.count ?? 0

    return (
        <LemonModal
            title={t('settings.organization.verifiedDomains.enforceModalTitle', {
                defaultValue: 'Restrict logins to verified email domains?',
            })}
            isOpen={enforcementPromptOpen}
            onClose={closeEnforcementPrompt}
            width={600}
            footer={
                <>
                    <LemonButton
                        type="secondary"
                        onClick={closeEnforcementPrompt}
                        disabledReason={
                            enforcementRemovalLoading
                                ? t('settings.organization.verifiedDomains.removingMembers', {
                                      defaultValue: 'Removing members...',
                                  })
                                : undefined
                        }
                    >
                        {t('settings.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        status="danger"
                        type="primary"
                        onClick={confirmEnforceVerifiedDomains}
                        loading={enforcementRemovalLoading}
                    >
                        {t('settings.organization.verifiedDomains.removeAndRestrict', {
                            defaultValue: 'Remove {{ count }} member and restrict',
                            defaultValue_other: 'Remove {{ count }} members and restrict',
                            count: impactedCount,
                        })}
                    </LemonButton>
                </>
            }
        >
            <div className="space-y-2">
                <p>
                    {t('settings.organization.verifiedDomains.enforceImpact', {
                        defaultValue:
                            '{{ count }} member has an email address outside your verified domains and will no longer be able to log in. Confirming also removes them from this organization.',
                        defaultValue_other:
                            '{{ count }} members have an email address outside your verified domains and will no longer be able to log in. Confirming also removes them from this organization.',
                        count: impactedCount,
                    })}
                </p>
                <ImpactedMembersTable impact={enforcementImpact} loading={enforcementImpactLoading} />
            </div>
        </LemonModal>
    )
}
