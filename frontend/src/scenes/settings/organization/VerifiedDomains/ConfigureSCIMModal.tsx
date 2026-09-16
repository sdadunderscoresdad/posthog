import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconRefresh } from '@posthog/icons'
import { Link } from '@posthog/lemon-ui'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { i18n } from 'lib/i18n/i18n'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonDialog } from 'lib/lemon-ui/LemonDialog'
import { LemonLabel } from 'lib/lemon-ui/LemonLabel/LemonLabel'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonSwitch } from 'lib/lemon-ui/LemonSwitch/LemonSwitch'
import { Spinner } from 'lib/lemon-ui/Spinner'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function ConfigureSCIMModal(): JSX.Element {
    const { t } = useTranslation()
    const { configureSCIMModalId, scimConfig, scimConfigLoading } = useValues(verifiedDomainsLogic)
    const { setConfigureSCIMModalId, enableScim, disableScim, regenerateScimToken } = useActions(verifiedDomainsLogic)
    const [tokenJustRevealed, setTokenJustRevealed] = useState(false)

    const handleClose = (): void => {
        setConfigureSCIMModalId(null)
        setTokenJustRevealed(false)
    }

    const handleToggleScim = async (): Promise<void> => {
        if (!configureSCIMModalId) {
            return
        }

        if (scimConfig.scim_enabled) {
            LemonDialog.open({
                title: i18n.t('settings.organization.verifiedDomains.scim.disableTitle', {
                    defaultValue: 'Disable SCIM?',
                }),
                description: i18n.t('settings.organization.verifiedDomains.scim.disableDescription', {
                    defaultValue:
                        'Your identity provider will no longer be able to manage users. SAML authentication will continue to work.',
                }),
                primaryButton: {
                    status: 'danger',
                    children: i18n.t('settings.organization.verifiedDomains.scim.disable', {
                        defaultValue: 'Disable SCIM',
                    }),
                    onClick: async () => {
                        await disableScim(configureSCIMModalId)
                    },
                },
                secondaryButton: {
                    children: i18n.t('common.cancel', { defaultValue: 'Cancel' }),
                },
            })
        } else {
            await enableScim(configureSCIMModalId)
            setTokenJustRevealed(true)
        }
    }

    const handleRegenerateToken = async (): Promise<void> => {
        if (!configureSCIMModalId) {
            return
        }

        LemonDialog.open({
            title: i18n.t('settings.organization.verifiedDomains.scim.regenerateTitle', {
                defaultValue: 'Regenerate SCIM token?',
            }),
            description: i18n.t('settings.organization.verifiedDomains.scim.regenerateDescription', {
                defaultValue:
                    'This will invalidate the current token. You will need to update your identity provider with the new token.',
            }),
            primaryButton: {
                status: 'danger',
                children: i18n.t('settings.organization.verifiedDomains.scim.regenerate', {
                    defaultValue: 'Regenerate token',
                }),
                onClick: async () => {
                    await regenerateScimToken(configureSCIMModalId)
                    setTokenJustRevealed(true)
                },
            },
            secondaryButton: {
                children: 'Cancel',
            },
        })
    }

    const showToken = tokenJustRevealed && scimConfig.scim_bearer_token

    return (
        <LemonModal onClose={handleClose} isOpen={!!configureSCIMModalId} title="" simple>
            <div className="LemonModal__layout">
                <LemonModal.Header>
                    <h3>
                        {t('settings.organization.verifiedDomains.scim.title', {
                            defaultValue: 'Configure SCIM provisioning',
                        })}
                    </h3>
                </LemonModal.Header>
                <LemonModal.Content className="space-y-2">
                    {scimConfigLoading ? (
                        <div className="flex min-h-40 items-center justify-center">
                            <Spinner size="large" captureTime />
                        </div>
                    ) : (
                        <>
                            <p>
                                <Link
                                    to="https://posthog.com/docs/data/sso#setting-up-scim"
                                    target="_blank"
                                    targetBlankIcon
                                >
                                    {t('settings.organization.verifiedDomains.readDocs', {
                                        defaultValue: 'Read the docs',
                                    })}
                                </Link>
                            </p>

                            <LemonSwitch
                                checked={scimConfig.scim_enabled ?? false}
                                onChange={handleToggleScim}
                                disabled={scimConfigLoading}
                                label={t('settings.organization.verifiedDomains.scim.enable', {
                                    defaultValue: 'Enable SCIM',
                                })}
                            />

                            {scimConfig.scim_enabled && (
                                <>
                                    <div>
                                        <LemonLabel className="block mb-1">
                                            {t('settings.organization.verifiedDomains.scim.baseUrl', {
                                                defaultValue: 'SCIM Base URL',
                                            })}
                                        </LemonLabel>
                                        <CopyToClipboardInline
                                            description={t('settings.organization.verifiedDomains.scim.baseUrl', {
                                                defaultValue: 'SCIM Base URL',
                                            })}
                                        >
                                            {scimConfig.scim_base_url || ''}
                                        </CopyToClipboardInline>
                                    </div>

                                    <div>
                                        <LemonLabel className="block mb-1">
                                            {t('settings.organization.verifiedDomains.scim.bearerToken', {
                                                defaultValue: 'Bearer Token',
                                            })}
                                        </LemonLabel>
                                        {showToken ? (
                                            <>
                                                <CopyToClipboardInline
                                                    description={t(
                                                        'settings.organization.verifiedDomains.scim.bearerTokenDescription',
                                                        { defaultValue: 'Bearer token' }
                                                    )}
                                                >
                                                    {scimConfig.scim_bearer_token || ''}
                                                </CopyToClipboardInline>
                                                <LemonBanner type="warning" className="my-2">
                                                    {t('settings.organization.verifiedDomains.scim.saveToken', {
                                                        defaultValue: 'Save this token, it will only be shown once.',
                                                    })}
                                                </LemonBanner>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-muted">
                                                    {t('settings.organization.verifiedDomains.scim.tokenOnce', {
                                                        defaultValue:
                                                            'The bearer token is only displayed once when generated.',
                                                    })}
                                                </p>
                                                <LemonButton
                                                    type="secondary"
                                                    onClick={handleRegenerateToken}
                                                    icon={<IconRefresh />}
                                                    loading={scimConfigLoading}
                                                >
                                                    {t('settings.organization.verifiedDomains.scim.regenerate', {
                                                        defaultValue: 'Regenerate token',
                                                    })}
                                                </LemonButton>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </LemonModal.Content>
                <LemonModal.Footer>
                    <LemonButton type="secondary" onClick={handleClose}>
                        {t('settings.organization.verifiedDomains.close', { defaultValue: 'Close' })}
                    </LemonButton>
                </LemonModal.Footer>
            </div>
        </LemonModal>
    )
}
