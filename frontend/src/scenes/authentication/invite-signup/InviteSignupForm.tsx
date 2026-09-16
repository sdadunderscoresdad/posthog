import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { type ReactNode, useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import * as judgePng from '@posthog/brand/hoggies/png/judge'

import { Logomark } from 'lib/brand'
import { pngHoggie } from 'lib/brand/hoggies'
import PasswordStrength from 'lib/components/PasswordStrength'
import SignupRoleSelect from 'lib/components/SignupRoleSelect'
import passkeyLogo from 'lib/components/SocialLoginButton/passkey.svg'
import { SocialLoginButton, SSOEnforcedLoginButton } from 'lib/components/SocialLoginButton/SocialLoginButton'
import { supportLogic } from 'lib/components/Support/supportLogic'
import { SSO_PROVIDER_NAMES } from 'lib/constants'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonDivider } from 'lib/lemon-ui/LemonDivider'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { Link } from 'lib/lemon-ui/Link'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { SpinnerOverlay } from 'lib/lemon-ui/Spinner/Spinner'
import { loginLogic } from 'scenes/authentication/login/loginLogic'
import { AuthCardTitle } from 'scenes/authentication/shared/authScene/AuthCardTitle'
import { AuthScene, AuthSceneCard } from 'scenes/authentication/shared/authScene/AuthScene'
import { OrgTile } from 'scenes/authentication/shared/authScene/OrgTile'
import { TurnstileChallenge } from 'scenes/authentication/signup/signupForm/TurnstileChallenge'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { PrevalidatedInvite, SSOProvider } from '~/types'

import { ErrorCodes, inviteSignupLogic } from './inviteSignupLogic'

const HedgehogJudge = pngHoggie(judgePng)

/**
 * Invite-signup alternatives row: social/SSO icons plus an optional passkey signup icon.
 * The passkey button is assembled here (not in SocialLoginButtons) because a passkey isn't a social login.
 */
function InviteAlternativeLogins({
    invite,
    showPasskey,
    onRegisterPasskey,
    passkeyRegistering,
}: {
    invite: PrevalidatedInvite
    showPasskey: boolean
    onRegisterPasskey: () => void
    passkeyRegistering: boolean
}): JSX.Element | null {
    const { t } = useTranslation()
    const { preflight, socialAuthAvailable } = useValues(preflightLogic)

    const order = Object.keys(SSO_PROVIDER_NAMES)
    const socialProviders =
        socialAuthAvailable && preflight
            ? Object.keys(preflight.available_social_auth_providers).sort((a, b) => order.indexOf(a) - order.indexOf(b))
            : []

    if (!socialProviders.length && !showPasskey) {
        return null
    }

    return (
        <>
            <LemonDivider dashed className="my-4" />
            <div className="text-center deprecated-space-y-4">
                <p className="text-secondary">
                    {t('inviteSignup.orContinueWith', { defaultValue: 'or continue with' })}
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    {socialProviders.map((provider) => (
                        <SocialLoginButton
                            key={provider}
                            provider={provider as SSOProvider}
                            extraQueryParams={{ invite_id: invite.id }}
                        />
                    ))}
                    {showPasskey && (
                        <LemonButton
                            size="large"
                            htmlType="button"
                            icon={
                                <img
                                    src={passkeyLogo}
                                    alt={t('inviteSignup.passkeyAlt', { defaultValue: 'Passkey' })}
                                    className="object-contain w-7 h-7"
                                />
                            }
                            tooltip={t('inviteSignup.signUpWithPasskey', {
                                defaultValue: 'Sign up with a passkey',
                            })}
                            onClick={onRegisterPasskey}
                            loading={passkeyRegistering}
                            data-attr="invite-signup-passkey"
                        />
                    )}
                </div>
            </div>
        </>
    )
}

