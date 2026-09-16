import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useTranslation } from 'react-i18next'

import { Link } from '@posthog/lemon-ui'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { i18n } from 'lib/i18n/i18n'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonTextArea } from 'lib/lemon-ui/LemonTextArea/LemonTextArea'
import { Spinner } from 'lib/lemon-ui/Spinner'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function ConfigureSAMLModal(): JSX.Element {
    const { t } = useTranslation()
    const { configureSAMLModalId, configureSAMLModalLoading, isSamlConfigSubmitting, samlConfig } =
        useValues(verifiedDomainsLogic)
    const { setConfigureSAMLModalId } = useActions(verifiedDomainsLogic)
    const { preflight } = useValues(preflightLogic)
    const siteUrl = preflight?.site_url ?? window.location.origin

    const samlReady = samlConfig.saml_acs_url && samlConfig.saml_entity_id && samlConfig.saml_x509_cert

    const handleClose = (): void => {
        setConfigureSAMLModalId(null)
        // clean()
    }

    return (
        <LemonModal onClose={handleClose} isOpen={!!configureSAMLModalId} title="" simple>
            <Form logic={verifiedDomainsLogic} formKey="samlConfig" enableFormOnSubmit className="LemonModal__layout ">
                <LemonModal.Header>
                    <h3>
                        {t('settings.organization.verifiedDomains.saml.title', {
                            defaultValue: 'Configure SAML authentication and provisioning',
                        })}
                    </h3>
                </LemonModal.Header>
                <LemonModal.Content className="deprecated-space-y-2">
                    {configureSAMLModalLoading ? (
                        <div className="flex min-h-40 items-center justify-center">
                            <Spinner size="large" captureTime />
                        </div>
                    ) : (
                        <>
                            <p>
                                <Link
                                    to="https://posthog.com/docs/data/sso#setting-up-saml"
                                    target="_blank"
                                    targetBlankIcon
                                >
                                    {t('settings.organization.verifiedDomains.readDocs', {
                                        defaultValue: 'Read the docs',
                                    })}
                                </Link>
                            </p>
                            <LemonField
                                label={t('settings.organization.verifiedDomains.saml.acsConsumerUrl', {
                                    defaultValue: 'ACS Consumer URL',
                                })}
                                name="_ACSConsumerUrl"
                            >
                                <CopyToClipboardInline>{`${siteUrl}/complete/saml/`}</CopyToClipboardInline>
                            </LemonField>
                            <LemonField
                                label={t('settings.organization.verifiedDomains.saml.relayState', {
                                    defaultValue: 'RelayState',
                                })}
                                name="_RelayState"
                            >
                                <CopyToClipboardInline>
                                    {samlConfig.saml_relay_state || 'unknown'}
                                </CopyToClipboardInline>
                            </LemonField>
                            <LemonField
                                label={t('settings.organization.verifiedDomains.saml.audience', {
                                    defaultValue: 'Audience / Entity ID',
                                })}
                                name="_Audience"
                            >
                                <CopyToClipboardInline>{siteUrl}</CopyToClipboardInline>
                            </LemonField>
                            <LemonField
                                name="saml_acs_url"
                                label={t('settings.organization.verifiedDomains.saml.acsUrl', {
                                    defaultValue: 'SAML ACS URL',
                                })}
                            >
                                <LemonInput
                                    className="ph-ignore-input"
                                    placeholder={t('settings.organization.verifiedDomains.saml.acsUrlPlaceholder', {
                                        defaultValue: "Your IdP's ACS or single sign-on URL.",
                                    })}
                                />
                            </LemonField>
                            <LemonField
                                name="saml_entity_id"
                                label={t('settings.organization.verifiedDomains.saml.entityId', {
                                    defaultValue: 'SAML Entity ID',
                                })}
                            >
                                <LemonInput
                                    className="ph-ignore-input"
                                    placeholder={t('settings.organization.verifiedDomains.saml.entityIdPlaceholder', {
                                        defaultValue: 'Entity ID provided by your IdP.',
                                    })}
                                />
                            </LemonField>
                            <LemonField
                                name="saml_x509_cert"
                                label={t('settings.organization.verifiedDomains.saml.certificate', {
                                    defaultValue: 'SAML X.509 Certificate',
                                })}
                            >
                                <LemonTextArea
                                    className="ph-ignore-input"
                                    minRows={10}
                                    placeholder={`${i18n.t(
                                        'settings.organization.verifiedDomains.saml.certificatePlaceholder',
                                        {
                                            defaultValue:
                                                'Enter the public certificate of your IdP. Keep all line breaks.',
                                        }
                                    )}\n-----BEGIN CERTIFICATE-----\nMIICVjCCAb+gAwIBAgIBADANBgkqhkiG9w0BAQ0FADBIMQswCQYDVQQGEwJ1czEL\n-----END CERTIFICATE-----`}
                                />
                            </LemonField>
                            {!samlReady && (
                                <LemonBanner type="info">
                                    {t('settings.organization.verifiedDomains.saml.incomplete', {
                                        defaultValue:
                                            'SAML will not be enabled unless you enter all attributes above. However you can still save the settings as a draft.',
                                    })}
                                </LemonBanner>
                            )}
                        </>
                    )}
                </LemonModal.Content>
                <LemonModal.Footer>
                    <LemonButton
                        loading={isSamlConfigSubmitting}
                        disabled={configureSAMLModalLoading}
                        type="primary"
                        htmlType="submit"
                    >
                        {t('settings.organization.verifiedDomains.saveSettings', { defaultValue: 'Save settings' })}
                    </LemonButton>
                </LemonModal.Footer>
            </Form>
        </LemonModal>
    )
}
