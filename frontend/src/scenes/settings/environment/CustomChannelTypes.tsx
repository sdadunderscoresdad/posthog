import { deepEqual as equal } from 'fast-equals'
import { useActions, useValues } from 'kea'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconPlus } from '@posthog/icons'

import { PropertyValue } from 'lib/components/PropertyFilters/components/PropertyValue'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { VerticalNestedDND } from 'lib/components/VerticalNestedDND/VerticalNestedDND'
import { TeamMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonInputSelect, LemonInputSelectOption } from 'lib/lemon-ui/LemonInputSelect'
import { LemonSelect } from 'lib/lemon-ui/LemonSelect'
import { Link } from 'lib/lemon-ui/Link'
import { uuid } from 'lib/utils/dom'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { UnexpectedNeverError } from 'lib/utils/guards'
import { genericOperatorMap } from 'lib/utils/operators'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import {
    CustomChannelCondition,
    CustomChannelField,
    CustomChannelOperator,
    CustomChannelRule,
    DefaultChannelTypes,
} from '~/queries/schema/schema-general'
import { FilterLogicalOperator, PropertyFilterType, PropertyOperator } from '~/types'

const combinerOptions = [
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.combiners.all', { defaultValue: 'All' })
        },
        value: FilterLogicalOperator.And,
    },
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.combiners.any', { defaultValue: 'Any' })
        },
        value: FilterLogicalOperator.Or,
    },
]

const keyOptions = [
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.fields.referringDomain', {
                defaultValue: 'Referring domain',
            })
        },
        value: CustomChannelField.ReferringDomain,
    },
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.fields.utmSource', { defaultValue: 'UTM Source' })
        },
        value: CustomChannelField.UTMSource,
    },
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.fields.utmMedium', { defaultValue: 'UTM Medium' })
        },
        value: CustomChannelField.UTMMedium,
    },
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.fields.utmCampaign', {
                defaultValue: 'UTM Campaign',
            })
        },
        value: CustomChannelField.UTMCampaign,
    },
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.fields.url', { defaultValue: 'URL' })
        },
        value: CustomChannelField.URL,
    },
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.fields.hostname', { defaultValue: 'Hostname' })
        },
        value: CustomChannelField.Hostname,
    },
    {
        get label() {
            return i18n.t('settings.environment.customChannelTypes.fields.pathname', { defaultValue: 'Pathname' })
        },
        value: CustomChannelField.Pathname,
    },
]

const opOptions = Object.values(CustomChannelOperator).map((op) => {
    return {
        label: genericOperatorMap[op],
        value: op,
    }
})

const isNullary = (operator: CustomChannelOperator): boolean => {
    return [CustomChannelOperator.IsSet, CustomChannelOperator.IsNotSet].includes(operator)
}

const opToPropertyOperator: Record<CustomChannelOperator, PropertyOperator> = {
    [CustomChannelOperator.Exact]: PropertyOperator.Exact,
    [CustomChannelOperator.IsNot]: PropertyOperator.IsNot,
    [CustomChannelOperator.IsSet]: PropertyOperator.IsSet,
    [CustomChannelOperator.IsNotSet]: PropertyOperator.IsNotSet,
    [CustomChannelOperator.IContains]: PropertyOperator.IContains,
    [CustomChannelOperator.NotIContains]: PropertyOperator.NotIContains,
    [CustomChannelOperator.Regex]: PropertyOperator.Regex,
    [CustomChannelOperator.NotRegex]: PropertyOperator.NotRegex,
}

function keyToSessionProperty(key: CustomChannelField): string {
    switch (key) {
        case CustomChannelField.ReferringDomain:
            return '$entry_referring_domain'
        case CustomChannelField.UTMSource:
            return '$entry_utm_source'
        case CustomChannelField.UTMMedium:
            return '$entry_utm_medium'
        case CustomChannelField.UTMCampaign:
            return '$entry_utm_campaign'
        case CustomChannelField.URL:
            return '$entry_url'
        case CustomChannelField.Hostname:
            return '$entry_hostname'
        case CustomChannelField.Pathname:
            return '$entry_pathname'
        default:
            throw new UnexpectedNeverError(key)
    }
}

