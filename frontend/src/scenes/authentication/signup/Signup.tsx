import { useActions, useMountedLogic, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { getCookie } from 'lib/api'
import PasswordStrength from 'lib/components/PasswordStrength'
import SignupReferralSource from 'lib/components/SignupReferralSource'
import SignupRoleSelect from 'lib/components/SignupRoleSelect'
import passkeyLogo from 'lib/components/SocialLoginButton/passkey.svg'
import { SocialLoginButtons } from 'lib/components/SocialLoginButton/SocialLoginButton'
import { supportLogic } from 'lib/components/Support/supportLogic'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { Link } from 'lib/lemon-ui/Link'
import { AuthCardTitle } from 'scenes/authentication/shared/authScene/AuthCardTitle'
import { AuthScene, AuthSceneCard } from 'scenes/authentication/shared/authScene/AuthScene'
import { RegionField } from 'scenes/authentication/shared/authScene/RegionField'
import { pendingOAuthConnectionLogic, reviewAccessCopy } from 'scenes/authentication/shared/pendingOAuthConnectionLogic'
import { TurnstileChallenge } from 'scenes/authentication/signup/signupForm/TurnstileChallenge'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { SceneExport } from 'scenes/sceneTypes'
import { userLogic } from 'scenes/userLogic'

import { LoginMethod } from '~/types'

import { signupLogic } from './signupForm/signupLogic'

export const scene: SceneExport = {
    component: Signup,
}

// Bare text nodes below are wrapped in <span>s: Chrome's in-page translation replaces text
// nodes with <font> elements, which crashes React's sibling insert/remove operations
// (removeChild/insertBefore NotFoundError, see react#11538). Text inside its own element is safe.
const NOTES: Record<number, string[]> = {
    0: ['// create an account', '// 1M events free, every month'],
    1: ['// step 2 of 2', '// make it a good one'],
    2: ['// almost there', '// last step'],
}

/** Step 1 — email (+ region, social, pending-invite branch). */
function SignupEmailPanel(): JSX.Element {
    const { t } = useTranslation()
    const { isSignupPanelEmailSubmitting, signupPanelEmailManualErrors, pendingInvite, loginUrl, emailCaseNotice } =
        useValues(signupLogic)
    const { preflight } = useValues(preflightLogic)
    const { pendingConnection } = useValues(pendingOAuthConnectionLogic)
    const [showJoinOrg, setShowJoinOrg] = useState(false)
    const lastLoginMethod = getCookie('ph_last_login_method') as LoginMethod | null
    const accountExists = !!signupPanelEmailManualErrors?.email

    if (pendingInvite) {
        return <PendingInvitePanel />
    }

    const footer = preflight?.demo ? undefined : (
        <p className="mt-5 mb-0 text-sm text-secondary text-center">
            <span>{t('signup.haveAccount', { defaultValue: 'Already have an account?' })}</span>{' '}
            <Link
                to={loginUrl}
                data-attr="signup-login-link"
                className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
            >
                {t('signup.logIn', { defaultValue: 'Log in →' })}
            </Link>
        </p>
    )

    return (
        <AuthSceneCard footer={footer}>
            <AuthCardTitle
                title={
                    pendingConnection
                        ? t('signup.createToConnect', {
                              defaultValue: 'Create your account to connect {{ client }}',
                              client: pendingConnection.clientName,
                          })
                        : t('signup.getStarted', { defaultValue: 'Get started' })
                }
                sub={
                    pendingConnection
                        ? reviewAccessCopy(
                              pendingConnection,
                              t('authentication.reviewAccess.leadOnceAccountReady', {
                                  defaultValue: 'Once your account is ready',
                              })
                          )
                        : t('signup.tagline', { defaultValue: 'Make your product self-driving.' })
                }
            />
            <Form logic={signupLogic} formKey="signupPanelEmail" enableFormOnSubmit className="flex flex-col gap-4">
                <RegionField />
                <LemonField
                    name="email"
                    label={t('signup.emailLabel', { defaultValue: 'Email' })}
                    help={emailCaseNotice && <span className="text-warning">{emailCaseNotice}</span>}
                >
                    {({ value, onChange, error, id }) => (
                        <LemonInput
                            id={id}
                            className="ph-ignore-input"
                            data-attr="signup-email"
                            type="email"
                            autoFocus
                            autoComplete="email"
                            placeholder="you@yourcompany.com"
                            value={value ?? ''}
                            onChange={onChange}
                            status={error ? 'danger' : 'default'}
                            fullWidth
                        />
                    )}
                </LemonField>
                {accountExists && (
                    <p className="text-xs text-danger -mt-2">
                        <span>{signupPanelEmailManualErrors.email}</span>{' '}
                        <Link
                            to={loginUrl}
                            className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
                        >
                            {t('signup.logInInstead', { defaultValue: 'Log in instead →' })}
                        </Link>
                    </p>
                )}
                <LemonButton
                    type="primary"
                    size="large"
                    center
                    fullWidth
                    htmlType="submit"
                    data-attr="signup-start"
                    loading={isSignupPanelEmailSubmitting}
                >
                    {t('signup.continue', { defaultValue: 'Continue' })}
                </LemonButton>
            </Form>
            {!preflight?.demo && (
                <SocialLoginButtons
                    topDivider
                    caption={t('signup.orSignUpWith', { defaultValue: 'or sign up with' })}
                    lastUsedProvider={lastLoginMethod ?? undefined}
                    captionLocation="top"
                />
            )}
            {!preflight?.demo && (
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        data-attr="signup-join-existing-org"
                        className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-secondary text-xs"
                        onClick={() => setShowJoinOrg((v) => !v)}
                    >
                        {t('signup.joinExistingOrg', {
                            defaultValue: 'Trying to join an existing organization?',
                        })}
                    </button>
                    {showJoinOrg && (
                        <p className="AuthScene__note mt-3 py-3 px-3.5 text-xs leading-relaxed text-secondary text-left bg-[#fbfbf9] border border-dashed border-[#c5c6bd] rounded">
                            {t('signup.inviteLinkHint', {
                                defaultValue:
                                    "You'll need your invite link. When a teammate invites you, we email you a personal link. Didn't get one? Check spam, or ask them to resend it from their members settings.",
                            })}
                        </p>
                    )}
                </div>
            )}
        </AuthSceneCard>
    )
}

function PendingInvitePanel(): JSX.Element {
    const { t } = useTranslation()
    const { signupPanelEmail, pendingInvite, pendingInviteResent, isPendingInviteResending } = useValues(signupLogic)
    const { resendPendingInvite, dismissPendingInvite } = useActions(signupLogic)
    const org = pendingInvite?.organization_name ?? t('signup.yourTeam', { defaultValue: 'your team' })

    return (
        <AuthSceneCard>
            <AuthCardTitle
                title={t('signup.alreadyInvited', { defaultValue: "You've already been invited" })}
                sub={
                    <span>
                        <b className="text-primary">{org}</b>{' '}
                        <span>{t('signup.invited', { defaultValue: 'invited' })}</span>{' '}
                        <span className="AuthScene__mono">{signupPanelEmail.email}</span>{' '}
                        <span>
                            {t('signup.inviteInInbox', {
                                defaultValue: 'to join them on PostHog. The invite link is in your inbox.',
                            })}
                        </span>
                    </span>
                }
                className="mb-5"
            />
            {pendingInviteResent ? (
                <div className="flex gap-2 items-start py-2.5 px-3 text-sm text-primary text-left bg-success-highlight border border-success rounded">
                    <span className="font-bold text-success">✓</span>
                    <span>
                        {t('signup.inviteResent', {
                            defaultValue:
                                'Sent. Look for an email from {{ org }}. The link inside takes you straight in.',
                            org,
                        })}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    <LemonButton
                        type="primary"
                        size="large"
                        center
                        fullWidth
                        data-attr="pending-invite-resend"
                        loading={isPendingInviteResending}
                        onClick={() => resendPendingInvite(signupPanelEmail.email)}
                    >
                        {t('signup.resendInvite', { defaultValue: 'Resend invite email' })}
                    </LemonButton>
                    <LemonButton
                        size="large"
                        center
                        fullWidth
                        data-attr="pending-invite-create-own-org"
                        onClick={() => dismissPendingInvite()}
                    >
                        {t('signup.createOwnOrg', {
                            defaultValue: "I'd rather create my own organization",
                        })}
                    </LemonButton>
                </div>
            )}
        </AuthSceneCard>
    )
}

/** Step 2 — passkey or password. */
function SignupAuthPanel(): JSX.Element {
    const { t } = useTranslation()
    const {
        signupPanelEmail,
        isSignupPanelAuthSubmitting,
        validatedPassword,
        passkeyRegistered,
        isPasskeyRegistering,
        passkeyError,
    } = useValues(signupLogic)
    const { registerPasskey, setPanel } = useActions(signupLogic)

    const footer = (
        <>
            <p className="AuthScene__terms mt-5 mb-0 text-xs leading-relaxed text-tertiary text-center">
                <Trans
                    i18nKey="signup.terms"
                    components={{
                        TermsLink: <Link to="https://posthog.com/terms" target="_blank" />,
                        PrivacyLink: <Link to="https://posthog.com/privacy" target="_blank" />,
                    }}
                    defaults="By creating an account, you agree to our <TermsLink>Terms of Service ↗</TermsLink> and <PrivacyLink>Privacy Policy ↗</PrivacyLink>."
                />
            </p>
            <p className="mt-3 mb-0 text-sm text-secondary text-center">
                <Link
                    onClick={() => setPanel(0)}
                    className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
                >
                    {t('signup.useDifferentEmail', { defaultValue: '← Use a different email' })}
                </Link>
            </p>
        </>
    )

    return (
        <AuthSceneCard footer={footer}>
            <AuthCardTitle
                title={t('signup.secureAccount', { defaultValue: 'Secure your account' })}
                sub={
                    <span>
                        <span>{t('signup.signingUpAs', { defaultValue: 'Signing up as' })}</span>{' '}
                        <span className="AuthScene__mono">{signupPanelEmail.email}</span>
                    </span>
                }
            />
            {passkeyError && (
                <div className="mb-4 py-2.5 px-3 text-sm leading-normal text-primary text-left bg-danger-highlight border border-danger rounded">
                    <span>{passkeyError}</span>
                </div>
            )}
            {passkeyRegistered ? (
                <div className="AuthScene__note text-center py-3 px-3.5 text-xs leading-relaxed text-secondary bg-[#fbfbf9] border border-dashed border-[#c5c6bd] rounded">
                    {t('signup.passkeyRegistered', { defaultValue: 'Passkey registered. Continue below.' })}
                </div>
            ) : (
                <LemonButton
                    type="secondary"
                    size="large"
                    fullWidth
                    icon={
                        <img
                            src={passkeyLogo}
                            alt={t('signup.passkeyAlt', { defaultValue: 'Passkey' })}
                            className="object-contain w-7 h-7"
                        />
                    }
                    onClick={registerPasskey}
                    loading={isPasskeyRegistering}
                    disabled={isPasskeyRegistering}
                    data-attr="signup-passkey"
                    center
                >
                    {t('signup.signUpWithPasskey', { defaultValue: 'Sign up with a passkey' })}
                </LemonButton>
            )}
            {!passkeyRegistered && (
                <div className="my-4 flex gap-3 items-center">
                    <span className="flex-1 h-px bg-[#e0e1d9]" />
                    <span className="text-xs text-secondary whitespace-nowrap">
                        {t('signup.orUsepassword', { defaultValue: 'or use a password' })}
                    </span>
                    <span className="flex-1 h-px bg-[#e0e1d9]" />
                </div>
            )}
            <Form logic={signupLogic} formKey="signupPanelAuth" enableFormOnSubmit className="flex flex-col gap-4">
                {!passkeyRegistered && (
                    <LemonField
                        name="password"
                        label={
                            <div className="flex items-baseline justify-between w-full">
                                <span>{t('signup.PasswordLabel', { defaultValue: 'Password' })}</span>
                                <PasswordStrength validatedPassword={validatedPassword} />
                            </div>
                        }
                    >
                        {({ value, onChange, error, id }) => (
                            <LemonInput
                                id={id}
                                className="ph-ignore-input"
                                data-attr="password"
                                type="password"
                                autoFocus
                                autoComplete="new-password"
                                placeholder="••••••••••"
                                value={value ?? ''}
                                onChange={onChange}
                                status={error ? 'danger' : 'default'}
                                fullWidth
                            />
                        )}
                    </LemonField>
                )}
                <LemonButton
                    type="primary"
                    size="large"
                    center
                    fullWidth
                    htmlType="submit"
                    data-attr="signup-auth-continue"
                    loading={isSignupPanelAuthSubmitting}
                    disabledReason={
                        !passkeyRegistered && validatedPassword.feedback ? validatedPassword.feedback : undefined
                    }
                >
                    {t('signup.createAccount', { defaultValue: 'Create account' })}
                </LemonButton>
            </Form>
        </AuthSceneCard>
    )
}

/** Step 3 — profile (name, organization, role, referral), like the legacy onboarding. */
function SignupProfilePanel(): JSX.Element {
    const { t } = useTranslation()
    const {
        isSignupPanelOnboardingSubmitting,
        signupPanelOnboardingManualErrors,
        challengeRequired,
        turnstileSiteKey,
        turnstileToken,
        signupPanelEmail,
    } = useValues(signupLogic)
    const { preflight } = useValues(preflightLogic)
    const { setTurnstileToken, setPanel } = useActions(signupLogic)
    const { openSupportForm } = useActions(supportLogic)

    const submitLabel = !preflight?.demo
        ? t('signup.createAccount', { defaultValue: 'Create account' })
        : !isSignupPanelOnboardingSubmitting
          ? t('signup.enterDemo', { defaultValue: 'Enter the demo environment' })
          : t('signup.preparingDemo', { defaultValue: 'Preparing demo data…' })

    const footer = (
        <>
            <p className="AuthScene__terms mt-5 mb-0 text-xs leading-relaxed text-tertiary text-center">
                <span>
                    <Trans
                        i18nKey="signup.agreeToTerms"
                        values={{
                            action: preflight?.demo
                                ? t('signup.enteringDemo', { defaultValue: 'entering the demo environment' })
                                : t('signup.creatingAccount', { defaultValue: 'creating an account' }),
                        }}
                        defaults="By {{ action }}, you agree to our"
                    />
                </span>{' '}
                <Link to="https://posthog.com/terms" target="_blank">
                    {t('signup.termsOfService', { defaultValue: 'Terms of Service ↗' })}
                </Link>{' '}
                <span>{t('signup.and', { defaultValue: 'and' })}</span>{' '}
                <Link to="https://posthog.com/privacy" target="_blank">
                    {t('signup.privacyPolicy', { defaultValue: 'Privacy Policy ↗' })}
                </Link>
                <span>.</span>
            </p>
            {!preflight?.demo && (
                <p className="mt-5 mb-0 text-sm text-secondary text-center">
                    <Link
                        onClick={() => setPanel(1)}
                        className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
                    >
                        {t('signup.orGoBack', { defaultValue: '← or go back' })}
                    </Link>
                </p>
            )}
        </>
    )

    return (
        <AuthSceneCard footer={footer}>
            <AuthCardTitle
                title={t('signup.tellUsAboutYourself', { defaultValue: 'Tell us about yourself' })}
                sub={
                    <span>
                        <span>{t('signup.settingUpFor', { defaultValue: 'Setting up the account for' })}</span>{' '}
                        <span className="AuthScene__mono">{signupPanelEmail.email}</span>
                    </span>
                }
            />
            {signupPanelOnboardingManualErrors?.generic && (
                <div className="mb-4 py-2.5 px-3 text-sm leading-normal text-primary text-left bg-danger-highlight border border-danger rounded">
                    <span>
                        {signupPanelOnboardingManualErrors.generic.detail ||
                            t('signup.signupFailed', { defaultValue: 'Could not complete your signup.' })}
                    </span>
                    {preflight?.cloud && (
                        <>
                            {' '}
                            <Link
                                // The login banner uses `login-error-contact-support`. A shared
                                // attribute would mix both pages into one autocapture funnel arm.
                                data-attr="signup-error-contact-support"
                                onClick={(e) => {
                                    e.preventDefault()
                                    openSupportForm({
                                        kind: 'support',
                                        email: signupPanelEmail.email,
                                    })
                                }}
                                className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
                            >
                                {t('signup.contactUs', { defaultValue: 'Contact us' })}
                            </Link>{' '}
                            <span>{t('signup.toResolveThis', { defaultValue: 'to resolve this.' })}</span>
                        </>
                    )}
                </div>
            )}
            <Form
                logic={signupLogic}
                formKey="signupPanelOnboarding"
                enableFormOnSubmit
                className="flex flex-col gap-4"
            >
                <LemonField name="name" label={t('signup.yourName', { defaultValue: 'Your name' })}>
                    {({ value, onChange, error, id }) => (
                        <LemonInput
                            id={id}
                            className="ph-ignore-input"
                            data-attr="signup-name"
                            autoFocus
                            placeholder={t('signup.namePlaceholder', { defaultValue: 'Jane Doe' })}
                            autoComplete="name"
                            value={value ?? ''}
                            onChange={onChange}
                            status={error ? 'danger' : 'default'}
                            fullWidth
                        />
                    )}
                </LemonField>
                <LemonField
                    name="organization_name"
                    label={t('signup.organizationName', { defaultValue: 'Organization name' })}
                >
                    {({ value, onChange, error, id }) => (
                        <LemonInput
                            id={id}
                            className="ph-ignore-input"
                            data-attr="signup-organization-name"
                            placeholder={t('signup.organizationPlaceholder', { defaultValue: 'Hogflix Movies' })}
                            value={value ?? ''}
                            onChange={onChange}
                            status={error ? 'danger' : 'default'}
                            fullWidth
                        />
                    )}
                </LemonField>
                <SignupRoleSelect />
                <SignupReferralSource disabled={isSignupPanelOnboardingSubmitting} />
                {challengeRequired && turnstileSiteKey ? (
                    <TurnstileChallenge
                        siteKey={turnstileSiteKey}
                        onSuccess={setTurnstileToken}
                        tokenReceived={!!turnstileToken}
                        email={signupPanelEmail.email}
                    />
                ) : (
                    <LemonButton
                        type="primary"
                        size="large"
                        center
                        fullWidth
                        htmlType="submit"
                        data-attr="signup-submit"
                        loading={isSignupPanelOnboardingSubmitting}
                    >
                        {submitLabel}
                    </LemonButton>
                )}
            </Form>
        </AuthSceneCard>
    )
}

export function Signup(): JSX.Element | null {
    const { user } = useValues(userLogic)
    const { panel } = useValues(signupLogic)
    // Mounted at the scene root so the cookie is read once, not on every panel change
    useMountedLogic(pendingOAuthConnectionLogic)

    if (user) {
        return null
    }

    return (
        <AuthScene notes={NOTES[panel] ?? NOTES[0]}>
            {panel === 0 ? <SignupEmailPanel /> : panel === 1 ? <SignupAuthPanel /> : <SignupProfilePanel />}
        </AuthScene>
    )
}
