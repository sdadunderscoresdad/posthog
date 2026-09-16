import type { TFunction } from 'i18next'
import { Trans } from 'react-i18next'

import { Link } from 'lib/lemon-ui/Link'

/**
 * Login error copy shared by the auth login variants and the exporter login screen.
 *
 * Built from `t` rather than kept as a module constant, because a message read at import time is
 * read once and would keep whatever language the page happened to load in.
 */
export function loginErrorMessages(t: TFunction): Record<string, string | JSX.Element> {
    return {
        no_new_organizations: t('login.error.noNewOrganizations', {
            defaultValue:
                'Your email address is not associated with an account. Please ask your administrator for an invite.',
        }),
        invalid_sso_provider: (
            <Trans i18nKey="login.error.invalidSsoProvider">
                The SSO provider you specified is invalid. Visit{' '}
                <Link to="https://posthog.com/sso" target="_blank">
                    https://posthog.com/sso
                </Link>{' '}
                for details.
            </Trans>
        ),
        improperly_configured_sso: (
            <Trans i18nKey="login.error.improperlyConfiguredSso">
                Cannot login with SSO provider because the provider is not configured, or your instance does not have
                the required license. Please visit{' '}
                <Link to="https://posthog.com/sso" target="_blank">
                    https://posthog.com/sso
                </Link>{' '}
                for details.
            </Trans>
        ),
        jit_not_enabled: t('login.error.jitNotEnabled', {
            defaultValue:
                'We could not find an account with your email address and your organization does not support automatic enrollment. Please contact your administrator for an invite.',
        }),
        saml_sso_enforced: t('login.error.samlSsoEnforced', {
            defaultValue:
                'Your organization requires SAML SSO authentication. Please enter your email address to access your account.',
        }),
        google_sso_enforced: t('login.error.googleSsoEnforced', {
            defaultValue: 'Your organization does not allow this authentication method. Please log in with Google.',
        }),
        github_sso_enforced: t('login.error.githubSsoEnforced', {
            defaultValue: 'Your organization does not allow this authentication method. Please log in with GitHub.',
        }),
        gitlab_sso_enforced: t('login.error.gitlabSsoEnforced', {
            defaultValue: 'Your organization does not allow this authentication method. Please log in with GitLab.',
        }),
        // our catch-all case, so the message is generic
        sso_enforced: t('login.error.ssoEnforced', {
            defaultValue: "Please log in with your organization's required SSO method.",
        }),
        verified_domain_required: t('login.error.verifiedDomainRequired', {
            defaultValue:
                "Your organization only allows members with a verified email domain. Contact your organization's admin for access.",
        }),
        oauth_cancelled: t('login.error.oauthCancelled', {
            defaultValue: "Sign in was cancelled. Please try again when you're ready.",
        }),
        reauth_user_mismatch: t('login.error.reauthUserMismatch', {
            defaultValue:
                "You signed in with a different account. Please try again with the account you're logged in as.",
        }),
        invalid_invite: t('login.error.invalidInvite', {
            defaultValue:
                'This invite link is no longer valid. It may have expired or been revoked. Please ask your administrator for a new invite.',
        }),
        social_login_failure: t('login.error.socialLoginFailure', {
            defaultValue: 'Login failed. Please try again or contact your administrator.',
        }),
    }
}
