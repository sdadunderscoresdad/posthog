import type { TFunction } from 'i18next'

/**
 * Built from `t` rather than kept as a constant, because a message read at import time keeps whatever
 * language the module happened to load in.
 */
export function orgAdminRequiredTooltip(t: TFunction): string {
    return t('settings.organization.adminRequired', {
        defaultValue: 'You must be an admin or owner of your organization to change this setting',
    })
}
