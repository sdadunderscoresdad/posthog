import { ActivityChange, ChangeMapping } from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'
import { objectsEqual } from 'lib/utils/objects'

import { RevenueAnalyticsConfig, RevenueAnalyticsEventItem } from '~/queries/schema/schema-general'

export const revenueAnalyticsConfigurationDescriber = (change?: ActivityChange): ChangeMapping | null => {
    if (!change) {
        return null
    }

    const before = (change.before ?? {}) as RevenueAnalyticsConfig
    const after = (change.after ?? {}) as RevenueAnalyticsConfig

    const eventConfigDescriptions = revenueAnalyticsEventConfigDescriber(before, after) ?? []
    const filterTestAccountsConfigDescriptions = revenueAnalyticsFilterTestAccountsConfigDescriber(before, after) ?? []

    return {
        description: [...eventConfigDescriptions, ...filterTestAccountsConfigDescriptions],
    }
}

const revenueAnalyticsEventConfigDescriber = (
    before: RevenueAnalyticsConfig,
    after: RevenueAnalyticsConfig
): JSX.Element[] | null => {
    const diff: Record<string, { before?: RevenueAnalyticsEventItem; after?: RevenueAnalyticsEventItem }> = {}

    for (const event of before.events) {
        diff[event.eventName] ||= {}
        diff[event.eventName].before = event
    }

    for (const event of after.events) {
        diff[event.eventName] ||= {}
        diff[event.eventName].after = event
    }

    const descriptions = []
    for (const eventName in diff) {
        const { before, after } = diff[eventName]

        if (before && !after) {
            descriptions.push(
                <>
                    {i18n.t('teamActivity.removedThe', { defaultValue: 'removed the' })}{' '}
                    {i18n.t('teamActivity.revenueAnalyticsEvent', { defaultValue: 'Revenue analytics event' })}{' '}
                    <code>{eventName}</code>
                </>
            )
        } else if (!before && after) {
            descriptions.push(
                <>
                    {i18n.t('teamActivity.addedThe', { defaultValue: 'added the' })}{' '}
                    {i18n.t('teamActivity.revenueAnalyticsEvent', { defaultValue: 'Revenue analytics event' })}{' '}
                    <code>{eventName}</code>
                </>
            )
        } else if (before && after) {
            if (before.currencyAwareDecimal !== after.currencyAwareDecimal) {
                descriptions.push(
                    <>
                        {after.currencyAwareDecimal
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
                        {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
                        {i18n.t('teamActivity.revenueAnalyticsEvent', { defaultValue: 'Revenue analytics event' })}{' '}
                        <code>{eventName}</code>{' '}
                        {i18n.t('teamActivity.currencyAwareConfiguration', {
                            defaultValue: 'currency aware configuration',
                        })}
                    </>
                )
            }

            if (before.revenueProperty !== after.revenueProperty) {
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.updatedThe', { defaultValue: 'updated the' })}{' '}
                        {i18n.t('teamActivity.revenueAnalyticsEvent', { defaultValue: 'Revenue analytics event' })}{' '}
                        <code>{eventName}</code>{' '}
                        {i18n.t('teamActivity.revenuePropertyTo', { defaultValue: 'revenue property to' })}{' '}
                        <code>{after.revenueProperty}</code>
                    </>
                )
            }

            if (!objectsEqual(before.revenueCurrencyProperty, after.revenueCurrencyProperty)) {
                const type = after.revenueCurrencyProperty.property
                    ? i18n.t('teamActivity.eventProperty', { defaultValue: 'event property' })
                    : i18n.t('teamActivity.staticCurrency', { defaultValue: 'static currency' })
                const value = after.revenueCurrencyProperty.property ?? after.revenueCurrencyProperty.static
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.updatedThe', { defaultValue: 'updated the' })}{' '}
                        {i18n.t('teamActivity.revenueAnalyticsEvent', { defaultValue: 'Revenue analytics event' })}{' '}
                        <code>{eventName}</code>{' '}
                        {i18n.t('teamActivity.revenueCurrencyPropertyTo', {
                            defaultValue: 'revenue currency property to',
                        })}{' '}
                        {type} <code>{value}</code>
                    </>
                )
            }
        }
    }

    return descriptions
}

const revenueAnalyticsFilterTestAccountsConfigDescriber = (
    before: RevenueAnalyticsConfig,
    after: RevenueAnalyticsConfig
): JSX.Element[] | null => {
    if (before.filter_test_accounts === after.filter_test_accounts) {
        return null
    }

    return [
        <>
            {after.filter_test_accounts
                ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
            {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
            <em>
                {i18n.t('teamActivity.filterOutInternalAndTestUsers', {
                    defaultValue: 'filter out internal and test users',
                })}
            </em>{' '}
            {i18n.t('teamActivity.configurationForRevenueAnalytics', {
                defaultValue: 'configuration for Revenue analytics',
            })}
        </>,
    ]
}
