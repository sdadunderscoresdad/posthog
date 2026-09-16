import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSwitch } from '@posthog/lemon-ui'

import { webAnalyticsAchievementsPreferencesLogic } from 'scenes/web-analytics/achievements/webAnalyticsAchievementsPreferencesLogic'

export function WebAnalyticsAchievementsSetting(): JSX.Element {
    const { t } = useTranslation()
    const { achievementsOptOut, preferencesLoading } = useValues(webAnalyticsAchievementsPreferencesLogic)
    const { setAchievementsOptOut } = useActions(webAnalyticsAchievementsPreferencesLogic)

    return (
        <LemonSwitch
            onChange={(checked) => setAchievementsOptOut({ optedOut: !checked })}
            checked={!achievementsOptOut}
            loading={preferencesLoading}
            label={t('settings.user.webAnalyticsAchievements', { defaultValue: 'Show Web analytics achievements' })}
            bordered
        />
    )
}
