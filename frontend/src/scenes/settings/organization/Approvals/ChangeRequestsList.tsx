import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { useTranslation } from 'react-i18next'

import { LemonButton, LemonDialog, LemonInput, LemonSelect, LemonTable, LemonTag, lemonToast } from '@posthog/lemon-ui'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TZLabel } from 'lib/components/TZLabel'
import { OrganizationMembershipLevel } from 'lib/constants'
import { dayjs } from 'lib/dayjs'
import { More } from 'lib/lemon-ui/LemonButton/More'
import { LemonTableColumn } from 'lib/lemon-ui/LemonTable'
import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { cn } from 'lib/utils/css-classes'
import { approvalsLogic } from 'scenes/approvals/approvalsLogic'
import { getChangeRequestButtonVisibility } from 'scenes/approvals/changeRequestsLogic'
import { getApprovalActionLabel, getApprovalResourceName, getApprovalResourceUrl } from 'scenes/approvals/utils'
import { urls } from 'scenes/urls'

import { AvailableFeature, ChangeRequest, ChangeRequestState } from '~/types'

export function ChangeRequestsList(): JSX.Element {
    const { t } = useTranslation()
    const { changeRequests, changeRequestsDataLoading, filters, hasMore } = useValues(approvalsLogic)
    const { setFilters, loadMore, approveChangeRequest, rejectChangeRequest } = useActions(approvalsLogic)

    const columns: LemonTableColumn<ChangeRequest, keyof ChangeRequest | undefined>[] = [
        {
            title: t('settings.organization.approvals.columns.action', { defaultValue: 'Action' }),
            dataIndex: 'action_key',
            render: function RenderAction(_, changeRequest) {
                return (
                    <LemonTableLink
                        to={urls.approval(changeRequest.id)}
                        title={getApprovalActionLabel(changeRequest.action_key)}
                    />
                )
            },
        },
        {
            title: t('settings.organization.approvals.columns.resource', { defaultValue: 'Resource' }),
            render: function RenderResource(_, changeRequest) {
                const resourceUrl = getApprovalResourceUrl(changeRequest.action_key, changeRequest.resource_id)
                const name = getApprovalResourceName(changeRequest.resource_type, changeRequest.intent)
                return resourceUrl && name ? <LemonTableLink to={resourceUrl} title={name} /> : name
            },
        },
        {
            title: t('settings.organization.approvals.columns.requestedBy', { defaultValue: 'Requested by' }),
            render: function RenderRequester(_, changeRequest) {
                return <ProfilePicture user={changeRequest.created_by} size="md" showName />
            },
        },
        {
            title: t('settings.organization.approvals.columns.status', { defaultValue: 'Status' }),
            dataIndex: 'state',
            render: function RenderStatus(_, changeRequest) {
                return <StatusTag state={changeRequest.state} />
            },
        },
        {
            title: t('settings.organization.approvals.columns.approvals', { defaultValue: 'Approvals' }),
            render: function RenderApprovals(_, changeRequest) {
                const required = changeRequest.policy_snapshot?.quorum || 1
                const current = changeRequest.approvals?.length || 0
                return (
                    <div>
                        {current} / {required}
                    </div>
                )
            },
        },
        {
            title: t('settings.organization.approvals.columns.created', { defaultValue: 'Created' }),
            dataIndex: 'created_at',
            render: function RenderCreatedAt(_, changeRequest) {
                return <TZLabel time={changeRequest.created_at} />
            },
        },
        {
            title: t('settings.organization.approvals.columns.expires', { defaultValue: 'Expires' }),
            dataIndex: 'expires_at',
            render: function RenderExpiresAt(_, changeRequest) {
                if (changeRequest.state !== ChangeRequestState.Pending || !changeRequest.expires_at) {
                    return null
                }
                const expiresAt = dayjs(changeRequest.expires_at)
                const hoursLeft = expiresAt.diff(dayjs(), 'hours')

                if (hoursLeft < 0) {
                    return (
                        <span className="text-danger">
                            <TZLabel time={changeRequest.expires_at} />
                        </span>
                    )
                }
                if (hoursLeft < 24) {
                    return (
                        <span className="text-warning">
                            <TZLabel time={changeRequest.expires_at} />
                        </span>
                    )
                }
                return <TZLabel time={changeRequest.expires_at} />
            },
        },
        {
            width: 0,
            render: function RenderActions(_, changeRequest) {
                return (
                    <ChangeRequestTableActions
                        changeRequest={changeRequest}
                        onApprove={approveChangeRequest}
                        onReject={rejectChangeRequest}
                    />
                )
            },
        },
    ]

    return (
        <PayGateMini feature={AvailableFeature.APPROVALS} featureDetail="approval-change-requests">
            <div className="space-y-4">
                <div className={cn('flex flex-wrap gap-2 justify-between')}>
                    <div className="flex gap-2 items-center">
                        <span>
                            <b>{t('settings.organization.approvals.columns.status', { defaultValue: 'Status' })}</b>
                        </span>
                        <LemonSelect
                            dropdownMatchSelectWidth={false}
                            onChange={(value) => {
                                setFilters({ state: value || undefined })
                            }}
                            size="small"
                            options={[
                                {
                                    label: t('settings.organization.approvals.states.all', { defaultValue: 'All' }),
                                    value: null,
                                },
                                {
                                    label: t('settings.organization.approvals.states.pending', {
                                        defaultValue: 'Pending',
                                    }),
                                    value: ChangeRequestState.Pending,
                                },
                                {
                                    label: t('settings.organization.approvals.states.approved', {
                                        defaultValue: 'Approved',
                                    }),
                                    value: ChangeRequestState.Approved,
                                },
                                {
                                    label: t('settings.organization.approvals.states.applied', {
                                        defaultValue: 'Applied',
                                    }),
                                    value: ChangeRequestState.Applied,
                                },
                                {
                                    label: t('settings.organization.approvals.states.rejected', {
                                        defaultValue: 'Rejected',
                                    }),
                                    value: ChangeRequestState.Rejected,
                                },
                                {
                                    label: t('settings.organization.approvals.states.expired', {
                                        defaultValue: 'Expired',
                                    }),
                                    value: ChangeRequestState.Expired,
                                },
                                {
                                    label: t('settings.organization.approvals.states.failed', {
                                        defaultValue: 'Failed',
                                    }),
                                    value: ChangeRequestState.Failed,
                                },
                            ]}
                            value={filters.state ?? null}
                        />
                    </div>
                </div>

                <LemonTable
                    dataSource={changeRequests}
                    columns={columns}
                    rowKey="id"
                    loading={changeRequestsDataLoading}
                    nouns={[
                        t('settings.organization.approvals.changeRequestNoun', { defaultValue: 'change request' }),
                        t('settings.organization.approvals.changeRequestNounPlural', {
                            defaultValue: 'change requests',
                        }),
                    ]}
                    data-attr="approvals-table"
                    emptyState={t('settings.organization.approvals.noChangeRequests', {
                        defaultValue: 'No change requests found',
                    })}
                    footer={
                        hasMore && (
                            <div className="flex justify-center p-1">
                                <LemonButton
                                    onClick={loadMore}
                                    className="min-w-full text-center"
                                    disabledReason={
                                        changeRequestsDataLoading
                                            ? t('settings.organization.approvals.loadingChangeRequests', {
                                                  defaultValue: 'Loading change requests',
                                              })
                                            : ''
                                    }
                                >
                                    <span className="flex-1 text-center">
                                        {changeRequestsDataLoading
                                            ? t('settings.loading')
                                            : t('settings.organization.approvals.loadMore', {
                                                  defaultValue: 'Load more',
                                              })}
                                    </span>
                                </LemonButton>
                            </div>
                        )
                    }
                />
            </div>
        </PayGateMini>
    )
}

