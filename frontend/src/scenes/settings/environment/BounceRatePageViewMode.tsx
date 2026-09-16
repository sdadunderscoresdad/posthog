import { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonRadio, LemonRadioOption } from 'lib/lemon-ui/LemonRadio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { teamLogic } from 'scenes/teamLogic'

import { HogQLQueryModifiers } from '~/queries/schema/schema-general'

type BounceRatePageViewMode = NonNullable<HogQLQueryModifiers['bounceRatePageViewMode']>

function buildBounceRatePageViewModeOptions({ t }: { t: TFunction }): LemonRadioOption<BounceRatePageViewMode>[] {
    return [
        {
            value: 'count_pageviews',
            label: (
                <>
                    <div>
                        {t('settings.environment.bounceRatePageViewMode.countPageviews', {
                            defaultValue: 'Counts pageviews',
                        })}
                    </div>
                    <div className="text-secondary">
                        <Trans
                            i18nKey="settings.environment.bounceRatePageViewMode.countPageviewsDescription"
                            components={{ code: <code /> }}
                            defaults="This is the default. Counts <code>$pageview</code> events in a session as part of the bounce rate calculation."
                        />
                    </div>
                </>
            ),
        },
        {
            value: 'uniq_urls',
            label: (
                <>
                    <div>
                        {t('settings.environment.bounceRatePageViewMode.countUniqueUrls', {
                            defaultValue: 'Counts unique urls visited',
                        })}
                    </div>
                    <div className="text-secondary">
                        {t('settings.environment.bounceRatePageViewMode.countUniqueUrlsDescription', {
                            defaultValue:
                                'Counts the number of unique url visited as part of the bounce rate calculation',
                        })}
                    </div>
                </>
            ),
        },
        {
            value: 'uniq_page_screen_autocaptures',
            label: (
                <>
                    <div>
                        {t('settings.environment.bounceRatePageViewMode.useUniqUpTo', { defaultValue: 'Use uniqUpTo' })}
                    </div>
                    <div className="text-secondary">
                        <Trans
                            i18nKey="settings.environment.bounceRatePageViewMode.useUniqUpToDescription"
                            components={{ code: <code /> }}
                            defaults="Uses the <code>uniqUpTo</code> function to count if the total unique pageviews + screen events + autocaptures is >= 2"
                        />
                    </div>
                </>
            ),
        },
    ]
}

export function BounceRatePageViewModeSetting(): JSX.Element {
    const { t } = useTranslation()
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)
    const { reportBounceRatePageViewModeUpdated } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const modeOptions = buildBounceRatePageViewModeOptions({ t }).map((o) => ({
        ...o,
        disabledReason: restrictedReason ?? undefined,
    }))
    const savedBounceRatePageViewMode =
        currentTeam?.modifiers?.bounceRatePageViewMode ??
        currentTeam?.default_modifiers?.bounceRatePageViewMode ??
        'count_pageviews'
    const [bounceRatePageViewMode, setBounceRatePageViewMode] =
        useState<BounceRatePageViewMode>(savedBounceRatePageViewMode)

    const handleChange = (mode: BounceRatePageViewMode): void => {
        updateCurrentTeam({ modifiers: { ...currentTeam?.modifiers, bounceRatePageViewMode: mode } })
        reportBounceRatePageViewModeUpdated(mode)
    }

    return (
        <>
            <LemonRadio value={bounceRatePageViewMode} onChange={setBounceRatePageViewMode} options={modeOptions} />
            <div className="mt-4">
                <LemonButton
                    type="primary"
                    onClick={() => handleChange(bounceRatePageViewMode)}
                    disabledReason={
                        bounceRatePageViewMode === savedBounceRatePageViewMode
                            ? t('settings.noChangesToSave', { defaultValue: 'No changes to save' })
                            : restrictedReason
                    }
                >
                    {t('settings.save', { defaultValue: 'Save' })}
                </LemonButton>
            </div>
        </>
    )
}
