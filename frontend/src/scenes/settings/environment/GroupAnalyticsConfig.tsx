import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { IconTrash } from '@posthog/icons'
import { LemonButton, LemonDialog, LemonInput, Link } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { GroupsAccessStatus, groupsAccessLogic } from 'lib/introductions/groupsAccessLogic'
import { LemonBanner } from 'lib/lemon-ui/LemonBanner'
import { LemonTable, LemonTableColumns } from 'lib/lemon-ui/LemonTable'

import { GroupType } from '~/types'

import { GroupsIntroduction } from 'products/groups/frontend/components/GroupsIntroduction'

import { groupAnalyticsConfigLogic } from './groupAnalyticsConfigLogic'

export interface DeleteGroupTypeDialogProps {
    onConfirm: () => void
    groupTypeName: string
}

export function openDeleteGroupTypeDialog({ onConfirm, groupTypeName }: DeleteGroupTypeDialogProps): void {
    const groupType = groupTypeName.toLowerCase()
    LemonDialog.open({
        title: i18n.t('settings.environment.groupAnalytics.deleteDialog.title', {
            defaultValue: 'Delete {{ groupType }} group type',
            groupType,
        }),
        description: (
            <div className="mt-2 w-150">
                {i18n.t('settings.environment.groupAnalytics.deleteDialog.irreversible', {
                    defaultValue: 'Deleting a group type is irreversible.',
                })}
                <br />
                <br />
                {i18n.t('settings.environment.groupAnalytics.deleteDialog.cannotReassign', {
                    defaultValue:
                        'You will not be able to assign existing events from this group type to another group type created in the future, only new events.',
                })}
                <br />
                <br />
                <Trans
                    i18nKey="settings.environment.groupAnalytics.deleteDialog.docsHint"
                    components={{
                        DocsLink: (
                            <Link to="https://posthog.com/docs/product-analytics/group-analytics" target="_blank" />
                        ),
                    }}
                    defaults="For more information about groups, see <DocsLink>the docs</DocsLink>"
                />
            </div>
        ),
        secondaryButton: {
            type: 'secondary',
            children: i18n.t('settings.cancel', { defaultValue: 'Cancel' }),
        },
        primaryButton: {
            type: 'primary',
            status: 'danger',
            onClick: onConfirm,
            children: i18n.t('settings.environment.groupAnalytics.deleteDialog.confirm', {
                defaultValue: 'Delete {{ groupType }}',
                groupType,
            }),
        },
    })
}

export function GroupAnalyticsConfig(): JSX.Element | null {
    const { t } = useTranslation()
    const { groupTypes, groupTypesLoading, singularChanges, pluralChanges, hasChanges } =
        useValues(groupAnalyticsConfigLogic)
    const { setSingular, setPlural, reset, save, deleteGroupType } = useActions(groupAnalyticsConfigLogic)

    const { groupsAccessStatus, needsUpgradeForGroups } = useValues(groupsAccessLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    if (needsUpgradeForGroups) {
        return <GroupsIntroduction />
    }

    const columns: LemonTableColumns<GroupType> = [
        {
            title: t('settings.environment.groupAnalytics.columns.groupType', { defaultValue: 'Group type' }),
            tooltip: t('settings.environment.groupAnalytics.columns.groupTypeTooltip', {
                defaultValue: 'As used in code',
            }),
            dataIndex: 'group_type',
            key: 'name',
            render: function RenderName(name) {
                return name
            },
        },
        {
            title: t('settings.environment.groupAnalytics.columns.singularName', { defaultValue: 'Singular name' }),
            key: 'singular',
            render: function Render(_, groupType) {
                return (
                    <LemonInput
                        value={
                            singularChanges[groupType.group_type_index] ||
                            groupType.name_singular ||
                            groupType.group_type
                        }
                        onChange={(e) => setSingular(groupType.group_type_index, e)}
                        disabledReason={restrictedReason}
                    />
                )
            },
        },
        {
            title: t('settings.environment.groupAnalytics.columns.pluralName', { defaultValue: 'Plural name' }),
            key: 'plural',
            render: function Render(_, groupType) {
                return (
                    <LemonInput
                        value={
                            pluralChanges[groupType.group_type_index] ||
                            groupType.name_plural ||
                            `${groupType.group_type}(s)`
                        }
                        onChange={(e) => setPlural(groupType.group_type_index, e)}
                        disabledReason={restrictedReason}
                    />
                )
            },
        },
        {
            title: '',
            key: 'delete',
            width: 24,
            render: function Render(_, groupType) {
                return (
                    <LemonButton
                        status="danger"
                        size="small"
                        icon={<IconTrash />}
                        onClick={() =>
                            openDeleteGroupTypeDialog({
                                onConfirm: () => deleteGroupType(groupType.group_type_index),
                                groupTypeName: groupType.group_type,
                            })
                        }
                        disabledReason={restrictedReason}
                    />
                )
            },
        },
    ]

    return (
        <>
            {groupsAccessStatus !== GroupsAccessStatus.AlreadyUsing && (
                <LemonBanner type="info" className="mb-4">
                    <Trans
                        i18nKey="settings.environment.groupAnalytics.emptyState"
                        components={{
                            DocsLink: (
                                <Link to="https://posthog.com/docs/product-analytics/group-analytics" target="_blank" />
                            ),
                        }}
                        defaults="Group types will show up here after you send your first event associated with a group. Take a look at <DocsLink>this guide</DocsLink> for more information on getting started."
                    />
                </LemonBanner>
            )}

            <LemonTable columns={columns} dataSource={Array.from(groupTypes.values())} loading={groupTypesLoading} />

            <div className="flex gap-2 mt-4">
                <LemonButton
                    type="primary"
                    disabledReason={
                        hasChanges
                            ? restrictedReason
                            : t('settings.environment.groupAnalytics.makeChangesFirst', {
                                  defaultValue: 'Make some changes before saving',
                              })
                    }
                    onClick={save}
                >
                    {t('settings.save', { defaultValue: 'Save' })}
                </LemonButton>
                <LemonButton
                    disabledReason={
                        hasChanges
                            ? restrictedReason
                            : t('settings.environment.groupAnalytics.revertChanges', {
                                  defaultValue: 'Revert any changes made',
                              })
                    }
                    onClick={reset}
                >
                    {t('settings.cancel', { defaultValue: 'Cancel' })}
                </LemonButton>
            </div>
        </>
    )
}
