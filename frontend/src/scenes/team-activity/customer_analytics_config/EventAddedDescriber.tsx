import { i18n } from 'lib/i18n/i18n'

import { ActionsNode, EventsNode, NodeKind } from '~/queries/schema/schema-general'

export const EventAddedDescriber = ({
    eventType,
    eventConfig,
}: {
    eventType: string
    eventConfig: EventsNode | ActionsNode
}): JSX.Element => {
    const eventDescription = getEventDescription(eventConfig)

    return (
        <>
            {i18n.t('teamActivity.added', { defaultValue: 'added' })} <strong>{eventType}</strong>:{' '}
            <code>{eventDescription}</code>
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
