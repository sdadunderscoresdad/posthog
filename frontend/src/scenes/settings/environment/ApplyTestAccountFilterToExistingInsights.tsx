import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { LemonButton, Link } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonDialog } from 'lib/lemon-ui/LemonDialog'
import { teamLogic } from 'scenes/teamLogic'

import { applyTestAccountFilterLogic } from './applyTestAccountFilterLogic'

export function ApplyTestAccountFilterToExistingInsights(): JSX.Element {
    const { t } = useTranslation()
    const { applyToExistingInsights } = useActions(applyTestAccountFilterLogic)
    const { pendingEnabled, bulkSetResponseLoading } = useValues(applyTestAccountFilterLogic)
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const noFiltersReason = currentTeam?.test_account_filters?.length
        ? null
        : t('settings.environment.testAccountFilters.existingInsights.noFilters', {
              defaultValue: 'Add at least one filter above first',
          })
    const inFlightReason = bulkSetResponseLoading
        ? t('settings.environment.testAccountFilters.existingInsights.applying', {
              defaultValue: 'Applying your last change',
          })
        : null

    const confirm = (enabled: boolean): void => {
        const filterState = enabled
            ? t('settings.environment.testAccountFilters.states.on', { defaultValue: 'on' })
            : t('settings.environment.testAccountFilters.states.off', { defaultValue: 'off' })
        LemonDialog.open({
            title: t('settings.environment.testAccountFilters.existingInsights.confirmTitle', {
                defaultValue: 'Turn the internal and test user filter {{ state }} for every insight in this project?',
                state: filterState,
            }),
            width: 560,
            content: (
                <div className="flex flex-col gap-3">
                    <p className="mb-0">
                        {t('settings.environment.testAccountFilters.existingInsights.confirmBody', {
                            defaultValue:
                                'Every insight in this project will {{ action }} filtering out internal and test users, including insights other people created. This replaces whatever each insight is set to now.',
                            action: enabled
                                ? t('settings.environment.testAccountFilters.states.start', { defaultValue: 'start' })
                                : t('settings.environment.testAccountFilters.states.stop', { defaultValue: 'stop' }),
                        })}
                    </p>
                    <div>
                        <p className="mb-1">
                            {t('settings.environment.testAccountFilters.existingInsights.leftAloneLeadIn', {
                                defaultValue: 'Left as they are:',
                            })}
                        </p>
                        <ul className="list-disc pl-5 mb-0">
                            <li>
                                {t('settings.environment.testAccountFilters.existingInsights.leftAloneSql', {
                                    defaultValue: 'SQL insights, which have no such filter',
                                })}
                            </li>
                            <li>
                                <Trans
                                    i18nKey="settings.environment.testAccountFilters.existingInsights.leftAloneNoEdit"
                                    components={{
                                        DocsLink: <Link to="https://posthog.com/docs/settings/access-control" />,
                                    }}
                                    defaults="Insights you can't edit. An organization admin can run this to cover those, or you can ask for edit access to them. <DocsLink>About access control</DocsLink>"
                                />
                            </li>
                            <li>
                                {t('settings.environment.testAccountFilters.existingInsights.leftAloneOldFormat', {
                                    defaultValue:
                                        'Insights saved in an older format. Open and save one to convert it, then run this again.',
                                })}
                            </li>
                        </ul>
                    </div>
                    <p className="mb-0">
                        {t('settings.environment.testAccountFilters.existingInsights.dashboardsNote', {
                            defaultValue:
                                "Dashboards follow their insights, unless a dashboard sets its own override. The default for new insights doesn't change.",
                        })}
                    </p>
                    <LemonBanner type="warning">
                        <Trans
                            i18nKey="settings.environment.testAccountFilters.existingInsights.noBulkUndo"
                            values={{ state: filterState }}
                            defaults="There's no bulk undo. Running it the other way later would set every insight to {{ state }}, not restore what each one had before. To get a single insight back, check its activity log for the previous setting."
                        />
                    </LemonBanner>
                </div>
            ),
            primaryButton: {
                children: t('settings.environment.testAccountFilters.existingInsights.applyButton', {
                    defaultValue: 'Turn the filter {{ state }}',
                    state: filterState,
                }),
                onClick: () => applyToExistingInsights(enabled),
            },
            secondaryButton: { children: t('settings.cancel', { defaultValue: 'Cancel' }) },
        })
    }

    return (
        <div>
            {/* Sized below the settings section's own h2, so this reads as part of it rather than a sibling. */}
            <h3 className="text-sm font-semibold mb-1">
                {t('settings.environment.testAccountFilters.existingInsights.heading', {
                    defaultValue: 'Existing insights',
                })}
            </h3>
            <p className="text-secondary text-sm">
                {t('settings.environment.testAccountFilters.existingInsights.description', {
                    defaultValue:
                        "Turn the internal and test user filter on or off for every insight in this project. This doesn't change the default for new insights.",
                })}
            </p>
            <div className="flex gap-2">
                {[true, false].map((enabled) => (
                    <LemonButton
                        key={String(enabled)}
                        type="secondary"
                        size="small"
                        data-attr={`apply-test-account-filter-to-existing-insights-${enabled ? 'on' : 'off'}`}
                        loading={bulkSetResponseLoading && pendingEnabled === enabled}
                        disabled={currentTeamLoading}
                        disabledReason={restrictedReason ?? noFiltersReason ?? inFlightReason}
                        onClick={() => confirm(enabled)}
                    >
                        {enabled
                            ? t('settings.environment.testAccountFilters.existingInsights.turnOn', {
                                  defaultValue: 'Turn on for existing insights',
                              })
                            : t('settings.environment.testAccountFilters.existingInsights.turnOff', {
                                  defaultValue: 'Turn off for existing insights',
                              })}
                    </LemonButton>
                ))}
            </div>
        </div>
    )
}
