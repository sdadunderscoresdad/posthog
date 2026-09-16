import { i18n } from 'lib/i18n/i18n'

import { ActionsNode, EventsNode, NodeKind } from '~/queries/schema/schema-general'

export const EventChangedDescriber = ({
    eventType,
    beforeConfig,
    afterConfig,
}: {
    eventType: string
    beforeConfig: EventsNode | ActionsNode
    afterConfig: EventsNode | ActionsNode
}): JSX.Element => {
    const beforeDescription = getEventDescription(beforeConfig)
    const afterDescription = getEventDescription(afterConfig)

    return (
        <>
            {i18n.t('teamActivity.changed', { defaultValue: 'changed' })} <strong>{eventType}</strong>{' '}
            {i18n.t('teamActivity.from', { defaultValue: 'from' })} <code>{beforeDescription}</code>{' '}
            {i18n.t('teamActivity.to', { defaultValue: 'to' })} <code>{afterDescription}</code>
        </>
    )
}

function getEventDescription(eventConfig: EventsNode | ActionsNode): string {
    if (eventConfig.kind === NodeKind.EventsNode) {
        return eventConfig.event || i18n.t('teamActivity.customerAnalytics.allEvents', { defaultValue: 'All events' })
    } else if (eventConfig.kind === NodeKind.ActionsNode) {
        return i18n.t('teamActivity.customerAnalytics.actionNumber', {
            defaultValue: 'Action #{{ id }}',
            id: eventConfig.id,
        })
    }
    return i18n.t('teamActivity.customerAnalytics.unknown', { defaultValue: 'Unknown' })
}
