import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconTrash } from '@posthog/icons'
import { LemonInput } from '@posthog/lemon-ui'

import { usersLemonSelectOptions } from 'lib/components/UserSelectItem'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonInputSelect } from 'lib/lemon-ui/LemonInputSelect/LemonInputSelect'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { Spinner } from 'lib/lemon-ui/Spinner/Spinner'
import { organizationLogic } from 'scenes/organizationLogic'

import { RoleMemberType, UserType } from '~/types'

import { rolesLogic } from './rolesLogic'

export function CreateRoleModal(): JSX.Element {
    const {
        roleInFocus,
        createRoleModalShown,
        roleMembersToAdd,
        roleMembersInFocusLoading,
        addableMembers,
        rolesLoading,
        roleMembersInFocus,
    } = useValues(rolesLogic)
    const { setCreateRoleModalShown, setRoleMembersToAdd, createRole, deleteRoleMember, addRoleMembers, deleteRole } =
        useActions(rolesLogic)

    const { t } = useTranslation()
    const { isAdminOrOwner } = useValues(organizationLogic)

    const [roleName, setRoleName] = useState('')

    const isNewRole = !roleInFocus

    const handleClose = (): void => {
        setCreateRoleModalShown(false)
        setRoleMembersToAdd([])
    }

    const handleSubmit = (): void => {
        createRole(roleName)
        setRoleName('')
    }

    return (
        <LemonModal
            onClose={handleClose}
            isOpen={createRoleModalShown}
            title={
                isNewRole
                    ? t('settings.organization.roles.createTitle', { defaultValue: 'Create role' })
                    : isAdminOrOwner
                      ? t('settings.organization.roles.editTitle', {
                            defaultValue: 'Edit {{ name }} role',
                            name: roleInFocus.name,
                        })
                      : t('settings.organization.roles.viewTitle', {
                            defaultValue: '{{ name }} role',
                            name: roleInFocus.name,
                        })
            }
            footer={
                rolesLoading ? (
                    <Spinner textColored />
                ) : isAdminOrOwner ? (
                    <div className="flex flex-row justify-between w-full">
                        <div>
                            {!isNewRole && (
                                <LemonButton
                                    htmlType="submit"
                                    type="secondary"
                                    status="danger"
                                    onClick={() => deleteRole(roleInFocus)}
                                    data-attr="role-delete-submit"
                                >
                                    {t('settings.organization.roles.deleteRole', { defaultValue: 'Delete role' })}
                                </LemonButton>
                            )}
                        </div>
                        {isNewRole && (
                            <LemonButton type="primary" onClick={handleSubmit}>
                                {t('settings.save', { defaultValue: 'Save' })}
                            </LemonButton>
                        )}
                    </div>
                ) : undefined
            }
        >
            {isNewRole && (
                <div className="mb-5">
                    <h5>{t('settings.organization.roles.nameLabel', { defaultValue: 'Role Name' })}</h5>
                    <LemonInput
                        placeholder={t('settings.organization.roles.namePlaceholder', { defaultValue: 'Product' })}
                        autoFocus
                        value={roleName}
                        onChange={setRoleName}
                    />
                </div>
            )}
            {isAdminOrOwner && (
                <div className="mb-5">
                    <h5>{t('settings.organization.roles.members', { defaultValue: 'Members' })}</h5>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <LemonInputSelect
                                placeholder={t('settings.organization.roles.searchMembers', {
                                    defaultValue: 'Search for team members to add…',
                                })}
                                value={roleMembersToAdd}
                                loading={roleMembersInFocusLoading}
                                onChange={(newValues: string[]) => setRoleMembersToAdd(newValues)}
                                mode="multiple"
                                data-attr="subscribed-emails"
                                options={usersLemonSelectOptions(addableMembers, 'uuid')}
                            />
                        </div>
                        {!isNewRole && (
                            <LemonButton
                                type="primary"
                                loading={roleMembersInFocusLoading}
                                disabled={roleMembersToAdd.length === 0}
                                onClick={() => addRoleMembers({ role: roleInFocus, membersToAdd: roleMembersToAdd })}
                            >
                                {t('settings.organization.roles.add', { defaultValue: 'Add' })}
                            </LemonButton>
                        )}
                    </div>
                </div>
            )}
            {!isNewRole && (
                <>
                    <h5>{t('settings.organization.roles.roleMembers', { defaultValue: 'Role Members' })}</h5>
                    {roleMembersInFocus.length > 0 ? (
                        <div className="mt-2 pb-2 rounded overflow-y-auto max-h-80">
                            {roleMembersInFocus.map((member) => {
                                return (
                                    <MemberRow
                                        key={member.id}
                                        member={member}
                                        deleteMember={(roleMemberUuid) => deleteRoleMember({ roleMemberUuid })}
                                        isAdminOrOwner={!!isAdminOrOwner}
                                    />
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-secondary mb-2">
                            {t('settings.organization.roles.noMembers', { defaultValue: 'No members added yet' })}
                        </div>
                    )}
                </>
            )}
        </LemonModal>
    )
}

function MemberRow({
    member,
    deleteMember,
    isAdminOrOwner,
}: {
    member: RoleMemberType
    deleteMember?: (roleMemberUuid: UserType['uuid']) => void
    isAdminOrOwner: boolean
}): JSX.Element {
    const { t } = useTranslation()
    const { user } = member

    return (
        <div className="flex items-center justify-between mt-2 h-8">
            <ProfilePicture user={user} size="md" showName />
            {isAdminOrOwner && deleteMember && (
                <LemonButton
                    icon={<IconTrash />}
                    onClick={() => deleteMember(member.id)}
                    tooltip={t('settings.organization.roles.removeMember', {
                        defaultValue: 'Remove user from role',
                    })}
                    type="tertiary"
                    size="small"
                />
            )}
        </div>
    )
}
