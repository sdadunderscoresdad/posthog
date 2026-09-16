import { useTranslation } from 'react-i18next'

import { LemonBanner, Link } from '@posthog/lemon-ui'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { i18n } from 'lib/i18n/i18n'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonTextArea } from 'lib/lemon-ui/LemonTextArea/LemonTextArea'

export function SAMLConfigFields({
    siteUrl,
    relayState,
    isReady,
}: {
    siteUrl: string
    relayState: string | null
    isReady: boolean
}): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            <p>
                {t('settings.organization.idpConfig.saml.description', {
                    defaultValue: 'Configure SAML for your organization.',
                })}{' '}
                <Link to="https://posthog.com/docs/data/sso#setting-up-saml" target="_blank" targetBlankIcon>
                    {t('settings.organization.idpConfig.saml.readGuide', { defaultValue: 'Read the SAML setup guide' })}
                </Link>
            </p>
            <LemonField
                label={t('settings.organization.idpConfig.saml.acsConsumerUrl', { defaultValue: 'ACS consumer URL' })}
                name="_acs_consumer_url"
            >
                <CopyToClipboardInline>{`${siteUrl}/complete/saml/`}</CopyToClipboardInline>
            </LemonField>
            <LemonField
                label={t('settings.organization.idpConfig.saml.relayState', { defaultValue: 'Relay state' })}
                name="_relay_state"
            >
                {relayState ? (
                    <CopyToClipboardInline>{relayState}</CopyToClipboardInline>
                ) : (
                    <span className="text-secondary">
                        {t('settings.organization.idpConfig.saml.saveForRelayState', {
                            defaultValue: 'Save this configuration to generate a relay state.',
                        })}
                    </span>
                )}
            </LemonField>
            <LemonField
                label={t('settings.organization.idpConfig.saml.audience', { defaultValue: 'Audience / entity ID' })}
                name="_audience"
            >
                <CopyToClipboardInline>{siteUrl}</CopyToClipboardInline>
            </LemonField>
            <LemonField
                name="saml_acs_url"
                label={t('settings.organization.idpConfig.saml.acsUrl', { defaultValue: 'SAML ACS URL' })}
            >
                <LemonInput className="ph-ignore-input" placeholder="https://idp.example.com/sso" />
            </LemonField>
            <LemonField
                name="saml_entity_id"
                label={t('settings.organization.idpConfig.saml.entityId', { defaultValue: 'SAML entity ID' })}
            >
                <LemonInput
                    className="ph-ignore-input"
                    placeholder={t('settings.organization.idpConfig.saml.entityIdPlaceholder', {
                        defaultValue: 'Entity ID provided by your identity provider',
                    })}
                />
            </LemonField>
            <LemonField
                name="saml_x509_cert"
                label={t('settings.organization.idpConfig.saml.certificate', {
                    defaultValue: 'SAML X.509 certificate',
                })}
            >
                <LemonTextArea
                    className="ph-ignore-input"
                    minRows={10}
                    placeholder={`${i18n.t('settings.organization.idpConfig.saml.certificatePlaceholder', {
                        defaultValue: 'Enter the public certificate from your identity provider. Keep all line breaks.',
                    })}\n-----BEGIN CERTIFICATE-----\nMIICVjCCAb+gAwIBAgIBADANBgkqhkiG9w0BAQ0FADBIMQswCQYDVQQGEwJ1czEL\n-----END CERTIFICATE-----`}
                />
            </LemonField>
            {!isReady && (
                <LemonBanner type="info">
                    {t('settings.organization.idpConfig.saml.incomplete', {
                        defaultValue:
                            'SAML remains disabled until you enter the ACS URL, entity ID, and X.509 certificate. You can save a partial configuration.',
                    })}
                </LemonBanner>
            )}
        </div>
    )
}
