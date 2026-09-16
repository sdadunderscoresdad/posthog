import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { LemonDialog } from 'lib/lemon-ui/LemonDialog'
import { LemonInputSelect } from 'lib/lemon-ui/LemonInputSelect/LemonInputSelect'
import { LemonSkeleton } from 'lib/lemon-ui/LemonSkeleton'
import { timeZoneLabel } from 'lib/utils/timezones'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { teamLogic } from 'scenes/teamLogic'

export function TimezoneConfig({ displayWarning = true }: { displayWarning?: boolean }): JSX.Element {
    const { t } = useTranslation()
    const { preflight } = useValues(preflightLogic)
    const { currentTeam, timezone: currentTimezone, currentTeamLoading } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    if (!preflight?.available_timezones || !currentTeam) {
        return <LemonSkeleton className="w-1/2 h-4" />
    }
    const options = Object.entries(preflight.available_timezones).map(([tz, offset]) => ({
        key: tz,
        label: timeZoneLabel(tz, offset),
    }))

    return (
        <div className="max-w-160">
            <LemonInputSelect
                mode="single"
                placeholder={t('settings.environment.timezone.placeholder', { defaultValue: 'Select a time zone' })}
                disabled={currentTeamLoading || !!restrictedReason}
                value={[currentTeam.timezone]}
                popoverClassName="z-[1000]"
                virtualized
                onChange={([newTimezone]): void => {
                    // This is a string for a single-mode select, but typing is poor
                    if (!preflight?.available_timezones) {
                        throw new Error(
                            i18n.t('settings.environment.timezone.noneAvailable', {
                                defaultValue: 'No timezones are available',
                            })
                        )
                    }
                    const currentOffset = preflight.available_timezones[currentTimezone]
                    const newOffset = preflight.available_timezones[newTimezone]
                    if (currentOffset === newOffset || !displayWarning) {
                        updateCurrentTeam({ timezone: newTimezone })
                    } else {
                        LemonDialog.open({
                            title: t('settings.environment.timezone.confirmTitle', {
                                defaultValue: 'Change time zone to {{ timezone }}?',
                                timezone: timeZoneLabel(newTimezone, newOffset),
                            }),
                            description: (
                                <p className="max-w-120">
                                    <Trans
                                        i18nKey="settings.environment.timezone.confirmDescription"
                                        values={{
                                            current: timeZoneLabel(currentTimezone, currentOffset),
                                        }}
                                        components={{ Strong: <strong /> }}
                                        defaults="This time zone has an offset different from the current <Strong>{{ current }}</Strong>, so queries will need to be recalculated. There will be a difference in date-based time ranges, and in day/week/month buckets."
                                    />
                                </p>
                            ),
                            primaryButton: {
                                children: t('settings.environment.timezone.confirm', {
                                    defaultValue: 'Change time zone',
                                }),
                                onClick: () => updateCurrentTeam({ timezone: newTimezone }),
                            },
                            secondaryButton: {
                                children: t('settings.cancel', { defaultValue: 'Cancel' }),
                            },
                        })
                    }
                }}
                options={options}
                data-attr="timezone-select"
            />
        </div>
    )
}