function ChangeRequestTableActions({
    changeRequest,
    onApprove,
    onReject,
}: {
    changeRequest: ChangeRequest
    onApprove: (id: string) => void
    onReject: (id: string, reason: string) => void
}): JSX.Element {
    const { t } = useTranslation()
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Organization,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })
    const { showApproveButton, showRejectButton } = getChangeRequestButtonVisibility(changeRequest)

    return (
        <More
            overlay={
                <>
                    <LemonButton fullWidth onClick={() => router.actions.push(urls.approval(changeRequest.id))}>
                        {t('settings.organization.approvals.viewDetails', { defaultValue: 'View details' })}
                    </LemonButton>
                    {showApproveButton && (
                        <LemonButton
                            fullWidth
                            type="primary"
                            disabledReason={restrictedReason}
                            onClick={() => {
                                LemonDialog.open({
                                    title: t('settings.organization.approvals.approveTitle', {
                                        defaultValue: 'Approve this change request?',
                                    }),
                                    content: (
                                        <div className="text-sm text-secondary">
                                            {t('settings.organization.approvals.approveContent', {
                                                defaultValue: 'This will add your approval to the change request.',
                                            })}
                                            {changeRequest.policy_snapshot?.quorum === 1
                                                ? ` ${t('settings.organization.approvals.approveAutoApply', {
                                                      defaultValue: ' The change will be applied automatically.',
                                                  }).trim()}`
                                                : ''}
                                        </div>
                                    ),
                                    primaryButton: {
                                        children: t('settings.organization.approvals.approve', {
                                            defaultValue: 'Approve',
                                        }),
                                        type: 'primary',
                                        onClick: () => onApprove(changeRequest.id),
                                        size: 'small',
                                    },
                                    secondaryButton: {
                                        children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                        type: 'tertiary',
                                        size: 'small',
                                    },
                                })
                            }}
                        >
                            {t('settings.organization.approvals.approve', { defaultValue: 'Approve' })}
                        </LemonButton>
                    )}
                    {showRejectButton && (
                        <LemonButton
                            fullWidth
                            status="danger"
                            disabledReason={restrictedReason}
                            onClick={() => {
                                LemonDialog.open({
                                    title: t('settings.organization.approvals.rejectTitle', {
                                        defaultValue: 'Reject this change request?',
                                    }),
                                    content: (
                                        <div>
                                            <div className="text-sm text-secondary mb-2">
                                                {t('settings.organization.approvals.rejectContent', {
                                                    defaultValue:
                                                        'This will reject the change request and prevent it from being applied.',
                                                })}
                                            </div>
                                            <LemonInput
                                                id="reject-reason"
                                                placeholder={t('settings.organization.approvals.rejectPlaceholder', {
                                                    defaultValue: 'Reason for rejection (required)',
                                                })}
                                            />
                                        </div>
                                    ),
                                    primaryButton: {
                                        children: t('settings.organization.approvals.reject', {
                                            defaultValue: 'Reject',
                                        }),
                                        type: 'primary',
                                        status: 'danger',
                                        onClick: () => {
                                            const reason = (
                                                document.getElementById('reject-reason') as HTMLInputElement
                                            )?.value
                                            if (!reason) {
                                                lemonToast.error(
                                                    t('settings.organization.approvals.rejectReasonRequired', {
                                                        defaultValue: 'Please provide a reason for rejection',
                                                    })
                                                )
                                                return
                                            }
                                            onReject(changeRequest.id, reason)
                                        },
                                        size: 'small',
                                    },
                                    secondaryButton: {
                                        children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                        type: 'tertiary',
                                        size: 'small',
                                    },
                                })
                            }}
                        >
                            {t('settings.organization.approvals.reject', { defaultValue: 'Reject' })}
                        </LemonButton>
                    )}
                </>
            }
        />
    )
}

function StatusTag({ state }: { state: ChangeRequestState }): JSX.Element {
    const { t } = useTranslation()
    const tagTypes = {
        [ChangeRequestState.Pending]: 'default',
        [ChangeRequestState.Approved]: 'primary',
        [ChangeRequestState.Applied]: 'success',
        [ChangeRequestState.Rejected]: 'danger',
        [ChangeRequestState.Expired]: 'warning',
        [ChangeRequestState.Failed]: 'danger',
    } as const

    return (
        <LemonTag type={tagTypes[state]} className="uppercase">
            {t(`settings.organization.approvals.states.${state}`, { defaultValue: state })}
        </LemonTag>
    )
}
