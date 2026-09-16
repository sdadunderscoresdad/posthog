/*
Scene to request a password reset email.
*/
import { useActions, useMountedLogic, useValues } from 'kea'
import { Form } from 'kea-forms'
import { router } from 'kea-router'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconCheckCircle } from '@posthog/icons'
import { LemonButton, LemonDivider, LemonInput, Link } from '@posthog/lemon-ui'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { IconErrorOutline } from 'lib/lemon-ui/icons'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { Spinner } from 'lib/lemon-ui/Spinner/Spinner'
import { loginTelemetryLogic } from 'scenes/authentication/shared/loginTelemetryLogic'
import { SupportModalButton } from 'scenes/authentication/shared/SupportModalButton'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { SceneExport } from 'scenes/sceneTypes'

import { passwordResetLogic } from './passwordResetLogic'

export const scene: SceneExport = {
    component: PasswordReset,
    logic: passwordResetLogic,
}

export function PasswordReset(): JSX.Element {
    const { t } = useTranslation()
    // Mounted here so the login funnel is only reported from the auth scenes
    useMountedLogic(loginTelemetryLogic)
    const { preflight, preflightLoading } = useValues(preflightLogic)
    const { requestPasswordResetSucceeded, requestPasswordResetManualErrors } = useValues(passwordResetLogic)
    const { resetRequestPasswordReset } = useActions(passwordResetLogic)

    useEffect(() => {
        return () => {
            resetRequestPasswordReset()
        }
    }, [resetRequestPasswordReset])

    return (
        <BridgePage view="password-reset" footer={<SupportModalButton />}>
            {requestPasswordResetManualErrors?.code === 'throttled' ? (
                <div className="text-center ">
                    <IconErrorOutline className="text-5xl text-danger" />
                </div>
            ) : (
                requestPasswordResetSucceeded && (
                    <div className="text-center">
                        <IconCheckCircle className="text-5xl text-success" />
                    </div>
                )
            )}
            <h2>{t('passwordReset.title', { defaultValue: 'Reset password' })}</h2>
            {preflightLoading ? (
                <Spinner />
            ) : !preflight?.email_service_available ? (
                <EmailUnavailable />
            ) : requestPasswordResetManualErrors?.code === 'throttled' ? (
                <ResetThrottled />
            ) : requestPasswordResetSucceeded ? (
                <ResetSuccess />
            ) : (
                <ResetForm />
            )}
        </BridgePage>
    )
}

function EmailUnavailable(): JSX.Element {
    const { t } = useTranslation()
    return (
        <div>
            <div>
                <Trans
                    i18nKey="passwordReset.unavailable"
                    components={{ Bold: <b /> }}
                    defaults="Self-serve password reset is unavailable. Please <Bold>contact your instance administrator</Bold> to reset your password."
                />
            </div>
            <LemonDivider className="my-6" />
            <div className="mt-4">
                {t('passwordReset.ifAdministrator', { defaultValue: "If you're an administrator:" })}
                <p>
                    <ul>
                        <li>
                            <Trans
                                i18nKey="passwordReset.emailNotConfigured"
                                components={{
                                    DocsLink: (
                                        <Link to="https://posthog.com/docs/self-host/configure/email?utm_medium=in-product&utm_campaign=password-reset" />
                                    ),
                                }}
                                defaults="Password reset is unavailable because email service is not configured. <DocsLink>Read the docs</DocsLink> on how to set this up."
                            />
                        </li>
                        <li>
                            {t('passwordReset.manualReset', {
                                defaultValue:
                                    'To reset the password manually, run the following command in your instance.',
                            })}
                        </li>
                    </ul>
                </p>
                <CodeSnippet language={Language.Bash} wrap>
                    python manage.py changepassword [account email]
                </CodeSnippet>
            </div>
        </div>
    )
}

function ResetForm(): JSX.Element {
    const { t } = useTranslation()
    const { isRequestPasswordResetSubmitting } = useValues(passwordResetLogic)

    return (
        <Form
            logic={passwordResetLogic}
            formKey="requestPasswordReset"
            className="deprecated-space-y-4"
            enableFormOnSubmit
        >
            <div className="text-center">
                {t('passwordReset.enterEmail', {
                    defaultValue:
                        'Enter your email address. If an account exists, you’ll receive an email with a password reset link soon.',
                })}
            </div>
            <LemonField name="email" label={t('signup.emailLabel', { defaultValue: 'Email' })}>
                <LemonInput
                    className="ph-ignore-input"
                    autoFocus
                    data-attr="reset-email"
                    placeholder="email@yourcompany.com"
                    type="email"
                    disabled={isRequestPasswordResetSubmitting}
                />
            </LemonField>
            <LemonButton
                fullWidth
                type="primary"
                status="alt"
                center
                htmlType="submit"
                data-attr="password-reset"
                loading={isRequestPasswordResetSubmitting}
                size="large"
            >
                {t('signup.continue', { defaultValue: 'Continue' })}
            </LemonButton>
        </Form>
    )
}

function ResetSuccess(): JSX.Element {
    const { t } = useTranslation()
    const { requestPasswordReset } = useValues(passwordResetLogic)
    const { push } = useActions(router)

    return (
        <div className="text-center">
            <Trans
                i18nKey="passwordReset.success"
                values={{
                    email: requestPasswordReset?.email || t('passwordReset.youTyped', { defaultValue: 'you typed' }),
                }}
                components={{ Bold: <b /> }}
                defaults="Request received successfully! If the email <Bold>{{ email }}</Bold> exists, you’ll receive an email with a reset link soon."
            />
            <div className="mt-4">
                <LemonButton
                    type="primary"
                    status="alt"
                    data-attr="back-to-login"
                    center
                    fullWidth
                    onClick={() => push('/login')}
                    size="large"
                >
                    {t('passwordReset.backToLogin', { defaultValue: 'Back to login' })}
                </LemonButton>
            </div>
        </div>
    )
}

function ResetThrottled(): JSX.Element {
    const { t } = useTranslation()
    const { requestPasswordReset } = useValues(passwordResetLogic)
    const { push } = useActions(router)

    return (
        <div className="text-center">
            <Trans
                i18nKey="passwordReset.throttled"
                values={{
                    email: requestPasswordReset?.email || t('passwordReset.youTyped', { defaultValue: 'you typed' }),
                }}
                components={{ Bold: <b /> }}
                defaults="There have been too many reset requests for the email <Bold>{{ email }}</Bold>. Please try again later or contact support if you think this has been a mistake."
            />
            <div className="mt-4">
                <LemonButton
                    type="primary"
                    status="alt"
                    data-attr="back-to-login"
                    center
                    fullWidth
                    onClick={() => push('/login')}
                    size="large"
                >
                    {t('passwordReset.backToLogin', { defaultValue: 'Back to login' })}
                </LemonButton>
            </div>
        </div>
    )
}
