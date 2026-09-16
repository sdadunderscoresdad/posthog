import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconCheckCircle, IconCopy, IconInfo, IconWarning } from '@posthog/icons'
import { LemonButton, LemonModal, LemonSwitch, Tooltip, lemonToast } from '@posthog/lemon-ui'

import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { twoFactorLogic } from 'scenes/authentication/two-factor-setup/twoFactorLogic'
import { membersLogic } from 'scenes/organization/membersLogic'
import { userLogic } from 'scenes/userLogic'

import { UserType } from '~/types'

export function TwoFactorSettings(): JSX.Element {
    const { t } = useTranslation()
    const { status, isDisable2FAModalOpen, isBackupCodesModalOpen } = useValues(twoFactorLogic)

    const { updateUser } = useActions(userLogic)
    const { loadMemberUpdates } = useActions(membersLogic)
    const {
        generateBackupCodes,
        disable2FA,
        loadStatus,
        openTwoFactorSetupModal,
        toggleDisable2FAModal,
        toggleBackupCodesModal,
    } = useActions(twoFactorLogic)

    const handleSuccess = (): void => {
        updateUser({})
        loadMemberUpdates()
    }

    const hasTotp = status?.has_totp ?? false
    const hasPasskeys = status?.has_passkeys ?? false
    const passkeysEnabled = status?.passkeys_enabled_for_2fa ?? false

    return (
        <div className="flex flex-col items-start space-y-4">
            {isDisable2FAModalOpen && (
                <LemonModal
                    title={t('settings.user.twoFactor.disableTitle', { defaultValue: 'Disable authenticator app' })}
                    onClose={() => toggleDisable2FAModal(false)}
                    footer={
                        <>
                            <LemonButton onClick={() => toggleDisable2FAModal(false)}>
                                {t('settings.cancel', { defaultValue: 'Cancel' })}
                            </LemonButton>
                            <LemonButton
                                type="primary"
                                status="danger"
                                onClick={() => {
                                    disable2FA()
                                    toggleDisable2FAModal(false)
                                    handleSuccess()
                                }}
                            >
                                {t('settings.user.twoFactor.disable', { defaultValue: 'Disable 2FA' })}
                            </LemonButton>
                        </>
                    }
                >
                    <p>
                        {t('settings.user.twoFactor.disableDescription', {
                            defaultValue:
                                'Are you sure you want to disable 2FA using an authenticator app? This will make your account less secure.',
                        })}
                    </p>
                </LemonModal>
            )}

            {isBackupCodesModalOpen && (
                <LemonModal
                    title={t('settings.user.twoFactor.backupCodesTitle', { defaultValue: 'Backup Codes' })}
                    onClose={() => toggleBackupCodesModal(false)}
                >
                    <div className="deprecated-space-y-4 max-w-md">
                        {status?.backup_codes?.length ? (
                            <>
                                <p>
                                    {t('settings.user.twoFactor.backupCodesDescription', {
                                        defaultValue:
                                            'Save these backup codes in a secure location. Each code can only be used once to sign in if you lose access to your authentication device.',
                                    })}
                                </p>
                                <div className="bg-primary p-4 rounded font-mono deprecated-space-y-1 relative">
                                    <LemonButton
                                        icon={<IconCopy />}
                                        size="small"
                                        className="absolute top-4 right-4"
                                        onClick={() => {
                                            void copyToClipboard(status.backup_codes.join('\n') || '', 'backup codes')
                                        }}
                                    >
                                        {t('settings.user.twoFactor.copy', { defaultValue: 'Copy' })}
                                    </LemonButton>
                                    {status.backup_codes.map((code) => (
                                        <div key={code}>{code}</div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="bg-primary p-4 rounded font-mono deprecated-space-y-1 relative">
                                <p className="text-secondary mb-0">
                                    {t('settings.user.twoFactor.noBackupCodes', {
                                        defaultValue: 'No backup codes generated',
                                    })}
                                </p>
                            </div>
                        )}
                        <LemonButton
                            type="primary"
                            onClick={() => {
                                generateBackupCodes()
                            }}
                        >
                            {status?.backup_codes?.length
                                ? t('settings.user.twoFactor.generateNewCodes', { defaultValue: 'Generate new codes' })
                                : t('settings.user.twoFactor.generateBackupCodes', {
                                      defaultValue: 'Generate backup codes',
                                  })}
                        </LemonButton>
                    </div>
                </LemonModal>
            )}

            <div className="space-y-1">
                {/* 2FA Status Indicator */}
                <div className="mb-4 flex items-center deprecated-space-x-2">
                    {status?.is_enabled ? (
                        <>
                            <IconCheckCircle color="green" className="text-xl" />
                            <span className="font-medium">
                                {t('settings.user.twoFactor.enabled', { defaultValue: '2FA enabled' })}
                            </span>
                        </>
                    ) : (
                        <>
                            <IconWarning color="orange" className="text-xl" />
                            <span className="font-medium">
                                {t('settings.user.twoFactor.notEnabled', { defaultValue: '2FA not enabled' })}
                            </span>
                        </>
                    )}
                </div>

                <div className="border rounded bg-bg-light">
                    {/* Authenticator app row */}
                    <div className="p-4 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">
                                        {t('settings.user.twoFactor.authenticatorApp', {
                                            defaultValue: 'Authenticator app',
                                        })}
                                    </span>
                                    <Tooltip
                                        title={
                                            <div className="space-y-2">
                                                <p>
                                                    {t('settings.user.twoFactor.authenticatorHint', {
                                                        defaultValue:
                                                            'Use an authenticator app (like Google Authenticator, Authy, or 1Password) to generate time-based codes for 2FA.',
                                                    })}
                                                </p>
                                                <p>
                                                    {t('settings.user.twoFactor.authenticatorHintEnabled', {
                                                        defaultValue:
                                                            "When enabled, you'll be asked for a code from your authenticator app when signing in.",
                                                    })}
                                                </p>
                                            </div>
                                        }
                                    >
                                        <IconInfo className="text-muted text-sm" />
                                    </Tooltip>
                                </div>
                                <p className="text-sm text-muted">
                                    {hasTotp
                                        ? t('settings.user.twoFactor.totpSetUp', {
                                              defaultValue: 'Authenticator app is set up and enabled for 2FA.',
                                          })
                                        : t('settings.user.twoFactor.totpNotSetUp', {
                                              defaultValue:
                                                  'Set up an authenticator app to use time-based codes for 2FA.',
                                          })}
                                </p>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                                {hasTotp ? (
                                    <>
                                        <LemonButton
                                            type="secondary"
                                            size="small"
                                            onClick={() => toggleBackupCodesModal(true)}
                                        >
                                            {t('settings.user.twoFactor.viewBackupCodes', {
                                                defaultValue: 'View backup codes',
                                            })}
                                        </LemonButton>
                                        <LemonButton
                                            type="secondary"
                                            size="small"
                                            status="danger"
                                            onClick={() => toggleDisable2FAModal(true)}
                                        >
                                            {t('settings.user.twoFactor.disableButton', { defaultValue: 'Disable' })}
                                        </LemonButton>
                                    </>
                                ) : (
                                    <LemonButton type="primary" onClick={() => openTwoFactorSetupModal()}>
                                        {t('settings.user.twoFactor.setup', { defaultValue: 'Setup' })}
                                    </LemonButton>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Passkeys row */}
                    <div className={`p-4 ${!hasPasskeys ? 'opacity-60' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-medium ${!hasPasskeys ? 'text-muted' : ''}`}>
                                        {t('settings.user.passkeys.title', { defaultValue: 'Passkeys' })}
                                    </span>
                                    <Tooltip
                                        title={
                                            <div className="space-y-2">
                                                <p>
                                                    {t('settings.user.twoFactor.passkeysHint', {
                                                        defaultValue:
                                                            'Passkeys provide a secure, passwordless way to sign in and can be used for 2FA authentication.',
                                                    })}
                                                </p>
                                                <p>
                                                    {hasPasskeys
                                                        ? t('settings.user.twoFactor.passkeysSetUp', {
                                                              defaultValue:
                                                                  'You have passkeys set up. They are automatically used for 2FA when available.',
                                                          })
                                                        : t('settings.user.twoFactor.passkeysNotSetUp', {
                                                              defaultValue:
                                                                  'Add a passkey in the Passkeys settings to enable this method for 2FA.',
                                                          })}
                                                </p>
                                            </div>
                                        }
                                    >
                                        <IconInfo className="text-muted text-sm" />
                                    </Tooltip>
                                </div>
                                <p className={`text-sm ${!hasPasskeys ? 'text-muted' : 'text-muted'}`}>
                                    {hasPasskeys
                                        ? passkeysEnabled
                                            ? t('settings.user.twoFactor.passkeysEnabled', {
                                                  defaultValue:
                                                      'Passkeys are enabled for 2FA. Manage your passkeys in the Passkeys settings.',
                                              })
                                            : t('settings.user.twoFactor.passkeysDisabled', {
                                                  defaultValue:
                                                      'Passkeys are disabled for 2FA. Enable the switch above to use passkeys for 2FA.',
                                              })
                                        : t('settings.user.twoFactor.passkeysNone', {
                                              defaultValue:
                                                  'No passkeys set up. Add a passkey to use this method for 2FA.',
                                          })}
                                </p>
                            </div>
                            <div className="ml-4">
                                <LemonSwitch
                                    checked={passkeysEnabled}
                                    disabledReason={
                                        !hasPasskeys
                                            ? t('settings.user.twoFactor.addPasskeyToEnable', {
                                                  defaultValue:
                                                      'Add a passkey in Passkeys settings to enable this method',
                                              })
                                            : undefined
                                    }
                                    onChange={async () => {
                                        if (hasPasskeys) {
                                            try {
                                                await updateUser(
                                                    {
                                                        passkeys_enabled_for_2fa: !passkeysEnabled,
                                                    } as Partial<UserType>,
                                                    () => {
                                                        // Reload 2FA status after successful update
                                                        loadStatus()
                                                    }
                                                )
                                            } catch (e: any) {
                                                const { detail } = e as Record<string, any>
                                                lemonToast.error(
                                                    detail ||
                                                        t('settings.user.twoFactor.passkeyUpdateFailed', {
                                                            defaultValue: 'Failed to update passkey 2FA setting',
                                                        })
                                                )
                                            }
                                        }
                                    }}
                                    tooltip={
                                        hasPasskeys
                                            ? passkeysEnabled
                                                ? t('settings.user.twoFactor.disablePasskeys', {
                                                      defaultValue: 'Disable passkeys for 2FA',
                                                  })
                                                : t('settings.user.twoFactor.enablePasskeys', {
                                                      defaultValue: 'Enable passkeys for 2FA',
                                                  })
                                            : t('settings.user.twoFactor.addPasskeyToEnableShort', {
                                                  defaultValue: 'Add a passkey to enable this method',
                                              })
                                    }
                                    size="medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
