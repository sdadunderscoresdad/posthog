import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconRefresh } from '@posthog/icons'
import { LemonButton, LemonDialog, LemonInput, LemonLabel, LemonSkeleton } from '@posthog/lemon-ui'

import { AuthorizedUrlList } from 'lib/components/AuthorizedUrlList/AuthorizedUrlList'
import { AuthorizedUrlListType } from 'lib/components/AuthorizedUrlList/authorizedUrlListLogic'
import { CodeSnippet } from 'lib/components/CodeSnippet'
import { JSSnippet } from 'lib/components/JSSnippet'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { Link } from 'lib/lemon-ui/Link'
import { userHasAccess } from 'lib/utils/accessControlUtils'
import { inStorybook, inStorybookTestRunner } from 'lib/utils/dom'
import { organizationLogic } from 'scenes/organizationLogic'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { isProjectNameTaken } from 'scenes/project/isProjectNameTaken'
import { projectLogic } from 'scenes/projectLogic'
import { teamLogic } from 'scenes/teamLogic'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { BusinessModelConfig } from './BusinessModelConfig'
import { TimezoneConfig } from './TimezoneConfig'
import { WeekStartConfig } from './WeekStartConfig'

export function TeamDisplayName(): JSX.Element {
    const { t } = useTranslation()
    const nameTakenReason = t('settings.environment.team.displayName.nameTaken', {
        defaultValue: 'There is already a project with this name in this organization. Choose a different name.',
    })
    const { currentTeamLoading } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentProject } = useValues(projectLogic)
    const { currentOrganization } = useValues(organizationLogic)
    const [name, setName] = useState(currentProject?.name || '')
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    // A rename patches the project, so the uniqueness rule applies to the project's name. That can
    // differ from the environment's name, which is what `teamLogic` holds.
    const trimmedName = name.trim()
    const nameTaken = isProjectNameTaken(trimmedName, currentOrganization?.projects, {
        excludeProjectId: currentProject?.id,
        currentName: currentProject?.name,
    })
    const renameDisabledReason =
        restrictedReason ||
        (!trimmedName && t('settings.environment.team.displayName.enterName', { defaultValue: 'Enter a name' })) ||
        (!currentProject &&
            t('settings.environment.team.displayName.loadingProject', { defaultValue: 'Loading the project' })) ||
        (trimmedName === currentProject?.name &&
            t('settings.environment.team.displayName.sameName', {
                defaultValue: "This is already the project's name",
            })) ||
        (nameTaken && nameTakenReason) ||
        null

    return (
        <div className="deprecated-space-y-4 max-w-160">
            <LemonField.Pure error={nameTaken ? nameTakenReason : undefined}>
                <LemonInput value={name} onChange={setName} disabledReason={restrictedReason} />
            </LemonField.Pure>
            <LemonButton
                type="primary"
                onClick={() => updateCurrentTeam({ name: trimmedName })}
                disabledReason={renameDisabledReason}
                loading={currentTeamLoading}
            >
                {t('settings.environment.team.displayName.rename', { defaultValue: 'Rename project' })}
            </LemonButton>
        </div>
    )
}

export function WebSnippet(): JSX.Element {
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)

    return currentTeamLoading && !currentTeam ? (
        <div className="deprecated-space-y-4">
            <LemonSkeleton className="w-1/2 h-4" />
            <LemonSkeleton repeat={3} />
        </div>
    ) : (
        <JSSnippet />
    )
}

