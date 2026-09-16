import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconTrash } from '@posthog/icons'
import { LemonButton, LemonDialog, LemonInput, LemonModal, LemonTable, LemonTag, Tooltip } from '@posthog/lemon-ui'

import { OrganizationMembershipLevel } from 'lib/constants'
import { detailedTime, humanFriendlyDetailedTime } from 'lib/utils/datetime'
import { isNotNil } from 'lib/utils/guards'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { DeleteOrganizationModal } from '../organization/OrganizationDangerZone'
import { TagList } from './PersonalAPIKeys'
import { personalAPIKeysLogic } from './personalAPIKeysLogic'
import { userDangerZoneLogic } from './userDangerZoneLogic'

export function DeleteUserModal({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
}): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const { push } = useActions(router)
    const { updateCurrentOrganization, deleteUser } = useActions(userLogic)
    const { userLoading } = useValues(userLogic)
    const { organizationToDelete, isUserDeletionConfirmed, deletedOrganizationIds } = useValues(userDangerZoneLogic)
    const { leaveOrganization, setOrganizationToDelete, setIsUserDeletionConfirmed } = useActions(userDangerZoneLogic)
    const organizations = (user?.organizations ?? [])
        .filter(isNotNil)
        .filter((org) => !deletedOrganizationIds.includes(org.id))
    const { keys } = useValues(personalAPIKeysLogic)
    const { loadKeys } = useActions(personalAPIKeysLogic)

    const deleteConfirmationText = t('settings.user.dangerZone.confirmPhrase', {
        defaultValue: 'permanently delete data',
    })

    useEffect(() => {
        loadKeys()
    }, [loadKeys])

    return (
        <>
            <LemonModal
                title={t('settings.user.dangerZone.deleteAccountTitle', { defaultValue: 'Delete your account' })}
                onClose={!userLoading ? () => setIsOpen(false) : undefined}
                footer={
                    <>
                        <LemonButton
                            disabledReason={userLoading && t('settings.loading', { defaultValue: 'Loading...' })}
                            type="secondary"
                            onClick={() => setIsOpen(false)}
                        >
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                        <LemonButton
                            type="secondary"
                            disabled={!isUserDeletionConfirmed}
                            loading={userLoading}
                            data-attr="delete-user-ok"
                            status="danger"
                            onClick={() => deleteUser()}
                        >
                            {t('settings.user.dangerZone.deleteAccount', { defaultValue: 'Delete account' })}
                        </LemonButton>
                    </>
                }
                isOpen={isOpen}
            >
                {organizations.length > 0 && (
                    <>
                        <p className="text-danger font-semibold">
                            {t('settings.user.dangerZone.leaveOrganizationsFirst', {
                                defaultValue:
                                    'You must leave or delete all organizations before deleting your account.',
                            })}
                        </p>
                        <LemonTable
                            dataSource={organizations}
                            size="small"
                            columns={[
                                {
                                    title: t('settings.user.dangerZone.columns.organization', {
                                        defaultValue: 'Organization',
                                    }),
                                    render: function RenderOrganizationName(_, organization) {
                                        return <div className="text-md font-semibold">{organization.name}</div>
                                    },
                                },
                                {
                                    title: '',
                                    render: function RenderActionButton(_, organization) {
                                        return (
                                            <div className="flex justify-end items-center gap-2 py-1 text-danger font-semibold">
                                                {organization.membership_level ===
                                                    OrganizationMembershipLevel.Owner && (
                                                    <LemonButton
                                                        type="secondary"
                                                        size="small"
                                                        status="default"
                                                        onClick={() => {
                                                            if (organization.id === user?.organization?.id) {
                                                                push(urls.settings('organization-members'))
                                                            } else {
                                                                updateCurrentOrganization(
                                                                    organization.id,
                                                                    urls.settings('organization-members')
                                                                )
                                                            }
                                                        }}
                                                    >
                                                        {t('settings.user.dangerZone.transferOwnership', {
                                                            defaultValue: 'Transfer ownership',
                                                        })}
                                                    </LemonButton>
                                                )}
                                                {organization.membership_level !==
                                                    OrganizationMembershipLevel.Owner && (
                                                    <LemonButton
                                                        type="secondary"
                                                        size="small"
                                                        status="default"
                                                        onClick={() => {
                                                            LemonDialog.open({
                                                                title: t(
                                                                    'settings.user.dangerZone.leaveOrganizationTitle',
                                                                    {
                                                                        defaultValue: 'Leave organization {{ name }}?',
                                                                        name: organization.name,
                                                                    }
                                                                ),
                                                                primaryButton: {
                                                                    children: t('settings.user.dangerZone.leave', {
                                                                        defaultValue: 'Leave',
                                                                    }),
                                                                    status: 'danger',
                                                                    onClick: () => leaveOrganization(organization.id),
                                                                },
                                                                secondaryButton: {
                                                                    children: t('settings.cancel', {
                                                                        defaultValue: 'Cancel',
                                                                    }),
                                                                },
                                                            })
                                                        }}
                                                    >
                                                        {t('settings.user.dangerZone.leaveOrganization', {
                                                            defaultValue: 'Leave organization',
                                                        })}
                                                    </LemonButton>
                                                )}
                                                {organization.membership_level ===
                                                    OrganizationMembershipLevel.Owner && (
                                                    <LemonButton
                                                        type="secondary"
                                                        size="small"
                                                        status="danger"
                                                        onClick={() => {
                                                            setOrganizationToDelete(organization)
                                                        }}
                                                    >
                                                        {t('settings.user.dangerZone.deleteOrganization', {
                                                            defaultValue: 'Delete organization',
                                                        })}
                                                    </LemonButton>
                                                )}
                                            </div>
                                        )
                                    },
                                },
                            ]}
                        />
                    </>
                )}
                {organizations.length === 0 && (
                    <>
                        <p>
                            <Trans
                                i18nKey="settings.user.dangerZone.accountDeletionWarning"
                                components={{ b: <b /> }}
                                defaults="Account deletion <b>cannot be undone</b>. You will lose all your data permanently."
                            />
                        </p>

                        {keys.length > 0 && (
                            <>
                                <p className="text-danger font-semibold mt-4">
                                    {t('settings.user.dangerZone.keysWillBeDeleted', {
                                        defaultValue: 'The following personal API keys will be deleted',
                                    })}
                                </p>
                                <LemonTable
                                    dataSource={keys}
                                    size="small"
                                    className="mt-2"
                                    columns={[
                                        {
                                            title: t('settings.user.dangerZone.columns.label', {
                                                defaultValue: 'Label',
                                            }),
                                            dataIndex: 'label',
                                            key: 'label',
                                            render: (label) => <span className="font-semibold">{String(label)}</span>,
                                        },
                                        {
                                            title: t('settings.user.dangerZone.columns.lastUsed', {
                                                defaultValue: 'Last Used',
                                            }),
                                            dataIndex: 'last_used_at',
                                            key: 'lastUsedAt',
                                            render: (_, key) => {
                                                return (
                                                    <Tooltip title={detailedTime(key.last_used_at)} placement="bottom">
                                                        {humanFriendlyDetailedTime(
                                                            key.last_used_at,
                                                            'MMMM DD, YYYY',
                                                            'h A'
                                                        )}
                                                    </Tooltip>
                                                )
                                            },
                                        },
                                        {
                                            title: t('settings.user.dangerZone.columns.scopes', {
                                                defaultValue: 'Scopes',
                                            }),
                                            key: 'scopes',
                                            dataIndex: 'scopes',
                                            render: (_, key) =>
                                                key.scopes[0] === '*' ? (
                                                    <LemonTag type="warning">
                                                        {t('settings.user.dangerZone.allAccess', {
                                                            defaultValue: 'All access',
                                                        })}
                                                    </LemonTag>
                                                ) : (
                                                    <TagList tags={key.scopes} onMoreClick={() => {}} />
                                                ),
                                        },
                                    ]}
                                />
                            </>
                        )}

                        <p className="mt-4">
                            <Trans
                                i18nKey="settings.user.dangerZone.confirmPrompt"
                                values={{ phrase: deleteConfirmationText }}
                                components={{ strong: <strong className="select-none" /> }}
                                defaults="Please type <strong>{{ phrase }}</strong> to confirm account deletion."
                            />
                        </p>
                        <LemonInput
                            type="text"
                            onChange={(value) => {
                                setIsUserDeletionConfirmed(value.toLowerCase() === deleteConfirmationText.toLowerCase())
                            }}
                        />
                    </>
                )}
            </LemonModal>
            <DeleteOrganizationModal
                isOpen={organizationToDelete !== null}
                setIsOpen={() => setOrganizationToDelete(null)}
                organization={organizationToDelete}
                redirectPath={urls.settings('user-danger-zone')}
            />
        </>
    )
}

export function UserDangerZone(): JSX.Element {
    const { setDeleteUserModalOpen } = useActions(userDangerZoneLogic)
    const { deleteUserModalOpen } = useValues(userDangerZoneLogic)

    return (
        <>
            <div className="text-danger">
                <div className="mt-4">
                    <p className="text-danger">
                        This is <b>irreversible</b>. Please be certain.
                    </p>
                    <LemonButton
                        status="danger"
                        type="secondary"
                        onClick={() => setDeleteUserModalOpen(true)}
                        data-attr="delete-user-button"
                        icon={<IconTrash />}
                    >
                        Delete your account
                    </LemonButton>
                </div>
            </div>
            <DeleteUserModal isOpen={deleteUserModalOpen} setIsOpen={setDeleteUserModalOpen} />
        </>
    )
}
