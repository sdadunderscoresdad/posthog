import { useTranslation } from 'react-i18next'

import { LemonBanner } from '@posthog/lemon-ui'

import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInputSelect } from 'lib/lemon-ui/LemonInputSelect/LemonInputSelect'
import { LemonRadio } from 'lib/lemon-ui/LemonRadio'
import { humanList } from 'lib/utils/strings'

import { ConfigScopeEnumApi, DomainScopeEnumApi, OrganizationDomainApi } from '~/generated/core/api.schemas'

import { IDENTITY_PROVIDER_FEATURES } from './identityProviderConfigUtils'

export function IdentityProviderDomainScope({
    configScope,
    domainScope,
    domains,
    disabled,
    hasSamlDomainScopeConflict,
    showScopeWarning,
}: {
    configScope: ConfigScopeEnumApi
    domainScope: DomainScopeEnumApi
    domains: OrganizationDomainApi[]
    disabled: boolean
    hasSamlDomainScopeConflict: boolean
    showScopeWarning: boolean
}): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            {hasSamlDomainScopeConflict && (
                <LemonBanner type="error">
                    {t('settings.organization.idpConfig.domainScope.conflict', {
                        defaultValue:
                            'This SAML configuration overlaps with another SAML configuration on one or more verified domains. Choose different domains before saving.',
                    })}
                </LemonBanner>
            )}
            {showScopeWarning && (
                <LemonBanner type="warning">
                    {t('settings.organization.idpConfig.domainScope.warningPrefix', {
                        defaultValue: 'Changing this value can affect your',
                    })}{' '}
                    {humanList(
                        Object.values(ConfigScopeEnumApi)
                            .filter((scope) => scope !== configScope)
                            .map((scope) => IDENTITY_PROVIDER_FEATURES[scope].name)
                    )}{' '}
                    {t('settings.organization.idpConfig.domainScope.warningSuffix', {
                        defaultValue: 'configurations.',
                    })}
                </LemonBanner>
            )}
            <LemonField
                name="domain_scope"
                label={t('settings.organization.idpConfig.domainScope.label', { defaultValue: 'Domains' })}
            >
                {({ value, onChange }) => (
                    <LemonRadio
                        value={value}
                        onChange={onChange}
                        options={[
                            {
                                value: DomainScopeEnumApi.All,
                                label: t('settings.organization.idpConfig.domainScope.allDomains', {
                                    defaultValue: 'All domains',
                                }),
                                description: t('settings.organization.idpConfig.domainScope.allDomainsDescription', {
                                    defaultValue:
                                        'Apply this configuration to every verified domain in the organization.',
                                }),
                                disabledReason: disabled
                                    ? t('settings.organization.idpConfig.domainScope.saving', {
                                          defaultValue: 'Saving configuration',
                                      })
                                    : undefined,
                                'data-attr': 'identity-provider-domain-scope-all',
                            },
                            {
                                value: DomainScopeEnumApi.Selected,
                                label: t('settings.organization.idpConfig.domainScope.selectedDomains', {
                                    defaultValue: 'Selected domains',
                                }),
                                description: t(
                                    'settings.organization.idpConfig.domainScope.selectedDomainsDescription',
                                    { defaultValue: 'Apply this configuration only to the domains you select.' }
                                ),
                                disabledReason: disabled
                                    ? t('settings.organization.idpConfig.domainScope.saving', {
                                          defaultValue: 'Saving configuration',
                                      })
                                    : undefined,
                                'data-attr': 'identity-provider-domain-scope-selected',
                            },
                        ]}
                    />
                )}
            </LemonField>
            {domainScope === DomainScopeEnumApi.Selected && (
                <LemonField name="organization_domain_ids">
                    <LemonInputSelect
                        mode="multiple"
                        options={domains.map((domain) => ({
                            key: domain.id,
                            label: domain.is_verified
                                ? domain.domain
                                : t('settings.organization.idpConfig.domainScope.pendingDomain', {
                                      defaultValue: '{{ domain }} (pending verification)',
                                      domain: domain.domain,
                                  }),
                        }))}
                        placeholder={t('settings.organization.idpConfig.domainScope.placeholder', {
                            defaultValue: 'Select domains',
                        })}
                        disabled={disabled}
                    />
                </LemonField>
            )}
        </div>
    )
}
