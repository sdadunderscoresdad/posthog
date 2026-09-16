import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { Trans, useTranslation } from 'react-i18next'

import { IconCode } from '@posthog/icons'
import { LemonButton, LemonInput, LemonSelect, Link } from '@posthog/lemon-ui'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { ScopeAccessRow } from 'lib/components/ScopeAccessRow/ScopeAccessRow'
import { IconErrorOutline } from 'lib/lemon-ui/icons'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { CLI_SCOPE_PRESETS, cliAuthorizeLogic } from './cliAuthorizeLogic'

export const scene: SceneExport = {
    component: CLIAuthorize,
    logic: cliAuthorizeLogic,
}

export function CLIAuthorize(): JSX.Element {
    const { t } = useTranslation()
    const {
        authorize,
        isSuccess,
        organizations,
        projects,
        projectsLoading,
        isAuthorizeSubmitting,
        formScopeRadioValues,
        filteredScopes,
        searchTerm,
        scopePreset,
        allAccessSelected,
        missingSchemaScopes,
        missingErrorTrackingScopes,
        missingEndpointsScopes,
        missingAgentScopes,
    } = useValues(cliAuthorizeLogic)
    const { setAuthorizeValue, setScopeRadioValue, setSearchTerm, setScopePreset, resetScopes } =
        useActions(cliAuthorizeLogic)

    return (
        <BridgePage view="login">
            {isSuccess ? (
                <div className="text-center space-y-4">
                    <h2>{t('cliAuthorize.successTitle', { defaultValue: 'CLI Authorization Complete' })}</h2>
                    <LemonBanner type="success">
                        <div className="space-y-2">
                            <p className="font-semibold">
                                {t('cliAuthorize.successBanner', {
                                    defaultValue: 'Your CLI has been authorized successfully!',
                                })}
                            </p>
                            <p>
                                {t('cliAuthorize.successDetail', {
                                    defaultValue: 'You can now close this window and return to your terminal.',
                                })}
                            </p>
                        </div>
                    </LemonBanner>
                    <div className="text-muted text-sm mt-4">
                        <p>
                            <Trans
                                i18nKey="cliAuthorize.successKeyNote"
                                components={{
                                    SettingsLink: (
                                        <Link to={urls.settings('user-api-keys')} className="font-semibold" />
                                    ),
                                }}
                                defaults="A personal API key has been created for your CLI. You can manage your personal API keys in <SettingsLink>Settings → Personal API keys</SettingsLink>"
                            />
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2>{t('cliAuthorize.title', { defaultValue: 'Authorize CLI Access' })}</h2>
                    <p className="text-muted text-sm">
                        {t('cliAuthorize.description', {
                            defaultValue:
                                'The PostHog CLI should have displayed a 9-character code (e.g., ABCD-1234). Enter it below to authorize your CLI.',
                        })}
                    </p>
                    <Form logic={cliAuthorizeLogic} formKey="authorize" enableFormOnSubmit className="space-y-4">
                        <LemonField
                            name="userCode"
                            label={t('cliAuthorize.codeLabel', { defaultValue: 'Authorization Code' })}
                        >
                            <LemonInput
                                className="ph-ignore-input font-mono text-lg tracking-wider"
                                autoFocus
                                data-attr="cli-auth-code"
                                placeholder="ABCD-1234"
                                maxLength={9}
                                value={authorize.userCode}
                                onChange={(value) => setAuthorizeValue('userCode', value.toUpperCase())}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                            />
                        </LemonField>
                        <LemonField
                            name="organizationId"
                            label={t('cliAuthorize.organizationLabel', { defaultValue: 'Organization' })}
                        >
                            <LemonSelect
                                data-attr="cli-organization-select"
                                placeholder={t('vercelConnect.selectOrg', { defaultValue: 'Select an organization' })}
                                value={authorize.organizationId}
                                onChange={(value) => setAuthorizeValue('organizationId', value)}
                                options={organizations.map((organization) => ({
                                    label: organization.name,
                                    value: organization.id,
                                }))}
                            />
                        </LemonField>
                        <LemonField
                            name="projectId"
                            label={t('cliAuthorize.projectLabel', { defaultValue: 'Project' })}
                        >
                            <LemonSelect
                                data-attr="cli-project-select"
                                placeholder={t('vercelConnect.selectProject', { defaultValue: 'Select a project' })}
                                value={authorize.projectId}
                                onChange={(value) => setAuthorizeValue('projectId', value)}
                                disabled={!authorize.organizationId}
                                options={projects.map((project: { id: number; name: string }) => ({
                                    label: project.name,
                                    value: project.id,
                                }))}
                                loading={projectsLoading}
                            />
                        </LemonField>

                        <div className="flex items-center justify-between mt-4 mb-2">
                            <h3 className="mb-0">{t('cliAuthorize.scopes', { defaultValue: 'Scopes' })}</h3>
                            <LemonSelect
                                data-attr="cli-scope-preset"
                                size="small"
                                placeholder={t('cliAuthorize.customSelection', { defaultValue: 'Custom selection' })}
                                value={scopePreset}
                                onChange={(value) => setScopePreset(value)}
                                options={CLI_SCOPE_PRESETS.map((preset) => ({
                                    label: preset.label,
                                    value: preset.value,
                                }))}
                                dropdownMatchSelectWidth={false}
                                dropdownPlacement="bottom-end"
                            />
                        </div>
                        <p className="text-muted text-sm mb-2">
                            {t('cliAuthorize.scopesDescription', {
                                defaultValue:
                                    'Permissions granted to the CLI. Pick a preset or fine-tune individual scopes. Only grant what you need.',
                            })}
                        </p>

                        <LemonField name="scopes">
                            {({ error }) => (
                                <>
                                    {error && (
                                        <div className="text-danger flex items-center gap-1 text-sm mb-2">
                                            <IconErrorOutline className="text-xl" /> {error}
                                        </div>
                                    )}

                                    {allAccessSelected ? (
                                        <LemonBanner
                                            type="warning"
                                            action={{
                                                children: t('cliAuthorize.reset', { defaultValue: 'Reset' }),
                                                onClick: () => resetScopes(),
                                            }}
                                        >
                                            <Trans
                                                i18nKey="cliAuthorize.fullAccessWarning"
                                                components={{ Bold: <b /> }}
                                                defaults="<Bold>This key will have full access to all supported endpoints.</Bold> We recommend scoping it to only what the CLI needs."
                                            />
                                        </LemonBanner>
                                    ) : (
                                        <>
                                            <LemonInput
                                                type="search"
                                                placeholder={t('cliAuthorize.searchScopes', {
                                                    defaultValue: 'Search scopes...',
                                                })}
                                                value={searchTerm}
                                                onChange={setSearchTerm}
                                                className="mb-2"
                                                size="small"
                                                fullWidth
                                            />
                                            <div className="max-h-64 overflow-y-auto pr-1">
                                                {filteredScopes.length === 0 ? (
                                                    <div className="text-muted text-sm py-2">
                                                        {t('cliAuthorize.noScopesMatch', {
                                                            defaultValue: 'No scopes match "{{ term }}"',
                                                            term: searchTerm,
                                                        })}
                                                    </div>
                                                ) : (
                                                    filteredScopes.map(
                                                        ({ key, objectName, disabledActions, warnings, info }) => {
                                                            const selected = formScopeRadioValues[key]
                                                            const warningAction =
                                                                selected === 'read' || selected === 'write'
                                                                    ? selected
                                                                    : null
                                                            return (
                                                                <ScopeAccessRow
                                                                    key={key}
                                                                    label={objectName}
                                                                    info={info}
                                                                    value={selected ?? 'none'}
                                                                    onChange={(value) => setScopeRadioValue(key, value)}
                                                                    readDisabledReason={
                                                                        disabledActions?.includes('read')
                                                                            ? t('cliAuthorize.doesNotApply', {
                                                                                  defaultValue:
                                                                                      'Does not apply to this resource',
                                                                              })
                                                                            : undefined
                                                                    }
                                                                    writeDisabledReason={
                                                                        disabledActions?.includes('write')
                                                                            ? t('cliAuthorize.doesNotApply', {
                                                                                  defaultValue:
                                                                                      'Does not apply to this resource',
                                                                              })
                                                                            : undefined
                                                                    }
                                                                    warning={
                                                                        warningAction ? warnings?.[warningAction] : null
                                                                    }
                                                                />
                                                            )
                                                        }
                                                    )
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </LemonField>

                        {(missingSchemaScopes ||
                            missingErrorTrackingScopes ||
                            missingEndpointsScopes ||
                            missingAgentScopes) && (
                            <div className="space-y-2 mt-2">
                                {missingSchemaScopes && (
                                    <LemonBanner type="warning">
                                        <Trans
                                            i18nKey="cliAuthorize.missingSchemaScopes"
                                            components={{
                                                Bold: <b />,
                                                EventCode: <code />,
                                                PropertyCode: <code />,
                                            }}
                                            defaults="<Bold>Schema management unavailable:</Bold> The CLI needs both <EventCode>event_definition</EventCode> and <PropertyCode>property_definition</PropertyCode> permissions (read or write) to manage schemas."
                                        />
                                    </LemonBanner>
                                )}
                                {missingErrorTrackingScopes && (
                                    <LemonBanner type="warning">
                                        <Trans
                                            i18nKey="cliAuthorize.missingErrorTrackingScopes"
                                            components={{ Bold: <b />, ScopeCode: <code /> }}
                                            defaults="<Bold>Error tracking unavailable:</Bold> The CLI needs <ScopeCode>error_tracking</ScopeCode> permissions (read or write) to manage error tracking."
                                        />
                                    </LemonBanner>
                                )}
                                {missingEndpointsScopes && (
                                    <LemonBanner type="warning">
                                        <Trans
                                            i18nKey="cliAuthorize.missingEndpointsScopes"
                                            components={{ Bold: <b />, ScopeCode: <code /> }}
                                            defaults="<Bold>Endpoints unavailable:</Bold> The CLI needs <ScopeCode>endpoint</ScopeCode> permissions (read or write) to execute endpoints."
                                        />
                                    </LemonBanner>
                                )}
                                {missingAgentScopes && (
                                    <LemonBanner type="warning">
                                        <Trans
                                            i18nKey="cliAuthorize.missingAgentScopes"
                                            components={{
                                                Bold: <b />,
                                                ApiCode: <code />,
                                                UserCode: <code />,
                                                ProjectCode: <code />,
                                                QueryCode: <code />,
                                            }}
                                            defaults="<Bold>Agent commands limited:</Bold> The CLI's <ApiCode>api</ApiCode> commands need <UserCode>user</UserCode>, <ProjectCode>project</ProjectCode>, and <QueryCode>query</QueryCode> permissions (read or write) to discover data and run queries."
                                        />
                                    </LemonBanner>
                                )}
                            </div>
                        )}

                        <LemonButton
                            type="primary"
                            status="alt"
                            htmlType="submit"
                            data-attr="cli-authorize-submit"
                            fullWidth
                            center
                            loading={isAuthorizeSubmitting}
                            size="large"
                            icon={<IconCode />}
                        >
                            {t('cliAuthorize.submit', { defaultValue: 'Authorize CLI' })}
                        </LemonButton>
                    </Form>
                </div>
            )}
        </BridgePage>
    )
}
