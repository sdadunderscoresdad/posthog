import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useTranslation } from 'react-i18next'

import { LemonBanner, LemonButton } from '@posthog/lemon-ui'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInputSelect } from 'lib/lemon-ui/LemonInputSelect/LemonInputSelect'
import { LemonSkeleton } from 'lib/lemon-ui/LemonSkeleton'

import { logsConfigLogic } from 'products/logs/frontend/logsConfigLogic'

export function LogsPatternMessageKeys(): JSX.Element {
    const { t } = useTranslation()
    const {
        logsConfig,
        logsConfigLoading,
        patternMessageKeysChanged,
        patternMessageKeysValidationErrors,
        isPatternMessageKeysSubmitting,
    } = useValues(logsConfigLogic)
    const { loadLogsConfig } = useActions(logsConfigLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    if (!logsConfig) {
        return logsConfigLoading ? (
            <LemonSkeleton className="w-1/2 h-4" />
        ) : (
            <LemonBanner
                type="error"
                action={{
                    children: t('settings.environment.logsPatternMessageKeys.retry', { defaultValue: 'Retry' }),
                    onClick: () => loadLogsConfig(),
                }}
            >
                {t('settings.environment.logsPatternMessageKeys.loadError', {
                    defaultValue: 'Could not load pattern message extraction settings.',
                })}
            </LemonBanner>
        )
    }

    return (
        <Form logic={logsConfigLogic} formKey="patternMessageKeys" enableFormOnSubmit className="space-y-4">
            <LemonField
                name="keys"
                label={t('settings.environment.logsPatternMessageKeys.label', { defaultValue: 'Message keys' })}
                help={t('settings.environment.logsPatternMessageKeys.help', {
                    defaultValue: 'Drag keys to change their priority. Clear all keys to disable message extraction.',
                })}
            >
                <LemonInputSelect
                    mode="multiple"
                    allowCustomValues
                    sortable={!restrictedReason && !logsConfigLoading && !isPatternMessageKeysSubmitting}
                    limit={10}
                    disableCommaSplitting
                    bulkActions="clear-all"
                    placeholder={t('settings.environment.logsPatternMessageKeys.placeholder', {
                        defaultValue: 'Add a message key',
                    })}
                    loading={logsConfigLoading}
                    disabled={logsConfigLoading || isPatternMessageKeysSubmitting || !!restrictedReason}
                    data-attr="logs-pattern-message-keys-select"
                    className="max-w-md"
                />
            </LemonField>
            {patternMessageKeysValidationErrors.keys?.[0] && (
                <LemonField.Error error={patternMessageKeysValidationErrors.keys[0]} />
            )}
            <LemonButton
                type="primary"
                htmlType="submit"
                disabledReason={
                    restrictedReason ||
                    patternMessageKeysValidationErrors.keys?.[0] ||
                    (!patternMessageKeysChanged
                        ? t('settings.noChangesToSave', { defaultValue: 'No changes to save' })
                        : undefined)
                }
                loading={logsConfigLoading || isPatternMessageKeysSubmitting}
            >
                {t('settings.save', { defaultValue: 'Save' })}
            </LemonButton>
        </Form>
    )
}