const sanitizeCustomChannelTypeRules = (rules?: CustomChannelRule[]): CustomChannelRule[] => {
    return (rules ?? [])
        .map((rule) => {
            return {
                id: rule.id || uuid(),
                channel_type: rule.channel_type,
                combiner: rule.combiner,
                items: (rule.items || [])
                    .map((condition) => ({
                        id: condition.id || uuid(),
                        key: condition.key,
                        op: condition.op,
                        value: condition.value,
                    }))
                    .filter((item) => item.key && item.op && item.value),
            }
        })
        .filter((rule) => rule.channel_type && rule.items.length > 0)
}

export function CustomChannelTypes(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)
    const { reportCustomChannelTypeRulesUpdated } = useActions(eventUsageLogic)

    const [savedCustomChannelTypeRules, setSavedCustomChannelTypeRules] = useState(() =>
        sanitizeCustomChannelTypeRules(
            currentTeam?.modifiers?.customChannelTypeRules ?? currentTeam?.default_modifiers?.customChannelTypeRules
        )
    )

    const [customChannelTypeRules, setCustomChannelTypeRules] = useState(savedCustomChannelTypeRules)

    const channelTypeOptions = useMemo((): LemonInputSelectOption[] => {
        const optionsSet = new Set<string>([
            ...customChannelTypeRules.map((rule) => rule.channel_type),
            ...Object.values(DefaultChannelTypes),
        ])
        return Array.from(optionsSet)
            .filter(Boolean)
            .map((channelType) => ({ label: channelType, key: channelType }))
    }, [customChannelTypeRules])

    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <div>
            <p>
                <Trans
                    i18nKey="settings.environment.customChannelTypes.intro"
                    components={{
                        DocsLink: <Link to="https://posthog.com/docs/data/channel-type#channel-type-calculation" />,
                    }}
                    defaults="You can create custom channel types by defining rules that match incoming events. The first matching rule is used, and if no rule matches (or if none are defined) then the <DocsLink>default channel type</DocsLink> is used."
                />
            </p>
            <p>
                <Trans
                    i18nKey="settings.environment.customChannelTypes.debugHint"
                    components={{
                        ExplorerLink: <Link to={urls.sessionAttributionExplorer()} target="_blank" />,
                    }}
                    defaults="To debug, try the <ExplorerLink>session attribution explorer tool</ExplorerLink>"
                />
            </p>
            <ChannelTypeEditor
                handleChange={setCustomChannelTypeRules}
                initialCustomChannelTypeRules={customChannelTypeRules}
                channelTypeOptions={channelTypeOptions}
                onSave={() => {
                    updateCurrentTeam({
                        modifiers: {
                            ...currentTeam?.modifiers,
                            customChannelTypeRules: sanitizeCustomChannelTypeRules(customChannelTypeRules),
                        },
                    })
                    reportCustomChannelTypeRulesUpdated(customChannelTypeRules.length)
                    setSavedCustomChannelTypeRules(customChannelTypeRules)
                }}
                isSaveDisabled={equal(customChannelTypeRules, savedCustomChannelTypeRules)}
                canEdit={!restrictedReason}
            />
        </div>
    )
}

export interface ChannelTypeEditorProps {
    handleChange: (rules: CustomChannelRule[]) => void
    initialCustomChannelTypeRules: CustomChannelRule[]
    channelTypeOptions: LemonInputSelectOption[]
    isSaveDisabled: boolean
    onSave: () => void
    canEdit: boolean
}

