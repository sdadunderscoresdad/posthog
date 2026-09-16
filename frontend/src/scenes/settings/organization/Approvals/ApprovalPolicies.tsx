import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconInfo, IconX } from '@posthog/icons'
import {
    LemonButton,
    LemonInput,
    LemonInputSelect,
    LemonSelect,
    LemonSwitch,
    LemonTable,
    Tooltip,
} from '@posthog/lemon-ui'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { More } from 'lib/lemon-ui/LemonButton/More'
import { LemonDialog } from 'lib/lemon-ui/LemonDialog'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonTableColumn } from 'lib/lemon-ui/LemonTable'
import { lemonToast } from 'lib/lemon-ui/LemonToast/LemonToast'
import { APPROVAL_ACTIONS, ApprovalActionKey, getApprovalActionLabel } from 'scenes/approvals/utils'
import { membersLogic } from 'scenes/organization/membersLogic'
import { rolesLogic } from 'scenes/settings/organization/Permissions/Roles/rolesLogic'

import { ApprovalPolicy, AvailableFeature } from '~/types'

import { approvalPoliciesLogic } from './approvalPoliciesLogic'

// Available fields that can be gated. Built from `t`, so the labels follow a language change.
function gateableFields(t: TFunction): Record<string, { label: string; type: 'number' | 'boolean' | 'string' }> {
    return {
        rollout_percentage: {
            label: t('settings.organization.approvals.fields.rolloutPercentage', {
                defaultValue: 'Rollout percentage',
            }),
            type: 'number',
        },
    }
}

function conditionTypes(t: TFunction): { value: string; label: string }[] {
    return [
        {
            value: 'any_change',
            label: t('settings.organization.approvals.conditions.changes', { defaultValue: 'changes' }),
        },
        {
            value: 'before_after',
            label: t('settings.organization.approvals.conditions.newValueIs', { defaultValue: 'new value is' }),
        },
        {
            value: 'change_amount',
            label: t('settings.organization.approvals.conditions.changesBy', { defaultValue: 'changes by' }),
        },
    ]
}

function conditionTypesTooltip(t: TFunction): string {
    return t('settings.organization.approvals.conditionsTooltip', {
        defaultValue:
            '• changes – require approval whenever this field is modified\n• new value is – require approval when the new value meets a threshold (e.g., rollout > 50%)\n• changes by – require approval when the change amount meets a threshold (e.g., increased by more than 10%)',
    })
}

const OPERATORS = [
    { value: '>', label: '>' },
    { value: '>=', label: '>=' },
    { value: '<', label: '<' },
    { value: '<=', label: '<=' },
    { value: '==', label: '=' },
    { value: '!=', label: '≠' },
]

interface ConditionRule {
    field: string
    type: string
    operator?: string
    value?: number
}