export function TeamVariables(): JSX.Element {
    const { t } = useTranslation()
    const { currentTeam, isTeamTokenResetAvailable } = useValues(teamLogic)
    const { resetToken } = useActions(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })
    const { preflight } = useValues(preflightLogic)

    const region = preflight?.region

    const RESET_CONFIRMATION = 'RESET'

    const openDialog = (): void => {
        LemonDialog.openForm({
            maxWidth: 480,
            title: t('settings.environment.team.variables.resetTitle', {
                defaultValue: 'Reset project token?',
            }),
            description: t('settings.environment.team.variables.resetDescription', {
                defaultValue:
                    'This will immediately invalidate your current project token. Any apps, websites, or services using it will stop sending data to PostHog until you update them with the new token. This action cannot be undone.',
            }),
            initialValues: { confirmation: '' },
            content: (
                <LemonField name="confirmation">
                    <LemonInput
                        placeholder={t('settings.environment.team.variables.typeToConfirm', {
                            defaultValue: 'Type "{{ phrase }}" to confirm',
                            phrase: RESET_CONFIRMATION,
                        })}
                        autoFocus
                        data-attr="reset-api-key-confirmation-input"
                    />
                </LemonField>
            ),
            errors: {
                confirmation: (value: string) =>
                    (value || '').toUpperCase() !== RESET_CONFIRMATION
                        ? t('settings.environment.team.variables.typeToConfirm', {
                              defaultValue: 'Type "{{ phrase }}" to confirm',
                              phrase: RESET_CONFIRMATION,
                          })
                        : undefined,
            },
            primaryButtonProps: {
                status: 'danger',
                children: t('settings.environment.team.variables.resetToken', { defaultValue: 'Reset token' }),
            },
            onSubmit: () => {
                resetToken()
            },
        })
    }

    return (
        <div className="space-y-4 max-w-200">
            <div className="border rounded p-4 space-y-3 bg-bg-light">
                <LemonLabel className="mb-0">
                    {t('settings.environment.team.variables.tokenLabel', { defaultValue: 'Project token' })}
                </LemonLabel>
                <CodeSnippet
                    compact
                    thing={t('settings.environment.team.variables.tokenThing', { defaultValue: 'project token' })}
                    actions={
                        isTeamTokenResetAvailable ? (
                            <LemonButton
                                icon={<IconRefresh />}
                                disabledReason={restrictedReason}
                                noPadding
                                onClick={openDialog}
                                tooltip={t('settings.environment.team.variables.resetToken', {
                                    defaultValue: 'Reset token',
                                })}
                            />
                        ) : undefined
                    }
                >
                    {currentTeam?.api_token || ''}
                </CodeSnippet>
                <p className="text-muted text-xs mb-0">
                    <Trans
                        i18nKey="settings.environment.team.variables.tokenHint"
                        components={{
                            LibrariesLink: <Link to="https://posthog.com/docs/libraries" />,
                        }}
                        defaults="Write-only key for use in <LibrariesLink>client libraries</LibrariesLink>. Safe to use in public apps."
                    />
                </p>
            </div>

            <div className="flex gap-4 flex-wrap">
                <div className="border rounded p-4 space-y-3 bg-bg-light flex-1 min-w-60">
                    <LemonLabel className="mb-0">
                        {t('settings.environment.team.variables.projectIdLabel', { defaultValue: 'Project ID' })}
                    </LemonLabel>
                    <CodeSnippet
                        compact
                        thing={t('settings.environment.team.variables.projectIdThing', { defaultValue: 'project ID' })}
                    >
                        {String(currentTeam?.id || '')}
                    </CodeSnippet>
                    <p className="text-muted text-xs mb-0">
                        <Trans
                            i18nKey="settings.environment.team.variables.projectIdHint"
                            components={{ ApiLink: <Link to="https://posthog.com/docs/api" /> }}
                            defaults="Use this ID in the <ApiLink>PostHog API</ApiLink>."
                        />
                    </p>
                </div>
                {region ? (
                    <div className="border rounded p-4 space-y-3 bg-bg-light flex-1 min-w-60">
                        <LemonLabel className="mb-0">
                            {t('settings.environment.team.variables.regionLabel', { defaultValue: 'Region' })}
                        </LemonLabel>
                        <CodeSnippet
                            compact
                            thing={t('settings.environment.team.variables.regionThing', {
                                defaultValue: 'project region',
                            })}
                        >
                            {`${region} Cloud`}
                        </CodeSnippet>
                        <p className="text-muted text-xs mb-0">
                            {t('settings.environment.team.variables.regionHint', {
                                defaultValue: 'Where your PostHog data is hosted.',
                            })}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export function TeamTimezone({ displayWarning = true }: { displayWarning?: boolean }): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col gap-2 flex-1 max-w-120">
                <LemonLabel id="timezone">
                    {t('settings.environment.team.timezone.label', { defaultValue: 'Time zone' })}
                </LemonLabel>
                <TimezoneConfig displayWarning={displayWarning} />
            </div>
            <div className="flex flex-col gap-2">
                <LemonLabel id="timezone">
                    {t('settings.environment.team.timezone.weekStartsOn', { defaultValue: 'Week starts on' })}
                </LemonLabel>
                <WeekStartConfig displayWarning={displayWarning} />
            </div>
        </div>
    )
}

export function TeamBusinessModel(): JSX.Element {
    const { t } = useTranslation()
    return (
        <div className="deprecated-space-y-2">
            <LemonLabel id="business-model">
                {t('settings.environment.team.businessModel.label', { defaultValue: 'Business model' })}
            </LemonLabel>
            <BusinessModelConfig />
        </div>
    )
}

export function TeamAuthorizedURLs(): JSX.Element {
    // In Storybook, allow editing by default since we don't have full app context
    const canEdit =
        inStorybook() || inStorybookTestRunner()
            ? true
            : userHasAccess(AccessControlResourceType.WebAnalytics, AccessControlLevel.Editor)

    return (
        <AuthorizedUrlList
            type={AuthorizedUrlListType.WEB_ANALYTICS}
            allowWildCards={false}
            allowAdd={canEdit}
            allowDelete={canEdit}
            displaySuggestions={canEdit}
        />
    )
}
