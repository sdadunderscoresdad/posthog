import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LemonBanner, LemonButton, LemonInput, Spinner } from '@posthog/lemon-ui'

import { passkeySettingsLogic } from './passkeySettingsLogic'

function RegistrationBanners(): JSX.Element | null {
    const { t } = useTranslation()
    const { registrationStep, error } = useValues(passkeySettingsLogic)
    const { clearError } = useActions(passkeySettingsLogic)

    if (!error && registrationStep !== 'complete' && registrationStep !== 'verifying') {
        return null
    }

    return (
        <>
            {error && (
                <LemonBanner type="error" onClose={clearError}>
                    {error}
                </LemonBanner>
            )}

            {registrationStep === 'complete' && (
                <LemonBanner type="success">
                    {t('settings.user.passkeys.added', { defaultValue: 'Passkey added and verified successfully!' })}
                </LemonBanner>
            )}

            {registrationStep === 'verifying' && (
                <LemonBanner type="info" icon={<Spinner />}>
                    {t('settings.user.passkeys.verifyToComplete', {
                        defaultValue: 'Please verify your passkey to complete registration...',
                    })}
                </LemonBanner>
            )}
        </>
    )
}

export function PasskeyAddFormEmpty(): JSX.Element {
    const { t } = useTranslation()
    const { registrationStep } = useValues(passkeySettingsLogic)
    const { beginRegistration } = useActions(passkeySettingsLogic)

    const handleAddPasskey = (): void => {
        beginRegistration(t('settings.user.passkeys.defaultName', { defaultValue: 'My Passkey' }))
    }

    const isRegistering = registrationStep === 'registering' || registrationStep === 'verifying'

    return (
        <div className="flex flex-col items-start space-y-4">
            <div className="w-full">
                <RegistrationBanners />
            </div>

            <div>
                <p className="text-muted mb-4 max-w-lg">
                    {t('settings.user.passkeys.description', {
                        defaultValue:
                            "Passkeys provide a faster, more seamless sign-in experience. Use your device's biometric authentication or a security key to sign in without passwords.",
                    })}
                </p>
                <LemonButton
                    type="primary"
                    onClick={handleAddPasskey}
                    loading={isRegistering}
                    disabledReason={
                        isRegistering
                            ? t('settings.user.passkeys.registrationInProgress', {
                                  defaultValue: 'Registration in progress...',
                              })
                            : undefined
                    }
                >
                    {registrationStep === 'verifying'
                        ? t('settings.user.passkeys.verifying', { defaultValue: 'Verifying...' })
                        : t('settings.user.passkeys.add', { defaultValue: 'Add passkey' })}
                </LemonButton>
            </div>
        </div>
    )
}

export function PasskeyAddForm(): JSX.Element {
    const { t } = useTranslation()
    const { registrationStep } = useValues(passkeySettingsLogic)
    const { beginRegistration } = useActions(passkeySettingsLogic)

    const [newPasskeyLabel, setNewPasskeyLabel] = useState('')

    const handleAddPasskey = (): void => {
        const label = newPasskeyLabel.trim() || t('settings.user.passkeys.defaultName', { defaultValue: 'My Passkey' })
        beginRegistration(label)
        setNewPasskeyLabel('')
    }

    const isRegistering = registrationStep === 'registering' || registrationStep === 'verifying'

    return (
        <div className="space-y-4">
            <RegistrationBanners />

            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="font-medium text-sm mb-1 block">
                        {t('settings.user.passkeys.addNew', { defaultValue: 'Add a new passkey' })}
                    </label>
                    <LemonInput
                        placeholder={t('settings.user.passkeys.nameOptionalPlaceholder', {
                            defaultValue: 'Passkey name (optional)',
                        })}
                        value={newPasskeyLabel}
                        onChange={setNewPasskeyLabel}
                        disabled={isRegistering}
                        onPressEnter={handleAddPasskey}
                        maxLength={200}
                    />
                </div>
                <LemonButton
                    type="primary"
                    onClick={handleAddPasskey}
                    loading={isRegistering}
                    disabledReason={
                        isRegistering
                            ? t('settings.user.passkeys.registrationInProgress', {
                                  defaultValue: 'Registration in progress...',
                              })
                            : undefined
                    }
                >
                    {registrationStep === 'verifying'
                        ? t('settings.user.passkeys.verifying', { defaultValue: 'Verifying...' })
                        : t('settings.user.passkeys.add', { defaultValue: 'Add passkey' })}
                </LemonButton>
            </div>
        </div>
    )
}