export function ApprovalPolicies(): JSX.Element {
    const { t } = useTranslation()
    const { policies, policiesLoading } = useValues(approvalPoliciesLogic)
    const { loadPolicies, deletePolicy } = useActions(approvalPoliciesLogic)
    const [editingPolicy, setEditingPolicy] = useState<ApprovalPolicy | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const restrictionReason = useRestrictedArea({ minimumAccessLevel: OrganizationMembershipLevel.Admin })

    useEffect(() => {
        loadPolicies()
    }, [loadPolicies])

    const columns: LemonTableColumn<ApprovalPolicy, keyof ApprovalPolicy | undefined>[] = [
        {
            title: t('settings.organization.approvals.columns.action', { defaultValue: 'Action' }),
            dataIndex: 'action_key',
            render: (_, policy) => getApprovalActionLabel(policy.action_key),
        },
        {
            title: t('settings.organization.approvals.columns.approvers', { defaultValue: 'Approvers' }),
            render: (_, policy) => {
                const users = policy.approver_config?.users || []
                const roles = policy.approver_config?.roles || []
                const parts = []
                if (users.length > 0) {
                    parts.push(`${users.length} user${users.length > 1 ? 's' : ''}`)
                }
                if (roles.length > 0) {
                    parts.push(`${roles.length} role${roles.length > 1 ? 's' : ''}`)
                }
                return parts.join(', ') || t('settings.organization.approvals.none', { defaultValue: 'None' })
            },
        },
        {
            title: t('settings.organization.approvals.columns.approvalsRequired', {
                defaultValue: 'Approvals required',
            }),
            render: (_, policy) => policy.approver_config?.quorum || 1,
        },
        {
            title: t('settings.organization.approvals.columns.selfApprove', { defaultValue: 'Self-approve' }),
            dataIndex: 'allow_self_approve',
            render: (_, policy) =>
                policy.allow_self_approve
                    ? t('settings.organization.approvals.yes', { defaultValue: 'Yes' })
                    : t('settings.organization.approvals.no', { defaultValue: 'No' }),
        },
        {
            title: t('settings.organization.approvals.columns.status', { defaultValue: 'Status' }),
            dataIndex: 'enabled',
            render: (_, policy) =>
                policy.enabled
                    ? t('settings.organization.approvals.enabled', { defaultValue: 'Enabled' })
                    : t('settings.organization.approvals.disabled', { defaultValue: 'Disabled' }),
        },
        {
            width: 0,
            render: (_, policy) => (
                <More
                    overlay={
                        <>
                            <LemonButton
                                fullWidth
                                onClick={() => {
                                    setEditingPolicy(policy)
                                }}
                                disabledReason={restrictionReason}
                            >
                                {t('settings.organization.approvals.edit', { defaultValue: 'Edit' })}
                            </LemonButton>
                            <LemonButton
                                fullWidth
                                status="danger"
                                onClick={() => {
                                    LemonDialog.open({
                                        title: t('settings.organization.approvals.deleteTitle', {
                                            defaultValue: 'Delete approval policy?',
                                        }),
                                        content: t('settings.organization.approvals.deleteContent', {
                                            defaultValue:
                                                'This will immediately remove the approval requirement for this action.',
                                        }),
                                        primaryButton: {
                                            children: t('settings.apiKeys.actions.delete', { defaultValue: 'Delete' }),
                                            type: 'primary',
                                            status: 'danger',
                                            onClick: () => deletePolicy(policy.id),
                                            size: 'small',
                                        },
                                        secondaryButton: {
                                            children: t('settings.cancel', { defaultValue: 'Cancel' }),
                                            type: 'tertiary',
                                            size: 'small',
                                        },
                                    })
                                }}
                                disabledReason={restrictionReason}
                            >
                                {t('settings.apiKeys.actions.delete', { defaultValue: 'Delete' })}
                            </LemonButton>
                        </>
                    }
                />
            ),
        },
    ]

    return (
        <PayGateMini feature={AvailableFeature.APPROVALS} featureDetail="approval-policies">
            <div className="space-y-4">
                <div className="flex justify-end items-center">
                    <LemonButton type="primary" onClick={() => setIsCreating(true)} disabledReason={restrictionReason}>
                        {t('settings.organization.approvals.addPolicy', { defaultValue: 'Add policy' })}
                    </LemonButton>
                </div>

                <LemonTable
                    dataSource={policies}
                    columns={columns}
                    loading={policiesLoading}
                    rowKey="id"
                    nouns={[
                        t('settings.organization.approvals.nounSingular', { defaultValue: 'policy' }),
                        t('settings.organization.approvals.nounPlural', { defaultValue: 'policies' }),
                    ]}
                    emptyState={t('settings.organization.approvals.empty', {
                        defaultValue: 'No approval policies configured',
                    })}
                />

                {isCreating && <ApprovalPolicyModal onClose={() => setIsCreating(false)} />}
                {editingPolicy && <ApprovalPolicyModal policy={editingPolicy} onClose={() => setEditingPolicy(null)} />}
            </div>
        </PayGateMini>
    )
}

