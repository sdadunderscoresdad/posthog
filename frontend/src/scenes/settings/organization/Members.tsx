import { useActions, useValues } from 'kea'
import posthog from 'posthog-js'
import { Trans, useTranslation } from 'react-i18next'

import { IconInfo } from '@posthog/icons'
import { LemonBanner, LemonInput, LemonSwitch } from '@posthog/lemon-ui'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { TZLabel } from 'lib/components/TZLabel'
import { FEATURE_FLAGS, OrganizationMembershipLevel } from 'lib/constants'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { More } from 'lib/lemon-ui/LemonButton/More'
import { LemonDialog } from 'lib/lemon-ui/LemonDialog'
import { LemonTable, LemonTableColumns } from 'lib/lemon-ui/LemonTable'
import { LemonTag } from 'lib/lemon-ui/LemonTag/LemonTag'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { Tooltip } from 'lib/lemon-ui/Tooltip'
import {
    getReasonForAccessLevelChangeProhibition,
    membershipLevelToName,
    organizationMembershipLevelIntegers,
} from 'lib/utils/permissioning'
import { capitalizeFirstLetter, fullName } from 'lib/utils/strings'
import { twoFactorLogic } from 'scenes/authentication/two-factor-setup/twoFactorLogic'
import { membersExportLogic } from 'scenes/organization/membersExportLogic'
import { membersLogic } from 'scenes/organization/membersLogic'
import { organizationLogic } from 'scenes/organizationLogic'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature, OrganizationMemberType } from '~/types'

function RemoveMemberModal({ member }: { member: OrganizationMemberType }): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const { scopedApiKeys } = useValues(membersLogic)

    return (
        <div className="max-w-xl">
            <p>
                {member.user.uuid === user?.uuid
                    ? t('settings.organization.members.confirmLeave', {
                          defaultValue:
                              'Are you sure you want to leave this organization? This cannot be undone. If you leave, you will no longer have access to this organization.',
                      })
                    : t('settings.organization.members.confirmRemove', {
                          defaultValue:
                              'Are you sure you want to remove this member? This cannot be undone. They will no longer have access to this organization.',
                      })}
            </p>
            {scopedApiKeys?.keys && scopedApiKeys.keys.length > 0 && (
                <div className="mt-4">
                    <LemonBanner type="warning" className="mb-2">
                        {member.user.uuid == user?.uuid
                            ? t('settings.organization.members.scopedKeysWarningSelf', {
                                  defaultValue:
                                      'The following personal API keys which belong to you will lose access to this organization and will stop working immediately. Please confirm they will not affect any services that depend on them before removing yourself.',
                              })
                            : t('settings.organization.members.scopedKeysWarningOther', {
                                  defaultValue:
                                      'The following personal API keys which belong to this member will lose access to this organization and will stop working immediately. Please confirm they will not affect any services that depend on them before removing this member.',
                              })}
                    </LemonBanner>
                    <LemonTable
                        dataSource={scopedApiKeys.keys}
                        columns={[
                            {
                                title: t('settings.organization.members.columns.name', { defaultValue: 'Name' }),
                                dataIndex: 'name',
                                key: 'name',
                            },
                            {
                                title: t('settings.organization.members.columns.lastUsed', {
                                    defaultValue: 'Last used',
                                }),
                                dataIndex: 'last_used_at',
                                key: 'last_used_at',
                                render: (last_used_at) =>
                                    last_used_at ? (
                                        <TZLabel time={last_used_at} />
                                    ) : (
                                        t('settings.organization.members.never', { defaultValue: 'Never' })
                                    ),
                            },
                        ]}
                    />
                </div>
            )}
        </div>
    )
}

