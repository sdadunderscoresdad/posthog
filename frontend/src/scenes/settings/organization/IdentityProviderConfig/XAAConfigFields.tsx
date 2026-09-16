import { Trans, useTranslation } from 'react-i18next'

import { Link } from '@posthog/lemon-ui'

import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonInputSelect } from 'lib/lemon-ui/LemonInputSelect/LemonInputSelect'

export function XAAConfigFields({ isReady }: { isReady: boolean }): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            <p>
                {t('settings.organization.idpConfig.xaa.description', {
                    defaultValue: 'Configure XAA for your organization.',
                })}{' '}
                <Link to="https://posthog.com/docs/settings/id-jag" target="_blank" targetBlankIcon>
                    {t('settings.organization.idpConfig.xaa.readGuide', { defaultValue: 'Read the XAA setup guide' })}
                </Link>
            </p>
            <LemonField
                name="id_jag_issuer_url"
                label={t('settings.organization.idpConfig.xaa.issuerUrl', {
                    defaultValue: 'Identity provider issuer URL',
                })}
                info={t('settings.organization.idpConfig.xaa.issuerUrlInfo', {
                    defaultValue: 'This must match the iss claim on ID-JAG tokens.',
                })}
            >
                <LemonInput className="ph-ignore-input" placeholder="https://idp.example.com" autoComplete="off" />
            </LemonField>
            <LemonField
                name="id_jag_jwks_url"
                label={t('settings.organization.idpConfig.xaa.jwksUrl', { defaultValue: 'JWKS URL (optional)' })}
                info={t('settings.organization.idpConfig.xaa.jwksUrlInfo', {
                    defaultValue: 'Leave this empty to use OIDC discovery from the issuer URL.',
                })}
            >
                <LemonInput
                    className="ph-ignore-input"
                    placeholder="https://idp.example.com/.well-known/jwks.json"
                    autoComplete="off"
                />
            </LemonField>
            <LemonField
                name="id_jag_allowed_clients"
                label={t('settings.organization.idpConfig.xaa.allowedClients', {
                    defaultValue: 'Allowed client IDs (optional)',
                })}
                info={t('settings.organization.idpConfig.xaa.allowedClientsInfo', {
                    defaultValue: 'Leave this empty to accept any client_id value.',
                })}
            >
                <LemonInputSelect
                    placeholder={t('settings.organization.idpConfig.xaa.addClientIds', {
                        defaultValue: 'Add client IDs',
                    })}
                    mode="multiple"
                    allowCustomValues
                    options={[]}
                />
            </LemonField>
            {!isReady && (
                <LemonBanner type="info">
                    {t('settings.organization.idpConfig.xaa.incomplete', {
                        defaultValue:
                            'XAA remains disabled until you enter an identity provider issuer URL. You can save a partial configuration.',
                    })}
                </LemonBanner>
            )}
            <LemonBanner type="info">
                <Trans
                    i18nKey="settings.organization.idpConfig.xaa.scopesNotice"
                    components={{ code: <code /> }}
                    defaults="Grant <code>user:read</code> and the scopes required by each integration. Project APIs also require <code>organization:read</code> and <code>project:read</code>."
                />
            </LemonBanner>
        </div>
    )
}