function InviteNewUser({ invite }: { invite: PrevalidatedInvite }): JSX.Element {
    const { t } = useTranslation()
    const {
        isSignupSubmitting,
        signupManualErrors,
        validatedPassword,
        passkeyRegistered,
        isPasskeyRegistering,
        passkeyError,
        challengeRequired,
        turnstileSiteKey,
        turnstileToken,
    } = useValues(inviteSignupLogic)
    const { registerPasskey, setTurnstileToken } = useActions(inviteSignupLogic)
    const { precheck } = useActions(loginLogic)
    const { precheckResponse, precheckResponseLoading } = useValues(loginLogic)
    const { openSupportForm } = useActions(supportLogic)
    const org = invite.organization_name
    const extraFieldsHidden = !!precheckResponse.sso_enforcement

    useEffect(() => {
        precheck({ email: invite.target_email })
    }, [invite.target_email]) // oxlint-disable-line react-hooks/exhaustive-deps

    const inviteHeader = (
        <div className="flex flex-col gap-3 items-center mb-5">
            <div className="flex gap-3 items-center">
                <OrgTile name={org} />
                <span className="AuthScene__inviteHeader-mark inline-flex opacity-90">
                    <Logomark variant="gradient" size="md" />
                </span>
            </div>
            <div className="text-center">
                <p className="m-0 text-sm text-secondary">
                    {t('inviteSignup.invitedToJoin', { defaultValue: "You've been invited to join" })}
                </p>
                <p className="pb-1.5 mt-0.5 mb-0 font-title text-3xl font-extrabold text-primary tracking-tight border-b border-dashed border-[#c5c6bd]">
                    {org}
                </p>
                <p className="m-0 mt-1.5 text-sm text-secondary">
                    {t('inviteSignup.onPosthog', { defaultValue: 'on PostHog' })}
                </p>
            </div>
        </div>
    )

    const footer = (
        <>
            <p className="AuthScene__terms mt-5 mb-0 text-xs leading-relaxed text-tertiary text-center">
                <Trans
                    i18nKey="inviteSignup.terms"
                    components={{
                        TermsLink: <Link to="https://posthog.com/terms" target="_blank" />,
                        PrivacyLink: <Link to="https://posthog.com/privacy" target="_blank" />,
                    }}
                    defaults="By continuing you agree to our <TermsLink>terms</TermsLink> and <PrivacyLink>privacy policy</PrivacyLink>."
                />
            </p>
            <p className="mt-5 mb-0 text-sm text-secondary text-center">
                {t('signup.haveAccount', { defaultValue: 'Already have an account?' })}{' '}
                <Link
                    to={urls.login()}
                    className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
                >
                    {t('signup.logIn', { defaultValue: 'Log in →' })}
                </Link>
            </p>
        </>
    )

    return (
        <AuthScene notes={["// you've been invited", `// ${org.toLowerCase()} is waiting`]}>
            <AuthSceneCard top={inviteHeader} footer={footer}>
                <AuthCardTitle
                    title={t('inviteSignup.createAccount', { defaultValue: 'Create your account' })}
                    sub={t('inviteSignup.createAccountSub', {
                        defaultValue: 'Your teammates are already in. This takes a minute.',
                    })}
                />
                {signupManualErrors?.generic && (
                    <div className="mb-4 py-2.5 px-3 text-sm leading-normal text-primary text-left bg-danger-highlight border border-danger rounded">
                        {signupManualErrors.generic.detail ||
                            t('signup.signupFailed', { defaultValue: 'Could not complete your signup.' })}{' '}
                        <Link
                            data-attr="invite-signup-error-contact-support"
                            onClick={() => openSupportForm({ kind: 'support' })}
                            className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
                        >
                            {t('inviteSignup.needHelp', { defaultValue: 'Need help?' })}
                        </Link>
                    </div>
                )}
                {passkeyError && (
                    <div className="mb-4 py-2.5 px-3 text-sm leading-normal text-primary text-left bg-danger-highlight border border-danger rounded">
                        {passkeyError}
                    </div>
                )}
                <Form logic={inviteSignupLogic} formKey="signup" enableFormOnSubmit className="flex flex-col gap-4">
                    <LemonField.Pure
                        label={t('signup.emailLabel', { defaultValue: 'Email' })}
                        help={t('inviteSignup.emailHelp', {
                            defaultValue: 'The invite is tied to this address.',
                        })}
                    >
                        <LemonInput type="email" value={invite.target_email} disabled fullWidth />
                    </LemonField.Pure>

                    {!extraFieldsHidden && (
                        <>
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
                            <LemonField name="first_name" label={t('signup.yourName', { defaultValue: 'Your name' })}>
                                {({ value, onChange, error, id }) => (
                                    <LemonInput
                                        id={id}
                                        className="ph-ignore-input"
                                        data-attr="first_name"
                                        placeholder={t('signup.namePlaceholder', { defaultValue: 'Jane Doe' })}
                                        autoComplete="name"
                                        value={value ?? ''}
                                        onChange={onChange}
                                        status={error ? 'danger' : 'default'}
                                        fullWidth
                                    />
                                )}
                            </LemonField>
                            <SignupRoleSelect />
                        </>
                    )}

                    {!precheckResponse.sso_enforcement &&
                        (challengeRequired && turnstileSiteKey ? (
                            <TurnstileChallenge
                                siteKey={turnstileSiteKey}
                                onSuccess={setTurnstileToken}
                                tokenReceived={!!turnstileToken}
                                email={invite.target_email}
                            />
                        ) : (
                            <LemonButton
                                type="primary"
                                size="large"
                                center
                                fullWidth
                                htmlType="submit"
                                data-attr="password-signup"
                                loading={isSignupSubmitting || precheckResponseLoading}
                            >
                                {t('inviteSignup.join', { defaultValue: 'Join {{ org }}', org })}
                            </LemonButton>
                        ))}
                    {precheckResponse.sso_enforcement && (
                        <SSOEnforcedLoginButton
                            provider={precheckResponse.sso_enforcement}
                            email={invite.target_email}
                            actionText={t('signup.continue', { defaultValue: 'Continue' })}
                            extraQueryParams={{ invite_id: invite.id }}
                        />
                    )}
                    {precheckResponse.saml_available && !precheckResponse.sso_enforcement && (
                        <SSOEnforcedLoginButton
                            provider="saml"
                            email={invite.target_email}
                            actionText={t('signup.continue', { defaultValue: 'Continue' })}
                            extraQueryParams={{ invite_id: invite.id }}
                        />
                    )}
                </Form>
                {!extraFieldsHidden && (
                    <InviteAlternativeLogins
                        invite={invite}
                        showPasskey={!passkeyRegistered}
                        onRegisterPasskey={() => registerPasskey()}
                        passkeyRegistering={isPasskeyRegistering}
                    />
                )}
            </AuthSceneCard>
        </AuthScene>
    )
}

