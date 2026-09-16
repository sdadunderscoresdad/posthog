import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { Trans, useTranslation } from 'react-i18next'

import { LemonButton, LemonInput } from '@posthog/lemon-ui'

import PasswordStrength from 'lib/components/PasswordStrength'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { userLogic } from 'scenes/userLogic'

import { changePasswordLogic } from './changePasswordLogic'

export function ChangePasswordTitle(): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const hasPassword = user?.has_password ?? false
    return (
        <>
            {hasPassword
                ? t('settings.user.password.changeTitle', { defaultValue: 'Change password' })
                : t('settings.user.password.setTitle', { defaultValue: 'Set password' })}
        </>
    )
}

export function ChangePassword(): JSX.Element {
    const { t } = useTranslation()
    const {
        validatedPassword,
        isChangePasswordSubmitting,
        user,
        passwordResetEmailSent,
        passwordResetEmailSentLoading,
    } = useValues(changePasswordLogic)
    const { requestPasswordResetEmail } = useActions(changePasswordLogic)
    const hasPassword = user?.has_password ?? false

    return (
        <Form
            logic={changePasswordLogic}
            formKey="changePassword"
            enableFormOnSubmit
            className="deprecated-space-y-4 max-w-160"
        >
            {hasPassword && (
                <>
                    <LemonField
                        name="current_password"
                        label={
                            <div className="flex flex-1 items-center justify-between gap-2">
                                <span>{t('settings.user.password.current', { defaultValue: 'Current password' })}</span>
                                <LemonButton
                                    size="xsmall"
                                    type="tertiary"
                                    data-attr="settings-forgot-password"
                                    onClick={requestPasswordResetEmail}
                                    loading={passwordResetEmailSentLoading}
                                >
                                    {passwordResetEmailSent
                                        ? t('settings.user.password.resendLink', { defaultValue: 'Resend link' })
                                        : t('settings.user.password.forgot', {
                                              defaultValue: 'Forgot password?',
                                          })}
                                </LemonButton>
                            </div>
                        }
                    >
                        <LemonInput
                            autoComplete="current-password"
                            type="password"
                            className="ph-ignore-input"
                            placeholder="••••••••••"
                        />
                    </LemonField>

                    {passwordResetEmailSent && (
                        <LemonBanner type="info">
                            <Trans
                                i18nKey="settings.user.password.resetEmailSent"
                                values={{ email: user?.email }}
                                components={{ Email: <span translate="no" /> }}
                                defaults="We emailed a reset link to <Email>{{ email }}</Email>. Open it to set a new password without your current one. Resetting signs you out of PostHog on every device."
                            />
                        </LemonBanner>
                    )}
                </>
            )}

            <LemonField
                name="password"
                label={
                    <div className="flex flex-1 items-center justify-between">
                        <span>{t('settings.user.password.new', { defaultValue: 'Password' })}</span>
                        <PasswordStrength validatedPassword={validatedPassword} />
                    </div>
                }
            >
                <LemonInput
                    autoComplete="new-password"
                    type="password"
                    className="ph-ignore-input"
                    placeholder="••••••••••"
                />
            </LemonField>

            {!hasPassword && (
                <LemonField
                    name="confirm_password"
                    label={t('settings.user.password.confirm', { defaultValue: 'Confirm password' })}
                >
                    <LemonInput
                        autoComplete="new-password"
                        type="password"
                        className="ph-ignore-input"
                        placeholder="••••••••••"
                    />
                </LemonField>
            )}

            <LemonButton type="primary" htmlType="submit" loading={isChangePasswordSubmitting}>
                {hasPassword
                    ? t('settings.user.password.changeTitle', { defaultValue: 'Change password' })
                    : t('settings.user.password.setTitle', { defaultValue: 'Set password' })}
            </LemonButton>
        </Form>
    )
}
