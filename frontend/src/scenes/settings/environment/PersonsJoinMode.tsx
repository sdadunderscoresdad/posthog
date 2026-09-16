import type { TFunction } from 'i18next'
import { useActions } from 'kea'
import { useTranslation } from 'react-i18next'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonRadioOption } from 'lib/lemon-ui/LemonRadio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { HogQLQueryModifiers } from '~/queries/schema/schema-general'

import { TeamSettingRadio } from '../components/TeamSettingRadio'

type PersonsJoinModeType = NonNullable<HogQLQueryModifiers['personsJoinMode']>

/** Built from `t`, so the option labels follow a language change. */
function personsJoinOptions(t: TFunction): LemonRadioOption<PersonsJoinModeType>[] {
    return [
        {
            value: 'inner',
            label: (
                <>
                    <div>
                        {t('settings.environment.personsJoinMode.innerLabel', { defaultValue: 'Does an inner join' })}
                    </div>
                    <div className="text-secondary">
                        {t('settings.environment.personsJoinMode.innerDescription', {
                            defaultValue: 'This is the default. You want this one unless you know what you are doing.',
                        })}
                    </div>
                </>
            ),
        },
        {
            value: 'left',
            label: (
                <>
                    <div>
                        {t('settings.environment.personsJoinMode.leftLabel', { defaultValue: 'Does a left join.' })}
                    </div>
                    <div className="text-secondary">
                        {t('settings.environment.personsJoinMode.leftDescription', {
                            defaultValue: 'Experimental mode for personless events',
                        })}
                    </div>
                </>
            ),
        },
    ]
}

export function PersonsJoinMode(): JSX.Element {
    const { t } = useTranslation()
    const { reportPersonsJoinModeUpdated } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })
    const options = personsJoinOptions(t).map((o) => ({
        ...o,
        disabledReason: restrictedReason ?? undefined,
    }))

    return (
        <TeamSettingRadio
            field="modifiers.personsJoinMode"
            options={options}
            defaultValue="inner"
            onSave={reportPersonsJoinModeUpdated}
        />
    )
}
