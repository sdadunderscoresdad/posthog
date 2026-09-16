import { useActions, useValues } from 'kea'
import { Dispatch, SetStateAction, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconTrash } from '@posthog/icons'
import { LemonButton, LemonInput, LemonModal } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { organizationLogic } from 'scenes/organizationLogic'
import { projectLogic } from 'scenes/projectLogic'

export function DeleteProjectModal({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean
    setIsOpen: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
    const { t } = useTranslation()
    const { currentProject, projectBeingDeleted } = useValues(projectLogic)
    const { currentOrganization } = useValues(organizationLogic)
    const { deleteProject } = useActions(projectLogic)

    const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false)
    const isDeletionInProgress = !!currentProject && projectBeingDeleted?.id === currentProject.id

    const allTeamsOfProject =
        currentProject && currentOrganization
            ? currentOrganization.teams.filter((team) => team.project_id === currentProject.id)
            : []

    const projectName = currentProject
        ? currentProject.name
        : t('settings.project.currentProject', { defaultValue: 'the current project' })

    return (
        <LemonModal
            title={t('settings.project.dangerZone.deleteModalTitle', {
                defaultValue: 'Delete the project and its data?',
            })}
            onClose={!isDeletionInProgress ? () => setIsOpen(false) : undefined}
            footer={
                <>
                    <LemonButton
                        disabledReason={
                            isDeletionInProgress &&
                            t('settings.project.dangerZone.deleting', { defaultValue: 'Deleting...' })
                        }
                        type="secondary"
                        onClick={() => setIsOpen(false)}
                    >
                        {t('settings.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="secondary"
                        disabled={!isDeletionConfirmed}
                        loading={isDeletionInProgress}
                        data-attr="delete-project-ok"
                        status="danger"
                        onClick={currentProject ? () => deleteProject(currentProject) : undefined}
                    >
                        {t('settings.project.dangerZone.deleteButton', {
                            defaultValue: 'Delete {{ name }}',
                            name: projectName,
                        })}
                    </LemonButton>
                </>
            }
            isOpen={isOpen}
        >
            <p>
                <Trans
                    i18nKey="settings.project.dangerZone.warning"
                    components={{ b: <b /> }}
                    defaults="Project deletion <b>cannot be undone</b>. You will lose all environments and their data (<b>including events</b>):"
                />
                <ul className="list-disc list-inside ml-4 mt-1">
                    {allTeamsOfProject.map((team) => (
                        <li key={team.id}>{team.name}</li>
                    ))}
                </ul>
            </p>
            <p className="mt-2 p-2 bg-bg-3000 rounded text-sm">
                <Trans
                    i18nKey="settings.project.dangerZone.cleanupNote"
                    components={{ strong: <strong /> }}
                    defaults="<strong>Note:</strong> For projects with lots of data, cleanup may take several hours. We'll send you an email when the process is complete."
                />
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
                        setIsDeletionConfirmed(value.toLowerCase() === currentProject.name.toLowerCase())
                    }
                }}
            />
        </LemonModal>
    )
}

export function ProjectDangerZone(): JSX.Element {
    const { t } = useTranslation()
    const { currentProject } = useValues(projectLogic)
    const [isModalVisible, setIsModalVisible] = useState(false)

    const restrictedReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Project,
    })

    return (
        <>
            <div className="text-danger">
                <div className="mt-4">
                    {!restrictedReason && (
                        <p className="text-danger">
                            <Trans
                                i18nKey="settings.project.dangerZone.irreversible"
                                components={{ b: <b /> }}
                                defaults="This is <b>irreversible</b>. Please be certain."
                            />
                        </p>
                    )}
                    <LemonButton
                        status="danger"
                        type="secondary"
                        onClick={() => setIsModalVisible(true)}
                        data-attr="delete-project-button"
                        icon={<IconTrash />}
                        disabledReason={restrictedReason}
                    >
                        {t('settings.project.dangerZone.deleteButton', {
                            defaultValue: 'Delete {{ name }}',
                            name:
                                currentProject?.name ||
                                t('settings.project.currentProject', {
                                    defaultValue: 'the current project',
                                }),
                        })}
                    </LemonButton>
                </div>
            </div>
            <DeleteProjectModal isOpen={isModalVisible} setIsOpen={setIsModalVisible} />
        </>
    )
}
