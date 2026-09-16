import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

const nameOrLinkToTour = (id?: string | null, name?: string | null): string | JSX.Element => {
    const displayName = name || i18n.t('productTour.emptyName', { defaultValue: '(empty string)' })
    return id ? <Link to={urls.productTour(id)}>{displayName}</Link> : displayName
}

export function productTourActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope !== 'ProductTour') {
        console.error('product tour describer received a non-product tour activity')
        return { description: null }
    }

    if (logItem.activity === 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('productTour.created', { defaultValue: 'created the product tour:' })}{' '}
                    {nameOrLinkToTour(logItem?.item_id, logItem?.detail.name)}
                </>
            ),
        }
    }

    if (logItem.activity === 'updated') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('productTour.updated', { defaultValue: 'updated the product tour:' })}{' '}
                    {nameOrLinkToTour(logItem?.item_id, logItem?.detail.name)}
                </>
            ),
        }
    }

    if (logItem.activity === 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('productTour.deleted', { defaultValue: 'deleted the product tour:' })}{' '}
                    {nameOrLinkToTour(logItem?.item_id, logItem?.detail.name)}
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, nameOrLinkToTour(logItem?.item_id, logItem?.detail.name))
}
