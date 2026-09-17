import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

const formattedName = (name?: string | null): string | JSX.Element => {
    const displayName = name

    return <strong>{displayName}</strong>
}

const getContextDescription = (context: any): JSX.Element | null => {
    if (!context) {
        return null
    }

    if (context.insight_id && context.insight_short_id) {
        return (
            <>
                {' '}
                {i18n.t('alertActivity.forInsight', { defaultValue: 'for insight' })}{' '}
                <Link to={urls.insightView(context.insight_short_id)}>
                    {context.insight_name || context.insight_short_id}
                </Link>
            </>
        )
    }

    return null
}

export function alertConfigurationActivityDescriber(
    logItem: ActivityLogItem,
    asNotification?: boolean
): HumanizedChange {
    if (logItem.scope != 'AlertConfiguration') {
        console.error('alert configuration describer received a non-alert-configuration activity')
        return { description: null }
    }

    if (logItem.activity == 'created') {
        const contextDesc = getContextDescription(logItem?.detail?.context)

        if (logItem.detail?.type === 'alert_subscription_change') {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('alertActivity.subscriberAdded', {
                            defaultValue: 'added {{ subscriber }} as a subscriber for alert {{ alert }}',
                            subscriber: `${logItem?.detail?.context?.subscriber_name} (${logItem?.detail?.context?.subscriber_email})`,
                            alert: logItem?.detail?.context?.alert_name,
                        })}
                        {contextDesc}
                    </>
                ),
            }
        }

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('alertActivity.created', { defaultValue: 'created the alert' })}{' '}
                    {formattedName(logItem?.detail.name)}
                    {contextDesc}
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        const contextDesc = getContextDescription(logItem?.detail?.context)

        if (logItem.detail?.type === 'alert_subscription_change') {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('alertActivity.subscriberRemoved', {
                            defaultValue: 'removed {{ subscriber }} as a subscriber from alert {{ alert }}',
                            subscriber: `${logItem?.detail?.context?.subscriber_name} (${logItem?.detail?.context?.subscriber_email})`,
                            alert: logItem?.detail?.context?.alert_name,
                        })}
                        {contextDesc}
                    </>
                ),
            }
        }

        const displayName =
            logItem.detail.name || i18n.t('alertActivity.fallbackName', { defaultValue: 'Alert Configuration' })
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('alertActivity.deleted', { defaultValue: 'deleted the alert:' })} {displayName}
                    {contextDesc}
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        const contextDesc = getContextDescription(logItem?.detail?.context)

        if (logItem.detail?.type === 'threshold_change') {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('alertActivity.thresholdUpdated', {
                            defaultValue: 'updated the threshold for alert {{ alert }}',
                            alert: logItem?.detail?.context?.alert_name,
                        })}
                        {contextDesc}
                    </>
                ),
            }
        }

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('alertActivity.updated', { defaultValue: 'updated the alert' })}{' '}
                    {formattedName(logItem?.detail.name)}
                    {contextDesc}
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, formattedName(logItem?.detail.name))
}
