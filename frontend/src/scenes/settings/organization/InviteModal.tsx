import './InviteModal.scss'

import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { IconInfo, IconPlus, IconTrash } from '@posthog/icons'
import { LemonInput, LemonSelect, LemonTextArea, Link, Tooltip } from '@posthog/lemon-ui'

import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { RestrictionScope } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { organizationMembershipLevelIntegers } from 'lib/utils/permissioning'
import { capitalizeFirstLetter, pluralize } from 'lib/utils/strings'
import { isEmail } from 'lib/utils/url'
import { organizationLogic } from 'scenes/organizationLogic'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { userLogic } from 'scenes/userLogic'

import { AccessControlLevel, AvailableFeature } from '~/types'

import { inviteLogic } from './inviteLogic'

/** Shuffled placeholder names */
const PLACEHOLDER_NAMES: string[] = [...Array(10).fill('Jane'), ...Array(10).fill('John'), 'Sonic'].sort(
    () => Math.random() - 0.5
)
export const MAX_INVITES_AT_ONCE = 20

export function EmailUnavailableForInvitesBanner(): JSX.Element {
    return (
        <LemonBanner type="info" className="my-2">
            <Trans
                i18nKey="settings.organization.invite.emailUnavailableBanner"
                components={{
                    EmailLink: (
                        <Link to="https://posthog.com/docs/self-host/configure/email" target="_blank" targetBlankIcon />
                    ),
                    Underline: <u />,
                    Br: <br />,
                }}
                defaults="This PostHog instance isn't <EmailLink>configured&nbsp;to&nbsp;send&nbsp;emails&nbsp;</EmailLink>.<Br></Br>Remember to <Underline>share the invite link</Underline> with each team member you invite."
            />
        </LemonBanner>
    )
}