function InviteExistingAccount({ invite }: { invite: PrevalidatedInvite }): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const { acceptInvite } = useActions(inviteSignupLogic)
    const { acceptedInvite, acceptedInviteLoading } = useValues(inviteSignupLogic)
    const org = invite.organization_name

    return (
        <AuthScene notes={['// hey, welcome back', '// one more org for you']}>
            <AuthSceneCard>
                <div className="mb-4 flex justify-center">
                    <OrgTile name={org} />
                </div>
                <AuthCardTitle
                    title={t('inviteSignup.joinTitle', { defaultValue: 'Join {{ org }}', org })}
                    sub={t('inviteSignup.existingAccountSub', {
                        defaultValue: "You'll accept this invite with your existing PostHog account:",
                    })}
                    className="mb-4"
                />
                {user && (
                    <div
                        className="mb-4 flex gap-3 items-center py-2.5 px-3 border border-dashed border-[#c5c6bd] rounded-lg"
                        data-attr="accept-invite-whoami"
                    >
                        <ProfilePicture user={user} size="xl" />
                        <div className="min-w-0">
                            <p className="m-0 text-sm font-semibold text-primary">{user.first_name}</p>
                            <p className="m-0 overflow-hidden font-mono text-xs text-secondary text-ellipsis whitespace-nowrap">
                                {user.email}
                            </p>
                        </div>
                    </div>
                )}
                <p className="AuthScene__sub mb-4 text-left text-sm text-secondary text-pretty">
                    <Trans
                        i18nKey="inviteSignup.acceptingAdds"
                        values={{ org }}
                        components={{ Bold: <b className="text-primary" /> }}
                        defaults="Accepting adds <Bold>{{ org }}</Bold> to your account. Switch between organizations any time from the upper left of the app."
                    />
                </p>
                {acceptedInvite ? (
                    <LemonButton
                        type="primary"
                        size="large"
                        center
                        fullWidth
                        onClick={() => {
                            window.location.href = '/'
                        }}
                    >
                        {t('inviteSignup.goTo', { defaultValue: 'Go to {{ org }} →', org })}
                    </LemonButton>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <LemonButton
                            type="primary"
                            size="large"
                            center
                            fullWidth
                            loading={acceptedInviteLoading}
                            onClick={acceptInvite}
                        >
                            {t('inviteSignup.acceptInvite', { defaultValue: 'Accept invite' })}
                        </LemonButton>
                        <LemonButton
                            size="large"
                            center
                            fullWidth
                            onClick={() => {
                                window.location.href = '/'
                            }}
                        >
                            {t('inviteSignup.notNow', { defaultValue: 'Not now, back to PostHog' })}
                        </LemonButton>
                    </div>
                )}
            </AuthSceneCard>
        </AuthScene>
    )
}

