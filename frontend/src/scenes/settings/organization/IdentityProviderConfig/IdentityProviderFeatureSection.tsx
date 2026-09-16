import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconCheckCircle, IconCircleDashed, IconWarning } from '@posthog/icons'
import { LemonBanner, LemonButton, LemonCard, LemonSkeleton } from '@posthog/lemon-ui'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { urls } from 'scenes/urls'

import { ConfigScopeEnumApi } from '~/generated/core/api.schemas'

import { ScimLogsModal } from '../VerifiedDomains/ScimLogsModal'
import { verifiedDomainsLogic } from '../VerifiedDomains/verifiedDomainsLogic'
import { identityProviderConfigsLogic } from './identityProviderConfigsLogic'
import {
    identityProviderFeatures,
    getIdentityProviderConfigsForScope,
    getIdentityProviderConfigStatus,
    getIdentityProviderConfigStatusDescription,
} from './identityProviderConfigUtils'

/** Built from `t`, so the status labels follow a language change. */
function statusDisplay(t: TFunction): Record<string, { label: string; icon: JSX.Element }> {
    return {
        configured: {
            label: t('settings.organization.idpConfig.status.configured', { defaultValue: 'Configured' }),
            icon: <IconCheckCircle className="size-6 text-success" />,
        },
        partially_configured: {
            label: t('settings.organization.idpConfig.status.partiallyConfigured', {
                defaultValue: 'Partially configured',
            }),
            icon: <IconWarning className="size-6 text-warning" />,
        },
        not_configured: {
            label: t('settings.organization.idpConfig.status.notConfigured', { defaultValue: 'Not configured' }),
            icon: <IconCircleDashed className="size-6 text-muted" />,
        },
    }
}

export function IdentityProviderFeatureSection({ configScope }: { configScope: ConfigScopeEnumApi }): JSX.Element {
    const { t } = useTranslation()
    const { identityProviderConfigs, identityProviderConfigsLoading, identityProviderConfigsLoadFailed } =
        useValues(identityProviderConfigsLogic)
    const { loadIdentityProviderConfigs } = useActions(identityProviderConfigsLogic)
    const { scimLogsLoading, verifiedDomains } = useValues(verifiedDomainsLogic)
    const { setScimConfigLogsModalId } = useActions(verifiedDomainsLogic)
    const feature = identityProviderFeatures(t)[configScope]
    const configs = identityProviderConfigs
        ? getIdentityProviderConfigsForScope(identityProviderConfigs, configScope)
        : []
    const config = configs[0]
    const configsToDisplay = configs.length > 1 ? configs : [config]
    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })
    let content: JSX.Element
    if (identityProviderConfigs === null && !identityProviderConfigsLoadFailed) {
        content = <LemonSkeleton className="h-16 w-full" />
    } else if (identityProviderConfigsLoadFailed) {
        content = (
            <LemonBanner
                type="error"
                action={{
                    children: t('settings.organization.idpConfig.tryAgain', { defaultValue: 'Try again' }),
                    onClick: loadIdentityProviderConfigs,
                    loading: identityProviderConfigsLoading,
                }}
            >
                {t('settings.organization.idpConfig.loadFailed', {
                    defaultValue: "Couldn't load identity provider configurations.",
                })}
            </LemonBanner>
        )
    } else {
        content = (
            <>
                <div className="space-y-3">
                    {configsToDisplay.map((config) => {
                        const configStatus = getIdentityProviderConfigStatus(config, configScope)
                        const status = statusDisplay(t)[configStatus]
                        const statusDescription = getIdentityProviderConfigStatusDescription(
                            t,
                            config,
                            configScope,
                            configStatus,
                            verifiedDomains
                        )
                        return (
                            <LemonCard
                                key={config?.id ?? 'not-configured'}
                                hoverEffect={false}
                                className="flex flex-wrap items-center justify-between gap-4 p-4"
                            >
                                <div className="flex min-w-0 items-start gap-2">
                                    <span className="mt-0.5 shrink-0">{status.icon}</span>
                                    <div className="min-w-0">
                                        <div className="text-base font-medium">
                                            {status.label}

                                            {config?.name && (
                                                <span className="text-secondary">
                                                    {' - '}
                                                    {config.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mb-0 text-sm text-tertiary">
                                            {statusDescription.text}
                                            {statusDescription.emphasizedText && (
                                                <strong>{statusDescription.emphasizedText}</strong>
                                            )}
                                            {statusDescription.trailingText}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {configScope === ConfigScopeEnumApi.Scim && (
                                        <LemonButton
                                            type="secondary"
                                            onClick={() => config && setScimConfigLogsModalId(config.id)}
                                            loading={scimLogsLoading}
                                            disabledReason={
                                                restrictionReason ||
                                                (!config
                                                    ? t('settings.organization.idpConfig.configureScimForLogs', {
                                                          defaultValue: 'Configure SCIM to view request logs',
                                                      })
                                                    : undefined)
                                            }
                                            data-attr={`view-scim-logs-${config?.id ?? 'none'}`}
                                        >
                                            {t('settings.organization.verifiedDomains.viewScimLogs', {
                                                defaultValue: 'View SCIM logs',
                                            })}
                                        </LemonButton>
                                    )}
                                    <LemonButton
                                        type="secondary"
                                        to={urls.identityProviderConfig(configScope, config?.id ?? 'new')}
                                        disabledReason={restrictionReason}
                                        data-attr={`configure-${configScope}-identity-provider`}
                                    >
                                        {t('settings.organization.idpConfig.configure', { defaultValue: 'Configure' })}
                                    </LemonButton>
                                </div>
                            </LemonCard>
                        )
                    })}
                </div>
                {configs.length > 0 && (
                    <div className="mt-3 flex">
                        <LemonButton
                            type="tertiary"
                            to={urls.identityProviderConfig(configScope, 'new')}
                            tooltip={t('settings.organization.idpConfig.multipleConfigsTooltip', {
                                defaultValue:
                                    "You probably don't need multiple configurations. Only create a new configuration if you use multiple IdPs or apps within your IdP for SSO.",
                            })}
                            data-attr={`new-${configScope}-identity-provider-from-settings`}
                        >
                            {t('settings.organization.idpConfig.addNew', {
                                defaultValue: 'Add a new {{ feature }} configuration',
                                feature: feature.name,
                            })}
                        </LemonButton>
                    </div>
                )}
                {configScope === ConfigScopeEnumApi.Scim && <ScimLogsModal emptyStateScope="configuration" />}
            </>
        )
    }

    return (
        <PayGateMini
            feature={feature.availableFeature}
            featureDetail={`${configScope}-settings-section`}
            loadingSkeleton={<LemonSkeleton className="h-16 w-full" />}
        >
            {content}
        </PayGateMini>
    )
}