function ActionsComponent(_: any, member: OrganizationMemberType): JSX.Element | null {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const { currentOrganization } = useValues(organizationLogic)
    const { removeMember, changeMemberAccessLevel, loadMemberScopedApiKeys } = useActions(membersLogic)

    if (!user) {
        return null
    }

    const currentMembershipLevel = currentOrganization?.membership_level ?? -1

    const allowDeletion =
        // higher-ranked users cannot be removed, at the same time the currently logged-in user can leave any time
        ((currentMembershipLevel >= OrganizationMembershipLevel.Admin && member.level <= currentMembershipLevel) ||
            member.user.uuid === user.uuid) &&
        // unless that user is the organization's owner, in which case they can't leave
        member.level !== OrganizationMembershipLevel.Owner

    const myMembershipLevel = currentOrganization ? currentOrganization.membership_level : null

    const allowedLevels = organizationMembershipLevelIntegers.filter(
        (listLevel) => !getReasonForAccessLevelChangeProhibition(myMembershipLevel, user, member, listLevel)
    )
    const disallowedReason = getReasonForAccessLevelChangeProhibition(myMembershipLevel, user, member, allowedLevels)

    if (disallowedReason && !allowDeletion) {
        return null
    }

    return (
        <More
            overlay={
                <>
                    {!disallowedReason &&
                        allowedLevels.map((listLevel) => (
                            <LemonButton
                                fullWidth
                                key={`${member.user.uuid}-level-${listLevel}`}
                                onClick={(event) => {
                                    event.preventDefault()
                                    if (!user) {
                                        throw Error
                                    }
                                    if (listLevel === OrganizationMembershipLevel.Owner) {
                                        LemonDialog.open({
                                            title: t('settings.organization.members.addOwnerTitle', {
                                                defaultValue: 'Add additional owner to {{ organization }}?',
                                                organization: user.organization?.name,
                                            }),
                                            description: t('settings.organization.members.addOwnerDescription', {
                                                defaultValue:
                                                    'Please confirm that you would like to make {{ member }} an owner of {{ organization }}.',
                                                member: fullName(member.user),
                                                organization: user.organization?.name,
                                            }),
                                            primaryButton: {
                                                status: 'danger',
                                                children: t('settings.organization.members.makeOwnerButton', {
                                                    defaultValue: 'Make {{ member }} an owner',
                                                    member: fullName(member.user),
                                                }),
                                                onClick: () => changeMemberAccessLevel(member, listLevel),
                                            },
                                            secondaryButton: {
                                                children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                            },
                                        })
                                    } else {
                                        changeMemberAccessLevel(member, listLevel)
                                    }
                                }}
                                data-test-level={listLevel}
                            >
                                {listLevel === OrganizationMembershipLevel.Owner ? (
                                    <>{t('settings.organization.members.makeOwner', { defaultValue: 'Make owner' })}</>
                                ) : listLevel > member.level ? (
                                    <>
                                        {t('settings.organization.members.upgradeTo', {
                                            defaultValue: 'Upgrade to {{ level }}',
                                            level: membershipLevelToName.get(listLevel),
                                        })}
                                    </>
                                ) : (
                                    <>
                                        {t('settings.organization.members.downgradeTo', {
                                            defaultValue: 'Downgrade to {{ level }}',
                                            level: membershipLevelToName.get(listLevel),
                                        })}
                                    </>
                                )}
                            </LemonButton>
                        ))}
                    {allowDeletion && (
                        <>
                            <LemonButton
                                status="danger"
                                data-attr="delete-org-membership"
                                onClick={() => {
                                    if (!user) {
                                        throw Error
                                    }
                                    loadMemberScopedApiKeys(member)
                                    LemonDialog.open({
                                        title:
                                            member.user.uuid == user.uuid
                                                ? t('settings.organization.members.leaveTitle', {
                                                      defaultValue: 'Leave organization {{ organization }}?',
                                                      organization: user.organization?.name,
                                                  })
                                                : t('settings.organization.members.removeTitle', {
                                                      defaultValue:
                                                          'Remove {{ member }} from organization {{ organization }}?',
                                                      member: fullName(member.user),
                                                      organization: user.organization?.name,
                                                  }),
                                        primaryButton: {
                                            children:
                                                member.user.uuid == user.uuid
                                                    ? t('settings.organization.members.leave', {
                                                          defaultValue: 'Leave',
                                                      })
                                                    : t('settings.organization.members.remove', {
                                                          defaultValue: 'Remove',
                                                      }),
                                            status: 'danger',
                                            onClick: () => removeMember(member),
                                        },
                                        secondaryButton: {
                                            children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                        },
                                        content: <RemoveMemberModal member={member} />,
                                    })
                                }}
                                fullWidth
                            >
                                {member.user.uuid !== user.uuid
                                    ? t('settings.organization.members.removeFromOrganization', {
                                          defaultValue: 'Remove from organization',
                                      })
                                    : t('settings.organization.members.leaveOrganization', {
                                          defaultValue: 'Leave organization',
                                      })}
                            </LemonButton>
                        </>
                    )}
                </>
            }
        />
    )
}

