import { useActions, useValues } from 'kea'
import { Dispatch, SetStateAction, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconTrash } from '@posthog/icons'
import { LemonButton, LemonInput, LemonModal } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { organizationLogic } from 'scenes/organizationLogic'
import { urls } from 'scenes/urls'

import type { OrganizationBasicType } from '~/types'

export function DeleteOrganizationModal({
    isOpen,
    setIsOpen,
    organization,
    redirectPath,
}: {
    organization: OrganizationBasicType | null
    isOpen: boolean
    setIsOpen: Dispatch<SetStateAction<boolean>>
    redirectPath?: string
}): JSX.Element | null {
    const { t } = useTranslation()
    const { organizationBeingDeleted } = useValues(organizationLogic)
    const { deleteOrganization } = useActions(organizationLogic)

    const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false)
    const isDeletionInProgress = !!organization && organizationBeingDeleted === organization.id

    return (
        <LemonModal
            title={t('settings.organization.dangerZone.deleteModalTitle', {
                defaultValue: 'Delete the entire organization?',
            })}
            onClose={!isDeletionInProgress ? () => setIsOpen(false) : undefined}
            footer={
                <>
                    <LemonButton disabled={isDeletionInProgress} type="secondary" onClick={() => setIsOpen(false)}>
                        {t('settings.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        type="secondary"
                        status="danger"
                        disabled={!isDeletionConfirmed}
                        loading={isDeletionInProgress}
                        data-attr="delete-organization-ok"
                        onClick={
                            organization
                                ? () => deleteOrganization({ organizationId: organization.id, redirectPath })
                                : undefined
                        }
                    >
                        {t('settings.organization.dangerZone.deleteButton', {
                            defaultValue: 'Delete {{ name }}',
                            name:
                                organization?.name ||
                                t('settings.organization.dangerZone.currentOrganization', {
                                    defaultValue: 'the current organization',
                                }),
                        })}
                    </LemonButton>
                </>
            }
            isOpen={isOpen}
        >
            <p>
                <Trans
                    i18nKey="settings.organization.dangerZone.warning"
                    components={{ b: <b /> }}
                    defaults="Organization deletion <b>cannot be undone</b>. You will lose all data, <b>including all events</b>, related to all projects within this organization."
                />
            </p>
            <p>
                <Trans
                    i18nKey="settings.organization.dangerZone.confirmPrompt"
                    values={{
                        name:
                            organization?.name ||
                            t('settings.organization.dangerZone.organizationName', {
                                defaultValue: "this organization's name",
                            }),
                    }}
                    components={{ strong: <strong /> }}
                    defaults="Please type <strong>{{ name }}</strong> to confirm."
                />
            </p>
            <LemonInput
                type="text"
                onChange={(value) => {
                    if (organization) {
                        setIsDeletionConfirmed(value.toLowerCase() === organization.name.toLowerCase())
                    }
                }}
                data-attr="delete-organization-confirmation-input"
            />
        </LemonModal>
    )
}

export function OrganizationDangerZone(): JSX.Element {
    const { t } = useTranslation()
    const { currentOrganization } = useValues(organizationLogic)
    const [isModalVisible, setIsModalVisible] = useState(false)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Owner,
        scope: RestrictionScope.Organization,
    })

    return (
        <>
            <div className="text-danger">
                {!restrictionReason && (
                    <p className="text-danger">
                        <Trans
                            i18nKey="settings.organization.dangerZone.irreversible"
                            components={{ b: <b /> }}
                            defaults="This is <b>irreversible</b>. Please be certain."
                        />
                    </p>
                )}
                <LemonButton
                    status="danger"
                    type="secondary"
                    onClick={() => setIsModalVisible(true)}
                    data-attr="delete-organization-button"
                    icon={<IconTrash />}
                    disabledReason={restrictionReason}
                >
                    {t('settings.organization.dangerZone.deleteButton', {
                        defaultValue: 'Delete {{ name }}',
                        name:
                            currentOrganization?.name ||
                            t('settings.organization.dangerZone.currentOrganization', {
                                defaultValue: 'the current organization',
                            }),
                    })}
                </LemonButton>
            </div>
            {currentOrganization && (
                <DeleteOrganizationModal
                    isOpen={isModalVisible}
                    setIsOpen={setIsModalVisible}
                    organization={currentOrganization}
                    redirectPath={urls.default()}
                />
            )}
        </>
    )
}
