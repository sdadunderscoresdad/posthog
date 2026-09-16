import {
    ActivityChange,
    ActivityLogItem,
    ActivityLogUserName,
    ChangeMapping,
    Description,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { SentenceList } from 'lib/components/ActivityLog/SentenceList'
import { PathCleanFilterItem } from 'lib/components/PathCleanFilters/PathCleanFilterItem'
import { keyFromFilter } from 'lib/components/PathCleanFilters/PathCleanFilters'
import PropertyFiltersDisplay from 'lib/components/PropertyFilters/components/PropertyFiltersDisplay'
import { getActiveLocale, i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { CURRENCY_SYMBOL_TO_EMOJI_MAP, CURRENCY_SYMBOL_TO_NAME_MAP } from 'lib/utils/currency'
import { isObject } from 'lib/utils/guards'
import { pluralize } from 'lib/utils/strings'
import { urls } from 'scenes/urls'

import { CurrencyCode } from '~/queries/schema/schema-general'
import {
    ActivityScope,
    CorrelationConfigType,
    GroupType,
    PathCleaningFilter,
    TeamSurveyConfigType,
    TeamType,
} from '~/types'

import { ThemeName } from '../dataThemeLogic'
import { coreEventsConfigurationDescriber } from './core_events_config/coreEventsConfigurationDescriber'
import { customerAnalyticsConfigurationDescriber } from './customer_analytics_config/customerAnalyticsConfigurationDescriber'
import { marketingAnalyticsConfigurationDescriber } from './marketing_analytics_config/marketingAnalyticsConfigurationDescriber'
import { revenueAnalyticsConfigurationDescriber } from './revenue_analytics_config/revenueAnalyticsConfigurationDescriber'

const isNumberOrNull = (x: unknown): x is number | null => {
    if (typeof x === 'number') {
        return !isNaN(x)
    } else if (typeof x === 'string') {
        return !isNaN(parseFloat(x))
    }
    return false
}

// Helper functions for common change description patterns
function createBooleanToggleHandler(featureName: string, options: { verb?: [string, string] } = {}) {
    return (change: ActivityChange): ChangeMapping | null => {
        const {
            verb = [
                i18n.t('teamActivity.enabled', { defaultValue: 'enabled' }),
                i18n.t('teamActivity.disabled', { defaultValue: 'disabled' }),
            ],
        } = options

        const [enabledVerb, disabledVerb] = verb
        const verbText = change.after ? enabledVerb : disabledVerb

        return {
            description: [
                <>
                    {verbText} {featureName}
                </>,
            ],
        }
    }
}

function createSessionRecordingConfigHandler(configName: string) {
    return (change: ActivityChange): ChangeMapping | null => {
        if (change.before === null && change.after === null) {
            return null
        }
        return {
            description: [
                <>
                    {' '}
                    {i18n.t('teamActivity.changedSessionReplay', { defaultValue: 'Changed session replay' })}{' '}
                    {configName}
                </>,
            ],
        }
    }
}

function createApiTokenHandler(tokenType: string, createdVerb: string, changedVerb: string) {
    return (change: ActivityChange): ChangeMapping | null => {
        if (change.after === undefined) {
            return null
        }

        const prefix = change.action === 'created' ? createdVerb : changedVerb
        return {
            description: [
                <>
                    {prefix} {i18n.t('teamActivity.the', { defaultValue: 'the' })} {tokenType}
                </>,
            ],
        }
    }
}

function createArrayChangeHandler(
    fieldName: string,
    options: { useEmphasis?: boolean; map?: (item: any) => string | null | undefined } = {}
) {
    return (change: ActivityChange): ChangeMapping | null => {
        const { useEmphasis = true, map } = options

        if (change.after === undefined) {
            return null
        }

        const array = (change.after || []) as any[]
        const displayArray = map ? array.map(map).filter(Boolean) : array
        const fieldNameElement = useEmphasis ? <em>{fieldName}</em> : fieldName

        return {
            description: [
                <>
                    {change.action === 'created'
                        ? i18n.t('teamActivity.set', { defaultValue: 'set' })
                        : i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                    {i18n.t('teamActivity.the', { defaultValue: 'the' })} {fieldNameElement}{' '}
                    {i18n.t('teamActivity.to', { defaultValue: 'to' })} <code>[{displayArray.join(', ')}]</code>
                </>,
            ],
        }
    }
}

function createSimpleValueHandler(fieldName: string, options: { useEmphasis?: boolean; requireValue?: boolean } = {}) {
    return (change: ActivityChange): ChangeMapping | null => {
        const { useEmphasis = false, requireValue = true } = options

        if (requireValue && !change.after) {
            return null
        }

        const valueElement = useEmphasis ? <em>{String(change.after)}</em> : change.after
        return {
            description: [
                <>
                    {change.action === 'created'
                        ? i18n.t('teamActivity.set', { defaultValue: 'set' })
                        : i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                    {i18n.t('teamActivity.the', { defaultValue: 'the' })} {fieldName}{' '}
                    {i18n.t('teamActivity.to', { defaultValue: 'to' })} {valueElement}
                </>,
            ],
        }
    }
}

function createFixedVerbValueHandler(
    verb: string,
    fieldName: string,
    options: { useEmphasis?: boolean; checkBothNull?: boolean } = {}
) {
    return (change: ActivityChange): ChangeMapping | null => {
        const { useEmphasis = false, checkBothNull = false } = options

        if (checkBothNull && change.before === null && change.after === null) {
            return null
        }

        const valueElement = useEmphasis ? <em>{String(change.after)}</em> : change.after
        return {
            description: [
                <>
                    {verb} {fieldName} {i18n.t('teamActivity.to', { defaultValue: 'to' })} {valueElement}
                </>,
            ],
        }
    }
}

function buildTeamPropertiesMapping(): Record<keyof TeamType, (change: ActivityChange) => ChangeMapping | null> {
    return {
        // API-related tokens
        api_token: createApiTokenHandler(
            i18n.t('teamActivity.feature.projectToken', { defaultValue: 'project token' }),
            i18n.t('teamActivity.set', { defaultValue: 'set' }),
            i18n.t('teamActivity.reset', { defaultValue: 'reset' })
        ),
        secret_api_token: createApiTokenHandler(
            i18n.t('teamActivity.feature.featureFlagsSecureApiKey', { defaultValue: 'Feature Flags secure API key' }),
            i18n.t('teamActivity.generated', { defaultValue: 'generated' }),
            i18n.t('teamActivity.rotated', { defaultValue: 'rotated' })
        ),
        secret_api_token_backup: (change) => {
            if (change.after === undefined || change.action !== 'deleted') {
                return null
            }

            return {
                description: [
                    <>
                        {i18n.t('teamActivity.deletedFeatureFlagsKeyBackup', {
                            defaultValue: 'Deleted the Feature Flags secure API key backup',
                        })}
                    </>,
                ],
            }
        },

        // Session replay config
        session_recording_url_trigger_config: createSessionRecordingConfigHandler(
            i18n.t('teamActivity.feature.urlTriggers', { defaultValue: 'URL triggers' })
        ),
        session_recording_url_blocklist_config: createSessionRecordingConfigHandler(
            i18n.t('teamActivity.feature.urlBlocklist', { defaultValue: 'URL blocklist' })
        ),
        session_recording_event_trigger_config: createSessionRecordingConfigHandler(
            i18n.t('teamActivity.feature.eventTriggers', { defaultValue: 'event triggers' })
        ),
        session_recording_trigger_match_type_config: createFixedVerbValueHandler(
            i18n.t('teamActivity.changed', { defaultValue: 'Changed' }),
            i18n.t('teamActivity.feature.sessionReplayTriggerMatchType', {
                defaultValue: 'session replay trigger match type',
            }),
            { checkBothNull: true }
        ),
        capture_console_log_opt_in: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.consoleLogCapture', { defaultValue: 'console log capture in session replay' })
        ),
        capture_performance_opt_in: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.consoleNetworkPerformanceCapture', {
                defaultValue: 'console network performance capture in session replay',
            })
        ),
        capture_dead_clicks: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.deadClicksAutocapture', { defaultValue: 'dead clicks autocapture' })
        ),
        session_recording_opt_in: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.sessionRecording', { defaultValue: 'session recording' })
        ),
        session_recording_minimum_duration_milliseconds: (change) => {
            const after = change.after
            if (after === undefined || typeof after !== 'number') {
                return null
            }

            let prefix = i18n.t('teamActivity.changed', { defaultValue: 'changed' })
            if (change.action === 'created') {
                prefix = i18n.t('teamActivity.set', { defaultValue: 'set' })
            }
            return {
                description: [
                    <>
                        {prefix} {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
                        {i18n.t('teamActivity.minimumSessionRecordingDuration', {
                            defaultValue: 'minimum session recording duration',
                        })}{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })} {after / 1000}{' '}
                        {i18n.t('teamActivity.seconds', { defaultValue: 'seconds' })}
                    </>,
                ],
            }
        },
        recording_domains: (change) => {
            const before: string[] | null = Array.isArray(change.before) ? (change.before.map(String) ?? null) : null
            const after: string[] | null = Array.isArray(change.after) ? (change.after.map(String) ?? null) : null
            if (after === null && before === null) {
                return null
            }

            const descriptions = []

            const adds: string[] = []
            if (after) {
                for (const domain of after) {
                    if ((!before || !before.includes(domain)) && domain.trim().length > 0) {
                        adds.push(domain)
                    }
                }
            }
            if (adds.length) {
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.added', { defaultValue: 'added' })} {adds.join(', ')}{' '}
                        {i18n.t('teamActivity.toSessionRecordingAuthorised', {
                            defaultValue: 'to session recording authorised',
                        })}{' '}
                        {pluralize(
                            adds.length,
                            i18n.t('teamActivity.domain', { defaultValue: 'domain' }),
                            i18n.t('teamActivity.domains', { defaultValue: 'domains' }),
                            false
                        )}
                    </>
                )
            }

            const removes: string[] = []
            if (before) {
                for (const domain of before) {
                    if ((!after || !after.includes(domain)) && domain.trim().length > 0) {
                        removes.push(domain)
                    }
                }
            }

            if (removes.length) {
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.removed', { defaultValue: 'removed' })} {removes.join(', ')}{' '}
                        {i18n.t('teamActivity.fromSessionRecordingAuthorised', {
                            defaultValue: 'from session recording authorised',
                        })}{' '}
                        {pluralize(
                            removes.length,
                            i18n.t('teamActivity.domain', { defaultValue: 'domain' }),
                            i18n.t('teamActivity.domains', { defaultValue: 'domains' }),
                            false
                        )}
                    </>
                )
            }
            return { description: descriptions }
        },
        session_recording_linked_flag: (change) => {
            const key = (change.after as any)?.key ?? (change.before as any)?.key ?? String(change.after)
            return {
                description: [
                    <>
                        {change?.after
                            ? i18n.t('teamActivity.linked', { defaultValue: 'linked' })
                            : i18n.t('teamActivity.unlinked', { defaultValue: 'unlinked' })}{' '}
                        {i18n.t('teamActivity.feature.sessionRecording', { defaultValue: 'session recording' })}{' '}
                        {i18n.t('teamActivity.toFeatureFlag', { defaultValue: 'to feature flag' })} {key}
                    </>,
                ],
            }
        },
        session_recording_masking_config: (change) => {
            const maskAllInputsBefore = isObject(change.before) ? change.before.maskAllInputs : !!change.before
            const maskAllInputsAfter = isObject(change.after) ? change.after.maskAllInputs : !!change.after
            const maskAllInputsChanged = maskAllInputsBefore !== maskAllInputsAfter

            const blockSelectorBefore = isObject(change?.before) ? change?.before.blockSelector : undefined
            const blockSelectorAfter = isObject(change?.after) ? change?.after.blockSelector : undefined
            const blockSelectorChanged = blockSelectorBefore !== blockSelectorAfter

            const maskTextSelectorBefore = isObject(change?.before) ? change?.before.maskTextSelector : !!change?.before
            const maskTextSelectorAfter = isObject(change?.after) ? change?.after.maskTextSelector : !!change?.after
            const maskTextSelectorChanged = maskTextSelectorBefore !== maskTextSelectorAfter

            const descriptions = []
            if (maskAllInputsChanged) {
                descriptions.push(
                    <>
                        {maskAllInputsAfter
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
                        {i18n.t('teamActivity.feature.maskingAllInputs', {
                            defaultValue: 'masking all inputs in session replay',
                        })}
                    </>
                )
            }

            if (maskTextSelectorChanged) {
                descriptions.push(
                    <>
                        {change?.action === 'created'
                            ? i18n.t('teamActivity.set', { defaultValue: 'set' })
                            : i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                        {i18n.t('teamActivity.feature.maskingTextSelector', { defaultValue: 'masking text selector' })}{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })} {maskTextSelectorAfter}{' '}
                        {i18n.t('teamActivity.inSessionReplay', { defaultValue: 'in session replay' })}
                    </>
                )
            }

            if (blockSelectorChanged) {
                descriptions.push(
                    <>
                        {change?.action === 'created'
                            ? i18n.t('teamActivity.set', { defaultValue: 'set' })
                            : i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                        {i18n.t('teamActivity.feature.blockingSelector', { defaultValue: 'blocking selector' })}{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })} \"{blockSelectorAfter}\"
                    </>
                )
            }

            return descriptions.length
                ? {
                      description: descriptions,
                  }
                : null
        },
        session_recording_network_payload_capture_config: (change) => {
            const payloadBefore = isObject(change.before) ? change.before.recordBody : !!change.before
            const payloadAfter = isObject(change.after) ? change.after.recordBody : !!change.after
            const payloadChanged = payloadBefore !== payloadAfter

            const headersBefore = isObject(change.before) ? change.before.recordHeaders : !!change.before
            const headersAfter = isObject(change.after) ? change.after.recordHeaders : !!change.after
            const headersChanged = headersBefore !== headersAfter

            const descriptions = []
            if (payloadChanged) {
                descriptions.push(
                    <>
                        {payloadAfter
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
                        {i18n.t('teamActivity.feature.networkBodyCapture', {
                            defaultValue: 'network body capture in session replay',
                        })}
                    </>
                )
            }

            if (headersChanged) {
                descriptions.push(
                    <>
                        {headersAfter
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
                        {i18n.t('teamActivity.feature.networkHeadersCapture', {
                            defaultValue: 'network headers capture in session replay',
                        })}
                    </>
                )
            }

            return descriptions.length
                ? {
                      description: descriptions,
                  }
                : null
        },
        session_recording_sample_rate: (change) => {
            // purposefully not double equal
            const hasBefore = change.before != undefined
            const hasAfter = change.after != undefined
            if (!hasAfter && !hasBefore) {
                return null
            }
            if (change.before === change.after) {
                return null
            }
            if (!isNumberOrNull(change.after)) {
                return null
            }

            // removing the sample rate is equivalent to 100%
            const chosenSampleRate = change.after ?? 1

            return {
                description: [
                    <>
                        {change.action === 'created'
                            ? i18n.t('teamActivity.set', { defaultValue: 'set' })
                            : i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                        {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
                        {i18n.t('teamActivity.feature.sessionRecordingSampleRate', {
                            defaultValue: 'session recording sample rate',
                        })}{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })} {(chosenSampleRate * 100).toFixed(0)}%
                    </>,
                ],
            }
        },
        session_replay_config: (change) => {
            // TODO we'll eventually need a deeper mapping for this nested object
            const after = change.after
            const recordCanvasAfter =
                after && typeof after === 'object' && !Array.isArray(after) ? after.record_canvas : null

            if (recordCanvasAfter === null) {
                return null
            }
            return {
                description: [
                    <>
                        {recordCanvasAfter
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
                        {i18n.t('teamActivity.feature.canvasRecording', {
                            defaultValue: 'canvas recording in session replay',
                        })}
                    </>,
                ],
            }
        },
        session_recording_retention_period: createSimpleValueHandler(
            i18n.t('teamActivity.feature.sessionReplayDataRetention', { defaultValue: 'session replay data retention' })
        ),
        session_recording_trigger_groups: createSessionRecordingConfigHandler(
            i18n.t('teamActivity.feature.sessionRecordingTriggerGroups', {
                defaultValue: 'session recording trigger groups',
            })
        ),

        // Survey config
        surveys_opt_in: createBooleanToggleHandler(i18n.t('teamActivity.feature.surveys', { defaultValue: 'surveys' })),
        survey_config: (change) => {
            const before = change.before as TeamSurveyConfigType
            const after = change.after as TeamSurveyConfigType
            const descriptions = []
            const preamble = i18n.t('teamActivity.survey.preamble', { defaultValue: 'Survey Configuration: ' })
            if (before === undefined) {
                descriptions.push(
                    i18n.t('teamActivity.survey.enabled', { defaultValue: 'Survey Configuration was enabled' })
                )
            }

            const propertyChangeDesc = (
                name: string,
                callback: (config: TeamSurveyConfigType) => string | undefined
            ): void => {
                if (callback(before) !== callback(after)) {
                    descriptions.push(
                        i18n.t('teamActivity.survey.propertyChanged', {
                            defaultValue: '{{ preamble }} {{ name }} was changed from "{{ before }}" to "{{ after }}"',
                            preamble,
                            name,
                            before: callback(before),
                            after: callback(after),
                        })
                    )
                }
            }

            if (before?.appearance?.whiteLabel !== after?.appearance?.whiteLabel) {
                descriptions.push(
                    i18n.t('teamActivity.survey.whiteLabeling', {
                        defaultValue: '{{ preamble }} Survey white labeling was {{ state }}',
                        preamble,
                        state: after?.appearance?.whiteLabel
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' }),
                    })
                )
            }

            if (before?.appearance?.displayThankYouMessage !== after?.appearance?.displayThankYouMessage) {
                descriptions.push(
                    i18n.t('teamActivity.survey.displayThankYouMessage', {
                        defaultValue: '{{ preamble }} displayThankYouMessage was {{ state }}',
                        preamble,
                        state: after?.appearance?.whiteLabel
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' }),
                    })
                )
            }

            propertyChangeDesc('backgroundColor', (c) => c?.appearance?.backgroundColor)
            propertyChangeDesc('submitButtonColor', (c) => c?.appearance?.submitButtonColor)
            propertyChangeDesc('submitButtonTextColor', (c) => c?.appearance?.submitButtonTextColor)
            propertyChangeDesc('ratingButtonColor', (c) => c?.appearance?.ratingButtonColor)
            propertyChangeDesc('ratingButtonActiveColor', (c) => c?.appearance?.ratingButtonActiveColor)
            propertyChangeDesc('borderColor', (c) => c?.appearance?.borderColor)
            propertyChangeDesc('placeholder', (c) => c?.appearance?.placeholder)
            propertyChangeDesc('thankYouMessageHeader', (c) => c?.appearance?.thankYouMessageHeader)
            propertyChangeDesc('position', (c) => c?.appearance?.position)

            return { description: descriptions }
        },

        // Logs
        logs_settings: () => {
            return {
                description: [
                    <>{i18n.t('teamActivity.updatedLogsSettings', { defaultValue: 'updated logs settings' })}</>,
                ],
            }
        },

        // Feature flag confirmation config
        feature_flag_confirmation_enabled: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.featureFlagConfirmation', { defaultValue: 'feature flag confirmation' })
        ),
        feature_flag_confirmation_message: createSimpleValueHandler(
            i18n.t('teamActivity.feature.featureFlagConfirmationMessage', {
                defaultValue: 'feature flag confirmation message',
            })
        ),
        default_evaluation_contexts_enabled: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.defaultEvaluationContexts', { defaultValue: 'default evaluation contexts' })
        ),

        // Autocapture
        autocapture_exceptions_errors_to_ignore: createArrayChangeHandler(
            i18n.t('teamActivity.feature.autocaptureExceptionsErrorsToIgnore', {
                defaultValue: 'autocapture exceptions errors to ignore',
            })
        ),
        autocapture_exceptions_opt_in: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.exceptionAutocapture', { defaultValue: 'exception autocapture' })
        ),
        autocapture_web_vitals_opt_in: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.webVitalsAutocapture', { defaultValue: 'web vitals autocapture' })
        ),
        autocapture_opt_out: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.autocapture', { defaultValue: 'autocapture' }),
            {
                verb: [
                    i18n.t('teamActivity.optedOutOf', { defaultValue: 'opted out of' }),
                    i18n.t('teamActivity.optedInTo', { defaultValue: 'opted in to' }),
                ],
            }
        ),
        heatmaps_opt_in: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.heatmaps', { defaultValue: 'heatmaps' })
        ),
        autocapture_web_vitals_allowed_metrics: (change) => {
            const after = change.after
            const metricsList = Array.isArray(after)
                ? after.join(', ')
                : i18n.t('teamActivity.webVitals.defaultMetrics', { defaultValue: 'CLS, FCP, INP, and LCP' })
            return {
                description: [
                    <>
                        {i18n.t('teamActivity.set', { defaultValue: 'set' })}{' '}
                        {i18n.t('teamActivity.feature.allowedWebVitalsMetrics', {
                            defaultValue: 'allowed web vitals autocapture metrics',
                        })}{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })} {metricsList}
                    </>,
                ],
            }
        },

        // and.... many more random stuff
        name: createSimpleValueHandler(i18n.t('teamActivity.feature.teamName', { defaultValue: 'team name' }), {
            requireValue: false,
        }),
        test_account_filters_default_checked: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.internalAndTestAccountFilters', {
                defaultValue: '"internal & test account filters" for all insights',
            })
        ),
        anonymize_ips: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.anonymizingIps', { defaultValue: 'anonymizing IP addresses' })
        ),
        timezone: createSimpleValueHandler(i18n.t('teamActivity.feature.timezone', { defaultValue: 'timezone' }), {
            useEmphasis: true,
        }),
        business_model: createSimpleValueHandler(
            i18n.t('teamActivity.feature.businessModel', { defaultValue: 'business model' })
        ),
        data_attributes: createArrayChangeHandler(
            i18n.t('teamActivity.feature.dataAttributes', { defaultValue: 'data attributes' })
        ),
        live_events_columns: createArrayChangeHandler(
            i18n.t('teamActivity.feature.liveEventsColumns', { defaultValue: 'live events columns' })
        ),
        app_urls: createArrayChangeHandler(i18n.t('teamActivity.feature.appUrls', { defaultValue: 'app URLs' })),
        group_types: createArrayChangeHandler(
            i18n.t('teamActivity.feature.groupTypes', { defaultValue: 'group types' }),
            { map: (group: GroupType) => group.name_plural }
        ),
        person_display_name_properties: createArrayChangeHandler(
            i18n.t('teamActivity.feature.personDisplayNameProperties', {
                defaultValue: 'person display name properties',
            })
        ),
        person_on_events_querying_enabled: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.queryingPersonOnEvents', { defaultValue: 'querying person on events' })
        ),
        human_friendly_comparison_periods: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.humanFriendlyComparisonPeriods', {
                defaultValue: 'human friendly comparison periods',
            })
        ),
        receive_org_level_activity_logs: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.orgLevelActivityLogs', { defaultValue: 'organization-level activity logs' })
        ),
        require_evaluation_contexts: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.requireEvaluationContextTags', {
                defaultValue: 'require evaluation context tags',
            })
        ),
        test_account_filters: (change) => {
            // change.after is an array of property filters
            // change.before is an array o property filters
            // so we can say what was removed and what was added
            const afters = Array.isArray(change.after) ? change.after || [] : []
            const befores = Array.isArray(change.before) ? change.before || [] : []

            const addedFilters = afters.filter((filter) => !befores.some((before) => before.key === filter.key))
            const removedFilters = befores.filter((filter) => !afters.some((after) => after.key === filter.key))

            const listParts = []
            if (addedFilters.length) {
                listParts.push(
                    <>
                        {i18n.t('teamActivity.added', { defaultValue: 'added' })}{' '}
                        <PropertyFiltersDisplay filters={addedFilters} />
                    </>
                )
            }
            if (removedFilters.length) {
                listParts.push(
                    <>
                        {i18n.t('teamActivity.removed', { defaultValue: 'removed' })}{' '}
                        <PropertyFiltersDisplay filters={removedFilters} />
                    </>
                )
            }
            if (listParts.length === 0) {
                return null
            }

            return {
                description: [
                    <>
                        {i18n.t('teamActivity.updatedInternalAccountFilters', {
                            defaultValue: 'Updated the "internal and test" account filters',
                        })}
                    </>,
                    <SentenceList key={0} listParts={listParts} />,
                ],
            }
        },
        extra_settings: (change) => {
            const after = change.after
            if (typeof after !== 'object') {
                return null
            }
            const descriptions = []
            for (const key in after) {
                if (key === 'poe_v2_enabled') {
                    descriptions.push(
                        <>
                            {after[key as keyof typeof after]
                                ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                                : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
                            {i18n.t('teamActivity.personOnEventsV2', { defaultValue: 'Person on Events (v2)' })}
                        </>
                    )
                }
            }
            return { description: descriptions }
        },
        modifiers: (change) => {
            const after = change.after
            if (typeof after !== 'object') {
                return null
            }
            const descriptions = []
            for (const key in after) {
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.set', { defaultValue: 'set' })} <em>{key}</em>{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })} \"{String(after[key as keyof typeof after])}
                        \"
                    </>
                )
            }
            return { description: descriptions }
        },
        default_data_theme: (change) => {
            return {
                description: [
                    <>
                        {i18n.t('teamActivity.changedDefaultColorTheme', {
                            defaultValue: 'changed the default color theme',
                        })}{' '}
                        {change.before && (
                            <>
                                {i18n.t('teamActivity.from', { defaultValue: 'from' })}{' '}
                                <ThemeName id={change.before as number} />{' '}
                            </>
                        )}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        <em>
                            <ThemeName id={change.after as number} />
                        </em>
                    </>,
                ],
            }
        },
        base_currency: (change) => {
            const before = change.before as CurrencyCode
            const after = change.after as CurrencyCode

            return {
                description: [
                    <>
                        {i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                        {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
                        <em>{i18n.t('teamActivity.feature.baseCurrency', { defaultValue: 'base currency' })}</em>{' '}
                        {i18n.t('teamActivity.from', { defaultValue: 'from' })}{' '}
                        <strong>
                            {CURRENCY_SYMBOL_TO_EMOJI_MAP[before]}&nbsp;{before}
                        </strong>{' '}
                        ({CURRENCY_SYMBOL_TO_NAME_MAP[before]}) {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        <strong>
                            {CURRENCY_SYMBOL_TO_EMOJI_MAP[after]}&nbsp;{after}
                        </strong>{' '}
                        ({CURRENCY_SYMBOL_TO_NAME_MAP[after]})
                    </>,
                ],
            }
        },
        completed_snippet_onboarding: (change) => {
            if (!change.after) {
                return null
            }

            return {
                description: [
                    <>
                        {i18n.t('teamActivity.completedTheirOnboarding', {
                            defaultValue: 'completed their onboarding',
                        })}
                    </>,
                ],
            }
        },
        week_start_day: (change) => {
            if (change.after === undefined || change.after === null) {
                return null
            }

            const dayOfWeekMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

            return {
                description: [
                    <>
                        {change.action === 'created'
                            ? i18n.t('teamActivity.set', { defaultValue: 'set' })
                            : i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                        {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
                        {i18n.t('teamActivity.feature.weekStartDay', { defaultValue: 'week start day' })}{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        <em>{dayOfWeekMapping[change.after as number]}</em>
                    </>,
                ],
            }
        },
        primary_dashboard: (change) => {
            if (!change.after) {
                return null
            }

            return {
                description: [
                    <>
                        {change.action === 'created'
                            ? i18n.t('teamActivity.set', { defaultValue: 'set' })
                            : i18n.t('teamActivity.changed', { defaultValue: 'changed' })}{' '}
                        {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
                        <em>
                            {i18n.t('teamActivity.feature.primaryDashboard', { defaultValue: 'primary dashboard' })}
                        </em>{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        <Link to={urls.dashboard(change.after as number)}>
                            <em>{String(change.after)}</em>
                        </Link>
                    </>,
                ],
            }
        },
        flags_persistence_default: (change) => {
            return {
                description: [
                    <>
                        {change.after
                            ? i18n.t('teamActivity.enabled', { defaultValue: 'enabled' })
                            : i18n.t('teamActivity.disabled', { defaultValue: 'disabled' })}{' '}
                        <Link
                            to="https://posthog.com/docs/feature-flags/creating-feature-flags#persisting-feature-flags-across-authentication-steps"
                            target="_blank"
                        >
                            {i18n.t('teamActivity.feature.flagPersistence', { defaultValue: 'flag persistence' })}
                        </Link>{' '}
                        {i18n.t('teamActivity.byDefault', { defaultValue: 'by default' })}
                    </>,
                ],
            }
        },
        path_cleaning_filters: (change) => {
            if (change.after === undefined) {
                return null
            }

            return {
                description: [
                    <>
                        {i18n.t('teamActivity.set', { defaultValue: 'set' })}{' '}
                        {i18n.t('teamActivity.the', { defaultValue: 'the' })}{' '}
                        <em>
                            {i18n.t('teamActivity.feature.pathCleaningFilters', {
                                defaultValue: 'path cleaning filters',
                            })}
                        </em>{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        {(change.after as PathCleaningFilter[]).map((filter) => (
                            <PathCleanFilterItem key={keyFromFilter(filter)} filter={filter} />
                        ))}
                    </>,
                ],
            }
        },
        onboarding_tasks: (change) => {
            const afterTasks = change.after ? Object.entries(change.after) : []
            const changedTasks = afterTasks.filter(([key, value]) => {
                const beforeValue = (change.before as { [key: string]: string })?.[key]
                return beforeValue !== value
            })

            if (!changedTasks.length) {
                return null
            }

            return {
                description: [
                    <>
                        {changedTasks.map(([key, value], index) => (
                            <span key={key}>
                                {index > 0 && <>, </>}
                                {value === 'completed'
                                    ? i18n.t('teamActivity.completed', { defaultValue: 'completed' })
                                    : i18n.t('teamActivity.uncompleted', { defaultValue: 'uncompleted' })}{' '}
                                {i18n.t('teamActivity.onboardingTask', { defaultValue: 'onboarding task' })}{' '}
                                <em>{key}</em>
                            </span>
                        ))}
                    </>,
                ],
            }
        },
        has_completed_onboarding_for: (change) => {
            const beforeProducts: { [key: string]: boolean } = (change.before as { [key: string]: boolean }) || {}
            const afterProducts: { [key: string]: boolean } = (change.after as { [key: string]: boolean }) || {}

            const newlyCompletedProducts = Object.entries(afterProducts).filter(
                ([product, completed]) => completed && !beforeProducts[product]
            )

            if (!newlyCompletedProducts.length) {
                return null
            }

            return {
                description: [
                    <>
                        {i18n.t('teamActivity.completedOnboardingFor', { defaultValue: 'completed onboarding for' })}{' '}
                        {newlyCompletedProducts.map(([product], index) => (
                            <span key={product}>
                                {index > 0 && <>, </>}
                                <strong>{product}</strong>
                            </span>
                        ))}
                    </>,
                ],
            }
        },
        correlation_config: (change) => {
            const before = change.before as CorrelationConfigType
            const after = change.after as CorrelationConfigType

            const descriptions = []

            const sameArray = (a: string[], b: string[]): boolean => {
                if (a.length !== b.length) {
                    return false
                }
                return a.every((x) => b.includes(x)) && b.every((x) => a.includes(x))
            }

            if (
                after.excluded_person_property_names &&
                !sameArray(before.excluded_person_property_names || [], after.excluded_person_property_names)
            ) {
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.set', { defaultValue: 'set' })}{' '}
                        <em>
                            {i18n.t('teamActivity.feature.excludedPersonProperties', {
                                defaultValue: 'excluded person properties',
                            })}
                        </em>{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        <code>{after.excluded_person_property_names.join(', ')}</code>
                    </>
                )
            }

            if (
                after.excluded_event_property_names &&
                !sameArray(before.excluded_event_property_names || [], after.excluded_event_property_names)
            ) {
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.set', { defaultValue: 'set' })}{' '}
                        <em>
                            {i18n.t('teamActivity.feature.excludedEventProperties', {
                                defaultValue: 'excluded event properties',
                            })}
                        </em>{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        <code>{after.excluded_event_property_names.join(', ')}</code>
                    </>
                )
            }

            if (
                after.excluded_event_names &&
                !sameArray(before.excluded_event_names || [], after.excluded_event_names)
            ) {
                descriptions.push(
                    <>
                        {i18n.t('teamActivity.set', { defaultValue: 'set' })}{' '}
                        <em>
                            {i18n.t('teamActivity.feature.excludedEventNames', {
                                defaultValue: 'excluded event names',
                            })}
                        </em>{' '}
                        {i18n.t('teamActivity.to', { defaultValue: 'to' })}{' '}
                        <code>{after.excluded_event_names.join(', ')}</code>
                    </>
                )
            }

            return { description: descriptions }
        },

        // Complex configs that require a custom describer
        customer_analytics_config: customerAnalyticsConfigurationDescriber,
        marketing_analytics_config: marketingAnalyticsConfigurationDescriber,
        revenue_analytics_config: revenueAnalyticsConfigurationDescriber,
        core_events_config: coreEventsConfigurationDescriber,

        // Conversations
        conversations_enabled: createBooleanToggleHandler(
            i18n.t('teamActivity.feature.conversations', { defaultValue: 'conversations' })
        ),
        conversations_settings: () => {
            return {
                description: [
                    <>
                        {i18n.t('teamActivity.updatedConversationsSettings', {
                            defaultValue: 'updated conversations settings',
                        })}
                    </>,
                ],
            }
        },

        // should never come from the backend
        created_at: () => null,
        id: () => null,
        updated_at: () => null,
        uuid: () => null,
        user_access_level: () => null,
        live_events_token: () => null,
        product_intents: () => null,
        cookieless_server_hash_mode: () => null,

        // don't make sense to be displayed
        project_id: () => null,
        organization: () => null,
        ingested_event: () => null,
        effective_membership_level: () => null,
        default_modifiers: () => null,
        is_demo: () => null,
        has_group_types: () => null,
        web_analytics_pre_aggregated_tables_enabled: () => null,
        web_analytics_pre_aggregated_tables_version: () => null,
        managed_viewsets: () => null,
        workflows_config: () => null,
        feature_flag_policy_config: () => null,
    }
}

let cachedTeamPropertiesMapping: {
    locale: string
    mapping: Record<keyof TeamType, (change: ActivityChange) => ChangeMapping | null>
} | null = null

/** The team change descriptions, in the language the app is rendering. */
function getTeamPropertiesMapping(): Record<keyof TeamType, (change: ActivityChange) => ChangeMapping | null> {
    const locale = getActiveLocale()
    if (cachedTeamPropertiesMapping?.locale !== locale) {
        cachedTeamPropertiesMapping = { locale, mapping: buildTeamPropertiesMapping() }
    }
    return cachedTeamPropertiesMapping.mapping
}

function nameAndLink(logItem?: ActivityLogItem): JSX.Element {
    return logItem?.detail?.short_id ? (
        <Link to={urls.notebook(logItem.detail.short_id)}>
            {logItem?.detail.name || i18n.t('teamActivity.unknown', { defaultValue: 'unknown' })}
        </Link>
    ) : logItem?.detail.name ? (
        <>{logItem?.detail.name}</>
    ) : (
        <i>{i18n.t('teamActivity.untitled', { defaultValue: 'Untitled' })}</i>
    )
}

export function teamActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope !== ActivityScope.TEAM) {
        console.error('team describer received a non-Team activity')
        return { description: null }
    }

    if (logItem.activity === 'email_sending_suspended' || logItem.activity === 'email_sending_unsuspended') {
        const wasSuspended = logItem.activity === 'email_sending_suspended'
        const reason = logItem.detail?.context?.reason as string | undefined
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {wasSuspended
                        ? i18n.t('teamActivity.suspended', { defaultValue: 'suspended' })
                        : i18n.t('teamActivity.reEnabled', { defaultValue: 're-enabled' })}{' '}
                    {i18n.t('teamActivity.workflowEmailSendingOn', { defaultValue: 'workflow email sending on' })}{' '}
                    {nameAndLink(logItem)}
                    {wasSuspended && reason ? (
                        <> {i18n.t('teamActivity.reason', { defaultValue: '(reason: {{ reason }})', reason })}</>
                    ) : null}
                </>
            ),
        }
    }

    if (logItem.activity == 'changed' || logItem.activity == 'updated') {
        let changes: Description[] = []
        let changeSuffix: Description = (
            <>
                {i18n.t('teamActivity.on', { defaultValue: 'on' })} {nameAndLink(logItem)}
            </>
        )

        for (const change of logItem.detail.changes || []) {
            if (!change?.field || !(change.field in getTeamPropertiesMapping())) {
                continue //  not all fields are describable
            }

            const actionHandler = getTeamPropertiesMapping()[change.field as keyof TeamType]
            const processedChange = actionHandler(change)
            if (processedChange === null) {
                continue // some logs are indescribable
            }

            const { description, suffix } = processedChange
            if (description) {
                changes = changes.concat(description)
            }

            if (suffix) {
                changeSuffix = suffix
            }
        }

        if (changes.length) {
            return {
                description: (
                    <SentenceList
                        listParts={changes}
                        prefix={<ActivityLogUserName logItem={logItem} />}
                        suffix={changeSuffix}
                    />
                ),
            }
        }
    }

    return defaultDescriber(logItem, asNotification, nameAndLink(logItem))
}
