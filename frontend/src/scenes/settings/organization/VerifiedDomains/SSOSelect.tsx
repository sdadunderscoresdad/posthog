import { useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSelect, LemonSelectOptions } from '@posthog/lemon-ui'

import { SocialLoginIcon } from 'lib/components/SocialLoginButton/SocialLoginIcon'
import { SSO_PROVIDER_NAMES } from 'lib/constants'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { SSOProvider } from '~/types'

export interface SSOSelectInterface {
    value: SSOProvider | ''
    loading: boolean
    onChange: (value: SSOProvider | '') => void
    samlAvailable: boolean
    disabledReason?: string | null
}

export function SSOSelect({
    value,
    loading,
    onChange,
    samlAvailable,
    disabledReason,
}: SSOSelectInterface): JSX.Element | null {
    const { t } = useTranslation()
    const { preflight } = useValues(preflightLogic)

    if (!preflight) {
        return null
    }

    const authProviders = Object.keys(preflight.available_social_auth_providers) as SSOProvider[]
    const notConfigured = t('settings.organization.verifiedDomains.sso.notConfigured', {
        defaultValue: 'This provider is not configured.',
    })
    const options: LemonSelectOptions<SSOProvider | ''> = [
        {
            value: '',
            label: t('settings.organization.verifiedDomains.sso.doNotEnforce', { defaultValue: "Don't enforce" }),
        },
    ]

    authProviders.forEach((key) => {
        options.push({
            value: key,
            label: SSO_PROVIDER_NAMES[key],
            disabledReason: preflight.available_social_auth_providers[key] ? undefined : notConfigured,
            icon: <SocialLoginIcon provider={key} className="w-4 h-4" />,
        })
    })

    options.push({
        value: 'saml',
        label: SSO_PROVIDER_NAMES['saml'],
        disabledReason: !samlAvailable ? notConfigured : undefined,
        icon: <SocialLoginIcon provider="saml" className="w-4 h-4" />,
    })

    return (
        <LemonSelect
            value={value}
            options={options}
            loading={loading}
            disabledReason={
                loading
                    ? t('settings.organization.verifiedDomains.sso.cannotChangeWhileLoading', {
                          defaultValue: 'Cannot change while loading',
                      })
                    : disabledReason
            }
            fullWidth
            onChange={onChange}
        />
    )
}
