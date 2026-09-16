import { useTranslation } from 'react-i18next'

import { IconRefresh } from '@posthog/icons'
import { LemonBanner, LemonButton, LemonDialog, LemonLabel, LemonSwitch, Link } from '@posthog/lemon-ui'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { LemonField } from 'lib/lemon-ui/LemonField'

export function SCIMConfigFields({
    scimEnabled,
    scimBaseUrl,
    revealedToken,
    canRegenerateToken,
    tokenLoading,
    disabled,
    onRegenerateToken,
}: {
    scimEnabled: boolean
    scimBaseUrl: string | null
    revealedToken: string | null
    canRegenerateToken: boolean
    tokenLoading: boolean
    disabled: boolean
    onRegenerateToken: () => void
}): JSX.Element {
    const { t } = useTranslation()
    const confirmRegenerateToken = (): void => {
        LemonDialog.open({
            title: t('settings.organization.idpConfig.scim.regenerateTitle', {
                defaultValue: 'Regenerate SCIM token?',
            }),
            description: t('settings.organization.idpConfig.scim.regenerateDescription', {
                defaultValue:
                    'This invalidates the current token. Update your identity provider with the new token after it is generated.',
            }),
            primaryButton: {
                status: 'danger',
                children: t('settings.organization.idpConfig.scim.regenerate', { defaultValue: 'Regenerate token' }),
                onClick: onRegenerateToken,
            },
            secondaryButton: { children: t('settings.cancel', { defaultValue: 'Cancel' }) },
        })
    }

    return (
        <div className="space-y-4">
            <p>
                {t('settings.organization.idpConfig.scim.description', {
                    defaultValue: 'Configure SCIM for your organization.',
                })}{' '}
                <Link to="https://posthog.com/docs/data/sso#setting-up-scim" target="_blank" targetBlankIcon>
                    {t('settings.organization.idpConfig.scim.readGuide', { defaultValue: 'Read the SCIM setup guide' })}
                </Link>
            </p>
            <LemonField name="scim_enabled">
                {({ value, onChange }) => (
                    <LemonSwitch
                        checked={value}
                        onChange={onChange}
                        label={t('settings.organization.idpConfig.scim.enable', {
                            defaultValue: 'Enable SCIM provisioning',
                        })}
                        disabled={disabled}
                    />
                )}
            </LemonField>
            {scimEnabled && (
                <div className="space-y-4">
                    <div>
                        <LemonLabel className="mb-1 block">
                            {t('settings.organization.idpConfig.scim.baseUrl', { defaultValue: 'SCIM base URL' })}
                        </LemonLabel>
                        {scimBaseUrl ? (
                            <CopyToClipboardInline
                                description={t('settings.organization.idpConfig.scim.baseUrl', {
                                    defaultValue: 'SCIM base URL',
                                })}
                            >
                                {scimBaseUrl}
                            </CopyToClipboardInline>
                        ) : (
                            <p className="text-secondary mb-0">
                                {t('settings.organization.idpConfig.scim.saveForBaseUrl', {
                                    defaultValue: 'Save this configuration to generate the SCIM base URL.',
                                })}
                            </p>
                        )}
                    </div>
                    <div>
                        <LemonLabel className="mb-1 block">
                            {t('settings.organization.idpConfig.scim.bearerToken', { defaultValue: 'Bearer token' })}
                        </LemonLabel>
                        {revealedToken ? (
                            <>
                                <CopyToClipboardInline
                                    description={t('settings.organization.idpConfig.scim.bearerToken', {
                                        defaultValue: 'Bearer token',
                                    })}
                                    isValueSensitive
                                >
                                    {revealedToken}
                                </CopyToClipboardInline>
                                <LemonBanner type="warning" className="mt-2">
                                    {t('settings.organization.idpConfig.scim.copyToken', {
                                        defaultValue: 'Copy this token now. It will not be shown again.',
                                    })}
                                </LemonBanner>
                            </>
                        ) : canRegenerateToken ? (
                            <>
                                <p className="text-secondary">
                                    {t('settings.organization.idpConfig.scim.tokenOnlyWhenGenerated', {
                                        defaultValue: 'The bearer token is only shown when it is generated.',
                                    })}
                                </p>
                                <LemonButton
                                    type="secondary"
                                    icon={<IconRefresh />}
                                    onClick={confirmRegenerateToken}
                                    loading={tokenLoading}
                                    data-attr="regenerate-scim-token"
                                >
                                    {t('settings.organization.idpConfig.scim.regenerate', {
                                        defaultValue: 'Regenerate token',
                                    })}
                                </LemonButton>
                            </>
                        ) : (
                            <p className="text-secondary mb-0">
                                {t('settings.organization.idpConfig.scim.saveForToken', {
                                    defaultValue: 'Save this configuration to generate a bearer token.',
                                })}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
