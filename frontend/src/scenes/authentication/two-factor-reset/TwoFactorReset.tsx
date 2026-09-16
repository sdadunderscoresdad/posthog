import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonBanner, LemonButton, LemonDivider } from '@posthog/lemon-ui'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { Spinner } from 'lib/lemon-ui/Spinner/Spinner'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { twoFactorResetLogic } from './twoFactorResetLogic'

export const scene: SceneExport = {
    component: TwoFactorReset,
    logic: twoFactorResetLogic,
}

export function TwoFactorReset(): JSX.Element {
    const { t } = useTranslation()
    const {
        validatedResetToken,
        validatedResetTokenLoading,
        resetComplete,
        resetError,
        resetLoading,
        requiresLogin,
        loginRedirectUrl,
    } = useValues(twoFactorResetLogic)
    const { confirmReset } = useActions(twoFactorResetLogic)

    // Show loading while validating
    if (validatedResetTokenLoading) {
        return (
            <BridgePage view="login">
                <div className="text-center">
                    <h2>{t('twoFactorReset.validatingLink', { defaultValue: 'Validating reset link...' })}</h2>
                    <Spinner className="mt-4" />
                </div>
            </BridgePage>
        )
    }

    // If user needs to login first, show redirect message
    if (requiresLogin) {
        return (
            <BridgePage view="login">
                <div className="space-y-4">
                    <h2>{t('twoFactorReset.loginRequired', { defaultValue: 'Login required' })}</h2>
                    <p>
                        {t('twoFactorReset.loginRequiredDetail', {
                            defaultValue:
                                'Please log in with your email and password first to reset your two-factor authentication.',
                        })}
                    </p>
                    <LemonButton fullWidth type="primary" center data-attr="login-to-reset" to={loginRedirectUrl}>
                        {t('twoFactorReset.logInToContinue', { defaultValue: 'Log in to continue' })}
                    </LemonButton>
                </div>
            </BridgePage>
        )
    }

    // Show success state
    if (resetComplete) {
        return (
            <BridgePage view="login">
                <div className="space-y-4">
                    <h2>{t('twoFactorReset.resetComplete', { defaultValue: '2FA has been reset' })}</h2>
                    <p>
                        {t('twoFactorReset.resetCompleteDetail', {
                            defaultValue:
                                'Your two-factor authentication settings have been successfully reset. You can now log in without 2FA.',
                        })}
                    </p>
                    <p>
                        {t('twoFactorReset.setUpAgain', {
                            defaultValue:
                                'We recommend setting up 2FA again after logging in to keep your account secure.',
                        })}
                    </p>
                    <LemonButton fullWidth type="primary" center data-attr="back-to-login" to={urls.login()}>
                        {t('twoFactorReset.logIn', { defaultValue: 'Log in' })}
                    </LemonButton>
                </div>
            </BridgePage>
        )
    }

    // Invalid or expired link
    const invalidLink = !validatedResetToken?.success

    return (
        <BridgePage view="login">
            <div className="space-y-4">
                {invalidLink ? (
                    <>
                        <h2>{t('twoFactorReset.unableToReset', { defaultValue: 'Unable to reset 2FA' })}</h2>
                        <LemonBanner type="error">
                            {validatedResetToken?.error ||
                                t('twoFactorReset.invalidLink', {
                                    defaultValue:
                                        'This reset link is invalid or has expired. Please contact your administrator to request a new link.',
                                })}
                        </LemonBanner>
                        <LemonButton fullWidth type="primary" center data-attr="back-to-login" to={urls.login()}>
                            {t('twoFactorReset.backToLogin', { defaultValue: 'Back to login' })}
                        </LemonButton>
                    </>
                ) : (
                    <>
                        <h2>{t('twoFactorReset.heading', { defaultValue: 'Reset two-factor authentication' })}</h2>
                        <p>
                            {t('twoFactorReset.aboutToReset', {
                                defaultValue:
                                    'You are about to reset your two-factor authentication settings. This will:',
                            })}
                        </p>
                        <ul className="list-disc list-inside text-sm">
                            <li>
                                {t('twoFactorReset.removeDevice', {
                                    defaultValue: 'Remove your TOTP authenticator device',
                                })}
                            </li>
                            <li>
                                {t('twoFactorReset.deleteBackupCodes', { defaultValue: 'Delete your backup codes' })}
                            </li>
                            <li>
                                {t('twoFactorReset.disablePasskey2fa', {
                                    defaultValue: 'Disable passkey-based 2FA (your passkeys will still work for login)',
                                })}
                            </li>
                        </ul>

                        <LemonDivider className="my-4" />

                        <p className="text-sm text-muted">
                            {t('twoFactorReset.logInAgain', {
                                defaultValue: 'After resetting, you will need to log in again.',
                            })}
                        </p>

                        {resetError && (
                            <LemonBanner type="error" className="mt-4">
                                {resetError}
                            </LemonBanner>
                        )}

                        <LemonButton
                            fullWidth
                            type="primary"
                            status="danger"
                            center
                            data-attr="confirm-2fa-reset"
                            loading={resetLoading}
                            onClick={() => confirmReset(validatedResetToken.token!)}
                        >
                            {t('twoFactorReset.confirm', { defaultValue: 'Confirm and reset 2FA' })}
                        </LemonButton>

                        <LemonButton fullWidth type="secondary" center data-attr="cancel-2fa-reset" to={urls.login()}>
                            {t('settings.cancel', { defaultValue: 'Cancel' })}
                        </LemonButton>
                    </>
                )}
            </div>
        </BridgePage>
    )
}