export function ProjectAccessSelector({ inviteIndex }: { inviteIndex: number }): JSX.Element {
    const { t } = useTranslation()
    const { invitesToSend, availableProjects, projectAccessControls } = useValues(inviteLogic)
    const {
        updateInviteAtIndex,
        addProjectAccess: addProjectAccessAction,
        removeProjectAccess: removeProjectAccessAction,
    } = useActions(inviteLogic)

    const invite = invitesToSend[inviteIndex]
    const selectedProjects = invite.private_project_access || []

    // Check if organization level is admin or owner (which will override project access)
    const isOrgLevelAdminOrOwner =
        invite.level === OrganizationMembershipLevel.Admin || invite.level === OrganizationMembershipLevel.Owner

    const availableProjectsToShow = availableProjects.filter(
        (project: any) => !selectedProjects.some((selected) => selected.id === project.id)
    )

    const addProjectAccess = (projectId: number, level: AccessControlLevel): void => {
        addProjectAccessAction(inviteIndex, projectId, level)
    }

    const removeProjectAccess = (projectId: number): void => {
        removeProjectAccessAction(inviteIndex, projectId)
    }

    const updateProjectAccess = (projectId: number, level: AccessControlLevel): void => {
        const newAccess = selectedProjects.map((access) => (access.id === projectId ? { ...access, level } : access))
        updateInviteAtIndex({ private_project_access: newAccess }, inviteIndex)
    }

    if (availableProjects.length === 0 && selectedProjects.length === 0) {
        return <></>
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium mb-0">
                    {t('settings.organization.invite.projectAccess', { defaultValue: 'Project access' })}
                </h4>
                <Tooltip
                    docLink="https://posthog.com/docs/settings/access-control"
                    title={t('settings.organization.invite.projectAccessTooltip', {
                        defaultValue:
                            'Give this user access to specific projects. These access controls will be applied when the user accepts the invite and joins the organization.',
                    })}
                >
                    <IconInfo className="text-muted-alt" />
                </Tooltip>
                {availableProjectsToShow.length > 0 && (
                    <LemonSelect
                        icon={<IconPlus />}
                        className="bg-bg-light"
                        placeholder={t('settings.organization.invite.addProject', { defaultValue: 'Add project' })}
                        options={availableProjectsToShow.map((project: any) => ({
                            value: project.id,
                            label: project.name,
                        }))}
                        onChange={(projectId) => {
                            if (projectId) {
                                addProjectAccess(Number(projectId), AccessControlLevel.Member)
                            }
                        }}
                    />
                )}
            </div>

            {isOrgLevelAdminOrOwner && selectedProjects.length > 0 && (
                <LemonBanner type="warning" className="text-xs">
                    <Trans
                        i18nKey="settings.organization.invite.orgLevelOverride"
                        values={{ level: OrganizationMembershipLevel[invite.level].toLowerCase() }}
                        components={{ Level: <span className="font-bold italic" /> }}
                        defaults="This user will have <Level>{{ level }}</Level> access on the organization level, which will override any project-specific access controls."
                    />
                </LemonBanner>
            )}

            {selectedProjects.length > 0 && (
                <div className="space-y-2">
                    {selectedProjects.map((access) => {
                        const project = availableProjects.find((p: any) => p.id === access.id)
                        if (!project) {
                            return null
                        }

                        const defaultLevel = projectAccessControls[project.id]?.access_level
                        const isLowerThanDefault = defaultLevel === 'admin' && access.level === 'member'

                        return (
                            <div key={access.id} className="space-y-2">
                                <div className="p-2 bg-bg-light rounded border">
                                    {isLowerThanDefault && (
                                        <div className="mb-2">
                                            <LemonBanner type="warning" className="text-xs">
                                                <Trans
                                                    i18nKey="settings.organization.invite.lowerThanDefault"
                                                    values={{
                                                        project: project.name,
                                                        defaultLevel,
                                                        selectedLevel: access.level,
                                                    }}
                                                    components={{
                                                        Project: <strong />,
                                                        Level: <span className="font-bold italic" />,
                                                    }}
                                                    defaults="<Project>{{ project }}</Project> has a default access level of <Level>{{ defaultLevel }}</Level>. Since you selected <Level>{{ selectedLevel }}</Level> (which is lower), the user will actually get <Level>{{ defaultLevel }}</Level> access."
                                                />
                                            </LemonBanner>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <span className="font-medium">{project.name}</span>{' '}
                                            {defaultLevel && (
                                                <span>
                                                    {t('settings.organization.invite.defaultLevel', {
                                                        defaultValue: '(default: {{ level }})',
                                                        level: defaultLevel,
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <LemonSelect
                                            className="bg-bg-light"
                                            size="small"
                                            options={[
                                                {
                                                    value: AccessControlLevel.Member,
                                                    label: capitalizeFirstLetter(AccessControlLevel.Member),
                                                },
                                                {
                                                    value: AccessControlLevel.Admin,
                                                    label: capitalizeFirstLetter(AccessControlLevel.Admin),
                                                },
                                            ]}
                                            value={access.level}
                                            onChange={(level) => {
                                                if (level) {
                                                    updateProjectAccess(access.id, level)
                                                }
                                            }}
                                        />
                                        <LemonButton
                                            size="small"
                                            icon={<IconTrash />}
                                            status="danger"
                                            onClick={() => removeProjectAccess(access.id)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export function InviteRow({
    index,
    isDeletable,
    hideProjectAccessSelector = false,
}: {
    index: number
    isDeletable: boolean
    hideProjectAccessSelector?: boolean
}): JSX.Element {
    const { t } = useTranslation()
    const name = PLACEHOLDER_NAMES[index % PLACEHOLDER_NAMES.length]

    const { hasAvailableFeature } = useValues(userLogic)
    const hasAccessControl = hasAvailableFeature(AvailableFeature.ACCESS_CONTROL)

    const { invitesToSend } = useValues(inviteLogic)
    const { updateInviteAtIndex, inviteTeamMembers, deleteInviteAtIndex } = useActions(inviteLogic)
    const { preflight } = useValues(preflightLogic)
    const { currentOrganization } = useValues(organizationLogic)

    const myMembershipLevel = currentOrganization ? currentOrganization.membership_level : null

    const allowedLevels = myMembershipLevel
        ? organizationMembershipLevelIntegers.filter((listLevel) => listLevel <= myMembershipLevel)
        : [OrganizationMembershipLevel.Member]

    const allowedLevelsOptions = allowedLevels.map((level) => ({
        value: level,
        label: OrganizationMembershipLevel[level],
    }))

    return (
        <div className="space-y-4 bg-surface-secondary py-4 px-4 rounded-md">
            <div className="flex gap-2">
                <div className="flex-2">
                    <LemonInput
                        placeholder={`${name.toLowerCase()}@posthog.com`}
                        type="email"
                        className={`error-on-blur${!invitesToSend[index]?.isValid ? ' errored' : ''}`}
                        onChange={(v) => {
                            let isValid = true
                            if (v && !isEmail(v)) {
                                isValid = false
                            }
                            updateInviteAtIndex({ target_email: v, isValid }, index)
                        }}
                        value={invitesToSend[index]?.target_email}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                inviteTeamMembers()
                            }
                        }}
                        autoFocus={index === 0}
                        data-attr="invite-email-input"
                    />
                </div>
                {preflight?.email_service_available && (
                    <div className="flex-1 flex gap-1 items-center justify-between">
                        <LemonInput
                            placeholder={name}
                            className="flex-1"
                            value={invitesToSend[index].first_name}
                            onChange={(v) => {
                                updateInviteAtIndex({ first_name: v }, index)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    inviteTeamMembers()
                                }
                            }}
                        />
                    </div>
                )}
                {allowedLevelsOptions.length > 1 && (
                    <div className="flex-1 flex gap-1 items-center justify-between">
                        <LemonSelect
                            className="bg-bg-light"
                            fullWidth
                            data-attr="invite-row-org-member-level"
                            options={allowedLevelsOptions}
                            value={invitesToSend[index].level || allowedLevels[0]}
                            onChange={(v) => {
                                updateInviteAtIndex({ level: v }, index)
                            }}
                        />
                    </div>
                )}
                {!preflight?.email_service_available && (
                    <div className="flex-1 flex gap-1 items-center justify-between">
                        <LemonButton
                            type="primary"
                            className="flex-1"
                            disabled={!isEmail(invitesToSend[index].target_email)}
                            onClick={() => {
                                inviteTeamMembers()
                            }}
                            fullWidth
                            center
                            data-attr="invite-generate-invite-link"
                        >
                            {t('settings.organization.invite.submit', { defaultValue: 'Submit' })}
                        </LemonButton>
                    </div>
                )}

                {isDeletable && (
                    <LemonButton icon={<IconTrash />} status="danger" onClick={() => deleteInviteAtIndex(index)} />
                )}
            </div>

            {hasAccessControl && !hideProjectAccessSelector && <ProjectAccessSelector inviteIndex={index} />}
        </div>
    )
}

export function InviteTeamMatesComponent({
    hideProjectAccessSelector = false,
}: {
    hideProjectAccessSelector?: boolean
}): JSX.Element {
    const { t } = useTranslation()
    const { preflight } = useValues(preflightLogic)
    const { invitesToSend, inviteContainsOwnerLevel } = useValues(inviteLogic)
    const { appendInviteRow, updateMessage, setIsInviteConfirmed } = useActions(inviteLogic)

    const areInvitesCreatable = invitesToSend.length + 1 < MAX_INVITES_AT_ONCE
    const areInvitesDeletable = invitesToSend.length > 1

    const { currentOrganization } = useValues(organizationLogic)

    const myMembershipLevel = currentOrganization ? currentOrganization.membership_level : null

    const allowedLevels = myMembershipLevel
        ? organizationMembershipLevelIntegers.filter((listLevel) => listLevel <= myMembershipLevel)
        : [OrganizationMembershipLevel.Member]

    const allowedLevelsOptions = allowedLevels.map((level) => ({
        value: level,
        label: OrganizationMembershipLevel[level],
    }))

    return (
        <>
            {preflight?.licensed_users_available === 0 && (
                <LemonBanner type="warning">
                    <Trans
                        i18nKey="settings.organization.invite.licenseLimit"
                        components={{ SalesLink: <Link to="mailto:sales@posthog.com" /> }}
                        defaults="You've hit the limit of team members you can invite to your PostHog instance given your license. Please contact <SalesLink>sales@posthog.com</SalesLink> to upgrade your license."
                    />
                </LemonBanner>
            )}
            <div className="deprecated-space-y-4">
                <div className="flex gap-2">
                    <b className="flex-2">
                        {t('settings.organization.invite.emailAddress', { defaultValue: 'Email address' })}
                    </b>
                    {preflight?.email_service_available && (
                        <b className="flex-1">
                            {t('settings.organization.invite.nameOptional', { defaultValue: 'Name (optional)' })}
                        </b>
                    )}
                    {allowedLevelsOptions.length > 1 && (
                        <b className="flex-1">
                            {t('settings.organization.invite.organizationLevel', {
                                defaultValue: 'Organization level',
                            })}
                        </b>
                    )}
                    {!preflight?.email_service_available && <b className="flex-1" />}
                    {areInvitesDeletable && <b className="w-12" />}
                </div>

                {invitesToSend.map((_, index) => (
                    <InviteRow
                        hideProjectAccessSelector={hideProjectAccessSelector}
                        index={index}
                        key={index.toString()}
                        isDeletable={areInvitesDeletable}
                    />
                ))}

                <div className="mt-2 flex justify-end">
                    {areInvitesCreatable && (
                        <LemonButton type="secondary" icon={<IconPlus />} onClick={appendInviteRow}>
                            {t('settings.organization.invite.add', { defaultValue: 'Add' })}
                        </LemonButton>
                    )}
                </div>
            </div>
            {preflight?.email_service_available && (
                <div className="mt-4">
                    <div className="mb-2">
                        <b>
                            {t('settings.organization.invite.messageOptional', { defaultValue: 'Message (optional)' })}
                        </b>
                    </div>
                    <LemonTextArea
                        data-attr="invite-optional-message"
                        placeholder={t('settings.organization.invite.messagePlaceholder', {
                            defaultValue: "Tell your teammates why you're inviting them to PostHog",
                        })}
                        onChange={(e) => updateMessage(e)}
                    />
                </div>
            )}

            {inviteContainsOwnerLevel && (
                <div className="mt-4">
                    <b>
                        {t('settings.organization.invite.confirmOwnerTitle', {
                            defaultValue: 'Confirm owner-level invites',
                        })}
                    </b>

                    <div className="mb-2">
                        <Trans
                            i18nKey="settings.organization.invite.confirmOwner"
                            values={{
                                phrase: t('settings.organization.invite.confirmPhrase', {
                                    defaultValue: 'send invites',
                                }),
                            }}
                            components={{ strong: <strong /> }}
                            defaults="At least one invite is for an owner level member. Please type <strong>{{ phrase }}</strong> to confirm that you wish to send these invites."
                        />
                    </div>
                    <LemonInput
                        type="text"
                        placeholder={t('settings.organization.invite.confirmPhrase', { defaultValue: 'send invites' })}
                        onChange={(value) => {
                            setIsInviteConfirmed(
                                value.toLowerCase() ===
                                    t('settings.organization.invite.confirmPhrase', { defaultValue: 'send invites' })
                            )
                        }}
                    />
                </div>
            )}
        </>
    )
}

export function InviteModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const { currentOrganization } = useValues(organizationLogic)
    const { preflight } = useValues(preflightLogic)
    const { invitesToSend, canSubmit, isInviting } = useValues(inviteLogic)
    const { resetInviteRows, inviteTeamMembers } = useActions(inviteLogic)

    const validInvitesCount = invitesToSend.filter((invite) => invite.isValid && invite.target_email).length

    const minAdminRestrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })

    const userCannotInvite = minAdminRestrictionReason && !currentOrganization?.members_can_invite

    return (
        <div className="InviteModal">
            <LemonModal
                isOpen={isOpen}
                onClose={() => {
                    resetInviteRows()
                    onClose()
                }}
                width={800}
                title={
                    <>
                        {t('settings.organization.invite.modalTitle', {
                            defaultValue: 'Invite others to {{ organization }}',
                            organization:
                                user?.organization?.name ||
                                t('settings.organization.invite.posthogFallback', { defaultValue: 'PostHog' }),
                        })}
                    </>
                }
                description={
                    preflight?.email_service_available ? (
                        <p>
                            <Trans
                                i18nKey="settings.organization.invite.description"
                                components={{
                                    DocsLink: (
                                        <Link
                                            to="https://posthog.com/docs/settings/organizations#adding-new-members"
                                            target="_blank"
                                            targetBlankIcon
                                        />
                                    ),
                                }}
                                defaults="Invite others to your organization to collaborate together in PostHog. An invite is specific to an email address and expires after 3 days. Name can be provided for the team member's convenience. <DocsLink>Docs</DocsLink>"
                            />
                        </p>
                    ) : (
                        <p>
                            <Trans
                                i18nKey="settings.organization.invite.descriptionNoEmail"
                                components={{ strong: <strong /> }}
                                defaults="This PostHog instance isn't configured to send emails. In the meantime, you can generate a link for each team member you want to invite. You can always invite others at a later time. <strong>Make sure you share links with the organization members you want to invite.</strong>"
                            />
                        </p>
                    )
                }
                footer={
                    <>
                        {!preflight?.email_service_available ? (
                            <LemonButton center type="secondary" onClick={onClose}>
                                {t('settings.organization.invite.done', { defaultValue: 'Done' })}
                            </LemonButton>
                        ) : (
                            <>
                                <LemonButton
                                    onClick={() => {
                                        resetInviteRows()
                                        onClose()
                                    }}
                                    type="secondary"
                                    disabled={isInviting}
                                >
                                    {t('settings.cancel', { defaultValue: 'Cancel' })}
                                </LemonButton>
                                <LemonButton
                                    onClick={() => inviteTeamMembers()}
                                    type="primary"
                                    loading={isInviting}
                                    disabledReason={
                                        userCannotInvite
                                            ? t('settings.organization.invite.noPermission', {
                                                  defaultValue: "You don't have permissions to invite others.",
                                              })
                                            : !canSubmit
                                              ? t('settings.organization.invite.fillAllFields', {
                                                    defaultValue: 'Please fill out all fields',
                                                })
                                              : undefined
                                    }
                                    data-attr="invite-team-member-submit"
                                >
                                    {validInvitesCount
                                        ? i18n.t('settings.organization.invite.submitCount', {
                                              defaultValue: 'Invite {{ members }}',
                                              members: pluralize(
                                                  validInvitesCount,
                                                  i18n.t('settings.organization.invite.teamMember', {
                                                      defaultValue: 'team member',
                                                  })
                                              ),
                                          })
                                        : i18n.t('settings.organization.invite.submit', {
                                              defaultValue: 'Invite team members',
                                          })}
                                </LemonButton>
                            </>
                        )}
                    </>
                }
            >
                <InviteTeamMatesComponent />
            </LemonModal>
        </div>
    )
}
