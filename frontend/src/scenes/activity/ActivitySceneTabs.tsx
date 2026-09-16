import { useTranslation } from 'react-i18next'

import { LemonTabs } from 'lib/lemon-ui/LemonTabs'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { iconForType } from '~/layout/panel-layout/ProjectTree/defaultTree'
import { ActivityTab } from '~/types'

/**
 * Built on each render rather than kept as a module constant: a message read at import time is read
 * once, so it would keep the language the page happened to load in.
 */
function useActivityTabs(): { key: ActivityTab; label: JSX.Element; link: string }[] {
    const { t } = useTranslation()
    return [
        {
            key: ActivityTab.ExploreEvents,
            label: (
                <span className="flex items-center gap-1">
                    {iconForType(sceneConfigurations[Scene.ExploreEvents].iconType)}
                    {t('activity.tabs.events', { defaultValue: 'Events' })}
                </span>
            ),
            link: urls.activity(ActivityTab.ExploreEvents),
        },
        {
            key: ActivityTab.ExploreSessions,
            label: (
                <span className="flex items-center gap-1">
                    {iconForType(sceneConfigurations[Scene.ExploreSessions].iconType)}
                    {t('activity.tabs.sessions', { defaultValue: 'Sessions' })}
                </span>
            ),
            link: urls.activity(ActivityTab.ExploreSessions),
        },
        {
            key: ActivityTab.LiveEvents,
            label: (
                <span className="flex items-center gap-1">
                    {iconForType(sceneConfigurations[Scene.LiveEvents].iconType)}
                    {t('activity.tabs.live', { defaultValue: 'Live' })}
                </span>
            ),
            link: urls.activity(ActivityTab.LiveEvents),
        },
    ]
}

export const ActivitySceneTabs = ({ activeKey }: { activeKey: ActivityTab }): JSX.Element => {
    return <LemonTabs activeKey={activeKey} tabs={useActivityTabs()} sceneInset className="mb-3" />
}
