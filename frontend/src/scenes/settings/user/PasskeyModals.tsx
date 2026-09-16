import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LemonButton, LemonInput, LemonModal } from '@posthog/lemon-ui'

import { passkeySettingsLogic } from './passkeySettingsLogic'

export function PasskeyModals(): JSX.Element {
    const { t } = useTranslation()
    const { deleteModalId, renameModal } = useValues(passkeySettingsLogic)
    const { closeDeleteModal, deletePasskey, closeRenameModal, renamePasskey } = useActions(passkeySettingsLogic)

    const [renameLabel, setRenameLabel] = useState('')

    useEffect(() => {
        if (renameModal) {
            setRenameLabel(renameModal.currentLabel)
        }
    }, [renameModal])

    const handleRename = (): void => {
        if (renameModal && renameLabel.trim()) {
            renamePasskey(renameModal.id, renameLabel.trim())
        }
    }

    return (
        <>
            <LemonModal
                isOpen={deleteModalId !== null}
                onClose={closeDeleteModal}
                title={t('settings.user.passkeys.deleteTitle', { defaultValue: 'Delete passkey?' })}
                footer={
                    <>
                        <LemonButton type="secondary" onClick={closeDeleteModal}>
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                        <LemonButton
                            type="primary"
                            status="danger"
                            onClick={() => deleteModalId && deletePasskey(deleteModalId)}
                        >
                            {t('settings.user.passkeys.delete', { defaultValue: 'Delete' })}
                        </LemonButton>
                    </>
                }
            >
                <p>
                    {t('settings.user.passkeys.deleteDescription', {
                        defaultValue:
                            "Are you sure you want to delete this passkey? You won't be able to use it to sign in anymore.",
                    })}
                </p>
            </LemonModal>

            <LemonModal
                isOpen={renameModal !== null}
                onClose={closeRenameModal}
                title={t('settings.user.passkeys.renameTitle', { defaultValue: 'Rename passkey' })}
                footer={
                    <>
                        <LemonButton type="secondary" onClick={closeRenameModal}>
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                        <LemonButton
                            type="primary"
                            onClick={handleRename}
                            disabledReason={
                                !renameLabel.trim()
                                    ? t('settings.user.passkeys.nameRequired', { defaultValue: 'Name is required' })
                                    : undefined
                            }
                        >
                            {t('settings.save', { defaultValue: 'Save' })}
                        </LemonButton>
                    </>
                }
            >
                <LemonInput
                    value={renameLabel}
                    onChange={setRenameLabel}
                    placeholder={t('settings.user.passkeys.namePlaceholder', { defaultValue: 'Passkey name' })}
                    autoFocus
                    onPressEnter={handleRename}
                    maxLength={200}
                />
            </LemonModal>
        </>
    )
}