function ApprovalPolicyModal({ policy, onClose }: { policy?: ApprovalPolicy; onClose: () => void }): JSX.Element {
    const { t } = useTranslation()
    const { createPolicy, updatePolicy } = useActions(approvalPoliciesLogic)
    const { members } = useValues(membersLogic)
    const { roles } = useValues(rolesLogic)
    const { loadAllMembers } = useActions(membersLogic)
    const { loadRoles } = useActions(rolesLogic)

    const [actionKey, setActionKey] = useState(policy?.action_key || 'feature_flag.enable')
    const [quorum, setQuorum] = useState(policy?.approver_config?.quorum || 1)
    const [allowSelfApprove, setAllowSelfApprove] = useState(policy?.allow_self_approve || false)
    const [approverUserIds, setApproverUserIds] = useState<number[]>(policy?.approver_config?.users || [])
    const [approverRoleIds, setApproverRoleIds] = useState<string[]>(policy?.approver_config?.roles || [])
    const [bypassAdminsOwners, setBypassAdminsOwners] = useState(
        (policy?.bypass_org_membership_levels?.length ?? 0) > 0
    )
    const [bypassRoleIds, setBypassRoleIds] = useState<string[]>(policy?.bypass_roles || [])

    // Parse existing conditions into rules
    const parseExistingConditions = (): ConditionRule[] => {
        const conditions = policy?.conditions as ConditionRule | undefined
        if (conditions?.field) {
            return [
                {
                    field: conditions.field,
                    type: conditions.type || 'any_change',
                    operator: conditions.operator,
                    value: conditions.value,
                },
            ]
        }
        return []
    }

    const [rules, setRules] = useState<ConditionRule[]>(parseExistingConditions)

    useEffect(() => {
        loadAllMembers()
        loadRoles()
    }, [loadAllMembers, loadRoles])

    const addRule = (field: string): void => {
        setRules((prev) => [...prev, { field, type: 'any_change' }])
    }

    const updateRule = (index: number, updates: Partial<ConditionRule>): void => {
        setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...updates } : rule)))
    }

    const removeRule = (index: number): void => {
        setRules((prev) => prev.filter((_, i) => i !== index))
    }

    const usedFields = new Set(rules.map((r) => r.field))
    const availableFields = Object.entries(gateableFields(t)).filter(([key]) => !usedFields.has(key))

    const handleSave = (): void => {
        if (approverUserIds.length === 0 && approverRoleIds.length === 0) {
            lemonToast.error(
                t('settings.organization.approvals.selectApproverError', {
                    defaultValue: 'Please select at least one user or role',
                })
            )
            return
        }

        // Build conditions from rules (for now, just take the first rule)
        let conditions: Record<string, unknown> = {}
        if (actionKey === ApprovalActionKey.FEATURE_FLAG_UPDATE && rules.length > 0) {
            const rule = rules[0]
            if (rule.type !== 'any_change' && rule.value === undefined) {
                lemonToast.error(
                    t('settings.organization.approvals.thresholdError', {
                        defaultValue: 'Please specify a threshold value',
                    })
                )
                return
            }
            conditions = {
                type: rule.type,
                field: rule.field,
            }
            if (rule.type !== 'any_change') {
                conditions.operator = rule.operator
                conditions.value = rule.value
            }
        }

        const policyData = {
            action_key: actionKey,
            approver_config: {
                quorum: quorum,
                users: approverUserIds,
                roles: approverRoleIds,
            },
            allow_self_approve: allowSelfApprove,
            conditions,
            bypass_org_membership_levels: bypassAdminsOwners ? ['8', '15'] : [],
            bypass_roles: bypassRoleIds,
            enabled: true,
        }

        if (policy) {
            updatePolicy(policy.id, policyData)
        } else {
            createPolicy(policyData)
        }
        onClose()
    }

    const userOptions =
        members?.map((member) => ({
            key: member.user.id.toString(),
            label: `${member.user.first_name} (${member.user.email})`,
            labelComponent: (
                <div className="flex items-center gap-2">
                    <span>{member.user.first_name}</span>
                    <span className="text-muted text-xs">({member.user.email})</span>
                </div>
            ),
        })) || []

    const roleOptions =
        roles?.map((role) => ({
            key: role.id,
            label: role.name,
        })) || []

    return (
        <LemonModal
            isOpen
            onClose={onClose}
            width={600}
            title={
                policy
                    ? t('settings.organization.approvals.editPolicy', { defaultValue: 'Edit approval policy' })
                    : t('settings.organization.approvals.createPolicy', { defaultValue: 'Create approval policy' })
            }
            footer={
                <>
                    <LemonButton type="secondary" onClick={onClose}>
                        {t('settings.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton type="primary" onClick={handleSave}>
                        {t('settings.save', { defaultValue: 'Save' })}
                    </LemonButton>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.organization.approvals.actionType', { defaultValue: 'Action type' })}
                    </label>
                    <LemonSelect
                        fullWidth
                        value={actionKey}
                        onChange={(value) => {
                            setActionKey(value)
                            if (value !== ApprovalActionKey.FEATURE_FLAG_UPDATE) {
                                setRules([])
                            }
                        }}
                        options={Object.entries(APPROVAL_ACTIONS).map(([value, action]) => ({
                            label: action.label,
                            value,
                        }))}
                    />
                </div>

                {actionKey === ApprovalActionKey.FEATURE_FLAG_UPDATE && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="block text-sm font-medium">
                                {t('settings.organization.approvals.requireApprovalWhen', {
                                    defaultValue: 'Require approval when',
                                })}
                            </label>
                            <Tooltip title={conditionTypesTooltip(t)}>
                                <IconInfo className="text-muted-alt w-4 h-4" />
                            </Tooltip>
                        </div>

                        {rules.length === 0 ? (
                            <div className="p-4 border border-dashed rounded text-center text-muted">
                                {t('settings.organization.approvals.noConditions', {
                                    defaultValue:
                                        'No conditions configured. Add a field to require approval for specific changes.',
                                })}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {rules.map((rule, index) => (
                                    <RuleRow
                                        key={rule.field}
                                        rule={rule}
                                        onChange={(updates) => updateRule(index, updates)}
                                        onRemove={() => removeRule(index)}
                                    />
                                ))}
                            </div>
                        )}

                        {availableFields.length > 0 && (
                            <LemonSelect
                                placeholder={t('settings.organization.approvals.addField', {
                                    defaultValue: '+ Add field',
                                })}
                                value={null}
                                onChange={(value) => value && addRule(value)}
                                options={availableFields.map(([key, config]) => ({
                                    value: key,
                                    label: config.label,
                                }))}
                                size="small"
                            />
                        )}

                        <p className="text-xs text-secondary">
                            {t('settings.organization.approvals.noConditionsNote', {
                                defaultValue:
                                    'If no conditions are set, all changes to this action type will require approval.',
                            })}
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.organization.approvals.approverUsers', { defaultValue: 'Approver users' })}
                    </label>
                    <LemonInputSelect
                        mode="multiple"
                        value={approverUserIds.map(String)}
                        onChange={(values) => setApproverUserIds(values.map(Number))}
                        options={userOptions}
                        placeholder={t('settings.organization.approvals.selectApproverUsers', {
                            defaultValue: 'Select users who can approve',
                        })}
                    />
                    <p className="text-xs text-secondary mt-1">
                        {t('settings.organization.approvals.approverUsersHint', {
                            defaultValue: 'Users who can approve change requests for this action',
                        })}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.organization.approvals.approverRoles', { defaultValue: 'Approver roles' })}
                    </label>
                    <LemonInputSelect
                        mode="multiple"
                        value={approverRoleIds}
                        onChange={setApproverRoleIds}
                        options={roleOptions}
                        placeholder={t('settings.organization.approvals.selectApproverRoles', {
                            defaultValue: 'Select roles who can approve',
                        })}
                    />
                    <p className="text-xs text-secondary mt-1">
                        {t('settings.organization.approvals.approverRolesHint', {
                            defaultValue: 'Users with any of these roles can approve change requests for this action',
                        })}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('settings.organization.approvals.approvalsRequired', { defaultValue: 'Approvals required' })}
                    </label>
                    <LemonSelect
                        fullWidth
                        value={quorum}
                        onChange={setQuorum}
                        options={[
                            {
                                label: t('settings.organization.approvals.approvalCountOne', {
                                    defaultValue: '1 approval',
                                }),
                                value: 1,
                            },
                            {
                                label: t('settings.organization.approvals.approvalCountOther', {
                                    defaultValue: '{{ count }} approvals',
                                    count: 2,
                                }),
                                value: 2,
                            },
                            {
                                label: t('settings.organization.approvals.approvalCountOther', {
                                    defaultValue: '{{ count }} approvals',
                                    count: 3,
                                }),
                                value: 3,
                            },
                        ]}
                    />
                </div>

                <div>
                    <LemonSwitch
                        checked={allowSelfApprove}
                        onChange={setAllowSelfApprove}
                        label={
                            <div className="flex items-center gap-2">
                                <span>
                                    {t('settings.organization.approvals.allowSelfApproval', {
                                        defaultValue: 'Allow self-approval',
                                    })}
                                </span>
                                <Tooltip
                                    title={t('settings.organization.approvals.allowSelfApprovalTooltip', {
                                        defaultValue:
                                            'If enabled, the person requesting the change can also approve it. They still need to be in the approver list.',
                                    })}
                                >
                                    <IconInfo className="text-muted-alt w-4 h-4" />
                                </Tooltip>
                            </div>
                        }
                    />
                </div>

                <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium mb-2">
                        {t('settings.organization.approvals.bypassOptions', { defaultValue: 'Bypass options' })}
                    </label>
                    <p className="text-xs text-secondary mb-3">
                        {t('settings.organization.approvals.bypassOptionsHint', {
                            defaultValue: 'Users matching these criteria can skip the approval flow entirely',
                        })}
                    </p>

                    <div className="space-y-3">
                        <LemonSwitch
                            checked={bypassAdminsOwners}
                            onChange={setBypassAdminsOwners}
                            label={
                                <div className="flex items-center gap-2">
                                    <span>
                                        {t('settings.organization.approvals.allowAdminsBypass', {
                                            defaultValue: 'Allow org admins and owners to bypass',
                                        })}
                                    </span>
                                    <Tooltip
                                        title={t('settings.organization.approvals.allowAdminsBypassTooltip', {
                                            defaultValue:
                                                'Organization admins and owners can perform this action without requiring approval',
                                        })}
                                    >
                                        <IconInfo className="text-muted-alt w-4 h-4" />
                                    </Tooltip>
                                </div>
                            }
                        />

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('settings.organization.approvals.bypassRoles', { defaultValue: 'Bypass roles' })}
                            </label>
                            <LemonInputSelect
                                mode="multiple"
                                value={bypassRoleIds}
                                onChange={setBypassRoleIds}
                                options={roleOptions}
                                placeholder={t('settings.organization.approvals.selectBypassRoles', {
                                    defaultValue: 'Select roles that can bypass approval',
                                })}
                            />
                            <p className="text-xs text-secondary mt-1">
                                {t('settings.organization.approvals.bypassRolesHint', {
                                    defaultValue: 'Users with any of these roles can skip the approval flow',
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </LemonModal>
    )
}

function RuleRow({
    rule,
    onChange,
    onRemove,
}: {
    rule: ConditionRule
    onChange: (updates: Partial<ConditionRule>) => void
    onRemove: () => void
}): JSX.Element {
    const { t } = useTranslation()
    const fieldConfig = gateableFields(t)[rule.field]
    const isNumeric = fieldConfig?.type === 'number'

    return (
        <div className="flex items-center gap-2 p-2 bg-bg-light border rounded">
            <span className="font-medium text-sm whitespace-nowrap">{fieldConfig?.label || rule.field}</span>

            <LemonSelect
                size="small"
                value={rule.type}
                onChange={(value) => onChange({ type: value })}
                options={conditionTypes(t)}
            />

            {rule.type !== 'any_change' && isNumeric && (
                <>
                    <LemonSelect
                        size="small"
                        value={rule.operator || '>'}
                        onChange={(value) => onChange({ operator: value })}
                        options={OPERATORS}
                    />
                    <LemonInput
                        size="small"
                        type="number"
                        min={rule.type === 'change_amount' ? -100 : 0}
                        max={100}
                        value={rule.value}
                        onChange={(val) => onChange({ value: val })}
                        placeholder="%"
                        className="w-20"
                    />
                    <span className="text-sm text-muted">%</span>
                </>
            )}

            <div className="flex-1" />

            <LemonButton
                size="small"
                icon={<IconX />}
                onClick={onRemove}
                tooltip={t('settings.organization.approvals.removeRule', { defaultValue: 'Remove rule' })}
            />
        </div>
    )
}
