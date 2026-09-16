import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import posthog from 'posthog-js'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { LemonTag } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonRadio, LemonRadioOption } from 'lib/lemon-ui/LemonRadio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { teamLogic } from 'scenes/teamLogic'

import { HogQLQueryModifiers } from '~/queries/schema/schema-general'

type PoEMode = NonNullable<HogQLQueryModifiers['personsOnEventsMode']>

function poeOptions(t: TFunction): LemonRadioOption<PoEMode>[] {
    return [
        {
            value: 'person_id_override_properties_on_events',
            label: (
                <span className="inline-flex items-center gap-1.5">
                    {t('settings.environment.personsOnEvents.eventTimeLabel', {
                        defaultValue: 'Use person properties from the time of the event',
                    })}
                    <LemonTag>
                        {t('settings.environment.personsOnEvents.recommended', { defaultValue: 'RECOMMENDED' })}
                    </LemonTag>
                </span>
            ),
            description: (
                <>
                    <Trans
                        i18nKey="settings.environment.personsOnEvents.eventTimeDescription"
                        components={{ em: <em /> }}
                        defaults="Fast queries. If the person property is updated, query results on past data <em>won't</em> change."
                    />
                </>
            ),
        },
        {
            value: 'person_id_override_properties_joined',
            label: t('settings.environment.personsOnEvents.queryTimeLabel', {
                defaultValue: 'Use person properties as of running the query',
            }),
            description: (
                <>
                    <Trans
                        i18nKey="settings.environment.personsOnEvents.queryTimeDescription"
                        components={{ em: <em /> }}
                        defaults="Slower queries. If the person property is updated, query results on past data <em>will</em> change accordingly."
                    />
                </>
            ),
        },
        {
            value: 'person_id_no_override_properties_on_events',
            label: t('settings.environment.personsOnEvents.idsEventTimeLabel', {
                defaultValue: 'Use person IDs and person properties from the time of the event',
            }),
            description: (
                <>
                    <Trans
                        i18nKey="settings.environment.personsOnEvents.idsEventTimeDescription"
                        components={{ em: <em />, Span: <span className="underline" /> }}
                        defaults="Fastest queries, <Span>but funnels and unique user counts will be inaccurate</Span>. If the person property is updated, query results on past data <em>won't</em> change."
                    />
                </>
            ),
        },
    ]
}

export function PersonsOnEvents(): JSX.Element {
    const { t } = useTranslation()
    const { updateCurrentTeam } = useActions(teamLogic)
    const { reportPoEModeUpdated } = useActions(eventUsageLogic)
    const { currentTeam } = useValues(teamLogic)
    const savedPoEMode: PoEMode =
        currentTeam?.modifiers?.personsOnEventsMode ?? currentTeam?.default_modifiers?.personsOnEventsMode ?? 'disabled'
    const [poeMode, setPoeMode] = useState<PoEMode>(savedPoEMode)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })
    const options = poeOptions(t).map((o) => ({ ...o, disabledReason: restrictedReason ?? undefined }))

    const handleChange = (mode: PoEMode): void => {
        updateCurrentTeam({ modifiers: { ...currentTeam?.modifiers, personsOnEventsMode: mode } })
        posthog.capture(
            i18n.t('settings.environment.personsOnEvents.changed', {
                defaultValue: 'user changed personsOnEventsMode setting',
            }),
            { personsOnEventsMode: mode }
        )
        reportPoEModeUpdated(mode)
    }

    return (
        <>
            <LemonRadio value={poeMode} onChange={setPoeMode} options={options} />
            <div className="mt-4">
                <LemonButton
                    type="primary"
                    onClick={() => handleChange(poeMode)}
                    disabledReason={
                        poeMode === savedPoEMode
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
