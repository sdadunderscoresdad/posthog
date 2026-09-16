import { useActions, useValues } from 'kea'
import { Dispatch, SetStateAction, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconArrowRight } from '@posthog/icons'
import { LemonButton, LemonInput, LemonModal, LemonSelect } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { projectLogic } from 'scenes/projectLogic'
import { userLogic } from 'scenes/userLogic'

import { OrganizationBasicType } from '~/types'

export function MoveProjectModal({
    isOpen,
    setIsOpen,
    organization,
}: {
    isOpen: boolean
    setIsOpen: Dispatch<SetStateAction<boolean>>
    organization: OrganizationBasicType
}): JSX.Element {
    const { t } = useTranslation()
    const { currentProject, projectBeingMovedLoading } = useValues(projectLogic)
    const { moveProject } = useActions(projectLogic)

    const [isConfirmed, setConfirmed] = useState(false)

    return (
        <LemonModal
            title={t('settings.project.move.modalTitle', {
                defaultValue: 'Move the project to another organization?',
            })}
            onClose={!projectBeingMovedLoading ? () => setIsOpen(false) : undefined}
            closable={!projectBeingMovedLoading}
            maxWidth="30rem"
            footer={
                <>
                    <LemonButton
                        disabledReason={
                            projectBeingMovedLoading && t('settings.project.move.moving', { defaultValue: 'Moving...' })
                        }
                        type="secondary"
                        onClick={() => setIsOpen(false)}
                    >
                        {t('settings.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="secondary"
                        disabled={!isConfirmed}
                        loading={projectBeingMovedLoading}
                        data-attr="move-project-ok"
                        status="danger"
                        onClick={currentProject ? () => moveProject(currentProject, organization.id) : undefined}
                    >
                        {t('settings.project.move.button', {
                            defaultValue: 'Move {{ name }}',
                            name:
                                currentProject?.name ||
                                t('settings.project.currentProject', { defaultValue: 'the current project' }),
                        })}
                    </LemonButton>
                </>
            }
            isOpen={isOpen}
        >
            <p>
                {t('settings.project.move.warning', {
                    defaultValue:
                        'Moving a project will mean all original organization members will lose access including via things like API keys unless they also are part of the new organization.',
                })}
            </p>
            <p>
                <Trans
                    i18nKey="settings.project.confirmPrompt"
                    values={{
                        name: currentProject
                            ? currentProject.name
                            : t('settings.project.projectName', { defaultValue: "this project's name" }),
                    }}
                    components={{ strong: <strong /> }}
                    defaults="Please type <strong>{{ name }}</strong> to confirm."
                />
            </p>
            <LemonInput
                type="text"
                onChange={(value) => {
                    if (currentProject) {
                        setConfirmed(value.toLowerCase() === currentProject.name.toLowerCase())
                    }
                }}
            />
        </LemonModal>
    )
}

function notAdminOfOrg(organization: OrganizationBasicType): boolean {
    return (organization.membership_level ?? OrganizationMembershipLevel.Member) < OrganizationMembershipLevel.Admin
}

export function ProjectMove(): JSX.Element {
    const { t } = useTranslation()
    const { currentProject } = useValues(projectLogic)
    const { otherOrganizations } = useValues(userLogic)
    const [isModalVisible, setIsModalVisible] = useState(false)

    const [targetOrganization, setTargetOrganization] = useState<OrganizationBasicType | null>(null)

    const restrictedReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Project,
    })
    const { moveProjectDisabledReason } = useValues(projectLogic)

    const notAdminOfTargetReason = t('settings.project.move.notAdminReason', {
        defaultValue: 'You need to be an admin or owner of this organization to move a project into it',
    })

    // Moving a project requires admin (or owner) on BOTH organizations — the API enforces this. The source org is
    // covered by `restrictedReason` above; guard the target org here so a member of the target org gets a clear
    // message instead of a failed request.
    const targetOrgRestrictionReason =
        targetOrganization && notAdminOfOrg(targetOrganization) ? notAdminOfTargetReason : null

    return (
        <>
            <p>
                <Trans
                    i18nKey="settings.project.move.prompt"
                    values={{ name: currentProject?.name }}
                    components={{ b: <b /> }}
                    defaults="Move <b>{{ name }}</b> to another organization?"
                />
            </p>

            <div className="flex items-center gap-2">
                <LemonSelect
                    options={otherOrganizations.map((o) => ({
                        label: o.name,
                        value: o.id,
                        disabledReason: notAdminOfOrg(o) ? notAdminOfTargetReason : undefined,
                    }))}
                    placeholder={t('settings.project.move.selectTarget', {
                        defaultValue: 'Select target organization',
                    })}
                    onChange={(value) => {
                        const organization = otherOrganizations.find((o) => o.id === value)
                        setTargetOrganization(organization || null)
                    }}
                    value={targetOrganization?.id}
                    disabledReason={restrictedReason ?? moveProjectDisabledReason}
                />

                <LemonButton
                    status="danger"
                    type="secondary"
                    onClick={() => setIsModalVisible(true)}
                    data-attr="move-project-button"
                    icon={<IconArrowRight />}
                    disabledReason={
                        restrictedReason ??
                        moveProjectDisabledReason ??
                        (targetOrganization === null
                            ? t('settings.project.move.selectTargetFirst', {
                                  defaultValue: 'Please select the target organization',
                              })
                            : (targetOrgRestrictionReason ?? undefined))
                    }
                >
                    {t('settings.project.move.button', {
                        defaultValue: 'Move {{ name }}',
                        name:
                            currentProject?.name ||
                            t('settings.project.currentProject', { defaultValue: 'the current project' }),
                    })}
                </LemonButton>
            </div>
            {targetOrganization && (
                <MoveProjectModal
                    isOpen={isModalVisible}
                    setIsOpen={setIsModalVisible}
                    organization={targetOrganization}
                />
            )}
        </>
    )
}
