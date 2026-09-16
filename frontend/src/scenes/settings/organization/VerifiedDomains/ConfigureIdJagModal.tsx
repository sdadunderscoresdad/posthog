import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { Trans, useTranslation } from 'react-i18next'

import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonInputSelect } from 'lib/lemon-ui/LemonInputSelect/LemonInputSelect'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { Spinner } from 'lib/lemon-ui/Spinner'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function ConfigureIdJagModal(): JSX.Element {
    const { t } = useTranslation()
    const { configureIdJagModalId, configureIdJagModalLoading, isIdJagConfigSubmitting, idJagConfig } =
        useValues(verifiedDomainsLogic)
    const { setConfigureIdJagModalId } = useActions(verifiedDomainsLogic)

    const idJagReady = Boolean(idJagConfig.id_jag_issuer_url)

    const handleClose = (): void => {
        setConfigureIdJagModalId(null)
    }

    return (
        <LemonModal onClose={handleClose} isOpen={!!configureIdJagModalId} title="" simple>
            <Form logic={verifiedDomainsLogic} formKey="idJagConfig" enableFormOnSubmit className="LemonModal__layout ">
                <LemonModal.Header>
                    <h3>
                        {t('settings.organization.verifiedDomains.idJag.title', {
                            defaultValue: 'Configure XAA (ID-JAG)',
                        })}
                    </h3>
                </LemonModal.Header>
                <LemonModal.Content className="deprecated-space-y-2">
                    {configureIdJagModalLoading ? (
                        <div className="flex min-h-40 items-center justify-center">
                            <Spinner size="large" captureTime />
                        </div>
                    ) : (
                        <>
                            <LemonField
                                name="id_jag_issuer_url"
                                label={t('settings.organization.verifiedDomains.idJag.issuerUrl', {
                                    defaultValue: 'IdP issuer URL',
                                })}
                                info={t('settings.organization.verifiedDomains.idJag.issuerUrlInfo', {
                                    defaultValue:
                                        'The trusted identity provider issuer URL. Must match the iss claim on ID-JAG tokens for users on this domain.',
                                })}
                            >
                                <LemonInput
                                    className="ph-ignore-input"
                                    placeholder="https://idp.example.com"
                                    autoComplete="off"
                                />
                            </LemonField>
                            <LemonField
                                name="id_jag_jwks_url"
                                label={t('settings.organization.verifiedDomains.idJag.jwksUrl', {
                                    defaultValue: 'JWKS URL (optional)',
                                })}
                                info={t('settings.organization.verifiedDomains.idJag.jwksUrlInfo', {
                                    defaultValue:
                                        'Override JWKS discovery. Leave empty to use OIDC discovery at the issuer URL.',
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
                                label={t('settings.organization.verifiedDomains.idJag.allowedClients', {
                                    defaultValue: 'Allowed client IDs (optional)',
                                })}
                                info={t('settings.organization.verifiedDomains.idJag.allowedClientsInfo', {
                                    defaultValue:
                                        'Restrict which client_id values are accepted. Leave empty to allow any client_id.',
                                })}
                            >
                                {({ value, onChange }) => (
                                    <LemonInputSelect
                                        value={value ?? []}
                                        onChange={onChange}
                                        placeholder={t('settings.organization.verifiedDomains.idJag.addClientIds', {
                                            defaultValue: 'Add client IDs...',
                                        })}
                                        mode="multiple"
                                        allowCustomValues
                                        options={[]}
                                    />
                                )}
                            </LemonField>
                            {!idJagReady && (
                                <LemonBanner type="info">
                                    {t('settings.organization.verifiedDomains.idJag.incomplete', {
                                        defaultValue:
                                            'XAA will not be enabled until you enter an IdP issuer URL. You can save partial settings as a draft.',
                                    })}
                                </LemonBanner>
                            )}
                            <LemonBanner type="info">
                                <Trans
                                    i18nKey="settings.organization.verifiedDomains.idJag.scopesNotice"
                                    components={{ code: <code /> }}
                                    defaults="Configure your IdP to grant <code>user:read</code> plus the scopes each integration needs (for project-scoped APIs, also <code>organization:read</code> and <code>project:read</code>). Tokens issued without the required scopes are rejected with an insufficient-scope error."
                                />
                            </LemonBanner>
                        </>
                    )}
                </LemonModal.Content>
                <LemonModal.Footer>
                    <LemonButton
                        loading={isIdJagConfigSubmitting}
                        disabled={configureIdJagModalLoading}
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