export function ChannelTypeEditor({
    handleChange,
    initialCustomChannelTypeRules,
    channelTypeOptions,
    isSaveDisabled,
    onSave,
    canEdit,
}: ChannelTypeEditorProps): JSX.Element {
    const { t } = useTranslation()
    const editorOnlyReason = t('settings.environment.customChannelTypes.editorOnlyReason', {
        defaultValue: 'You need editor access to modify channel types',
    })

    return (
        <VerticalNestedDND<CustomChannelCondition, CustomChannelRule>
            initialItems={initialCustomChannelTypeRules}
            renderContainerItem={(rule, { updateContainerItem }) => {
                return (
                    <div className="flex flex-col deprecated-space-y-2">
                        <div className="flex flex-row items-center deprecated-space-x-2">
                            <span>
                                {t('settings.environment.customChannelTypes.setChannelTypeTo', {
                                    defaultValue: 'Set Channel type to',
                                })}
                            </span>
                            <LemonInputSelect
                                className="flex-1"
                                mode="single"
                                allowCustomValues={true}
                                value={[rule.channel_type]}
                                onChange={(channelType) =>
                                    updateContainerItem({
                                        ...rule,
                                        channel_type: channelType[0],
                                    })
                                }
                                options={channelTypeOptions}
                                placeholder={t('settings.environment.customChannelTypes.channelTypePlaceholder', {
                                    defaultValue: 'Enter a channel type name',
                                })}
                                disabled={!canEdit}
                            />
                        </div>
                        {rule.items.length > 0 ? (
                            <div>
                                {rule.items.length == 1 ? (
                                    t('settings.environment.customChannelTypes.singleCondition', {
                                        defaultValue: 'when this condition is met',
                                    })
                                ) : (
                                    <div className="flex flex-row items-center deprecated-space-x-2">
                                        <span>
                                            {t('settings.environment.customChannelTypes.when', {
                                                defaultValue: 'When',
                                            })}
                                        </span>
                                        <LemonSelect
                                            value={rule.combiner}
                                            options={combinerOptions}
                                            onChange={(combiner) => updateContainerItem({ ...rule, combiner })}
                                            disabledReason={!canEdit ? editorOnlyReason : undefined}
                                        />
                                        <span>
                                            {t('settings.environment.customChannelTypes.multipleConditions', {
                                                defaultValue: 'conditions are met',
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )
            }}
            renderChildItem={(rule, { updateChildItem }) => {
                return (
                    <div className="w-full deprecated-space-y-2">
                        <div className="flex flex-row deprecated-space-x-2">
                            <LemonSelect<CustomChannelField>
                                value={rule.key}
                                options={keyOptions}
                                onChange={(key) => updateChildItem({ ...rule, key })}
                                disabledReason={!canEdit ? editorOnlyReason : undefined}
                            />
                            <LemonSelect<CustomChannelOperator>
                                value={rule.op}
                                options={opOptions}
                                onChange={(op) => updateChildItem({ ...rule, op })}
                                disabledReason={!canEdit ? editorOnlyReason : undefined}
                            />
                        </div>
                        {isNullary(rule.op) ? null : canEdit ? (
                            <PropertyValue
                                key={rule.key}
                                propertyKey={keyToSessionProperty(rule.key)}
                                type={PropertyFilterType.Session}
                                onSet={(propertyValue: any) => {
                                    updateChildItem({ ...rule, value: propertyValue })
                                }}
                                operator={opToPropertyOperator[rule.op]}
                                value={rule.value}
                                placeholder={t('settings.environment.customChannelTypes.valuePlaceholder', {
                                    defaultValue: 'Enter a value',
                                })}
                            />
                        ) : (
                            <div className="text-muted">
                                {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                            </div>
                        )}
                    </div>
                )
            }}
            renderAddChildItem={(rule, { onAddChild }) => {
                return canEdit ? (
                    <LemonButton type="primary" onClick={() => onAddChild(rule.id)} icon={<IconPlus />}>
                        {t('settings.environment.customChannelTypes.addCondition', {
                            defaultValue: 'Add condition',
                        })}
                    </LemonButton>
                ) : null
            }}
            renderAddContainerItem={({ onAddContainer }) => {
                return canEdit ? (
                    <LemonButton type="primary" onClick={onAddContainer} icon={<IconPlus />}>
                        {t('settings.environment.customChannelTypes.addRule', { defaultValue: 'Add rule' })}
                    </LemonButton>
                ) : null
            }}
            renderAdditionalControls={() => {
                return canEdit ? (
                    <LemonButton
                        onClick={onSave}
                        disabledReason={
                            isSaveDisabled
                                ? t('settings.noChangesToSave', { defaultValue: 'No changes to save' })
                                : undefined
                        }
                        type="primary"
                    >
                        {t('settings.environment.customChannelTypes.save', {
                            defaultValue: 'Save custom channel type rules',
                        })}
                    </LemonButton>
                ) : null
            }}
            createNewContainerItem={() => {
                return {
                    id: uuid(),
                    items: [
                        {
                            id: uuid(),
                            key: CustomChannelField.ReferringDomain,
                            op: CustomChannelOperator.Exact,
                            value: [],
                        },
                    ],
                    channel_type: '',
                    combiner: FilterLogicalOperator.And,
                }
            }}
            createNewChildItem={() => {
                return {
                    id: uuid(),
                    key: CustomChannelField.ReferringDomain,
                    op: CustomChannelOperator.Exact,
                    value: [],
                }
            }}
            onChange={handleChange}
        />
    )
}