export function Members(): JSX.Element | null {
    const { t } = useTranslation()
    const { filteredMembers, members, membersLoading, search } = useValues(membersLogic)
    const { downloadMembersListDisabledReason } = useValues(membersExportLogic)
    const { currentOrganization } = useValues(organizationLogic)
    const { preflight } = useValues(preflightLogic)
    const { user } = useValues(userLogic)
    const { setSearch, ensureAllMembersLoaded } = useActions(membersLogic)
    const { downloadMembersList } = useActions(membersExportLogic)
    const { updateOrganization } = useActions(organizationLogic)
    const { openTwoFactorSetupModal } = useActions(twoFactorLogic)

    const adminRestrictionReason = useRestrictedArea({ minimumAccessLevel: OrganizationMembershipLevel.Admin })
    const hasHiddenMembers =
        (members?.length ?? 0) > 0 && (members?.length ?? 0) < (currentOrganization?.member_count ?? 0)

    useOnMountEffect(ensureAllMembersLoaded)

    if (!user) {
        return null
    }

    const columns: LemonTableColumns<OrganizationMemberType> = [
        {
            key: 'user_profile_picture',
            render: function ProfilePictureRender(_, member) {
                return <ProfilePicture user={member.user} />
            },
            width: 32,
        },
        {
            title: t('settings.organization.members.columns.name', { defaultValue: 'Name' }),
            key: 'user_name',
            render: (_, member) => (
                <span className="ph-no-capture">
                    {member.user.uuid == user.uuid
                        ? t('settings.organization.members.you', {
                              defaultValue: '{{ name }} (you)',
                              name: fullName(member.user),
                          })
                        : fullName(member.user)}
                </span>
            ),
            sorter: (a, b) => fullName(a.user).localeCompare(fullName(b.user)),
        },
        {
            title: t('settings.organization.members.columns.email', { defaultValue: 'Email' }),
            key: 'user_email',
            render: (_, member) => {
                return (
                    <>
                        <span className="ph-no-capture">{member.user.email}</span>
                        {!member.user.is_email_verified &&
                            !member.has_social_auth &&
                            preflight?.email_service_available && (
                                <>
                                    {' '}
                                    <LemonTag type="highlight" data-attr="pending-email-verification">
                                        {t('settings.organization.members.pendingEmailVerification', {
                                            defaultValue: 'pending email verification',
                                        })}
                                    </LemonTag>
                                </>
                            )}
                    </>
                )
            },
            sorter: (a, b) => a.user.email.localeCompare(b.user.email),
        },
        {
            title: t('settings.organization.members.columns.level', { defaultValue: 'Level' }),
            dataIndex: 'level',
            key: 'level',
            render: function LevelRender(_, member) {
                return (
                    <LemonTag data-attr="membership-level">
                        {capitalizeFirstLetter(membershipLevelToName.get(member.level) ?? member.level.toString())}
                    </LemonTag>
                )
            },
            sorter: (a, b) => a.level - b.level,
        },
        {
            title: t('settings.organization.members.columns.twoFactor', { defaultValue: '2FA' }),
            dataIndex: 'is_2fa_enabled',
            key: 'is_2fa_enabled',
            render: function LevelRender(_, member) {
                return (
                    <>
                        <Tooltip
                            title={
                                member.user.uuid == user.uuid && !member.is_2fa_enabled
                                    ? t('settings.organization.members.setup2fa', {
                                          defaultValue: 'Click to setup 2FA for your account',
                                      })
                                    : ''
                            }
                        >
                            <LemonTag
                                onClick={
                                    member.user.uuid == user.uuid && !member.is_2fa_enabled
                                        ? () => openTwoFactorSetupModal()
                                        : undefined
                                }
                                data-attr="2fa-enabled"
                                type={member.is_2fa_enabled ? 'success' : 'warning'}
                            >
                                {member.is_2fa_enabled
                                    ? t('settings.user.twoFactor.enabled', { defaultValue: '2FA enabled' })
                                    : t('settings.user.twoFactor.notEnabled', { defaultValue: '2FA not enabled' })}
                            </LemonTag>
                        </Tooltip>
                    </>
                )
            },
            sorter: (a, b) => (a.is_2fa_enabled != b.is_2fa_enabled ? 1 : 0),
        },
        {
            title: t('settings.organization.members.columns.joined', { defaultValue: 'Joined' }),
            dataIndex: 'joined_at',
            key: 'joined_at',
            render: function RenderJoinedAt(joinedAt) {
                return (
                    <div className="whitespace-nowrap">
                        <TZLabel time={joinedAt as string} />
                    </div>
                )
            },
            sorter: (a, b) => a.joined_at.localeCompare(b.joined_at),
        },
        {
            title: t('settings.organization.members.columns.lastLoggedIn', { defaultValue: 'Last Logged In' }),
            dataIndex: 'last_login',
            key: 'last_login',
            render: function RenderLastLogin(lastLogin) {
                return (
                    <div className="whitespace-nowrap">
                        {lastLogin ? (
                            <TZLabel time={lastLogin as string} />
                        ) : (
                            t('settings.organization.members.never', { defaultValue: 'Never' })
                        )}
                    </div>
                )
            },
            sorter: (a, b) => new Date(a.last_login ?? 0).getTime() - new Date(b.last_login ?? 0).getTime(),
        },
        {
            key: 'actions',
            width: 0,
            render: ActionsComponent,
        },
    ]

    return (
        <>
            <div className="flex flex-wrap gap-2 justify-between items-center">
                <LemonInput
                    type="search"
                    placeholder={t('settings.organization.members.searchPlaceholder', {
                        defaultValue: 'Search for members',
                    })}
                    value={search}
                    onChange={setSearch}
                    className="flex-1 basis-[min(100%,18rem)]"
                />
                {!adminRestrictionReason && (
                    <LemonButton
                        type="secondary"
                        onClick={downloadMembersList}
                        disabledReason={downloadMembersListDisabledReason}
                        data-attr="org-members-download-csv"
                    >
                        {t('settings.organization.members.downloadList', {
                            defaultValue: 'Download members list',
                        })}
                    </LemonButton>
                )}
            </div>

            <LemonTable
                dataSource={filteredMembers ?? []}
                columns={columns}
                rowKey="id"
                style={{ marginTop: '1rem' }}
                loading={membersLoading}
                data-attr="org-members-table"
                defaultSorting={{ columnKey: 'level', order: -1 }}
                pagination={{ pageSize: 50 }}
                footer={
                    hasHiddenMembers && (
                        <div className="flex items-center gap-2 px-3 py-2">
                            <div className="flex">
                                {[0, 1, 2].map((index) => (
                                    <ProfilePicture
                                        key={index}
                                        name="?"
                                        index={index}
                                        size="md"
                                        className={index > 0 ? '-ml-1.5' : ''}
                                    />
                                ))}
                            </div>
                            <span className="text-secondary">
                                {t('settings.organization.members.otherMembers', {
                                    defaultValue: 'Other organization members',
                                })}{' '}
                                <Tooltip
                                    title={t('settings.organization.members.hiddenMembersTooltip', {
                                        defaultValue: 'Your organization only shows the full member list to admins.',
                                    })}
                                >
                                    <IconInfo className="text-base align-middle" />
                                </Tooltip>
                            </span>
                        </div>
                    )
                }
            />
            <h3 className="mt-4">
                {t('settings.organization.members.twoFactorHeading', { defaultValue: 'Two-factor authentication' })}
            </h3>
            <PayGateMini
                feature={AvailableFeature.TWOFA_ENFORCEMENT}
                featureDetail="organization-members-two-factor-authentication"
            >
                <p>
                    {t('settings.organization.members.enforce2faDescription', {
                        defaultValue: 'Require all organization members to use two-factor authentication.',
                    })}
                </p>
                <LemonSwitch
                    label={t('settings.organization.members.enforce2fa', { defaultValue: 'Enforce 2FA' })}
                    bordered
                    checked={!!currentOrganization?.enforce_2fa}
                    onChange={(enforce_2fa) => updateOrganization({ enforce_2fa })}
                    disabledReason={adminRestrictionReason}
                />
            </PayGateMini>

            <h3 className="mt-4">
                {t('settings.organization.members.inviteSettings', { defaultValue: 'Invite settings' })}
            </h3>
            <PayGateMini
                feature={AvailableFeature.ORGANIZATION_INVITE_SETTINGS}
                featureDetail="organization-member-and-project-invites"
            >
                <p>
                    {t('settings.organization.members.inviteSettingsDescription', {
                        defaultValue: 'Control who can send organization invites.',
                    })}
                </p>
                <LemonSwitch
                    label={
                        <span>
                            <Trans
                                i18nKey="settings.organization.members.membersCanInvite"
                                values={{ organization: currentOrganization?.name }}
                                components={{ i: <i /> }}
                                defaults="Members can invite others to join <i>{{ organization }}</i>"
                            />
                        </span>
                    }
                    bordered
                    data-attr="org-members-can-invite-toggle"
                    checked={!!currentOrganization?.members_can_invite}
                    onChange={(members_can_invite) => updateOrganization({ members_can_invite })}
                    disabledReason={adminRestrictionReason}
                />
                <p className="mt-4">
                    {t('settings.organization.members.createProjectsDescription', {
                        defaultValue:
                            'Control who can create new projects. Admins and owners can always create projects.',
                    })}
                </p>
                <LemonSwitch
                    label={
                        <span>
                            <Trans
                                i18nKey="settings.organization.members.membersCanCreateProjects"
                                values={{ organization: currentOrganization?.name }}
                                components={{ i: <i /> }}
                                defaults="Members can create new projects in <i>{{ organization }}</i>"
                            />
                        </span>
                    }
                    bordered
                    data-attr="org-members-can-create-projects-toggle"
                    checked={!!currentOrganization?.members_can_create_projects}
                    onChange={(members_can_create_projects) => updateOrganization({ members_can_create_projects })}
                    disabledReason={adminRestrictionReason}
                />
            </PayGateMini>

            {posthog.isFeatureEnabled(FEATURE_FLAGS.MEMBERS_CAN_USE_PERSONAL_API_KEYS) && (
                <>
                    <h3 className="mt-4">
                        {t('settings.organization.security.heading', { defaultValue: 'Security settings' })}
                    </h3>
                    <PayGateMini
                        feature={AvailableFeature.ORGANIZATION_SECURITY_SETTINGS}
                        featureDetail="organization-members-personal-api-key-access"
                    >
                        <p>
                            {t('settings.organization.members.securitySettingsDescription', {
                                defaultValue: 'Configure security permissions for organization members.',
                            })}
                        </p>
                        <LemonSwitch
                            label={
                                <span>
                                    {t('settings.organization.members.membersCanUsePersonalApiKeys', {
                                        defaultValue: 'Members can use personal API keys',
                                    })}{' '}
                                    <Tooltip
                                        title={t('settings.organization.members.personalApiKeysTooltip', {
                                            defaultValue:
                                                'Organization admins and owners can always use personal API keys regardless of this setting.',
                                        })}
                                    >
                                        <IconInfo className="mr-1" />
                                    </Tooltip>
                                </span>
                            }
                            bordered
                            data-attr="org-members-can-use-personal-api-keys-toggle"
                            checked={!!currentOrganization?.members_can_use_personal_api_keys}
                            onChange={(members_can_use_personal_api_keys) =>
                                updateOrganization({ members_can_use_personal_api_keys })
                            }
                            disabledReason={adminRestrictionReason}
                        />
                    </PayGateMini>
                </>
            )}
        </>
    )
}
