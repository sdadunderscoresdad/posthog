import { Trans } from 'react-i18next'

import {
    ActivityChange,
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'

// The billing service sets detail.name; map it to a short verb phrase for the feed. The map is
// rebuilt per call, because one read at import would keep the language the app started in.
function billingActions(): Record<string, string> {
    const canceledTrial = i18n.t('billingActivity.actions.canceledTrial', { defaultValue: 'canceled a trial' })
    return {
        'Billing spend limits': i18n.t('billingActivity.actions.spendLimits', {
            defaultValue: 'updated the spend limits',
        }),
        'Billing next-period limit reset': i18n.t('billingActivity.actions.nextPeriodLimitReset', {
            defaultValue: 'reset a next-period spend limit',
        }),
        'Billing products activated': i18n.t('billingActivity.actions.productsActivated', {
            defaultValue: 'added products',
        }),
        'Billing products deactivated': i18n.t('billingActivity.actions.productsDeactivated', {
            defaultValue: 'removed products',
        }),
        'Billing plan switched': i18n.t('billingActivity.actions.planSwitched', { defaultValue: 'switched plan' }),
        'Billing trial activated': i18n.t('billingActivity.actions.trialActivated', {
            defaultValue: 'started a trial',
        }),
        'Billing trial extended': i18n.t('billingActivity.actions.trialExtended', { defaultValue: 'extended a trial' }),
        'Billing trial canceled': canceledTrial,
        // Alias kept so rows written before the billing service adopted American spelling still render.
        'Billing trial cancelled': canceledTrial,
        'Billing credits purchased': i18n.t('billingActivity.actions.creditsPurchased', {
            defaultValue: 'purchased credits',
        }),
    }
}

const formatValue = (value: ActivityChange['before']): string =>
    value === null || value === undefined ? i18n.t('billingActivity.none', { defaultValue: 'none' }) : `${value}`

const describeChange = (change: ActivityChange): string | null => {
    if (!change.field) {
        return null
    }
    switch (change.action) {
        case 'changed':
            return i18n.t('billingActivity.change.changed', {
                field: change.field,
                before: formatValue(change.before),
                after: formatValue(change.after),
                defaultValue: '{{ field }} from {{ before }} to {{ after }}',
            })
        case 'created':
            return i18n.t('billingActivity.change.created', {
                field: change.field,
                value: formatValue(change.after),
                defaultValue: '{{ field }}: {{ value }}',
            })
        case 'deleted':
            return i18n.t('billingActivity.change.deleted', {
                field: change.field,
                value: formatValue(change.before),
                defaultValue: '{{ field }}: {{ value }}',
            })
        default:
            return change.field
    }
}

const describeChanges = (changes: ActivityChange[]): string | null => {
    if (changes.length === 1) {
        return describeChange(changes[0])
    }
    const fields = changes.map((change) => change.field).filter((field): field is string => !!field)
    return fields.length ? fields.join(', ') : null
}

export function billingActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    // Every billing_activity row is written as an "updated" activity; fall back for anything else.
    if (logItem.activity !== 'updated') {
        return defaultDescriber(logItem, asNotification)
    }

    const action =
        billingActions()[logItem.detail.name || ''] ||
        i18n.t('billingActivity.updatedBilling', { defaultValue: 'updated billing' })
    const detail = describeChanges(logItem.detail.changes || [])

    return {
        description: (
            <>
                <ActivityLogUserName logItem={logItem} />{' '}
                <Trans
                    i18nKey="billingActivity.inBilling"
                    values={{ action }}
                    components={{ BillingLink: <Link to={urls.organizationBilling()} /> }}
                    defaults="{{ action }} in <BillingLink>billing</BillingLink>"
                />
                {detail ? ` (${detail})` : ''}
            </>
        ),
    }
}