function InviteInvalid(): JSX.Element {
    const { t } = useTranslation()
    const { error } = useValues(inviteSignupLogic)
    const { user } = useValues(userLogic)
    const { openSupportForm } = useActions(supportLogic)

    const code = error?.code ?? ErrorCodes.Unknown

    const titles: Record<ErrorCodes, string> = {
        [ErrorCodes.InvalidInvite]: t('inviteSignup.invalidInviteTitle', {
            defaultValue: 'This invite link is invalid or expired',
        }),
        [ErrorCodes.UserAlreadyMember]: t('inviteSignup.alreadyMemberTitle', {
            defaultValue: "You're already a member",
        }),
        [ErrorCodes.InvalidRecipient]: t('inviteSignup.invalidRecipientTitle', {
            defaultValue: "This invite link can't be used",
        }),
        [ErrorCodes.Unknown]: t('inviteSignup.unknownTitle', {
            defaultValue: "We couldn't validate this invite link",
        }),
    }

    const details: Record<ErrorCodes, ReactNode> = {
        [ErrorCodes.InvalidInvite]: (
            <Trans
                i18nKey="inviteSignup.invalidInviteDetail"
                values={{ detail: error?.detail }}
                components={{ Bold: <b /> }}
                defaults="{{ detail }} If you believe this is a mistake, ask whoever created the invite to <Bold>send you a new one</Bold>."
            />
        ),
        [ErrorCodes.UserAlreadyMember]: (
            <Trans
                i18nKey="inviteSignup.alreadyMemberDetail"
                values={{
                    detail:
                        error?.detail ||
                        t('inviteSignup.alreadyMemberFallback', {
                            defaultValue: 'You already are a member of this organization.',
                        }),
                    email: user?.email ? ` (${user.email})` : '',
                }}
                defaults="{{ detail }} Your account{{ email }} already belongs to it. To join a different organization, ask the inviter to send a new invite to a different email address."
            />
        ),
        [ErrorCodes.InvalidRecipient]: (
            <Trans
                i18nKey="inviteSignup.invalidRecipientDetail"
                values={{
                    detail: error?.detail,
                    following: user
                        ? t('inviteSignup.invalidRecipientSignedIn', {
                              defaultValue:
                                  'You can log out and create a new account under the invited email address, or ask the organization admin to send a new invite to {{ email }}.',
                              email: user.email,
                          })
                        : t('inviteSignup.invalidRecipientSignedOut', {
                              defaultValue: 'Log in with the invited email address above, or create your own password.',
                          }),
                }}
                defaults="{{ detail }} {{ following }}"
            />
        ),
        [ErrorCodes.Unknown]: (
            <Trans
                i18nKey="inviteSignup.unknownDetail"
                values={{ detail: error?.detail }}
                defaults="{{ detail }} There was an issue with your invite link. Please try again in a few seconds. If the problem persists, contact us."
            />
        ),
    }

    const footer = (
        <p className="mt-5 mb-0 text-sm text-secondary text-center">
            {!user && (
                <>
                    <Link
                        to={urls.login()}
                        className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
                    >
                        {t('inviteSignup.logInShort', { defaultValue: 'Log in' })}
                    </Link>
                    <span className="mx-1.5 text-muted">·</span>
                </>
            )}
            <Link
                to="https://posthog.com"
                target="_blank"
                className="font-semibold no-underline cursor-pointer hover:underline hover:underline-offset-2 text-warning"
            >
                posthog.com ↗
            </Link>
        </p>
    )

    return (
        <AuthScene notes={['// hmm', "// this invite isn't right"]}>
            <AuthSceneCard footer={footer}>
                <div className="flex flex-col items-center text-center">
                    <HedgehogJudge className="block w-auto mx-auto h-28" />
                    <h1 className="m-0 mt-3 font-title text-2xl font-extrabold leading-tight text-primary text-center tracking-tight">
                        {titles[code]}
                    </h1>
                    <p className="AuthScene__sub mt-2 mb-4 text-sm text-secondary text-center text-pretty">
                        {details[code]}
                    </p>
                    <div className="flex flex-col gap-2.5 w-full">
                        {user ? (
                            <LemonButton size="large" center fullWidth type="primary" to={urls.default()}>
                                {t('inviteSignup.goBackToPosthog', { defaultValue: 'Go back to PostHog' })}
                            </LemonButton>
                        ) : code === ErrorCodes.InvalidRecipient ? (
                            <LemonButton
                                size="large"
                                center
                                fullWidth
                                type="primary"
                                to={window.location.pathname}
                                disableClientSideRouting
                            >
                                {t('inviteSignup.tryAgain', { defaultValue: 'Try again' })}
                            </LemonButton>
                        ) : null}
                        <LemonButton size="large" center fullWidth onClick={() => openSupportForm({ kind: 'bug' })}>
                            {t('inviteSignup.contactSupport', { defaultValue: 'Contact support' })}
                        </LemonButton>
                    </div>
                </div>
            </AuthSceneCard>
        </AuthScene>
    )
}

export function InviteSignupForm(): JSX.Element {
    const { invite, inviteLoading, error } = useValues(inviteSignupLogic)
    const { user } = useValues(userLogic)

    if (inviteLoading) {
        return <SpinnerOverlay sceneLevel />
    }
    if (error) {
        return <InviteInvalid />
    }
    if (invite) {
        return user ? <InviteExistingAccount invite={invite} /> : <InviteNewUser invite={invite} />
    }
    return <SpinnerOverlay sceneLevel />
}
