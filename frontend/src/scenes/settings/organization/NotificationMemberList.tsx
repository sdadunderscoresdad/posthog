import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonButton, LemonInput, LemonSegmentedButton, LemonTag } from '@posthog/lemon-ui'

import { membershipLevelToName } from 'lib/utils/permissioning'

import type { NotificationConcept, NotificationRuleValue } from '../shared/notificationSettingDescriptors'
import { MEMBERS_PER_PAGE, listKey, notificationGovernanceLogic, ruleFor } from './notificationGovernanceLogic'

function ruleOptions(t: TFunction): { value: NotificationRuleValue; label: string }[] {
    return [
        {
            value: 'none',
            label: t('settings.organization.notifications.rules.none', { defaultValue: 'No override' }),
        },
        { value: 'on', label: t('settings.organization.notifications.rules.on', { defaultValue: 'Always on' }) },
        { value: 'off', label: t('settings.organization.notifications.rules.off', { defaultValue: 'Always off' }) },
    ]
}

export function NotificationMemberList({
    concept,
    scopeId,
}: {
    concept: NotificationConcept
    scopeId: string
}): JSX.Element {
    const { t } = useTranslation()
    const { pendingRules, savedRules, savingChanges, memberListFor } = useValues(notificationGovernanceLogic)
    const { setRule, setRuleForMany, setListQuery, setListPage } = useActions(notificationGovernanceLogic)

    const list = listKey(concept.setting, scopeId)
    const { query, searching, total, matching, shown, editableIds, page, pages, start } = memberListFor(list)

    return (
        <div className="deprecated-space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <LemonInput
                    type="search"
                    size="small"
                    placeholder={t('settings.organization.notifications.searchMembers', {
                        defaultValue: 'Search members',
                    })}
                    value={query}
                    onChange={(next) => setListQuery(list, next)}
                    className="w-56"
                    data-attr="notification-governance-search"
                />
                <span className="text-muted text-xs ml-auto">
                    {searching
                        ? t('settings.organization.notifications.setMatching', {
                              defaultValue: 'Set {{ count }} matching member to',
                              defaultValue_other: 'Set {{ count }} matching members to',
                              count: editableIds.length,
                          })
                        : t('settings.organization.notifications.setAll', {
                              defaultValue: 'Set all {{ count }} member to',
                              defaultValue_other: 'Set all {{ count }} members to',
                              count: editableIds.length,
                          })}
                </span>
                {ruleOptions(t).map((option) => (
                    <LemonButton
                        key={option.value}
                        size="xsmall"
                        type="secondary"
                        onClick={() => setRuleForMany(concept.setting, scopeId, editableIds, option.value)}
                        disabledReason={
                            savingChanges
                                ? t('settings.organization.notifications.saving', { defaultValue: 'Saving' })
                                : undefined
                        }
                        data-attr={`notification-governance-bulk-${option.value}`}
                    >
                        {option.label}
                    </LemonButton>
                ))}
            </div>

            {shown.length === 0 ? (
                <p className="text-muted text-sm">
                    {t('settings.organization.notifications.noMatchingMembers', {
                        defaultValue: 'No members match that search.',
                    })}
                </p>
            ) : (
                <div className="flex flex-col gap-1">
                    {shown.map((member) => {
                        const name = `${member.first_name} ${member.last_name}`.trim()
                        return (
                            <div key={member.user_id} className="flex items-center gap-2">
                                <span className="flex-1 flex items-center gap-2 min-w-0">
                                    <span className="truncate">{name || member.email}</span>
                                    {!!name && <span className="text-muted text-xs truncate">{member.email}</span>}
                                    <LemonTag type="muted">
                                        {membershipLevelToName.get(member.organization_membership_level)}
                                    </LemonTag>
                                </span>
                                <LemonSegmentedButton
                                    size="xsmall"
                                    value={ruleFor(pendingRules, savedRules, concept.setting, scopeId, member.user_id)}
                                    onChange={(value) => setRule(concept.setting, scopeId, member.user_id, value)}
                                    options={ruleOptions(t)}
                                    disabledReason={
                                        !member.editable
                                            ? t('settings.organization.notifications.higherAccess', {
                                                  defaultValue:
                                                      'This member has a higher organization access level than you',
                                              })
                                            : savingChanges
                                              ? t('settings.organization.notifications.saving', {
                                                    defaultValue: 'Saving',
                                                })
                                              : undefined
                                    }
                                />
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="flex items-center gap-2 text-muted text-xs">
                <span className="mr-auto">
                    {matching > 0 &&
                        (searching
                            ? t('settings.organization.notifications.showingMatching', {
                                  defaultValue:
                                      'Showing {{ from }} to {{ to }} of {{ matching }} matching, out of {{ total }}',
                                  from: start + 1,
                                  to: Math.min(start + MEMBERS_PER_PAGE, matching),
                                  matching,
                                  total,
                              })
                            : t('settings.organization.notifications.showing', {
                                  defaultValue: 'Showing {{ from }} to {{ to }} of {{ matching }}',
                                  from: start + 1,
                                  to: Math.min(start + MEMBERS_PER_PAGE, matching),
                                  matching,
                              }))}
                </span>
                <LemonButton
                    size="xsmall"
                    type="secondary"
                    onClick={() => setListPage(list, page - 1)}
                    disabledReason={
                        page === 0
                            ? t('settings.organization.notifications.firstPage', { defaultValue: 'On the first page' })
                            : undefined
                    }
                >
                    {t('settings.organization.notifications.previous', { defaultValue: 'Previous' })}
                </LemonButton>
                <span>
                    {t('settings.organization.notifications.pageOf', {
                        defaultValue: 'Page {{ page }} of {{ pages }}',
                        page: page + 1,
                        pages,
                    })}
                </span>
                <LemonButton
                    size="xsmall"
                    type="secondary"
                    onClick={() => setListPage(list, page + 1)}
                    disabledReason={
                        page >= pages - 1
                            ? t('settings.organization.notifications.lastPage', { defaultValue: 'On the last page' })
                            : undefined
                    }
                >
                    {t('settings.organization.notifications.next', { defaultValue: 'Next' })}
                </LemonButton>
            </div>
        </div>
    )
}
