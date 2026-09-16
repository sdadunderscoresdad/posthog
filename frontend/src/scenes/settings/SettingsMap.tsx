import { Trans } from 'react-i18next'

import { LemonBanner, LemonTag, Link, Tooltip } from '@posthog/lemon-ui'
import { LLMProviderKeysSettings } from '@posthog/products-ai-observability/frontend/settings/LLMProviderKeysSettings'
import { ParserRecipesSettings } from '@posthog/products-ai-observability/frontend/settings/ParserRecipesSettings'
import { ErrorTrackingAlerting } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/alerting/ErrorTrackingAlerting'
import { AssignmentRules } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/assignment_rules/AssignmentRules'
import { GroupingRules } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/grouping_rules/GroupingRules'
import { RateLimitSettings } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/rate_limit/RateLimitSettings'
import { Releases } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/releases/Releases'
import { SeverityRules } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/severity_rules/SeverityRules'
import { SpikeDetectionSettings } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/spike_detection/SpikeDetectionSettings'
import { SymbolSets } from '@posthog/products-error-tracking/frontend/scenes/ErrorTrackingConfigurationScene/symbol_sets/SymbolSets'
import { McpStoreSettings } from '@posthog/products-mcp-store/frontend/McpStoreSettings'
import { EventConfiguration } from '@posthog/products-revenue-analytics/frontend/settings/EventConfiguration'
import { ExternalDataSourceConfiguration } from '@posthog/products-revenue-analytics/frontend/settings/ExternalDataSourceConfiguration'
import { FilterTestAccountsConfiguration as RevenueAnalyticsFilterTestAccountsConfiguration } from '@posthog/products-revenue-analytics/frontend/settings/FilterTestAccountsConfiguration'

import { BaseCurrency } from 'lib/components/BaseCurrency/BaseCurrency'
import { FeaturePreviews, FeaturePreviewsComingSoon } from 'lib/components/FeaturePreviews/FeaturePreviews'
import { FlaggedFeature } from 'lib/components/FlaggedFeature'
import { FEATURE_SUPPORT } from 'lib/components/SupportedPlatforms/featureSupport'
import { FEATURE_FLAGS, OrganizationMembershipLevel } from 'lib/constants'
import { getActiveLocale, i18n } from 'lib/i18n/i18n'
import { PersonalPosthogConnections } from 'lib/integrations/PosthogConnect'
import { DefaultMinimumDetectableEffect } from 'scenes/experiments/DefaultMinimumDetectableEffect'
import { GitHub, Linear, Slack } from 'scenes/integrations/definitions'
import { BounceRateDurationSetting } from 'scenes/settings/environment/BounceRateDuration'
import { BounceRatePageViewModeSetting } from 'scenes/settings/environment/BounceRatePageViewMode'
import { CookielessServerHashModeSetting } from 'scenes/settings/environment/CookielessServerHashMode'
import { CustomBotRules } from 'scenes/settings/environment/CustomBotRules'
import { CustomChannelTypes } from 'scenes/settings/environment/CustomChannelTypes'
import { DeadClicksAutocaptureSettings } from 'scenes/settings/environment/DeadClicksAutocaptureSettings'
import { MaxChangelogSettings } from 'scenes/settings/environment/MaxChangelogSettings'
import { MaxMemorySettings } from 'scenes/settings/environment/MaxMemorySettings'
import { PersonLastSeenAtEnabled } from 'scenes/settings/environment/PersonLastSeenAtEnabled'
import { PersonsJoinMode } from 'scenes/settings/environment/PersonsJoinMode'
import { PersonsOnEvents } from 'scenes/settings/environment/PersonsOnEvents'
import { PreAggregatedTablesSetting } from 'scenes/settings/environment/PreAggregatedTablesSetting'
import { ReplayTriggers } from 'scenes/settings/environment/ReplayTriggers'
import { SessionsTableVersion } from 'scenes/settings/environment/SessionsTableVersion'
import { SessionsV2JoinModeSettings } from 'scenes/settings/environment/SessionsV2JoinModeSettings'
import {
    TaskAgentMyPreferenceSettings,
    TaskAgentProjectDefaultSettings,
} from 'scenes/settings/environment/TaskAgentDefaultsSettings'
import { OrganizationMCPAccess } from 'scenes/settings/organization/OrganizationMCPAccess'
import { urls } from 'scenes/urls'

import { ConfigScopeEnumApi } from '~/generated/core/api.schemas'
import { AccessResolutionPreview } from '~/layout/navigation-3000/sidepanel/panels/access_control/ResolutionPreview/AccessResolutionPreview'
import {
    DefaultRoleSelector,
    RolesAccessControls,
} from '~/layout/navigation-3000/sidepanel/panels/access_control/RolesAccessControls'
import { AccessControlLevel, AccessControlResourceType, AvailableFeature, Realm } from '~/types'

import { LearnFromSupportSetting } from 'products/business_knowledge/frontend/settings/LearnFromSupportSetting'
import { AISection } from 'products/conversations/frontend/scenes/settings/AISection'
import { GeneralSection } from 'products/conversations/frontend/scenes/settings/GeneralSection'
import { NotificationsSection } from 'products/conversations/frontend/scenes/settings/NotificationsSection'
import { ZendeskImportSection } from 'products/conversations/frontend/scenes/settings/ZendeskImportSection'
import { CustomerAnalyticsEventStream } from 'products/customer_analytics/frontend/components/EventStream/CustomerAnalyticsEventStream'
import { AccountTrackRules } from 'products/customer_analytics/frontend/scenes/CustomerAnalyticsConfigurationScene/account/AccountTrackRules'
import { CustomerAnalyticsAccountConfig } from 'products/customer_analytics/frontend/scenes/CustomerAnalyticsConfigurationScene/account/CustomerAnalyticsAccountConfig'
import {
    WarehouseGroupPropertiesSetting,
    WarehousePersonPropertiesSetting,
} from 'products/customer_analytics/frontend/scenes/CustomerAnalyticsConfigurationScene/account/WarehousePersonPropertiesSetting'
import { CalendarSyncConfig } from 'products/customer_analytics/frontend/scenes/CustomerAnalyticsConfigurationScene/calendar/CalendarSyncConfig'
import { CustomerAnalyticsDashboardEvents } from 'products/customer_analytics/frontend/scenes/CustomerAnalyticsConfigurationScene/events/CustomerAnalyticsDashboardEvents'
import { ExceptionAutocaptureToggle } from 'products/error_tracking/frontend/scenes/ErrorTrackingConfigurationScene/exception_autocapture/ExceptionAutocaptureSettings'
import { SuppressionRules } from 'products/error_tracking/frontend/scenes/ErrorTrackingConfigurationScene/suppression_rules/SuppressionRules'
import { MAX_LOOKBACK_DAYS, MIN_LOOKBACK_DAYS } from 'products/experiments/frontend/constants'
import { LogsAlertingSection } from 'products/logs/frontend/components/LogsAlerting/LogsAlertingSection'
import { LogsMetricRulesSection } from 'products/logs/frontend/components/LogsMetricRules/LogsMetricRulesSection'
import { LogsRetentionSection } from 'products/logs/frontend/components/LogsRetention/LogsRetentionSection'
import { LogsSamplingSection } from 'products/logs/frontend/components/LogsSampling/LogsSamplingSection'
import { LogsFeatureFlagKeys } from 'products/logs/frontend/logsFeatureFlagKeys'
import { WorkflowsEmailTrackingConsentSettings } from 'products/workflows/frontend/scenes/settings/WorkflowsEmailTrackingConsentSettings'
import { WorkflowsEngagementEventsSettings } from 'products/workflows/frontend/scenes/settings/WorkflowsEngagementEventsSettings'
import { WorkflowsTaskLimitsSettings } from 'products/workflows/frontend/scenes/settings/WorkflowsTaskLimitsSettings'

import { IntegrationsList } from '../../lib/integrations/IntegrationsList'
import {
    ActivityLogNotifications,
    ActivityLogOrgLevelSettings,
    ActivityLogSettings,
} from './environment/ActivityLogSettings'
import { AutocaptureSettings, WebVitalsAutocaptureSettings } from './environment/AutocaptureSettings'
import { CorrelationConfig } from './environment/CorrelationConfig'
import { CSPReportingSettings } from './environment/CSPReportingSettings'
import { DataAttributes } from './environment/DataAttributes'
import { DataColorThemes } from './environment/DataColorThemes'
import { DefaultCupedEnabled } from './environment/DefaultCupedEnabled'
import { DefaultCupedLookbackDays } from './environment/DefaultCupedLookbackDays'
import { DefaultExperimentConfidenceLevel } from './environment/DefaultExperimentConfidenceLevel'
import { DefaultExperimentStatsMethod } from './environment/DefaultExperimentStatsMethod'
import { DefaultOnlyCountMaturedUsers } from './environment/DefaultOnlyCountMaturedUsers'
import { DefaultSequentialTestingEnabled } from './environment/DefaultSequentialTestingEnabled'
import { DefaultSequentialTuningParameter } from './environment/DefaultSequentialTuningParameter'
import { DiscussionMentionNotifications } from './environment/DiscussionSettings'
import { ErrorTrackingConfigurationMovedBanner } from './environment/ErrorTrackingConfigurationMovedBanner'
import { ErrorTrackingIntegrations } from './environment/ErrorTrackingIntegrations'
import { ExperimentRecalculationTime } from './environment/ExperimentRecalculationTime'
import {
    DefaultEvaluationContexts,
    DefaultReleaseConditions,
    EvaluationContextSuggestions,
    FlagChangeConfirmationSettings,
    FlagPersistenceSettings,
    FlagsSecureApiKeys,
    RequireEvaluationContexts,
    RequireFeatureFlagTags,
} from './environment/FeatureFlagSettings'
import { GroupAnalyticsConfig } from './environment/GroupAnalyticsConfig'
import { HeatmapsSettings } from './environment/HeatmapsSettings'
import { HumanFriendlyComparisonPeriodsSetting } from './environment/HumanFriendlyComparisonPeriodsSetting'
import { IPAllowListInfo } from './environment/IPAllowListInfo'
import { IPCapture } from './environment/IPCapture'
import { JsSnippetVersionPin } from './environment/JsSnippetVersionPin'
import {
    LogsCaptureSettings,
    LogsJsonParseSettings,
    LogsPiiScrubSettings,
    LogsRetentionSettings,
} from './environment/LogsCaptureSettings'
import { LogsDistinctIdAttributeKeys } from './environment/LogsDistinctIdAttributeKeys'
import { LogsPatternMessageKeys } from './environment/LogsPatternMessageKeys'
import { LogsSessionIdAttributeKeys } from './environment/LogsSessionIdAttributeKeys'
import { ManagedReverseProxy } from './environment/ManagedReverseProxy'
import { MarketingAnalyticsSettingsWrapper } from './environment/MarketingAnalyticsSettingsWrapper'
import MCPServerSettings from './environment/MCPServerSettings'
import { PathCleaningFiltersConfig } from './environment/PathCleaningFiltersConfig'
import { PersonDisplayNameProperties } from './environment/PersonDisplayNameProperties'
import { ReplayIntegrations } from './environment/ReplayIntegrations'
import { SDKSetupInstructions } from './environment/SDKSetupInstructions'
import {
    CanvasCaptureSettings,
    LogCaptureSettings,
    ReplayAuthorizedDomains,
    ReplayDataRetentionSettings,
    ReplayGeneral,
    ReplayMaskingSettings,
    ReplayNetworkCapture,
    ReplayNetworkHeadersPayloads,
} from './environment/SessionRecordingSettings'
import { SurveyDefaultAppearance, SurveyEnableToggle } from './environment/SurveySettings'
import { TeamAccessControl } from './environment/TeamAccessControl'
import { TeamAuthorizedURLs, TeamBusinessModel, TeamTimezone, TeamVariables } from './environment/TeamSettings'
import { ProjectAccountFiltersSetting } from './environment/TestAccountFiltersConfig'
import { TracingDistinctIdAttributeKeys } from './environment/TracingDistinctIdAttributeKeys'
import { TracingSessionIdAttributeKeys } from './environment/TracingSessionIdAttributeKeys'
import { UsageMetricsConfig } from './environment/UsageMetricsConfig'
import { WebAnalyticsEnablePreAggregatedTables } from './environment/WebAnalyticsAPISetting'
import { AIHipaaDisclaimer, getExternalAIProvidersTooltipTitle } from './organization/aiConsentCopy'
import { ApprovalPolicies } from './organization/Approvals/ApprovalPolicies'
import { ChangeRequestsList } from './organization/Approvals/ChangeRequestsList'
import { CIMDVerificationTokens } from './organization/CIMDVerificationTokens'
import { IdentityProviderFeatureSection } from './organization/IdentityProviderConfig/IdentityProviderFeatureSection'
import { Invites } from './organization/Invites'
import { Members } from './organization/Members'
import { NotificationGovernanceSetting } from './organization/NotificationGovernanceSetting'
import { OAuthApps } from './organization/OAuthApps'
import { OrganizationAI } from './organization/OrgAI'
import { OrganizationAITrainingOptOut } from './organization/OrgAITraining'
import { OrganizationDangerZone } from './organization/OrganizationDangerZone'
import { OrganizationIntegrations } from './organization/OrganizationIntegrations'
import { OrganizationPersonalAPIKeys } from './organization/OrganizationPersonalAPIKeys'
import { OrganizationSecuritySettings } from './organization/OrganizationSecuritySettings'
import { OrganizationDesktopBetaTerms } from './organization/OrgDesktopBetaTerms'
import { OrganizationDisplayName } from './organization/OrgDisplayName'
import { OrgIPAnonymizationDefault } from './organization/OrgIPAnonymizationDefault'
import { OrganizationVariables } from './organization/OrgVariables'
import { EnforceVerifiedDomains } from './organization/VerifiedDomains/EnforceVerifiedDomains'
import { VerifiedDomains } from './organization/VerifiedDomains/VerifiedDomains'
import { ProjectDangerZone } from './project/ProjectDangerZone'
import { ProjectDetails } from './project/ProjectDetails'
import { ProjectMove } from './project/ProjectMove'
import { ProjectSecretAPIKeys } from './project/ProjectSecretAPIKeys'
import { SettingSection } from './types'
import { AllowImpersonation } from './user/AllowImpersonation'
import { ChangePassword, ChangePasswordTitle } from './user/ChangePassword'
import { ConnectedApps } from './user/ConnectedApps'
import { HedgehogModeSettings } from './user/HedgehogModeSettings'
import { LoginSessions } from './user/LoginSessions'
import { MCPHintsSetting } from './user/MCPHintsSetting'
import { OptOutCapture } from './user/OptOutCapture'
import { PasskeySettings } from './user/PasskeySettings'
import { PersonalAPIKeys } from './user/PersonalAPIKeys'
import { PersonalGitHubIntegrations, PersonalSlackIntegrations } from './user/PersonalIntegrations'
import { ProfilePictureSettings } from './user/ProfilePictureSettings'
import { RealtimeNotificationPreferences } from './user/RealtimeNotificationPreferences'
import { Reminders } from './user/Reminders'
import { SidebarAutoSuggestSetting } from './user/SidebarProductSettings'
import {
    HomepageSetting,
    SidebarItemsSetting,
    SidebarLayoutSetting,
    SidebarMyToolsSetting,
} from './user/SidebarSettings'
import { ThemeSwitcher } from './user/ThemeSwitcher'
import { TwoFactorSettings } from './user/TwoFactorSettings'
import { UpdateEmailPreferences } from './user/UpdateEmailPreferences'
import { UserDangerZone } from './user/UserDangerZone'
import { UserDetails } from './user/UserDetails'
import { WebAnalyticsAchievementsSetting } from './user/WebAnalyticsAchievementsSetting'

function buildSettingsMap(): SettingSection[] {
    return [
        // ENVIRONMENT
        {
            level: 'environment',
            id: 'environment-details',
            title: i18n.t('settings.map.environment-details.title', { defaultValue: 'General' }),
            settings: [
                {
                    id: 'variables',
                    title: i18n.t('settings.map.variables.title', { defaultValue: 'Project token & ID' }),
                    description: i18n.t('settings.map.variables.description', {
                        defaultValue:
                            'Your project token and ID used to connect SDKs and APIs to this environment. Integrations often call the token your project API key.',
                    }),
                    component: <TeamVariables />,
                    keywords: [
                        'api key',
                        'project api key',
                        'client api key',
                        'public api key',
                        'write key',
                        'token',
                        'project id',
                    ],
                },
                {
                    id: 'snippet',
                    title: i18n.t('settings.map.snippet.title', { defaultValue: 'SDK setup' }),
                    description: i18n.t('settings.map.snippet.description', {
                        defaultValue:
                            'Install PostHog in your app using one of our SDKs. Select your platform to see the setup instructions.',
                    }),
                    docsUrl: 'https://posthog.com/docs/getting-started/install',
                    component: <SDKSetupInstructions />,
                    keywords: [
                        'install',
                        'setup',
                        'tracking',
                        'code',
                        'sdk',
                        'snippet',
                        'javascript',
                        'html',
                        'react',
                        'next.js',
                        'nextjs',
                        'python',
                        'node',
                        'nodejs',
                        'react native',
                        'angular',
                        'astro',
                        'bubble',
                        'framer',
                        'nuxt',
                        'remix',
                        'svelte',
                        'tanstack',
                        'vue',
                        'webflow',
                        'android',
                        'ios',
                        'flutter',
                        'django',
                        'elixir',
                        'go',
                        'laravel',
                        'php',
                        'ruby',
                        'rails',
                        'api',
                        'docusaurus',
                        'google tag manager',
                        'gtm',
                    ],
                },
                {
                    id: 'js-snippet-version',
                    title: (
                        <>
                            {i18n.t('settings.map.js-snippet-version.title', { defaultValue: 'Snippet version' })}{' '}
                            <LemonTag type="warning" className="ml-1 uppercase">
                                {i18n.t('settings.map.js-snippet-version.experimental', {
                                    defaultValue: 'Experimental',
                                })}
                            </LemonTag>
                        </>
                    ),
                    description: i18n.t('settings.map.js-snippet-version.description', {
                        defaultValue:
                            'Pin the snippet to a specific version of posthog-js. Defaults to the latest v1 release.',
                    }),
                    flag: ['JS_SNIPPET_VERSIONING'],
                    component: <JsSnippetVersionPin />,
                    keywords: ['version', 'pin', 'snippet', 'sdk', 'posthog-js'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-customization',
            title: i18n.t('settings.map.environment-customization.title', { defaultValue: 'Customization' }),
            settings: [
                {
                    id: 'display-name',
                    title: i18n.t('settings.map.display-name.title', { defaultValue: 'Project details' }),
                    description: i18n.t('settings.map.display-name.description', {
                        defaultValue:
                            'Name this project and label it so you can group and find it across your organization.',
                    }),
                    component: <ProjectDetails />,
                    keywords: ['name', 'rename', 'label', 'tag', 'tags'],
                },
                {
                    id: 'date-and-time',
                    title: i18n.t('settings.map.date-and-time.title', { defaultValue: 'Date & time' }),
                    description: i18n.t('settings.map.date-and-time.description', {
                        defaultValue:
                            'Set the timezone and week start day used for displaying and bucketing time-series data in insights and dashboards. You may need to refresh insights for changes to apply.',
                    }),
                    component: <TeamTimezone />,
                    keywords: ['timezone', 'utc', 'locale', 'week start'],
                },
                {
                    // Project-wide, not product analytics specific: these filters apply to insights,
                    // web analytics, revenue analytics, session replay, and CDP destinations alike.
                    id: 'internal-user-filtering',
                    title: i18n.t('settings.map.internal-user-filtering.title', {
                        defaultValue: 'Filter out internal and test users',
                    }),
                    description: i18n.t('settings.map.internal-user-filtering.description', {
                        defaultValue:
                            'Define filters to exclude internal users and test accounts from your analytics. Filtered users will not appear in insights by default.',
                    }),
                    docsUrl: 'https://posthog.com/tutorials/filter-internal-users',
                    component: <ProjectAccountFiltersSetting />,
                    keywords: ['test account', 'internal', 'exclude', 'filter'],
                },
                {
                    // Project-wide, like internal user filtering above: these definitions feed the
                    // `Is bot` property, which is available to every query, not only web analytics.
                    id: 'custom-bot-definitions',
                    title: i18n.t('settings.map.custom-bot-definitions.title', { defaultValue: 'Custom bots' }),
                    description: i18n.t('settings.map.custom-bot-definitions.description', {
                        defaultValue:
                            'Add your own crawlers and scripts to the bots PostHog already detects, so you can tell them apart from real visitors.',
                    }),
                    docsUrl: 'https://posthog.com/docs/web-analytics/bot-detection',
                    component: <CustomBotRules />,
                    keywords: ['bot', 'crawler', 'spider', 'scraper', 'user agent', 'ai'],
                },
                {
                    id: 'business-model',
                    title: i18n.t('settings.environment.team.businessModel.label', { defaultValue: 'Business model' }),
                    description: i18n.t('settings.map.business-model.description', {
                        defaultValue:
                            'Set whether this project serves B2B or B2C customers so PostHog can tailor the experience and recommendations.',
                    }),
                    component: <TeamBusinessModel />,
                    keywords: ['b2b', 'b2c', 'saas', 'ecommerce'],
                },
                {
                    id: 'base-currency',
                    title: i18n.t('settings.map.base-currency.title', { defaultValue: 'Base currency' }),
                    description: i18n.t('settings.map.base-currency.description', {
                        defaultValue: 'Set the default currency used for revenue and monetary calculations.',
                    }),
                    component: <BaseCurrency hideTitle />,
                    keywords: ['money', 'currency', 'usd', 'eur'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-max',
            title: i18n.t('settings.map.environment-max.title', { defaultValue: 'PostHog AI' }),
            group: 'AI',
            settings: [
                {
                    id: 'core-memory',
                    title: i18n.t('settings.map.core-memory.title', { defaultValue: 'Memory' }),
                    description: i18n.t('settings.map.core-memory.description', {
                        defaultValue:
                            "PostHog AI automatically remembers details about your company and product. This context helps our AI assistant provide relevant answers and suggestions. If there are any details you don't want PostHog AI to remember, you can edit or remove them below.",
                    }),
                    component: <MaxMemorySettings />,
                    hideOn: [Realm.SelfHostedClickHouse, Realm.SelfHostedPostgres],
                },
                {
                    // FIXME: changelog should probably not be here since it updates user's settings. Maybe belongs under account settings?
                    id: 'changelog',
                    title: i18n.t('settings.map.changelog.title', { defaultValue: 'Changelog' }),
                    description: i18n.t('settings.map.changelog.description', {
                        defaultValue:
                            'See the latest PostHog AI features and control whether the changelog appears in the main UI.',
                    }),
                    component: <MaxChangelogSettings />,
                    hideOn: [Realm.SelfHostedClickHouse, Realm.SelfHostedPostgres],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-task-agents',
            title: i18n.t('settings.map.environment-task-agents.title', { defaultValue: 'Model preferences' }),
            group: 'AI',
            settings: [
                {
                    id: 'task-agent-project-default',
                    title: i18n.t('settings.map.task-agent-project-default.title', {
                        defaultValue: 'Project default model',
                    }),
                    description: i18n.t('settings.map.task-agent-project-default.description', {
                        defaultValue:
                            'The model agent runs launch with when nobody picks one. Everyone on this project inherits it in the new PostHog AI view, in Slack, and in PostHog Desktop.',
                    }),
                    component: <TaskAgentProjectDefaultSettings />,
                    keywords: ['ai', 'model', 'claude', 'codex', 'agent', 'tasks', 'default', 'slack', 'desktop'],
                },
                {
                    id: 'task-agent-my-preference',
                    title: i18n.t('settings.map.task-agent-my-preference.title', { defaultValue: 'My default model' }),
                    description: i18n.t('settings.map.task-agent-my-preference.description', {
                        defaultValue:
                            'The model your own runs launch with, overriding the project default. Applies in the new PostHog AI view, in Slack, and in PostHog Desktop.',
                    }),
                    component: <TaskAgentMyPreferenceSettings />,
                    keywords: ['ai', 'model', 'claude', 'codex', 'agent', 'tasks', 'preference', 'slack', 'desktop'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'posthog-mcp',
            title: i18n.t('settings.map.posthog-mcp.title', { defaultValue: 'PostHog MCP' }),
            group: 'AI',
            settings: [
                {
                    id: 'posthog-mcp-configure',
                    title: i18n.t('settings.map.posthog-mcp-configure.title', {
                        defaultValue: 'Model Context Protocol (MCP) server',
                    }),
                    description: i18n.t('settings.map.posthog-mcp-configure.description', {
                        defaultValue:
                            'Connect PostHog to AI tools like Claude, Cursor, and Copilot via the MCP protocol for data-driven AI assistance.',
                    }),
                    docsUrl: 'https://posthog.com/docs/model-context-protocol',
                    component: <MCPServerSettings />,
                    keywords: ['ai', 'llm', 'claude', 'cursor', 'copilot'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'mcp-servers',
            title: i18n.t('settings.map.mcp-servers.title', { defaultValue: 'MCP servers' }),
            group: 'AI',
            flag: 'MCP_GATEWAY',
            settings: [
                {
                    id: 'mcp-servers-manage',
                    title: null,
                    component: <McpStoreSettings />,
                    keywords: ['mcp', 'server', 'install', 'oauth', 'ai', 'agent'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-ai-observability',
            title: i18n.t('settings.map.environment-ai-observability.title', { defaultValue: 'AI observability' }),
            group: 'Products',
            settings: [
                {
                    id: 'ai-observability-byok',
                    title: i18n.t('settings.map.ai-observability-byok.title', {
                        defaultValue: 'Bring your own key (BYOK)',
                    }),
                    description: i18n.t('settings.map.ai-observability-byok.description', {
                        defaultValue:
                            'Add and manage provider API keys for AI observability features, including evaluations and playground.',
                    }),
                    component: <LLMProviderKeysSettings />,
                    docsUrl: 'https://posthog.com/docs/ai-evals/evaluations',
                    keywords: ['llm', 'provider', 'api key', 'openai', 'anthropic', 'gemini', 'playground'],
                },
                {
                    id: 'ai-observability-parser-recipes',
                    title: i18n.t('settings.map.ai-observability-parser-recipes.title', {
                        defaultValue: 'Custom parsing',
                    }),
                    description: i18n.t('settings.map.ai-observability-parser-recipes.description', {
                        defaultValue:
                            "Add recipes that normalize provider message shapes the built-in recipes don't cover. They apply when rendering traces.",
                    }),
                    component: <ParserRecipesSettings />,
                    keywords: ['parser', 'recipe', 'normalize', 'trace', 'provider', 'custom parsing', 'content'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-csp-reporting',
            title: i18n.t('settings.map.environment-csp-reporting.title', { defaultValue: 'CSP reporting' }),
            group: 'Products',
            settings: [
                {
                    id: 'csp-reporting',
                    title: i18n.t('settings.map.csp-reporting.title', { defaultValue: 'CSP reporting' }),
                    description: i18n.t('settings.map.csp-reporting.description', {
                        defaultValue:
                            'Collect Content Security Policy violation reports to monitor and debug CSP issues on your site.',
                    }),
                    component: <CSPReportingSettings />,
                    keywords: ['content security policy', 'csp', 'violation', 'security'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-customer-analytics',
            title: i18n.t('settings.map.environment-customer-analytics.title', { defaultValue: 'Customer analytics' }),
            flag: 'CUSTOMER_ANALYTICS',
            group: 'Products',
            settings: [
                {
                    id: 'group-analytics',
                    title: i18n.t('settings.map.group-analytics.title', { defaultValue: 'Group analytics' }),
                    description: i18n.t('settings.map.group-analytics.description', {
                        defaultValue: 'Configure group types for analyzing user behavior at the company or team level.',
                    }),
                    docsUrl: 'https://posthog.com/docs/product-analytics/group-analytics',
                    component: <GroupAnalyticsConfig />,
                    keywords: ['company', 'organization', 'team', 'group type'],
                },
                {
                    id: 'customer-analytics-usage-metrics',
                    title: i18n.t('settings.map.customer-analytics-usage-metrics.title', {
                        defaultValue: 'Usage metrics',
                    }),
                    description: i18n.t('settings.map.customer-analytics-usage-metrics.description', {
                        defaultValue:
                            'Configure which events and properties are tracked as usage metrics for your customers.',
                    }),
                    component: <UsageMetricsConfig />,
                    flag: 'CUSTOMER_ANALYTICS',
                    keywords: ['usage', 'engagement', 'activity'],
                },
                {
                    id: 'customer-analytics-dashboard-events',
                    title: i18n.t('settings.map.customer-analytics-dashboard-events.title', {
                        defaultValue: 'Dashboard events',
                    }),
                    description: i18n.t('settings.map.customer-analytics-dashboard-events.description', {
                        defaultValue: 'Configure which events appear on customer analytics dashboards.',
                    }),
                    component: <CustomerAnalyticsDashboardEvents />,
                    flag: 'CUSTOMER_ANALYTICS',
                    keywords: ['dashboard', 'customer', 'events'],
                },
                {
                    id: 'customer-analytics-accounts',
                    title: i18n.t('settings.map.customer-analytics-accounts.title', { defaultValue: 'Accounts' }),
                    description: i18n.t('settings.map.customer-analytics-accounts.description', {
                        defaultValue: 'Select which group type represents an account in customer analytics.',
                    }),
                    component: <CustomerAnalyticsAccountConfig />,
                    flag: ['CUSTOMER_ANALYTICS', 'CUSTOMER_ANALYTICS_CSP'],
                    keywords: ['accounts', 'group', 'b2b'],
                },
                {
                    id: 'customer-analytics-track-rules',
                    title: i18n.t('settings.map.customer-analytics-track-rules.title', { defaultValue: 'Track rules' }),
                    description: i18n.t('settings.map.customer-analytics-track-rules.description', {
                        defaultValue: 'Choose which active accounts appear in Customer analytics.',
                    }),
                    component: <AccountTrackRules />,
                    flag: ['CUSTOMER_ANALYTICS', 'CUSTOMER_ANALYTICS_TRACK_RULES'],
                    keywords: ['accounts', 'track', 'ignore', 'rules', 'filter'],
                },
                {
                    id: 'customer-analytics-calendar-sync',
                    title: i18n.t('settings.map.customer-analytics-calendar-sync.title', {
                        defaultValue: 'Google account sync',
                    }),
                    description: i18n.t('settings.map.customer-analytics-calendar-sync.description', {
                        defaultValue:
                            'Connect your Google account to sync customer meetings and email to matching accounts. Each team member connects their own account.',
                    }),
                    component: <CalendarSyncConfig />,
                    flag: ['CUSTOMER_ANALYTICS', 'CUSTOMER_ANALYTICS_CSP'],
                    keywords: ['calendar', 'email', 'meetings', 'google', 'sync', 'accounts'],
                },
                {
                    id: 'customer-analytics-event-stream',
                    title: i18n.t('settings.map.customer-analytics-event-stream.title', {
                        defaultValue: 'Event stream',
                    }),
                    description: i18n.t('settings.map.customer-analytics-event-stream.description', {
                        defaultValue:
                            "Stream selected customers' events to a Slack channel of your choice in real time. Each team member configures their own stream: pick your events and channel here, then add customers from their account profiles.",
                    }),
                    component: <CustomerAnalyticsEventStream />,
                    flag: ['CUSTOMER_ANALYTICS', 'CUSTOMER_ANALYTICS_CSP'],
                    keywords: ['event', 'stream', 'live', 'slack', 'accounts'],
                },
                {
                    id: 'customer-analytics-person-properties',
                    title: i18n.t('settings.map.customer-analytics-person-properties.title', {
                        defaultValue: 'Person properties',
                    }),
                    description: i18n.t('settings.map.customer-analytics-person-properties.description', {
                        defaultValue:
                            'Sync warehouse table columns onto matching people as person properties, and manage their schedule, backfills, and run history.',
                    }),
                    component: <WarehousePersonPropertiesSetting />,
                    flag: 'WAREHOUSE_PERSON_PROPERTIES',
                    keywords: ['warehouse', 'person', 'properties', 'sync', 'backfill'],
                },
                {
                    id: 'customer-analytics-group-properties',
                    title: i18n.t('settings.map.customer-analytics-group-properties.title', {
                        defaultValue: 'Group properties',
                    }),
                    description: i18n.t('settings.map.customer-analytics-group-properties.description', {
                        defaultValue:
                            'Sync warehouse table columns onto matching groups as group properties, and manage their schedule, backfills, and run history.',
                    }),
                    component: <WarehouseGroupPropertiesSetting />,
                    flag: 'WAREHOUSE_PERSON_PROPERTIES',
                    keywords: ['warehouse', 'group', 'properties', 'sync', 'backfill'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-error-tracking',
            title: i18n.t('settings.map.environment-error-tracking.title', { defaultValue: 'Error tracking' }),
            group: 'Products',
            accessControl: {
                resourceType: AccessControlResourceType.ErrorTracking,
                minimumAccessLevel: AccessControlLevel.Viewer,
            },
            settings: [
                {
                    id: 'banner',
                    title: null,
                    component: <ErrorTrackingConfigurationMovedBanner />,
                },
                {
                    id: 'error-tracking-exception-autocapture',
                    title: i18n.t('settings.map.error-tracking-exception-autocapture.title', {
                        defaultValue: 'Exception autocapture',
                    }),
                    description: i18n.t('settings.map.error-tracking-exception-autocapture.description', {
                        defaultValue:
                            'Automatically capture frontend exceptions using onError and onUnhandledRejection listeners in the web JavaScript SDK.',
                    }),
                    docsUrl: 'https://posthog.com/docs/error-tracking',
                    platformSupport: FEATURE_SUPPORT.errorTrackingExceptionAutocapture,
                    component: <ExceptionAutocaptureToggle />,
                    keywords: ['crash', 'bug', 'exception', 'stack trace'],
                },
                {
                    id: 'error-tracking-integrations',
                    title: i18n.t('settings.organization.verifiedDomains.columns.integrations', {
                        defaultValue: 'Integrations',
                    }),
                    description: i18n.t('settings.map.error-tracking-integrations.description', {
                        defaultValue: 'Connect error tracking with external services like GitHub or Linear.',
                    }),
                    component: <ErrorTrackingIntegrations />,
                    keywords: ['github', 'linear', 'gitlab', 'jira', 'integration', 'connect', 'issue'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-error-tracking-configuration',
            title: i18n.t('settings.map.environment-error-tracking-configuration.title', {
                defaultValue: 'Error tracking',
            }),
            group: 'Products',
            hideFromNavigation: true,
            accessControl: {
                resourceType: AccessControlResourceType.ErrorTracking,
                minimumAccessLevel: AccessControlLevel.Viewer,
            },
            settings: [
                {
                    id: 'error-tracking-exception-autocapture',
                    title: i18n.t('settings.map.error-tracking-exception-autocapture.title.2', {
                        defaultValue: 'Exception autocapture',
                    }),
                    description: i18n.t('settings.map.error-tracking-exception-autocapture.description.2', {
                        defaultValue:
                            'Automatically capture frontend exceptions using onError and onUnhandledRejection listeners in the web JavaScript SDK.',
                    }),
                    docsUrl: 'https://posthog.com/docs/error-tracking',
                    platformSupport: FEATURE_SUPPORT.errorTrackingExceptionAutocapture,
                    component: <ExceptionAutocaptureToggle />,
                    keywords: ['crash', 'bug', 'exception', 'stack trace'],
                },
                {
                    id: 'error-tracking-alerting',
                    title: i18n.t('settings.map.error-tracking-alerting.title', { defaultValue: 'Alerting' }),
                    description: i18n.t('settings.map.error-tracking-alerting.description', {
                        defaultValue: 'Configure alerts to get notified when new errors occur or error rates spike.',
                    }),
                    component: <ErrorTrackingAlerting />,
                    keywords: ['notification', 'alert', 'threshold', 'spike'],
                },
                {
                    id: 'error-tracking-spike-detection',
                    title: i18n.t('settings.map.error-tracking-spike-detection.title', {
                        defaultValue: 'Spike detection',
                    }),
                    component: <SpikeDetectionSettings />,
                },
                {
                    id: 'error-tracking-rate-limits',
                    title: i18n.t('settings.map.error-tracking-rate-limits.title', { defaultValue: 'Rate limits' }),
                    component: <RateLimitSettings />,
                    flag: 'ERROR_TRACKING_RATE_LIMITING',
                    keywords: ['rate', 'limit', 'throttle', 'ingestion', 'cap', 'bypass'],
                },
                {
                    id: 'error-tracking-auto-assignment',
                    title: i18n.t('settings.map.error-tracking-auto-assignment.title', {
                        defaultValue: 'Assignment rules',
                    }),
                    description: i18n.t('settings.map.error-tracking-auto-assignment.description', {
                        defaultValue: 'Automatically assign errors to team members based on rules you define.',
                    }),
                    component: <AssignmentRules />,
                    keywords: ['assign', 'auto', 'owner', 'team', 'rule', 'routing'],
                },
                {
                    id: 'error-tracking-custom-grouping',
                    title: i18n.t('settings.map.error-tracking-custom-grouping.title', {
                        defaultValue: 'Grouping rules',
                    }),
                    description: i18n.t('settings.map.error-tracking-custom-grouping.description', {
                        defaultValue: 'Define rules for how errors are grouped together into issues.',
                    }),
                    component: <GroupingRules />,
                    keywords: ['group', 'custom', 'merge', 'fingerprint', 'dedup'],
                },
                {
                    id: 'error-tracking-severity-rules',
                    title: i18n.t('settings.map.error-tracking-severity-rules.title', {
                        defaultValue: 'Severity rules',
                    }),
                    description: i18n.t('settings.map.error-tracking-severity-rules.description', {
                        defaultValue: 'Set the initial severity of new issues based on rules you define.',
                    }),
                    component: <SeverityRules />,
                    keywords: ['severity', 'priority', 'triage', 'critical', 'rule'],
                },
                {
                    id: 'error-tracking-suppression-rules',
                    title: i18n.t('settings.map.error-tracking-suppression-rules.title', {
                        defaultValue: 'Suppression rules',
                    }),
                    description: i18n.t('settings.map.error-tracking-suppression-rules.description', {
                        defaultValue: 'Filter out exceptions that match the given filters.',
                    }),
                    component: <SuppressionRules />,
                    keywords: ['filter', 'ignore', 'suppress', 'exception', 'type', 'message'],
                },
                {
                    id: 'error-tracking-symbol-sets',
                    title: i18n.t('settings.map.error-tracking-symbol-sets.title', { defaultValue: 'Symbol sets' }),
                    description: i18n.t('settings.map.error-tracking-symbol-sets.description', {
                        defaultValue: 'Upload source maps to get readable stack traces from minified code.',
                    }),
                    docsUrl: 'https://posthog.com/docs/error-tracking/upload-source-maps',
                    component: <SymbolSets />,
                    keywords: ['source map', 'sourcemap', 'debug', 'minified', 'stack trace'],
                },
                {
                    id: 'error-tracking-releases',
                    title: i18n.t('settings.map.error-tracking-releases.title', { defaultValue: 'Releases' }),
                    description: i18n.t('settings.map.error-tracking-releases.description', {
                        defaultValue:
                            'Track releases to see which version introduced errors and monitor deployment health.',
                    }),
                    docsUrl: 'https://posthog.com/docs/error-tracking/releases',
                    component: <Releases />,
                    keywords: ['version', 'deploy', 'release', 'regression'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-experiments',
            title: i18n.t('settings.map.environment-experiments.title', { defaultValue: 'Experiments' }),
            group: 'Products',
            settings: [
                {
                    id: 'environment-experiment-stats-method',
                    title: i18n.t('settings.map.environment-experiment-stats-method.title', {
                        defaultValue: 'Default statistical method',
                    }),
                    description: i18n.t('settings.map.environment-experiment-stats-method.description', {
                        defaultValue:
                            'Choose which statistical method to use by default for new experiments in this environment. Individual experiments can override this setting.',
                    }),
                    docsUrl: 'https://posthog.com/docs/experiments',
                    component: <DefaultExperimentStatsMethod />,
                    keywords: ['bayesian', 'frequentist', 'statistics', 'ab test'],
                },
                {
                    id: 'environment-experiment-confidence-level',
                    title: i18n.t('settings.map.environment-experiment-confidence-level.title', {
                        defaultValue: 'Default confidence level',
                    }),
                    description: i18n.t('settings.map.environment-experiment-confidence-level.description', {
                        defaultValue:
                            'Higher confidence level reduces false positives but requires more data. Can be overridden per experiment.',
                    }),
                    component: <DefaultExperimentConfidenceLevel />,
                    keywords: ['confidence', 'significance', 'p-value', 'false positive'],
                },
                {
                    id: 'environment-experiment-mde',
                    title: i18n.t('settings.map.environment-experiment-mde.title', {
                        defaultValue: 'Default minimum detectable effect',
                    }),
                    description: i18n.t('settings.map.environment-experiment-mde.description', {
                        defaultValue:
                            'The smallest effect size you want to detect with statistical significance. Lower values require more data and longer run times. Can be overridden per experiment.',
                    }),
                    component: <DefaultMinimumDetectableEffect />,
                    keywords: ['mde', 'effect size', 'sensitivity', 'power', 'sample size'],
                },
                {
                    id: 'environment-experiment-recalculation-time',
                    title: i18n.t('settings.map.environment-experiment-recalculation-time.title', {
                        defaultValue: 'Daily recalculation time',
                    }),
                    description: i18n.t('settings.map.environment-experiment-recalculation-time.description', {
                        defaultValue:
                            "Select the time of day when experiment metrics should be recalculated. This time is in your project's timezone.",
                    }),
                    component: <ExperimentRecalculationTime />,
                    keywords: ['schedule', 'refresh', 'update', 'time'],
                },
                {
                    id: 'environment-experiment-matured-users',
                    title: i18n.t('settings.map.environment-experiment-matured-users.title', {
                        defaultValue: 'Default conversion window filter',
                    }),
                    description: i18n.t('settings.map.environment-experiment-matured-users.description', {
                        defaultValue:
                            'When enabled, new experiments will only count participants whose full conversion window has elapsed. Can be overridden per experiment.',
                    }),
                    component: <DefaultOnlyCountMaturedUsers />,
                    keywords: ['matured', 'conversion', 'window', 'filter'],
                },
                {
                    id: 'environment-experiment-cuped-enabled',
                    title: i18n.t('settings.map.environment-experiment-cuped-enabled.title', {
                        defaultValue: 'Default CUPED variance reduction',
                    }),
                    description: i18n.t('settings.map.environment-experiment-cuped-enabled.description', {
                        defaultValue:
                            'When enabled, experiments will use CUPED variance reduction. CUPED uses pre-experiment data to detect significant effects faster on supported metrics. Can be overridden per experiment.',
                    }),
                    component: <DefaultCupedEnabled />,
                    keywords: ['cuped', 'variance', 'reduction', 'pre-experiment', 'covariate'],
                },
                {
                    id: 'environment-experiment-cuped-lookback-days',
                    title: i18n.t('settings.map.environment-experiment-cuped-lookback-days.title', {
                        defaultValue: 'Default CUPED lookback window',
                    }),
                    description: i18n.t('settings.map.environment-experiment-cuped-lookback-days.description', {
                        defaultValue:
                            'Number of days before the experiment start to use as the pre-experiment window for CUPED. Must be between {{ min }} and {{ max }} days. Can be overridden per experiment.',
                        min: MIN_LOOKBACK_DAYS,
                        max: MAX_LOOKBACK_DAYS,
                    }),
                    component: <DefaultCupedLookbackDays />,
                    keywords: ['cuped', 'lookback', 'pre-experiment', 'covariate', 'window'],
                },
                {
                    id: 'environment-experiment-sequential-testing-enabled',
                    title: i18n.t('settings.map.environment-experiment-sequential-testing-enabled.title', {
                        defaultValue: 'Default sequential testing',
                    }),
                    description: i18n.t('settings.map.environment-experiment-sequential-testing-enabled.description', {
                        defaultValue:
                            'When enabled, frequentist experiments will use sequential testing by default, producing always-valid p-values that are robust to peeking. Confidence intervals are wider in exchange. Only applies to the frequentist statistical method. Can be overridden per experiment.',
                    }),
                    component: <DefaultSequentialTestingEnabled />,
                    keywords: ['sequential', 'peeking', 'always-valid', 'p-value', 'frequentist'],
                },
                {
                    id: 'environment-experiment-sequential-tuning-parameter',
                    title: i18n.t('settings.map.environment-experiment-sequential-tuning-parameter.title', {
                        defaultValue: 'Default sequential testing tuning parameter',
                    }),
                    description: i18n.t('settings.map.environment-experiment-sequential-tuning-parameter.description', {
                        defaultValue:
                            'Roughly the sample size at which the always-valid confidence sequence is tightest. Set close to the expected total sample size of new experiments to minimize the width penalty. Can be overridden per experiment.',
                    }),
                    component: <DefaultSequentialTuningParameter />,
                    keywords: ['sequential', 'tuning', 'parameter', 'rho', 'frequentist'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-feature-flags',
            title: i18n.t('settings.map.environment-feature-flags.title', { defaultValue: 'Feature flags' }),
            group: 'Products',
            settings: [
                {
                    id: 'feature-flags-interface',
                    title: i18n.t('settings.map.feature-flags-interface.title', { defaultValue: 'Flag persistence' }),
                    description: i18n.t('settings.map.feature-flags-interface.description', {
                        defaultValue:
                            'When enabled, all new feature flags will have persistence enabled by default. This ensures consistent user experiences across authentication steps.',
                    }),
                    docsUrl:
                        'https://posthog.com/docs/feature-flags/creating-feature-flags#persisting-feature-flags-across-authentication-steps',
                    component: <FlagPersistenceSettings />,
                    keywords: ['flag', 'persistence', 'authentication', 'consistent'],
                },
                {
                    id: 'feature-flag-confirmation',
                    title: i18n.t('settings.map.feature-flag-confirmation.title', {
                        defaultValue: 'Flag change confirmation',
                    }),
                    description: i18n.t('settings.map.feature-flag-confirmation.description', {
                        defaultValue:
                            'Show a confirmation modal before saving changes to existing feature flags, helping prevent accidental changes to release conditions.',
                    }),
                    component: <FlagChangeConfirmationSettings />,
                    keywords: ['confirmation', 'safety', 'change', 'release'],
                },
                {
                    id: 'feature-flag-require-tags',
                    title: i18n.t('settings.map.feature-flag-require-tags.title', { defaultValue: 'Require tags' }),
                    description: i18n.t('settings.map.feature-flag-require-tags.description', {
                        defaultValue:
                            'Require every new feature flag to have at least one tag, and stop a tagged flag losing its last one, so flags stay attributable to a team or workstream. Flags created for surveys, experiments, early access features, product tours, and web experiments are exempt.',
                    }),
                    component: <RequireFeatureFlagTags />,
                    keywords: ['tag', 'tags', 'require', 'governance'],
                },
                {
                    id: 'feature-flag-require-evaluation-contexts',
                    title: i18n.t('settings.map.feature-flag-require-evaluation-contexts.title', {
                        defaultValue: 'Require evaluation contexts',
                    }),
                    description: i18n.t('settings.map.feature-flag-require-evaluation-contexts.description', {
                        defaultValue:
                            'Require all new feature flags to have at least one evaluation context before they can be created, preventing flags that are not properly scoped.',
                    }),
                    docsUrl: 'https://posthog.com/docs/feature-flags/evaluation-contexts',
                    flag: 'FLAG_EVALUATION_TAGS',
                    component: <RequireEvaluationContexts />,
                    keywords: ['evaluation', 'context', 'scope', 'require'],
                },
                {
                    id: 'feature-flag-default-evaluation-contexts',
                    title: i18n.t('settings.map.feature-flag-default-evaluation-contexts.title', {
                        defaultValue: 'Default evaluation contexts',
                    }),
                    description: i18n.t('settings.map.feature-flag-default-evaluation-contexts.description', {
                        defaultValue:
                            'Automatically apply default evaluation context tags to newly created feature flags. Users can still modify them during flag creation.',
                    }),
                    docsUrl: 'https://posthog.com/docs/feature-flags/evaluation-contexts',
                    flag: 'DEFAULT_EVALUATION_ENVIRONMENTS',
                    component: <DefaultEvaluationContexts />,
                    keywords: ['evaluation', 'default', 'context', 'tag'],
                },
                {
                    id: 'feature-flag-default-release-conditions',
                    title: i18n.t('settings.map.feature-flag-default-release-conditions.title', {
                        defaultValue: 'Default release conditions',
                    }),
                    description: i18n.t('settings.map.feature-flag-default-release-conditions.description', {
                        defaultValue:
                            'Automatically apply default release conditions to newly created feature flags. Users can still modify them during flag creation.',
                    }),
                    component: <DefaultReleaseConditions />,
                    keywords: ['release', 'conditions', 'default', 'rollout', 'groups'],
                },
                {
                    id: 'feature-flag-evaluation-context-suggestions',
                    title: i18n.t('settings.map.feature-flag-evaluation-context-suggestions.title', {
                        defaultValue: 'Evaluation context suggestions',
                    }),
                    description: i18n.t('settings.map.feature-flag-evaluation-context-suggestions.description', {
                        defaultValue:
                            'Manage which evaluation context names are suggested when scoping a feature flag. Hide stale or mistyped names from the suggestion list without affecting flags that already use them.',
                    }),
                    docsUrl: 'https://posthog.com/docs/feature-flags/evaluation-contexts',
                    flag: 'FLAG_EVALUATION_TAGS',
                    component: <EvaluationContextSuggestions />,
                    keywords: ['evaluation', 'context', 'suggestion', 'hide', 'tag'],
                },
                {
                    id: 'feature-flag-secure-api-key',
                    title: i18n.t('settings.map.feature-flag-secure-api-key.title', {
                        defaultValue: 'Feature flags secure API key',
                    }),
                    description: (
                        <FlaggedFeature
                            flag={FEATURE_FLAGS.PROJECT_SECRET_API_KEYS}
                            fallback={i18n.t('settings.map.feature-flag-secure-api-key.description', {
                                defaultValue:
                                    'Use this key for local evaluation of feature flags or remote config settings. Replaces personal API keys for local evaluation.',
                            })}
                        >
                            Deprecated. This key is still usable for local evaluation of feature flags or remote config
                            settings, but new integrations should use a project secret API key with the
                            feature_flag:read scope instead.
                        </FlaggedFeature>
                    ),
                    searchDescription: i18n.t('settings.map.feature-flag-secure-api-key.searchDescription', {
                        defaultValue: `Use this key for local evaluation of feature flags or remote config settings. Replaces personal API keys for local evaluation.`,
                    }),
                    docsUrl: 'https://posthog.com/docs/feature-flags/local-evaluation',
                    component: <FlagsSecureApiKeys />,
                    keywords: ['api key', 'secret', 'local evaluation', 'remote config'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-heatmaps',
            title: i18n.t('settings.map.environment-heatmaps.title', { defaultValue: 'Heatmaps' }),
            group: 'Products',
            settings: [
                {
                    id: 'heatmaps',
                    title: i18n.t('settings.map.heatmaps.title', { defaultValue: 'Heatmaps' }),
                    description: i18n.t('settings.map.heatmaps.description', {
                        defaultValue:
                            'Capture general clicks, mouse movements, and scrolling to create heatmaps. No additional events are created. Heatmaps are generated based on overall mouse or touch positions, useful for understanding general user behavior.',
                    }),
                    docsUrl: 'https://posthog.com/docs/toolbar/heatmaps',
                    platformSupport: FEATURE_SUPPORT.heatmaps,
                    component: <HeatmapsSettings />,
                    keywords: ['click map', 'scroll', 'rage click', 'mouse', 'touch'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-logs',
            title: i18n.t('settings.map.environment-logs.title', { defaultValue: 'Logs' }),
            group: 'Products',
            settings: [
                {
                    id: 'logs',
                    title: i18n.t('settings.map.logs.title', { defaultValue: 'Logs' }),
                    description: i18n.t('settings.map.logs.description', {
                        defaultValue:
                            'Automatically capture browser console logs and send them to the Logs product for analysis and debugging. This is separate from session replay console log capture.',
                    }),
                    docsUrl: 'https://posthog.com/docs/logs',
                    platformSupport: FEATURE_SUPPORT.logsCapture,
                    component: <LogsCaptureSettings />,
                    keywords: ['log', 'capture', 'collect', 'ingest', 'console'],
                },
                {
                    id: 'logs-json-parse',
                    title: i18n.t('settings.environment.logsCapture.jsonParseLabel', {
                        defaultValue: 'JSON parse logs',
                    }),
                    description: i18n.t('settings.map.logs-json-parse.description', {
                        defaultValue:
                            'Parse log lines that are valid JSON and add their fields as log attributes that can be used in filters.',
                    }),
                    component: <LogsJsonParseSettings />,
                    flag: 'LOGS_SETTINGS_JSON',
                    keywords: ['json', 'parse', 'structured', 'format'],
                },
                {
                    id: 'logs-pii-scrub',
                    title: i18n.t('settings.map.logs-pii-scrub.title', { defaultValue: 'PII scrubbing' }),
                    description: i18n.t('settings.map.logs-pii-scrub.description', {
                        defaultValue:
                            'Remove or mask common personally identifiable information from log payloads during ingestion.',
                    }),
                    component: <LogsPiiScrubSettings />,
                    flag: 'LOGS_SETTINGS_PII_SCRUB',
                    keywords: ['pii', 'privacy', 'gdpr', 'redact', 'mask', 'scrub', 'sensitive'],
                },
                {
                    id: 'logs-distinct-id-attribute-key',
                    title: i18n.t('settings.map.logs-distinct-id-attribute-key.title', {
                        defaultValue: 'Link to person',
                    }),
                    description: (
                        <>
                            The log attributes PostHog reads to identify which person a log belongs to. A log is linked
                            when any of these attributes matches one of the person&apos;s distinct IDs. Defaults to{' '}
                            <code>posthogDistinctId</code>, the key the JavaScript and React Native SDKs auto-attach.
                            Add keys only if your backend pipeline emits the person identifier under different
                            attributes.
                        </>
                    ),
                    searchDescription: i18n.t('settings.map.logs-distinct-id-attribute-key.searchDescription', {
                        defaultValue: `The log attributes PostHog reads to identify which person a log belongs to. A log is linked when any of these attributes matches one of the person's distinct IDs. Defaults to posthogDistinctId, the key the JavaScript and React Native SDKs auto-attach. Add keys only if your backend pipeline emits the person identifier under different attributes.`,
                    }),
                    component: <LogsDistinctIdAttributeKeys />,
                    keywords: ['log', 'person', 'distinct', 'attribute', 'pivot', 'profile', 'link'],
                },
                {
                    id: 'logs-pattern-message-keys',
                    title: i18n.t('settings.map.logs-pattern-message-keys.title', {
                        defaultValue: 'Pattern message extraction',
                    }),
                    description: i18n.t('settings.map.logs-pattern-message-keys.description', {
                        defaultValue:
                            'Choose which JSON keys provide the message used to group logs into patterns. Keys are matched literally at the top level, in order. This does not change the stored log body.',
                    }),
                    component: <LogsPatternMessageKeys />,
                    keywords: ['log', 'pattern', 'message', 'extract', 'json', 'group'],
                },
                {
                    id: 'logs-session-id-attribute-keys',
                    title: i18n.t('settings.map.logs-session-id-attribute-keys.title', {
                        defaultValue: 'Link to session',
                    }),
                    description: (
                        <>
                            The log attributes PostHog reads to identify which session a log belongs to, checked in
                            order with the first match winning, followed by other common session ID attributes. Defaults
                            to <code>sessionId</code>, the key the JavaScript and React Native SDKs auto-attach. Add
                            keys only if your pipeline emits the session ID under different attributes.
                        </>
                    ),
                    searchDescription: i18n.t('settings.map.logs-session-id-attribute-keys.searchDescription', {
                        defaultValue: `The log attributes PostHog reads to identify which session a log belongs to, checked in order with the first match winning, followed by other common session ID attributes. Defaults to sessionId, the key the JavaScript and React Native SDKs auto-attach. Add keys only if your pipeline emits the session ID under different attributes.`,
                    }),
                    component: <LogsSessionIdAttributeKeys />,
                    keywords: ['log', 'session', 'replay', 'attribute', 'link'],
                },
                {
                    id: 'logs-retention',
                    title: i18n.t('settings.environment.coreEvents.categories.retention.label', {
                        defaultValue: 'Retention',
                    }),
                    description: (
                        <span>
                            How long to retain logs before they are automatically deleted.{' '}
                            <strong>Changes only affect the retention for new logs</strong>. You can only change this
                            setting at most once per 24 hours.
                        </span>
                    ),
                    component: <LogsRetentionSettings />,
                    keywords: ['retention', 'storage', 'delete', 'ttl'],
                },
                {
                    id: 'logs-drop-rules',
                    title: i18n.t('settings.map.logs-drop-rules.title', { defaultValue: 'Drop rules' }),
                    description: i18n.t('settings.map.logs-drop-rules.description', {
                        defaultValue:
                            'Drop matching log lines before storage using ordered rules. Rules run in ingestion order (after optional scrub and JSON parse).',
                    }),
                    component: <LogsSamplingSection />,
                    keywords: ['drop', 'exclude', 'filter', 'rules', 'path', 'attribute', 'volume', 'noise'],
                },
                {
                    id: 'logs-metric-rules',
                    title: i18n.t('settings.map.logs-metric-rules.title', { defaultValue: 'Log-based metrics' }),
                    description: i18n.t('settings.map.logs-metric-rules.description', {
                        defaultValue:
                            'Generate metrics from your logs at ingestion time. Metrics are computed before drop rules, so you can drop noisy logs and keep the trend.',
                    }),
                    component: <LogsMetricRulesSection />,
                    flag: 'METRICS',
                    keywords: ['metric', 'metrics', 'log-based', 'generate', 'count', 'aggregate', 'logs to metrics'],
                },
                {
                    id: 'logs-retention-rules',
                    title: i18n.t('settings.map.logs-retention-rules.title', { defaultValue: 'Retention rules' }),
                    description: i18n.t('settings.map.logs-retention-rules.description', {
                        defaultValue:
                            "Keep matching logs longer or shorter than the environment default using ordered rules. The first matching rule sets a log's retention; retention is applied at ingest.",
                    }),
                    component: <LogsRetentionSection />,
                    flag: LogsFeatureFlagKeys.retentionRules,
                    keywords: ['retention', 'storage', 'ttl', 'rules', 'filter', 'keep', 'expire'],
                },
                {
                    id: 'logs-alerting',
                    title: i18n.t('settings.map.logs-alerting.title', { defaultValue: 'Alerting' }),
                    description: i18n.t('settings.map.logs-alerting.description', {
                        defaultValue: 'Configure alerts to get notified when log volumes breach thresholds.',
                    }),
                    component: <LogsAlertingSection />,
                    keywords: ['notification', 'alert', 'threshold', 'logs'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-marketing-analytics',
            title: i18n.t('settings.map.environment-marketing-analytics.title', {
                defaultValue: 'Marketing analytics',
            }),
            flag: 'WEB_ANALYTICS_MARKETING',
            group: 'Products',
            settings: [
                {
                    id: 'marketing-settings',
                    title: i18n.t('settings.map.marketing-settings.title', { defaultValue: 'Marketing settings' }),
                    description: i18n.t('settings.map.marketing-settings.description', {
                        defaultValue: 'Configure tracking and attribution settings for marketing analytics.',
                    }),
                    docsUrl: 'https://posthog.com/docs/web-analytics/marketing-analytics',
                    component: <MarketingAnalyticsSettingsWrapper />,
                    keywords: ['utm', 'attribution', 'campaign', 'channel', 'marketing'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-product-analytics',
            title: i18n.t('settings.map.environment-product-analytics.title', { defaultValue: 'Product analytics' }),
            group: 'Products',
            settings: [
                {
                    id: 'data-theme',
                    title: i18n.t('settings.map.data-theme.title', { defaultValue: 'Chart color themes' }),
                    description: i18n.t('settings.map.data-theme.description', {
                        defaultValue: 'Customize the color palette used in charts and visualizations.',
                    }),
                    component: <DataColorThemes />,
                    keywords: ['color', 'palette', 'chart', 'visualization'],
                },
                {
                    id: 'persons-on-events',
                    title: i18n.t('settings.map.persons-on-events.title', { defaultValue: 'Person properties mode' }),
                    description: i18n.t('settings.map.persons-on-events.description', {
                        defaultValue:
                            'Choose the behavior of person property filters. For best performance, use person properties from the time of the event.',
                    }),
                    component: <PersonsOnEvents />,
                    flag: '!SETTINGS_PERSONS_ON_EVENTS_HIDDEN', // Setting hidden for Cloud orgs created since June 2024
                    keywords: ['person', 'properties', 'join', 'query', 'performance'],
                },
                {
                    id: 'correlation-analysis',
                    title: i18n.t('settings.map.correlation-analysis.title', {
                        defaultValue: 'Correlation analysis exclusions',
                    }),
                    description: i18n.t('settings.map.correlation-analysis.description', {
                        defaultValue:
                            'Correlation analysis automatically surfaces relevant signals for conversion. Exclude events or properties that do not provide useful signals.',
                    }),
                    docsUrl: 'https://posthog.com/docs/product-analytics/funnels#correlation-analysis',
                    component: <CorrelationConfig />,
                    keywords: ['funnel', 'conversion', 'exclude', 'property'],
                },
                {
                    id: 'person-display-name',
                    title: i18n.t('settings.map.person-display-name.title', { defaultValue: 'Person display name' }),
                    description: i18n.t('settings.map.person-display-name.description', {
                        defaultValue:
                            'Choose which person properties are used to display names in the UI (e.g. email, name, username).',
                    }),
                    docsUrl: 'https://posthog.com/docs/data/persons',
                    component: <PersonDisplayNameProperties />,
                    keywords: ['name', 'email', 'identity', 'display'],
                },
                {
                    id: 'person-last-seen-at',
                    title: i18n.t('settings.map.person-last-seen-at.title', {
                        defaultValue: 'Person last seen tracking',
                    }),
                    description: i18n.t('settings.map.person-last-seen-at.description', {
                        defaultValue:
                            'When enabled, PostHog tracks when each person was last active. The value updates hourly and is visible in the People list.',
                    }),
                    docsUrl: 'https://posthog.com/docs/data/persons',
                    component: <PersonLastSeenAtEnabled />,
                    keywords: ['person', 'last seen', 'activity', 'tracking'],
                },
                {
                    id: 'path-cleaning',
                    title: i18n.t('settings.map.path-cleaning.title', { defaultValue: 'Path cleaning rules' }),
                    description: i18n.t('settings.map.path-cleaning.description', {
                        defaultValue:
                            'Define regex rules to normalize URLs in path analysis. Useful for removing IDs or query parameters from paths.',
                    }),
                    docsUrl: 'https://posthog.com/docs/product-analytics/paths#path-cleaning-rules',
                    component: <PathCleaningFiltersConfig />,
                    keywords: ['url', 'regex', 'normalize', 'path analysis'],
                },
                {
                    id: 'human-friendly-comparison-periods',
                    title: i18n.t('settings.map.human-friendly-comparison-periods.title', {
                        defaultValue: 'Human friendly comparison periods',
                    }),
                    description: i18n.t('settings.map.human-friendly-comparison-periods.description', {
                        defaultValue:
                            'When comparing against a previous month or year, compare against the same day of the week instead of the same calendar date. A year comparison becomes 52 weeks, and a month comparison becomes 4 weeks.',
                    }),
                    component: <HumanFriendlyComparisonPeriodsSetting />,
                    keywords: ['compare', 'period', 'week', 'month', 'year', 'seasonality'],
                },
                {
                    id: 'group-analytics',
                    title: i18n.t('settings.map.group-analytics.title.2', { defaultValue: 'Group analytics' }),
                    description: i18n.t('settings.map.group-analytics.description.2', {
                        defaultValue: 'Configure group types for analyzing user behavior at the company or team level.',
                    }),
                    docsUrl: 'https://posthog.com/docs/product-analytics/group-analytics',
                    component: <GroupAnalyticsConfig />,
                    flag: '!CUSTOMER_ANALYTICS',
                    keywords: ['company', 'organization', 'team', 'group type'],
                },
                {
                    id: 'persons-join-mode',
                    title: i18n.t('settings.map.persons-join-mode.title', { defaultValue: 'Persons join mode' }),
                    description: i18n.t('settings.map.persons-join-mode.description', {
                        defaultValue:
                            'Choose how persons are joined to events. Do not change this setting unless you know what you are doing.',
                    }),
                    component: <PersonsJoinMode />,
                    flag: 'SETTINGS_PERSONS_JOIN_MODE',
                    keywords: ['join', 'inner', 'left', 'personless'],
                },
                {
                    id: 'session-table-version',
                    title: i18n.t('settings.map.session-table-version.title', {
                        defaultValue: 'Sessions table version',
                    }),
                    description: i18n.t('settings.map.session-table-version.description', {
                        defaultValue:
                            'Choose which version of the sessions table to use. V2 is faster but requires uuidv7 session IDs. Use auto unless you know what you are doing.',
                    }),
                    component: <SessionsTableVersion />,
                    flag: 'SETTINGS_SESSION_TABLE_VERSION',
                    keywords: ['session', 'table', 'version', 'uuidv7'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-revenue-analytics',
            title: i18n.t('settings.map.environment-revenue-analytics.title', { defaultValue: 'Revenue analytics' }),
            group: 'Products',
            accessControl: {
                resourceType: AccessControlResourceType.RevenueAnalytics,
                minimumAccessLevel: AccessControlLevel.Editor,
            },
            settings: [
                {
                    // FIXME: remove from "Revenue definitions" page
                    id: 'revenue-base-currency',
                    title: i18n.t('settings.map.revenue-base-currency.title', { defaultValue: 'Base currency' }),
                    description: i18n.t('settings.map.revenue-base-currency.description', {
                        defaultValue: 'Set the base currency for revenue analytics calculations.',
                    }),
                    component: <BaseCurrency hideTitle />,
                    hideWhenNoSection: true,
                    keywords: ['money', 'currency', 'usd', 'eur'],
                },
                {
                    // FIXME: remove from "Revenue definitions" page
                    id: 'revenue-analytics-filter-test-accounts',
                    title: i18n.t('settings.environment.testAccountFilters.filterRevenueAnalytics', {
                        defaultValue: 'Filter out internal and test users from revenue analytics',
                    }),
                    description: i18n.t('settings.map.revenue-analytics-filter-test-accounts.description', {
                        defaultValue: 'Exclude test accounts from revenue calculations and reports.',
                    }),
                    component: <RevenueAnalyticsFilterTestAccountsConfiguration />,
                    keywords: ['test account', 'internal', 'exclude', 'filter', 'revenue'],
                },
                {
                    // FIXME: should not be in settings
                    id: 'revenue-analytics-events',
                    title: i18n.t('settings.map.revenue-analytics-events.title', { defaultValue: 'Revenue events' }),
                    description: i18n.t('settings.map.revenue-analytics-events.description', {
                        defaultValue: 'Configure which events represent revenue-generating actions.',
                    }),
                    docsUrl: 'https://posthog.com/docs/revenue-analytics',
                    component: <EventConfiguration />,
                    keywords: ['purchase', 'payment', 'subscription', 'charge'],
                },
                {
                    // FIXME: should not be in settings
                    id: 'revenue-analytics-external-data-sources',
                    title: i18n.t('settings.map.revenue-analytics-external-data-sources.title', {
                        defaultValue: 'External data sources',
                    }),
                    description: i18n.t('settings.map.revenue-analytics-external-data-sources.description', {
                        defaultValue: 'Connect external data sources like Stripe for revenue tracking.',
                    }),
                    component: <ExternalDataSourceConfiguration />,
                    keywords: ['stripe', 'import', 'sync', 'data warehouse'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-replay',
            title: i18n.t('settings.map.environment-replay.title', { defaultValue: 'Session replay' }),
            group: 'Products',
            settings: [
                {
                    id: 'replay',
                    title: i18n.t('settings.map.replay.title', { defaultValue: 'Session replay' }),
                    description: i18n.t('settings.map.replay.description', {
                        defaultValue:
                            'Watch recordings of how users interact with your web app to diagnose issues and understand user behavior.',
                    }),
                    docsUrl: 'https://posthog.com/docs/session-replay',
                    component: <ReplayGeneral />,
                    keywords: ['recording', 'video', 'screen', 'session'],
                },
                {
                    id: 'replay-log-capture',
                    title: i18n.t('settings.map.replay-log-capture.title', { defaultValue: 'Log capture' }),
                    description: i18n.t('settings.map.replay-log-capture.description', {
                        defaultValue: 'Capture browser console logs alongside session recordings to help debug issues.',
                    }),
                    docsUrl: 'https://posthog.com/docs/session-replay/console-log-recording',
                    platformSupport: FEATURE_SUPPORT.sessionReplayLogCapture,
                    component: <LogCaptureSettings />,
                    keywords: ['console', 'log', 'debug', 'error'],
                },
                {
                    id: 'replay-canvas-capture',
                    title: i18n.t('settings.map.replay-canvas-capture.title', { defaultValue: 'Canvas capture' }),
                    description: i18n.t('settings.map.replay-canvas-capture.description', {
                        defaultValue:
                            'Capture HTML canvas elements in session recordings. Useful for apps that render charts, games, or other canvas-based content.',
                    }),
                    docsUrl: 'https://posthog.com/docs/session-replay/canvas-recording',
                    platformSupport: FEATURE_SUPPORT.sessionReplayCanvasCapture,
                    component: <CanvasCaptureSettings />,
                    keywords: ['canvas', 'webgl', 'drawing', 'chart'],
                },
                {
                    id: 'replay-triggers',
                    title: i18n.t('settings.environment.replayTriggers.conditions.heading', {
                        defaultValue: 'Recording conditions',
                    }),
                    description: i18n.t('settings.map.replay-triggers.description', {
                        defaultValue:
                            'Control when recordings start and stop. Use URL triggers, event triggers, or sampling to manage recording volume.',
                    }),
                    docsUrl: 'https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record',
                    component: <ReplayTriggers />,
                    keywords: ['trigger', 'url', 'event', 'sample', 'condition', 'filter'],
                },
                {
                    id: 'replay-masking',
                    title: i18n.t('settings.map.replay-masking.title', { defaultValue: 'Privacy and masking' }),
                    description: i18n.t('settings.map.replay-masking.description', {
                        defaultValue:
                            'Choose what data gets masked in your session recordings. For more control, configure masking directly in your code.',
                    }),
                    docsUrl: 'https://posthog.com/docs/session-replay/privacy',
                    platformSupport: FEATURE_SUPPORT.sessionReplayMasking,
                    component: <ReplayMaskingSettings />,
                    keywords: ['redact', 'sensitive', 'pii', 'hide', 'mask', 'privacy', 'gdpr'],
                },
                {
                    id: 'replay-network',
                    title: i18n.t('settings.map.replay-network.title', { defaultValue: 'Network capture' }),
                    description: i18n.t('settings.map.replay-network.description', {
                        defaultValue:
                            'Capture network request timings alongside session recordings to identify slow or failing API calls.',
                    }),
                    docsUrl: 'https://posthog.com/docs/session-replay/network-recording',
                    platformSupport: FEATURE_SUPPORT.sessionReplayCaptureRequests,
                    component: <ReplayNetworkCapture />,
                    keywords: ['xhr', 'fetch', 'api', 'request', 'response', 'performance'],
                },
                {
                    id: 'replay-network-headers-payloads',
                    title: i18n.t('settings.map.replay-network-headers-payloads.title', {
                        defaultValue: 'Network headers & payloads',
                    }),
                    description: i18n.t('settings.map.replay-network-headers-payloads.description', {
                        defaultValue:
                            'Capture request and response headers and body content alongside network timings. Sensitive data is automatically scrubbed.',
                    }),
                    docsUrl: 'https://posthog.com/docs/session-replay/network-recording',
                    platformSupport: FEATURE_SUPPORT.sessionReplayCaptureHeadersAndPayloads,
                    component: <ReplayNetworkHeadersPayloads />,
                    keywords: ['headers', 'payload', 'body', 'request', 'response'],
                },
                {
                    id: 'replay-authorized-domains',
                    title: i18n.t('settings.map.replay-authorized-domains.title', {
                        defaultValue: 'Authorized domains for replay',
                    }),
                    description: i18n.t('settings.map.replay-authorized-domains.description', {
                        defaultValue:
                            'This setting is deprecated. Use URL triggers in recording conditions to control which domains are recorded.',
                    }),
                    platformSupport: FEATURE_SUPPORT.sessionReplayAuthorizedDomains,
                    component: <ReplayAuthorizedDomains />,
                    allowForTeam: (t) => !!t?.recording_domains?.length,
                    keywords: ['domain', 'whitelist', 'allowlist'],
                },
                {
                    id: 'replay-retention',
                    title: i18n.t('settings.map.replay-retention.title', { defaultValue: 'Data retention' }),
                    description: i18n.t('settings.map.replay-retention.description', {
                        defaultValue:
                            'Control how long your recordings are stored. Changes only affect the retention period for future recordings.',
                    }),
                    component: <ReplayDataRetentionSettings />,
                    keywords: ['storage', 'retention', 'delete', 'days', 'months'],
                },
                {
                    id: 'replay-integrations',
                    title: i18n.t('settings.organization.verifiedDomains.columns.integrations', {
                        defaultValue: 'Integrations',
                    }),
                    description: i18n.t('settings.map.replay-integrations.description', {
                        defaultValue: 'Configure integrations to create and link issues from session replays.',
                    }),
                    component: <ReplayIntegrations />,
                    keywords: ['integration', 'connect', 'third-party'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-conversations',
            title: i18n.t('settings.map.environment-conversations.title', { defaultValue: 'Support' }),
            group: 'Products',
            settings: [
                {
                    id: 'conversations-general',
                    title: i18n.t('settings.map.conversations-general.title', { defaultValue: 'General' }),
                    component: <GeneralSection />,
                    keywords: [
                        'conversation',
                        'ticket',
                        'message',
                        'support',
                        'general',
                        'api',
                        'domain',
                        'identity',
                        'secret',
                        'channel',
                        'widget',
                        'email',
                        'slack',
                        'teams',
                        'microsoft',
                    ],
                },
                {
                    id: 'conversations-notifications',
                    title: i18n.t('settings.map.conversations-notifications.title', { defaultValue: 'Notifications' }),
                    description: i18n.t('settings.map.conversations-notifications.description', {
                        defaultValue:
                            'We recommend setting up a workflow for fine-grained automation — Slack pings, SLA escalations, auto-tagging. For the basics, configure email or browser notifications.',
                    }),
                    component: <NotificationsSection />,
                    allowForTeam: (t) => !!t?.conversations_enabled,
                    keywords: [
                        'conversation',
                        'ticket',
                        'message',
                        'support',
                        'notification',
                        'workflow',
                        'email',
                        'browser',
                    ],
                },
                {
                    id: 'conversations-imports',
                    title: (
                        <>
                            {i18n.t('settings.map.conversations-imports.title', { defaultValue: 'Imports' })}
                            <LemonTag type="highlight" size="small" className="ml-1">
                                {i18n.t('settings.map.conversations-imports.beta', { defaultValue: 'Beta' })}
                            </LemonTag>
                        </>
                    ),
                    description: i18n.t('settings.map.conversations-imports.description', {
                        defaultValue: 'Import historical support data from external tools into Support.',
                    }),
                    component: <ZendeskImportSection />,
                    flag: 'PRODUCT_SUPPORT_IMPORT_TICKETS',
                    allowForTeam: (t) => !!t?.conversations_enabled,
                    keywords: ['import', 'zendesk', 'migrate', 'ticket', 'support', 'conversation'],
                },
                {
                    id: 'conversations-ai',
                    title: (
                        <>
                            {i18n.t('settings.map.conversations-ai.title', { defaultValue: 'AI agent' })}
                            <LemonTag type="highlight" size="small" className="ml-1">
                                {i18n.t('settings.map.conversations-ai.beta', { defaultValue: 'Beta' })}
                            </LemonTag>
                        </>
                    ),
                    description: i18n.t('settings.map.conversations-ai.description', {
                        defaultValue:
                            'Automatically generate AI-powered reply suggestions grounded in your business knowledge sources.',
                    }),
                    component: <AISection />,
                    flag: 'PRODUCT_SUPPORT_AI_SUGGESTION',
                    allowForTeam: (t) => !!t?.conversations_enabled,
                    keywords: ['ai', 'agent', 'suggestion', 'auto', 'reply', 'support', 'conversation', 'beta'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-business-knowledge',
            title: i18n.t('settings.map.environment-business-knowledge.title', { defaultValue: 'Business knowledge' }),
            group: 'Products',
            flag: 'PRODUCT_BUSINESS_KNOWLEDGE',
            settings: [
                {
                    id: 'business-knowledge-learn-from-support',
                    title: i18n.t('settings.map.business-knowledge-learn-from-support.title', {
                        defaultValue: 'Self-learning',
                    }),
                    description: i18n.t('settings.map.business-knowledge-learn-from-support.description', {
                        defaultValue:
                            'When on, PostHog learns reusable answers from public human replies on resolved support tickets.',
                    }),
                    component: <LearnFromSupportSetting />,
                    docsUrl: 'https://posthog.com/docs/business-knowledge/learn-from-support',
                    keywords: ['business', 'knowledge', 'support', 'learn', 'ticket', 'resolved'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-surveys',
            title: i18n.t('settings.map.environment-surveys.title', { defaultValue: 'Surveys' }),
            group: 'Products',
            settings: [
                {
                    id: 'surveys-interface',
                    title: i18n.t('settings.map.surveys-interface.title', { defaultValue: 'Surveys' }),
                    description: i18n.t('settings.map.surveys-interface.description', {
                        defaultValue:
                            'Enable or disable surveys in your web application. When disabled, surveys will not be rendered automatically.',
                    }),
                    docsUrl: 'https://posthog.com/docs/surveys',
                    platformSupport: FEATURE_SUPPORT.surveys,
                    component: <SurveyEnableToggle />,
                    keywords: ['popup', 'widget', 'feedback', 'nps', 'csat', 'enable'],
                },
                {
                    id: 'surveys-default-appearance',
                    title: i18n.t('settings.map.surveys-default-appearance.title', {
                        defaultValue: 'Default survey appearance',
                    }),
                    description: i18n.t('settings.map.surveys-default-appearance.description', {
                        defaultValue:
                            'Configure the default look and feel for new surveys. Individual surveys can override these settings.',
                    }),
                    docsUrl: 'https://posthog.com/docs/surveys/creating-surveys#customizing-the-look-and-feel',
                    component: <SurveyDefaultAppearance />,
                    keywords: ['appearance', 'style', 'theme', 'customization', 'popup'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-tracing',
            title: i18n.t('settings.map.environment-tracing.title', { defaultValue: 'Tracing' }),
            group: 'Products',
            flag: ['TRACING', 'TRACING_SESSION_PERSON_LINKS'],
            settings: [
                {
                    id: 'tracing-distinct-id-attribute-keys',
                    title: i18n.t('settings.map.tracing-distinct-id-attribute-keys.title', {
                        defaultValue: 'Link to person',
                    }),
                    description: (
                        <>
                            The span attributes PostHog reads to identify which person a trace belongs to. A span is
                            linked when any of these attributes holds one of the person&apos;s distinct IDs. Defaults to{' '}
                            <code>posthogDistinctId</code>. Add keys only if your pipeline emits the person identifier
                            under different attributes.
                        </>
                    ),
                    searchDescription: i18n.t('settings.map.tracing-distinct-id-attribute-keys.searchDescription', {
                        defaultValue: `The span attributes PostHog reads to identify which person a trace belongs to. A span is linked when any of these attributes holds one of the person's distinct IDs. Defaults to posthogDistinctId. Add keys only if your pipeline emits the person identifier under different attributes.`,
                    }),
                    component: <TracingDistinctIdAttributeKeys />,
                    keywords: ['trace', 'span', 'person', 'distinct', 'attribute', 'pivot', 'profile', 'link'],
                },
                {
                    id: 'tracing-session-id-attribute-keys',
                    title: i18n.t('settings.map.tracing-session-id-attribute-keys.title', {
                        defaultValue: 'Link to session',
                    }),
                    description: (
                        <>
                            The span attributes PostHog reads to identify which session a trace belongs to, checked in
                            order with the first match winning, followed by other common session ID attributes. Defaults
                            to <code>sessionId</code>. Add keys only if your pipeline emits the session ID under
                            different attributes.
                        </>
                    ),
                    searchDescription: i18n.t('settings.map.tracing-session-id-attribute-keys.searchDescription', {
                        defaultValue: `The span attributes PostHog reads to identify which session a trace belongs to, checked in order with the first match winning, followed by other common session ID attributes. Defaults to sessionId. Add keys only if your pipeline emits the session ID under different attributes.`,
                    }),
                    component: <TracingSessionIdAttributeKeys />,
                    keywords: ['trace', 'span', 'session', 'replay', 'attribute', 'link'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-web-analytics',
            title: i18n.t('settings.map.environment-web-analytics.title', { defaultValue: 'Web analytics' }),
            group: 'Products',
            settings: [
                {
                    id: 'web-analytics-authorized-urls',
                    title: i18n.t('settings.map.web-analytics-authorized-urls.title', {
                        defaultValue: 'Web analytics domains',
                    }),
                    description: i18n.t('settings.map.web-analytics-authorized-urls.description', {
                        defaultValue:
                            'Configure which domains are tracked in web analytics. Wildcards are not allowed — URLs must be concrete and launchable.',
                    }),
                    component: <TeamAuthorizedURLs />,
                    keywords: ['domain', 'website', 'url'],
                },
                {
                    id: 'channel-type',
                    title: i18n.t('settings.map.channel-type.title', { defaultValue: 'Custom channel type' }),
                    description: i18n.t('settings.map.channel-type.description', {
                        defaultValue: 'Define custom rules for categorizing traffic sources into channels.',
                    }),
                    docsUrl: 'https://posthog.com/docs/data/channel-type',
                    component: <CustomChannelTypes />,
                    keywords: ['utm', 'source', 'medium', 'referrer', 'attribution'],
                },
                {
                    id: 'cookieless-server-hash-mode',
                    title: i18n.t('settings.map.cookieless-server-hash-mode.title', {
                        defaultValue: 'Cookieless tracking',
                    }),
                    description: i18n.t('settings.map.cookieless-server-hash-mode.description', {
                        defaultValue:
                            'Count unique users with a privacy-preserving hash instead of cookies. Enable this here, then enable cookieless mode in posthog-js.',
                    }),
                    docsUrl: 'https://posthog.com/tutorials/cookieless-tracking',
                    component: <CookielessServerHashModeSetting />,
                    keywords: ['cookie', 'privacy', 'gdpr', 'tracking', 'consent'],
                },
                {
                    id: 'bounce-rate-duration',
                    title: i18n.t('settings.map.bounce-rate-duration.title', { defaultValue: 'Bounce rate duration' }),
                    description: i18n.t('settings.map.bounce-rate-duration.description', {
                        defaultValue:
                            'Set how long a user can stay on a page (in seconds) before the session is not counted as a bounce. Default is 10 seconds.',
                    }),
                    docsUrl: 'https://posthog.com/tutorials/bounce-rate',
                    component: <BounceRateDurationSetting />,
                    keywords: ['bounce', 'session', 'duration', 'seconds'],
                },
                {
                    id: 'bounce-rate-page-view-mode',
                    title: i18n.t('settings.map.bounce-rate-page-view-mode.title', {
                        defaultValue: 'Bounce rate page view mode',
                    }),
                    description: i18n.t('settings.map.bounce-rate-page-view-mode.description', {
                        defaultValue:
                            'Choose how pageviews are counted as part of the bounce rate calculation. Other factors like autocaptures and session duration are also considered.',
                    }),
                    component: <BounceRatePageViewModeSetting />,
                    flag: 'SETTINGS_BOUNCE_RATE_PAGE_VIEW_MODE',
                    keywords: ['bounce', 'pageview', 'url', 'calculation'],
                },
                {
                    id: 'session-join-mode',
                    title: i18n.t('settings.map.session-join-mode.title', { defaultValue: 'Session join mode' }),
                    description: i18n.t('settings.map.session-join-mode.description', {
                        defaultValue:
                            "Choose which join mode to use for sessions. Don't change this unless you know what you're doing.",
                    }),
                    component: <SessionsV2JoinModeSettings />,
                    flag: 'SETTINGS_SESSIONS_V2_JOIN',
                    keywords: ['session', 'join', 'string', 'uuid'],
                },
                {
                    id: 'web-analytics-pre-aggregated-tables',
                    title: i18n.t('settings.map.web-analytics-pre-aggregated-tables.title', {
                        defaultValue: 'Pre-aggregated tables',
                    }),
                    description: i18n.t('settings.map.web-analytics-pre-aggregated-tables.description', {
                        defaultValue: 'Configure pre-aggregated tables to speed up web analytics queries.',
                    }),
                    component: <PreAggregatedTablesSetting />,
                    flag: 'SETTINGS_WEB_ANALYTICS_PRE_AGGREGATED_TABLES',
                    keywords: ['performance', 'speed', 'query', 'materialized'],
                },
                {
                    id: 'web-analytics-opt-in-pre-aggregated-tables-and-api',
                    title: i18n.t('settings.map.web-analytics-opt-in-pre-aggregated-tables-and-api.title', {
                        defaultValue: 'New query engine',
                    }),
                    description: i18n.t('settings.map.web-analytics-opt-in-pre-aggregated-tables-and-api.description', {
                        defaultValue: 'Enable the new pre-aggregated query engine for faster web analytics.',
                    }),
                    component: <WebAnalyticsEnablePreAggregatedTables />,
                    flag: 'WEB_ANALYTICS_API',
                    keywords: ['performance', 'speed', 'query', 'api'],
                },
                {
                    id: 'web-vitals-autocapture',
                    title: i18n.t('settings.map.web-vitals-autocapture.title', {
                        defaultValue: 'Web vitals autocapture',
                    }),
                    description: i18n.t('settings.map.web-vitals-autocapture.description', {
                        defaultValue:
                            "Capture Google Chrome's web vitals metrics for web analytics performance tracking.",
                    }),
                    docsUrl: 'https://posthog.com/docs/web-analytics/web-vitals',
                    platformSupport: FEATURE_SUPPORT.webVitals,
                    component: <WebVitalsAutocaptureSettings />,
                    keywords: ['lcp', 'cls', 'fcp', 'inp', 'performance', 'core web vitals'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-workflows',
            title: i18n.t('settings.map.environment-workflows.title', { defaultValue: 'Workflows' }),
            group: 'Products',
            settings: [
                {
                    id: 'workflows-engagement-events',
                    title: i18n.t('settings.map.workflows-engagement-events.title', {
                        defaultValue: 'Engagement events',
                    }),
                    description: i18n.t('settings.map.workflows-engagement-events.description', {
                        defaultValue:
                            'When enabled, email engagement activity (sent, delivered, opened, link clicked, bounced, blocked, failed) is captured as standard PostHog events alongside the existing workflow metrics. This lets you build insights, funnels, and dashboards from workflows data. These events count toward your event usage and are billed like any other event. This setting only controls event capture: it does not disable open and click tracking itself. To stop tracking opens and clicks for an email, turn off "Track opens and link clicks" on that email step.',
                    }),
                    docsUrl: 'https://posthog.com/docs/workflows/engagement-events',
                    component: <WorkflowsEngagementEventsSettings />,
                    keywords: [
                        'workflows',
                        'email',
                        'engagement',
                        'events',
                        'capture',
                        'tracking',
                        'sent',
                        'delivered',
                        'opened',
                        'clicked',
                        'bounced',
                        'blocked',
                        'failed',
                    ],
                },
                {
                    id: 'workflows-email-tracking-consent',
                    title: i18n.t('settings.map.workflows-email-tracking-consent.title', {
                        defaultValue: 'Email tracking consent',
                    }),
                    description: i18n.t('settings.map.workflows-email-tracking-consent.description', {
                        defaultValue:
                            'Controls whether open and click tracking on marketing workflow emails requires recipient consent. Untracked emails contain no tracking pixel and no rewritten links, and never record opens or clicks. Transactional emails are exempt. Delivery, bounce, and unsubscribe events are always recorded.',
                    }),
                    component: <WorkflowsEmailTrackingConsentSettings />,
                    keywords: [
                        'workflows',
                        'email',
                        'tracking',
                        'consent',
                        'pixel',
                        'cnil',
                        'gdpr',
                        'privacy',
                        'opt-in',
                        'opt-out',
                    ],
                },
                {
                    id: 'workflows-ai-task-limits',
                    title: i18n.t('settings.map.workflows-ai-task-limits.title', { defaultValue: 'AI task limits' }),
                    description: i18n.t('settings.map.workflows-ai-task-limits.description', {
                        defaultValue:
                            'How many AI tasks your workflows can create in a rolling 24 hours. One limit applies to each workflow on its own, the other to every workflow in the project together. Leave a limit empty to use the default. Set it to zero to pause task creation. Contact support to raise a limit above 500 per workflow or 2,500 per project.',
                    }),
                    component: <WorkflowsTaskLimitsSettings />,
                    flag: 'WORKFLOW_AI_TASK_ACTION',
                    keywords: ['workflows', 'ai', 'task', 'agent', 'limit', 'rate', 'cap', 'daily', 'spend', 'pause'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-access-control',
            title: i18n.t('settings.map.environment-access-control.title', { defaultValue: 'Access control' }),
            settings: [
                {
                    id: 'environment-access-control',
                    title: i18n.t('settings.map.environment-access-control.title.2', {
                        defaultValue: 'Access control',
                    }),
                    description: i18n.t('settings.map.environment-access-control.description', {
                        defaultValue: 'Manage who has access to this environment and what they can do.',
                    }),
                    docsUrl: 'https://posthog.com/docs/settings/access-control',
                    component: <TeamAccessControl />,
                    keywords: ['permission', 'role', 'access', 'rbac', 'team'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-activity-logs',
            title: i18n.t('settings.map.environment-activity-logs.title', { defaultValue: 'Activity logs' }),
            payGate: {
                feature: AvailableFeature.AUDIT_LOGS,
                // pinned: `pay gate shown` property value, so renaming it breaks existing insights
                featureDetail: 'activity-log-retention',
                bypassForImpersonation: true,
            },
            settings: [
                {
                    id: 'activity-log-settings',
                    title: i18n.t('settings.map.activity-log-settings.title', { defaultValue: 'Activity logs' }),
                    description: i18n.t('settings.map.activity-log-settings.description', {
                        defaultValue: 'View a log of changes made to this environment by team members.',
                    }),
                    component: <ActivityLogSettings />,
                    keywords: ['audit', 'history', 'change', 'activity'],
                },
                {
                    id: 'activity-log-org-level-settings',
                    title: i18n.t('settings.map.activity-log-org-level-settings.title', { defaultValue: 'Settings' }),
                    description: i18n.t('settings.map.activity-log-org-level-settings.description', {
                        defaultValue: 'Configure organization-level activity log settings.',
                    }),
                    component: <ActivityLogOrgLevelSettings />,
                    keywords: ['audit', 'organization', 'activity'],
                },
                {
                    id: 'activity-log-notifications',
                    title: i18n.t('settings.map.activity-log-notifications.title', { defaultValue: 'Notifications' }),
                    description: i18n.t('settings.map.activity-log-notifications.description', {
                        defaultValue: 'Get notified about activity log events via configured destinations.',
                    }),
                    component: <ActivityLogNotifications />,
                    allowForTeam: (t) => (t?.effective_membership_level ?? 0) >= OrganizationMembershipLevel.Admin,
                    keywords: ['notification', 'alert', 'activity', 'webhook'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-approvals',
            title: i18n.t('settings.organization.approvals.columns.approvals', { defaultValue: 'Approvals' }),
            minimumAccessLevel: OrganizationMembershipLevel.Admin,
            settings: [
                {
                    id: 'approval-policies',
                    title: i18n.t('settings.map.approval-policies.title', { defaultValue: 'Policies' }),
                    description: i18n.t('settings.map.approval-policies.description', {
                        defaultValue: 'Configure which actions require approval before being applied.',
                    }),
                    docsUrl: 'https://posthog.com/docs/settings/approvals#policies',
                    component: <ApprovalPolicies />,
                    keywords: ['approval', 'policy', 'review', 'gate'],
                },
                {
                    id: 'change-requests',
                    title: i18n.t('settings.map.change-requests.title', { defaultValue: 'Change requests' }),
                    description: i18n.t('settings.map.change-requests.description', {
                        defaultValue: 'Review and approve pending change requests.',
                    }),
                    docsUrl: 'https://posthog.com/docs/settings/approvals#change-requests',
                    component: <ChangeRequestsList />,
                    keywords: ['approval', 'review', 'pending', 'request'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-autocapture',
            title: i18n.t('settings.map.environment-autocapture.title', { defaultValue: 'Autocapture' }),
            settings: [
                {
                    id: 'autocapture',
                    title: i18n.t('settings.map.autocapture.title', { defaultValue: 'Autocapture' }),
                    description: i18n.t('settings.map.autocapture.description', {
                        defaultValue:
                            'Automatically capture frontend events such as clicks, input changes, and form submissions when using the web JavaScript SDK. Also available for React Native and iOS via code configuration.',
                    }),
                    docsUrl: 'https://posthog.com/docs/product-analytics/autocapture',
                    platformSupport: FEATURE_SUPPORT.autocapture,
                    component: <AutocaptureSettings />,
                    keywords: ['click', 'input', 'form', 'dom', 'automatic', 'event'],
                },
                {
                    id: 'autocapture-data-attributes',
                    title: i18n.t('settings.map.autocapture-data-attributes.title', {
                        defaultValue: 'Data attributes',
                    }),
                    description: i18n.t('settings.map.autocapture-data-attributes.description', {
                        defaultValue:
                            'Specify data attributes used in your app (e.g. data-attr, data-custom-id). These attributes help the toolbar and action definitions match unique elements on your pages. Use * as a wildcard.',
                    }),
                    docsUrl: 'https://posthog.com/docs/product-analytics/autocapture#data-attributes',
                    component: <DataAttributes />,
                    keywords: ['selector', 'css', 'element', 'toolbar', 'action'],
                },
                {
                    id: 'web-vitals-autocapture',
                    title: i18n.t('settings.map.web-vitals-autocapture.title.2', {
                        defaultValue: 'Web vitals autocapture',
                    }),
                    description: i18n.t('settings.map.web-vitals-autocapture.description.2', {
                        defaultValue:
                            "Capture Google Chrome's web vitals metrics (LCP, CLS, FCP, INP). These events enhance web analytics and session replay with performance data.",
                    }),
                    docsUrl: 'https://posthog.com/docs/web-analytics/web-vitals',
                    platformSupport: FEATURE_SUPPORT.webVitals,
                    component: <WebVitalsAutocaptureSettings />,
                    keywords: ['lcp', 'cls', 'inp', 'fcp', 'performance', 'core web vitals'],
                },
                {
                    id: 'dead-clicks-autocapture',
                    title: i18n.t('settings.map.dead-clicks-autocapture.title', {
                        defaultValue: 'Dead clicks autocapture',
                    }),
                    description: i18n.t('settings.map.dead-clicks-autocapture.description', {
                        defaultValue:
                            "Track clicks that don't result in any action (no scroll, text selection, or DOM mutation). Dead clicks help you find elements users expect to be interactive but aren't.",
                    }),
                    docsUrl: 'https://posthog.com/docs/toolbar/heatmaps#dead-clicks',
                    platformSupport: FEATURE_SUPPORT.deadClicks,
                    component: <DeadClicksAutocaptureSettings />,
                    keywords: ['rage click', 'broken', 'unresponsive', 'frustration'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-discussions',
            title: i18n.t('settings.map.environment-discussions.title', { defaultValue: 'Discussions' }),
            settings: [
                {
                    id: 'discussion-mention-integrations',
                    title: i18n.t('settings.organization.verifiedDomains.columns.integrations', {
                        defaultValue: 'Integrations',
                    }),
                    description: i18n.t('settings.map.discussion-mention-integrations.description', {
                        defaultValue: 'Configure how discussion mentions are delivered via integrations.',
                    }),
                    component: <DiscussionMentionNotifications />,
                    allowForTeam: (t) => (t?.effective_membership_level ?? 0) >= OrganizationMembershipLevel.Admin,
                    keywords: ['mention', 'notification', 'comment', 'discussion'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-exports',
            title: i18n.t('settings.map.environment-exports.title', { defaultValue: 'Exports' }),
            to: urls.exports(),
            settings: [],
        },
        {
            level: 'environment',
            id: 'environment-integrations',
            title: i18n.t('settings.organization.verifiedDomains.columns.integrations', {
                defaultValue: 'Integrations',
            }),
            settings: [
                {
                    id: 'integration-slack',
                    title: i18n.t('settings.map.integration-slack.title', { defaultValue: 'Slack integration' }),
                    description: i18n.t('settings.map.integration-slack.description', {
                        defaultValue:
                            'Integrate with Slack to subscribe to insights or dashboards for regular reports to channels of your choice.',
                    }),
                    docsUrl: Slack.docsUrl,
                    component: <Slack.SettingsSection />,
                    keywords: ['slack', 'channel', 'notification', 'subscribe', 'report'],
                },
                {
                    id: 'integration-github',
                    title: i18n.t('settings.map.integration-github.title', { defaultValue: 'GitHub integration' }),
                    description: i18n.t('settings.map.integration-github.description', {
                        defaultValue: 'Connect GitHub to link issues and pull requests with PostHog insights.',
                    }),
                    docsUrl: GitHub.docsUrl,
                    component: <GitHub.SettingsSection connectSurface="settings" />,
                    keywords: ['github', 'git', 'repository', 'issue', 'pr'],
                },
                {
                    id: 'integration-linear',
                    title: i18n.t('settings.map.integration-linear.title', { defaultValue: 'Linear integration' }),
                    description: i18n.t('settings.map.integration-linear.description', {
                        defaultValue: 'Connect Linear to create and link issues directly from PostHog.',
                    }),
                    docsUrl: Linear.docsUrl,
                    component: <Linear.SettingsSection />,
                    keywords: ['linear', 'issue', 'project management', 'task'],
                },
                {
                    id: 'integration-other',
                    title: i18n.t('settings.map.integration-other.title', { defaultValue: 'Other integrations' }),
                    description: i18n.t('settings.map.integration-other.description', {
                        defaultValue:
                            'Integrations connected from other product areas, such as pipeline destinations, data warehouse sources, error tracking, and marketing analytics.',
                    }),
                    component: (
                        <IntegrationsList
                            omitKinds={['slack', 'github', 'linear']}
                            titleText=""
                            emptyState={
                                <div className="px-4 py-6 text-center text-sm text-secondary rounded border bg-surface-primary">
                                    <p className="mb-1">No other integrations connected</p>
                                    <p className="text-xs text-muted text-balance mb-0">
                                        These connect from the product area that uses them:{' '}
                                        <Link to={urls.destinations()}>pipeline destinations</Link>,{' '}
                                        <Link to={urls.sources()}>data warehouse sources</Link>,{' '}
                                        <Link
                                            to={urls.settings(
                                                'environment-error-tracking',
                                                'error-tracking-integrations'
                                            )}
                                        >
                                            error tracking
                                        </Link>{' '}
                                        and{' '}
                                        <Link
                                            to={urls.settings('environment-marketing-analytics', 'marketing-settings')}
                                        >
                                            marketing analytics
                                        </Link>
                                        .
                                    </p>
                                </div>
                            }
                        />
                    ),
                    keywords: ['integration', 'connect', 'third-party', 'app'],
                },
                {
                    id: 'integration-ip-allowlist',
                    title: i18n.t('settings.map.integration-ip-allowlist.title', {
                        defaultValue: 'Static IP addresses',
                    }),
                    description: i18n.t('settings.map.integration-ip-allowlist.description', {
                        defaultValue:
                            'PostHog Cloud uses static IP addresses for outbound traffic. Add these to your firewall allowlist if needed.',
                    }),
                    component: <IPAllowListInfo />,
                    keywords: ['whitelist', 'firewall', 'allowlist', 'cidr', 'ip'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-privacy',
            title: i18n.t('settings.map.environment-privacy.title', { defaultValue: 'Privacy' }),
            settings: [
                {
                    id: 'datacapture',
                    title: i18n.t('settings.map.datacapture.title', { defaultValue: 'IP data capture configuration' }),
                    description: i18n.t('settings.map.datacapture.description', {
                        defaultValue:
                            'When enabled, client IP addresses will not be stored with your events. Transformations like GeoIP enrichment and bot detection can still use the IP before it is discarded. Note: this does not apply when Cookieless server hash mode is enabled, which strips the IP before transformations run.',
                    }),
                    docsUrl: 'https://posthog.com/docs/privacy',
                    component: <IPCapture />,
                    keywords: ['ip', 'anonymize', 'gdpr', 'privacy', 'geolocation', 'discard'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-secret-api-keys',
            title: i18n.t('settings.map.environment-secret-api-keys.title', {
                defaultValue: 'Project secret API keys',
            }),
            flag: 'PROJECT_SECRET_API_KEYS',
            requiresReauthentication: true,
            settings: [
                {
                    id: 'environment-secret-api-keys',
                    title: i18n.t('settings.map.environment-secret-api-keys.title.2', {
                        defaultValue: 'Project secret API keys',
                    }),
                    description: i18n.t('settings.map.environment-secret-api-keys.description', {
                        defaultValue:
                            'These keys allow access to a select set of API endpoints, intended to be accessed exclusively by your systems. Only give keys the permissions they need, and delete unused keys promptly.',
                    }),
                    docsUrl: 'https://posthog.com/docs/api',
                    component: <ProjectSecretAPIKeys />,
                    keywords: ['token', 'api key', 'authentication', 'secret'],
                },
            ],
        },
        {
            level: 'environment',
            id: 'environment-danger-zone',
            title: i18n.t('settings.organization.idpConfig.scene.dangerZone', { defaultValue: 'Danger zone' }),
            settings: [
                {
                    id: 'project-move',
                    title: i18n.t('settings.map.project-move.title', { defaultValue: 'Move project' }),
                    description: i18n.t('settings.map.project-move.description', {
                        defaultValue: 'Move this project to a different organization.',
                    }),
                    component: <ProjectMove />,
                    keywords: ['transfer', 'move', 'organization'],
                },
                {
                    id: 'environment-delete',
                    title: i18n.t('settings.map.environment-delete.title', { defaultValue: 'Delete environment' }),
                    description: i18n.t('settings.map.environment-delete.description', {
                        defaultValue:
                            'Permanently delete this environment and all its data. This action cannot be undone.',
                    }),
                    component: <ProjectDangerZone />,
                    keywords: ['delete', 'remove', 'destroy'],
                },
            ],
        },
        // ORGANIZATION
        {
            level: 'organization',
            id: 'organization-details',
            title: i18n.t('settings.map.organization-details.title', { defaultValue: 'General' }),
            settings: [
                {
                    id: 'organization-admin-notice',
                    title: null,
                    component: (
                        <LemonBanner type="info" className="my-4">
                            You must be an organization admin or owner to change these settings.
                        </LemonBanner>
                    ),
                },
                {
                    id: 'organization-display-name',
                    title: i18n.t('settings.map.organization-display-name.title', { defaultValue: 'Name & logo' }),
                    description: i18n.t('settings.map.organization-display-name.description', {
                        defaultValue:
                            "Your organization's name and logo are shown across the PostHog interface. Click the avatar to upload a custom logo.",
                    }),
                    component: <OrganizationDisplayName />,
                    keywords: ['name', 'rename', 'label', 'organization', 'logo', 'image', 'brand', 'icon', 'avatar'],
                },
                {
                    id: 'organization-id',
                    title: i18n.t('settings.map.organization-id.title', { defaultValue: 'Organization ID' }),
                    description: i18n.t('settings.map.organization-id.description', {
                        defaultValue: "Your organization's unique identifier, used in the PostHog API.",
                    }),
                    component: <OrganizationVariables />,
                    keywords: ['organization', 'id', 'uuid', 'identifier', 'copy'],
                },
                {
                    id: 'organization-ai-consent',
                    title: i18n.t('settings.map.organization-ai-consent.title', {
                        defaultValue: 'AI service providers',
                    }),
                    description: (
                        <>
                            <Trans
                                i18nKey="settings.map.organization-ai-consent.description"
                                components={{
                                    Providers: <Tooltip title={getExternalAIProvidersTooltipTitle()} />,
                                    dfn: <dfn />,
                                }}
                                defaults="PostHog AI features, such as the PostHog AI chat, use <Providers><dfn>external AI services</dfn></Providers> for data analysis."
                            />
                            <br />
                            <Trans
                                i18nKey="settings.map.organization-ai-consent.dataTransfer"
                                components={{ Italic: <i /> }}
                                defaults="This <Italic>can</Italic> involve transfer of identifying user data, so we ask for your org-wide consent below."
                            />
                            <br />
                            <Trans
                                i18nKey="settings.map.organization-ai-consent.noThirdPartyTraining"
                                components={{ Strong: <strong /> }}
                                defaults="<Strong>Your data will not be used for training third-party models.</Strong>"
                            />
                            <br />
                            <br />
                            <AIHipaaDisclaimer />
                        </>
                    ),
                    component: <OrganizationAI />,
                    keywords: [
                        'ai',
                        'max',
                        'llm',
                        'artificial intelligence',
                        'consent',
                        'approve',
                        'enable',
                        'opt-in',
                        'data sharing',
                    ],
                    searchDescription: i18n.t('settings.map.organization-ai-consent.searchDescription', {
                        defaultValue: `PostHog AI features use external AI services for data analysis. This can involve transfer of identifying user data.`,
                    }),
                },
                {
                    id: 'organization-desktop-beta-terms',
                    title: i18n.t('settings.map.organization-desktop-beta-terms.title', {
                        defaultValue: 'PostHog Desktop beta terms',
                    }),
                    description: (
                        <>
                            {i18n.t('settings.map.organization-desktop-beta-terms.description', {
                                defaultValue:
                                    'Accept the additional data-processing terms for the PostHog Desktop beta.',
                            })}
                            <br />
                            <br />
                            {i18n.t('settings.map.organization-desktop-beta-terms.processing', {
                                defaultValue:
                                    'PostHog Desktop uses Baseten and Modal to process customer data, personal data, and PII. They are not currently listed as PostHog subprocessors for this feature.',
                            })}
                            <br />
                            <br />
                            {i18n.t('settings.map.organization-desktop-beta-terms.proceeding', {
                                defaultValue:
                                    'Your organization agrees to proceed notwithstanding that status. If this feature becomes generally available, PostHog will update the DPA and provide notice. This beta may change or be discontinued.',
                            })}
                            <br />
                            <br />
                            <Trans
                                i18nKey="settings.map.organization-desktop-beta-terms.subprocessorsLink"
                                components={{
                                    SubprocessorsLink: <Link to="https://posthog.com/subprocessors" target="_blank" />,
                                }}
                                defaults="<SubprocessorsLink>View PostHog subprocessors</SubprocessorsLink>"
                            />
                        </>
                    ),
                    component: <OrganizationDesktopBetaTerms />,
                    keywords: ['desktop', 'beta', 'terms', 'consent', 'opt-in', 'data processing'],
                    searchDescription: i18n.t('settings.map.organization-desktop-beta-terms.searchDescription', {
                        defaultValue: `Accept the additional data-processing terms for the PostHog Desktop beta.`,
                    }),
                },
                {
                    id: 'organization-ai-training-opt-out',
                    title: i18n.t('settings.map.organization-ai-training-opt-out.title', {
                        defaultValue: 'Internal AI training',
                    }),
                    component: <OrganizationAITrainingOptOut />,
                    hideOn: [Realm.SelfHostedClickHouse, Realm.SelfHostedPostgres],
                    keywords: ['ai', 'training', 'opt-out', 'opt-in', 'model', 'max'],
                    searchDescription: i18n.t('settings.map.organization-ai-training-opt-out.searchDescription', {
                        defaultValue: `Control whether PostHog can use your data to train AI models. Turning this off disables AI features for your organization.`,
                    }),
                },
                {
                    id: 'organization-ip-anonymization-default',
                    title: i18n.t('settings.map.organization-ip-anonymization-default.title', {
                        defaultValue: 'IP data capture default',
                    }),
                    description: i18n.t('settings.map.organization-ip-anonymization-default.description', {
                        defaultValue:
                            'When enabled, new projects will automatically have "Discard client IP data" turned on. This is recommended for GDPR compliance. Existing projects are not affected.',
                    }),
                    component: <OrgIPAnonymizationDefault />,
                    keywords: ['ip', 'anonymize', 'gdpr', 'privacy', 'geolocation'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-authentication',
            title: i18n.t('settings.map.organization-authentication.title', { defaultValue: 'Authentication' }),
            settings: [
                {
                    id: 'authentication-domains',
                    title: i18n.t('settings.map.authentication-domains.title', {
                        defaultValue: 'Authentication Domains',
                    }),
                    docsUrl: 'https://posthog.com/docs/settings/sso',
                    component: <VerifiedDomains />,
                    keywords: ['sso', 'saml', 'single sign-on', 'domain verification', 'enforce'],
                },
                {
                    id: 'enforce-verified-domains',
                    title: i18n.t('settings.map.enforce-verified-domains.title', {
                        defaultValue: 'Domain enforcement',
                    }),
                    component: <EnforceVerifiedDomains />,
                    keywords: ['sso', 'verified domain', 'restrict', 'membership', 'invites'],
                },
                {
                    id: 'saml-configuration',
                    title: i18n.t('settings.organization.idpConfig.features.samlTitle', {
                        defaultValue: 'SAML single sign-on',
                    }),
                    description: i18n.t('settings.map.saml-configuration.description', {
                        defaultValue:
                            'Authenticate members through your identity provider using Security Assertion Markup Language (SAML).',
                    }),
                    docsUrl: 'https://posthog.com/docs/data/sso#setting-up-saml',
                    component: <IdentityProviderFeatureSection configScope={ConfigScopeEnumApi.Saml} />,
                    flag: 'SSO_SETTINGS_REDESIGN',
                    keywords: ['sso', 'saml', 'single sign-on', 'identity provider'],
                },
                {
                    id: 'scim-configuration',
                    title: i18n.t('settings.organization.idpConfig.features.scimTitle', {
                        defaultValue: 'SCIM provisioning',
                    }),
                    description: i18n.t('settings.map.scim-configuration.description', {
                        defaultValue:
                            'Provision and deprovision organization members through your identity provider using System for Cross-domain Identity Management (SCIM).',
                    }),
                    docsUrl: 'https://posthog.com/docs/data/sso#setting-up-scim',
                    component: <IdentityProviderFeatureSection configScope={ConfigScopeEnumApi.Scim} />,
                    flag: 'SSO_SETTINGS_REDESIGN',
                    keywords: ['scim', 'provisioning', 'identity provider'],
                },
                {
                    id: 'xaa-configuration',
                    title: i18n.t('settings.organization.idpConfig.features.xaaTitle', {
                        defaultValue: 'XAA authentication',
                    }),
                    description: i18n.t('settings.organization.idpConfig.features.xaaDescription', {
                        defaultValue: 'Automate API and MCP access to PostHog with Cross App Access (XAA).',
                    }),
                    docsUrl: 'https://posthog.com/docs/settings/id-jag',
                    component: <IdentityProviderFeatureSection configScope={ConfigScopeEnumApi.Xaa} />,
                    flag: ['SSO_SETTINGS_REDESIGN', 'XAA_AUTHENTICATION'],
                    keywords: ['xaa', 'id-jag', 'identity provider', 'token exchange'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-billing',
            hideSelfHost: true,
            title: i18n.t('settings.map.organization-billing.title', { defaultValue: 'Billing' }),
            to: urls.organizationBilling(),
            settings: [],
            keywords: ['usage', 'subscription', 'invoice', 'plan', 'payment', 'spend', 'quota', 'credits', 'card'],
        },
        {
            level: 'organization',
            id: 'organization-cimd-verification-tokens',
            title: i18n.t('settings.map.organization-cimd-verification-tokens.title', {
                defaultValue: 'CIMD verification tokens',
            }),
            settings: [
                {
                    id: 'organization-cimd-verification-tokens-list',
                    title: i18n.t('settings.map.organization-cimd-verification-tokens-list.title', {
                        defaultValue: 'CIMD verification tokens',
                    }),
                    description: i18n.t('settings.map.organization-cimd-verification-tokens-list.description', {
                        defaultValue:
                            'Link CIMD partner applications to this organization for higher rate limits and identity.',
                    }),
                    component: <CIMDVerificationTokens />,
                    keywords: [
                        'cimd',
                        'oauth',
                        'partner',
                        'provisioning',
                        'verification',
                        'token',
                        'api',
                        'rate limit',
                    ],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-integrations',
            title: i18n.t('settings.organization.verifiedDomains.columns.integrations', {
                defaultValue: 'Integrations',
            }),
            settings: [
                {
                    id: 'organization-integrations-list',
                    title: i18n.t('settings.map.organization-integrations-list.title', {
                        defaultValue: 'Connected integrations',
                    }),
                    description: i18n.t('settings.map.organization-integrations-list.description', {
                        defaultValue: 'Manage integrations connected at the organization level.',
                    }),
                    component: <OrganizationIntegrations />,
                    keywords: ['integration', 'connect', 'third-party', 'oauth'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-legal-documents',
            hideSelfHost: true,
            title: i18n.t('settings.map.organization-legal-documents.title', { defaultValue: 'Legal documents' }),
            to: urls.legalDocuments(),
            settings: [],
            minimumAccessLevel: OrganizationMembershipLevel.Admin,
        },
        {
            level: 'organization',
            id: 'organization-proxy',
            title: i18n.t('settings.map.organization-proxy.title', { defaultValue: 'Managed reverse proxy' }),
            settings: [
                {
                    id: 'organization-proxy',
                    title: i18n.t('settings.map.organization-proxy.title.2', {
                        defaultValue: 'Managed reverse proxies',
                    }),
                    docsUrl: 'https://posthog.com/docs/advanced/proxy',
                    component: <ManagedReverseProxy />,
                    keywords: ['custom domain', 'dns', 'cname', 'ad blocker', 'first party'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-members',
            title: i18n.t('settings.organization.roles.members', { defaultValue: 'Members' }),
            settings: [
                {
                    id: 'invites',
                    title: i18n.t('settings.map.invites.title', { defaultValue: 'Pending invites' }),
                    description: i18n.t('settings.map.invites.description', {
                        defaultValue: 'Manage pending invitations to join your organization.',
                    }),
                    component: <Invites />,
                    keywords: ['invite', 'email', 'pending', 'join'],
                },
                {
                    id: 'members',
                    title: i18n.t('settings.map.members.title', { defaultValue: 'Organization members' }),
                    description: i18n.t('settings.map.members.description', {
                        defaultValue: 'View and manage current members of your organization and their roles.',
                    }),
                    component: <Members />,
                    keywords: ['member', 'user', 'role', 'admin', 'owner'],
                },
                {
                    id: 'member-notifications',
                    title: i18n.t('settings.map.member-notifications.title', { defaultValue: 'Member notifications' }),
                    description: i18n.t('settings.map.member-notifications.description', {
                        defaultValue:
                            'Choose which email notifications your members receive. Anything you set here they cannot change back themselves.',
                    }),
                    component: <NotificationGovernanceSetting />,
                    flag: 'ORG_NOTIFICATION_GOVERNANCE',
                    allowForTeam: (t) => (t?.effective_membership_level ?? 0) >= OrganizationMembershipLevel.Admin,
                    keywords: ['notification', 'email', 'member', 'lock', 'digest', 'pipeline'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-oauth-apps',
            title: i18n.t('settings.map.organization-oauth-apps.title', { defaultValue: 'OAuth applications' }),
            settings: [
                {
                    id: 'organization-oauth-apps-list',
                    title: i18n.t('settings.map.organization-oauth-apps-list.title', {
                        defaultValue: 'OAuth applications',
                    }),
                    description: i18n.t('settings.map.organization-oauth-apps-list.description', {
                        defaultValue: 'View applications that have been authorized to connect to your organization.',
                    }),
                    component: <OAuthApps />,
                    keywords: ['oauth', 'app', 'client', 'integration', 'api', 'authentication', 'third-party'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-roles',
            title: i18n.t('settings.map.organization-roles.title', { defaultValue: 'Roles' }),
            settings: [
                {
                    id: 'organization-roles',
                    title: i18n.t('settings.map.organization-roles.title.2', { defaultValue: 'Roles' }),
                    description: i18n.t('settings.map.organization-roles.description', {
                        defaultValue:
                            'Use roles to group your organization members and assign them permissions. Roles are used for access control across your organization.',
                    }),
                    docsUrl: 'https://posthog.com/docs/settings/access-control',
                    component: <RolesAccessControls />,
                    keywords: ['role', 'permission', 'rbac', 'access control'],
                },
                {
                    id: 'organization-default-role',
                    title: i18n.t('settings.map.organization-default-role.title', {
                        defaultValue: 'Default role for new members',
                    }),
                    description: i18n.t('settings.map.organization-default-role.description', {
                        defaultValue:
                            'Automatically assign a role to new members when they join the organization. New users will inherit all permissions from this role.',
                    }),
                    component: <DefaultRoleSelector />,
                    keywords: ['default', 'role', 'new member', 'onboarding'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-access-resolution',
            title: i18n.t('settings.map.organization-access-resolution.title', {
                defaultValue: 'Access resolution preview',
            }),
            flag: 'ACCESS_CONTROL_RESOLUTION_PREVIEW',
            // Temporary migration surface: reachable only from the access control
            // settings banner, never from the settings navigation or search
            hideFromNavigation: true,
            settings: [
                {
                    id: 'organization-access-resolution-preview',
                    title: i18n.t('settings.map.organization-access-resolution-preview.title', {
                        defaultValue: 'Access resolution preview',
                    }),
                    description: i18n.t('settings.map.organization-access-resolution-preview.description', {
                        defaultValue:
                            'PostHog is changing how access levels combine: the most specific rule will decide, instead of the highest one. Review what will be different for your organization before the change takes effect.',
                    }),
                    component: <AccessResolutionPreview />,
                    keywords: ['access control', 'resolution', 'rbac', 'permission', 'override'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-security',
            title: i18n.t('settings.map.organization-security.title', { defaultValue: 'Security' }),
            minimumAccessLevel: OrganizationMembershipLevel.Admin,
            settings: [
                {
                    id: 'organization-security',
                    title: i18n.t('settings.map.organization-security.title.2', { defaultValue: 'Security' }),
                    description: i18n.t('settings.map.organization-security.description', {
                        defaultValue: 'Configure organization-wide security policies.',
                    }),
                    component: <OrganizationSecuritySettings />,
                    keywords: ['compliance', 'sharing', 'public'],
                },
                {
                    id: 'organization-mcp-access',
                    title: i18n.t('settings.map.organization-mcp-access.title', { defaultValue: 'MCP access' }),
                    description: i18n.t('settings.map.organization-mcp-access.description', {
                        defaultValue: 'Control what the PostHog MCP can do in this organization.',
                    }),
                    component: <OrganizationMCPAccess />,
                    keywords: ['mcp', 'ai', 'agent', 'read-only', 'model context protocol'],
                },
                {
                    id: 'organization-personal-api-keys',
                    title: i18n.t('settings.map.organization-personal-api-keys.title', {
                        defaultValue: 'Personal API key access',
                    }),
                    description: i18n.t('settings.map.organization-personal-api-keys.description', {
                        defaultValue:
                            "See which members' personal API keys can reach this organization or its projects, who owns them, and the scopes they grant.",
                    }),
                    component: <OrganizationPersonalAPIKeys />,
                    keywords: ['api key', 'personal', 'token', 'access', 'audit'],
                },
            ],
        },
        {
            level: 'organization',
            id: 'organization-startup-program',
            hideSelfHost: true,
            title: i18n.t('settings.map.organization-startup-program.title', { defaultValue: 'Startup program' }),
            to: urls.startups(),
            settings: [],
            minimumAccessLevel: OrganizationMembershipLevel.Admin,
            flag: 'STARTUP_PROGRAM_INTENT',
        },
        {
            level: 'organization',
            id: 'organization-danger-zone',
            title: i18n.t('settings.organization.idpConfig.scene.dangerZone', { defaultValue: 'Danger zone' }),
            settings: [
                {
                    id: 'organization-delete',
                    title: i18n.t('settings.user.dangerZone.deleteOrganization', {
                        defaultValue: 'Delete organization',
                    }),
                    description: i18n.t('settings.map.organization-delete.description', {
                        defaultValue:
                            'Permanently delete your organization and all its projects and data. This action cannot be undone.',
                    }),
                    component: <OrganizationDangerZone />,
                    keywords: ['delete', 'remove', 'destroy'],
                },
            ],
        },
        // USER
        {
            level: 'user',
            id: 'user-profile',
            title: i18n.t('settings.map.user-profile.title', { defaultValue: 'Profile' }),
            settings: [
                {
                    id: 'profile-picture',
                    title: i18n.t('settings.map.profile-picture.title', { defaultValue: 'Profile picture' }),
                    component: <ProfilePictureSettings />,
                    keywords: ['avatar', 'gravatar', 'photo', 'picture', 'image', 'profile'],
                },
                {
                    id: 'details',
                    title: i18n.t('settings.map.details.title', { defaultValue: 'Details' }),
                    component: <UserDetails />,
                    keywords: ['name', 'email', 'profile', 'personal'],
                },
                {
                    id: 'change-password',
                    title: <ChangePasswordTitle />,
                    component: <ChangePassword />,
                    keywords: ['password', 'security', 'credential'],
                },
                {
                    id: '2fa',
                    title: i18n.t('settings.organization.members.twoFactorHeading', {
                        defaultValue: 'Two-factor authentication',
                    }),
                    description: i18n.t('settings.map.2fa.description', {
                        defaultValue:
                            'Add an extra layer of security to your account using an authenticator app or passkeys.',
                    }),
                    component: <TwoFactorSettings />,
                    keywords: ['two-factor', 'mfa', 'authenticator', 'security', 'totp'],
                },
                {
                    id: 'passkeys',
                    title: i18n.t('settings.user.passkeys.title', { defaultValue: 'Passkeys' }),
                    description: i18n.t('settings.map.passkeys.description', {
                        defaultValue: 'Manage your passkeys for passwordless sign-in and two-factor authentication.',
                    }),
                    component: <PasskeySettings />,
                    keywords: ['webauthn', 'fido', 'biometric', 'passwordless'],
                },
                {
                    id: 'login-sessions',
                    title: i18n.t('settings.map.login-sessions.title', { defaultValue: 'Web sessions' }),
                    description: i18n.t('settings.map.login-sessions.description', {
                        defaultValue: 'Devices and browsers currently signed in to your PostHog account.',
                    }),
                    component: <LoginSessions />,
                    keywords: ['sessions', 'devices', 'logins', 'sign out', 'log out', 'security', 'revoke'],
                },
            ],
        },
        {
            level: 'user',
            id: 'user-connected-apps',
            title: i18n.t('settings.map.user-connected-apps.title', { defaultValue: 'Connected applications' }),
            settings: [
                {
                    id: 'connected-apps',
                    title: i18n.t('settings.map.connected-apps.title', { defaultValue: 'Connected applications' }),
                    description: i18n.t('settings.map.connected-apps.description', {
                        defaultValue:
                            'Applications that have been granted access to your PostHog account via OAuth. You can revoke access at any time.',
                    }),
                    component: <ConnectedApps />,
                    keywords: ['oauth', 'app', 'connected', 'authorized', 'revoke', 'access', 'token'],
                },
            ],
        },
        {
            level: 'user',
            id: 'user-customization',
            title: i18n.t('settings.map.user-customization.title', { defaultValue: 'Customization' }),
            settings: [
                {
                    id: 'theme',
                    title: i18n.t('settings.map.theme.title', { defaultValue: 'Theme' }),
                    component: <ThemeSwitcher onlyLabel />,
                    keywords: ['dark mode', 'light mode', 'appearance', 'color scheme'],
                },
                {
                    id: 'optout',
                    title: i18n.t('settings.map.optout.title', { defaultValue: 'Anonymize data collection' }),
                    description: i18n.t('settings.map.optout.description', {
                        defaultValue:
                            'PostHog uses PostHog to capture information about how people use the product. Anonymize your usage data if you prefer not to share it.',
                    }),
                    component: <OptOutCapture />,
                    hideOn: [Realm.Cloud],
                    keywords: ['telemetry', 'opt out', 'privacy', 'tracking'],
                },
                {
                    id: 'allow-impersonation',
                    title: i18n.t('settings.map.allow-impersonation.title', { defaultValue: 'Support access' }),
                    component: <AllowImpersonation />,
                    flag: 'CONTROL_SUPPORT_LOGIN',
                    keywords: ['impersonation', 'support login', 'debug'],
                },
                {
                    id: 'sidebar-auto-suggest',
                    title: i18n.t('settings.user.sidebar.autoSuggest', {
                        defaultValue: 'Automatically suggest new tools',
                    }),
                    description: i18n.t('settings.map.sidebar-auto-suggest.description', {
                        defaultValue:
                            "When we detect you are using a new tool, we'll automatically add it to your sidebar as a suggestion. We might also suggest tools that are related to the ones you are using when we launch a new one.",
                    }),
                    component: <SidebarAutoSuggestSetting />,
                    keywords: ['sidebar', 'suggest', 'products', 'apps', 'tools', 'auto'],
                },
                {
                    id: 'mcp-hints',
                    title: i18n.t('settings.map.mcp-hints.title', { defaultValue: 'MCP hints' }),
                    description: i18n.t('settings.map.mcp-hints.description', {
                        defaultValue:
                            'After you take an action in PostHog (creating a feature flag, building a dashboard, etc.), show a small hint that the same action can be done from your IDE via the PostHog MCP. Rate-limited to once a week.',
                    }),
                    component: <MCPHintsSetting />,
                    keywords: ['mcp', 'claude', 'cursor', 'codex', 'ide', 'hints', 'wizard'],
                },
                {
                    id: 'web-analytics-achievements',
                    title: i18n.t('settings.map.web-analytics-achievements.title', {
                        defaultValue: 'Web analytics achievements',
                    }),
                    description: i18n.t('settings.map.web-analytics-achievements.description', {
                        defaultValue:
                            'Show playful achievement badges and streaks on the Web analytics dashboard. Applies to your current project.',
                    }),
                    component: <WebAnalyticsAchievementsSetting />,
                    flag: 'WEB_ANALYTICS_ACHIEVEMENTS',
                    keywords: ['web analytics', 'achievements', 'gamification', 'badges', 'streak'],
                },
                {
                    id: 'hedgehog-mode',
                    title: i18n.t('settings.map.hedgehog-mode.title', { defaultValue: 'Hedgehog mode' }),
                    description: i18n.t('settings.map.hedgehog-mode.description', {
                        defaultValue: 'Enable the PostHog hedgehog companion that follows you around the app.',
                    }),
                    component: <HedgehogModeSettings />,
                    keywords: ['hedgehog', 'mascot', 'fun', 'companion', 'hog'],
                },
                {
                    id: 'customization-irl',
                    title: i18n.t('settings.map.customization-irl.title', { defaultValue: 'Customization IRL' }),
                    component: (
                        <div>
                            Grab some{' '}
                            <Link to="https://posthog.com/merch" target="_blank">
                                PostHog merch
                            </Link>{' '}
                            to customize yourself outside of the app
                        </div>
                    ),
                },
            ],
        },
        {
            level: 'user',
            id: 'user-navigation',
            title: i18n.t('settings.map.user-navigation.title', { defaultValue: 'Navigation' }),
            flag: 'UI_CUSTOMIZATION',
            settings: [
                {
                    id: 'homepage',
                    title: i18n.t('settings.map.homepage.title', { defaultValue: 'Homepage' }),
                    description: i18n.t('settings.map.homepage.description', {
                        defaultValue:
                            'The page that opens when you open PostHog or select Home in the sidebar. This applies to the current project.',
                    }),
                    component: <HomepageSetting />,
                    keywords: ['homepage', 'home', 'default page', 'landing page', 'launchpad', 'start'],
                },
                {
                    id: 'sidebar-layout',
                    title: i18n.t('settings.map.sidebar-layout.title', { defaultValue: 'Layout' }),
                    description: i18n.t('settings.map.sidebar-layout.description', {
                        defaultValue: 'Control how dense the sidebar rows are.',
                    }),
                    component: <SidebarLayoutSetting />,
                    keywords: ['sidebar', 'layout', 'density', 'compact', 'comfortable'],
                },
                {
                    id: 'sidebar-items',
                    title: i18n.t('settings.map.sidebar-items.title', { defaultValue: 'Navigation items' }),
                    description: i18n.t('settings.map.sidebar-items.description', {
                        defaultValue:
                            'Choose which items appear in your sidebar. These preferences only apply to you. Activity and Settings always stay visible.',
                    }),
                    component: <SidebarItemsSetting />,
                    keywords: ['sidebar', 'navigation', 'navbar', 'menu', 'hide', 'show', 'customize', 'starred'],
                },
                {
                    id: 'sidebar-my-tools',
                    title: i18n.t('settings.map.sidebar-my-tools.title', { defaultValue: 'My Tools' }),
                    description: i18n.t('settings.map.sidebar-my-tools.description', {
                        defaultValue:
                            'Choose which tools appear in the My Tools section of your sidebar. This selection applies to the current project.',
                    }),
                    component: <SidebarMyToolsSetting />,
                    keywords: ['sidebar', 'tools', 'products', 'apps', 'my tools', 'customize'],
                },
            ],
        },
        {
            level: 'user',
            id: 'user-feature-previews',
            title: i18n.t('settings.map.user-feature-previews.title', { defaultValue: 'Feature previews' }),
            settings: [
                {
                    id: 'feature-previews',
                    title: i18n.t('settings.map.feature-previews.title', { defaultValue: 'Feature previews' }),
                    description: i18n.t('settings.map.feature-previews.description', {
                        defaultValue:
                            'Try out upcoming PostHog features before they are generally available. Toggling a preview enables it for your account only.',
                    }),
                    component: <FeaturePreviews />,
                    keywords: ['beta', 'early access', 'preview', 'opt-in'],
                },
                {
                    id: 'feature-previews-coming-soon',
                    title: i18n.t('settings.map.feature-previews-coming-soon.title', { defaultValue: 'Coming soon' }),
                    description: i18n.t('settings.map.feature-previews-coming-soon.description', {
                        defaultValue: 'Get notified when upcoming features are ready for preview.',
                    }),
                    component: <FeaturePreviewsComingSoon />,
                    keywords: ['upcoming', 'notify', 'concept', 'future'],
                },
            ],
        },
        {
            level: 'user',
            id: 'user-notifications',
            title: i18n.t('settings.map.user-notifications.title', { defaultValue: 'Notifications' }),
            settings: [
                {
                    id: 'notifications',
                    title: i18n.t('settings.map.notifications.title', { defaultValue: 'Notifications' }),
                    description: i18n.t('settings.map.notifications.description', {
                        defaultValue: 'Choose which email notifications you receive from PostHog.',
                    }),
                    component: <UpdateEmailPreferences />,
                    keywords: ['email', 'notification', 'digest', 'unsubscribe'],
                },
                {
                    id: 'realtime-notifications',
                    title: i18n.t('settings.map.realtime-notifications.title', {
                        defaultValue: 'In-app notifications',
                    }),
                    description: i18n.t('settings.map.realtime-notifications.description', {
                        defaultValue:
                            'Choose which real-time notifications you receive in the PostHog app, per project.',
                    }),
                    component: <RealtimeNotificationPreferences />,
                    flag: 'REAL_TIME_NOTIFICATIONS',
                    keywords: ['notification', 'in-app', 'realtime', 'popover', 'mention'],
                },
            ],
        },
        {
            level: 'user',
            id: 'user-api-keys',
            title: i18n.t('settings.map.user-api-keys.title', { defaultValue: 'Personal API keys' }),
            settings: [
                {
                    id: 'personal-api-keys',
                    title: i18n.t('settings.map.personal-api-keys.title', { defaultValue: 'Personal API keys' }),
                    description: i18n.t('settings.map.personal-api-keys.description', {
                        defaultValue:
                            'These keys allow full access to your personal account through the API. Only give keys the permissions they need, and delete unused keys promptly.',
                    }),
                    docsUrl: 'https://posthog.com/docs/api',
                    component: <PersonalAPIKeys />,
                    keywords: ['token', 'api key', 'authentication', 'secret'],
                },
            ],
        },
        {
            level: 'user',
            id: 'user-personal-integrations',
            title: i18n.t('settings.map.user-personal-integrations.title', { defaultValue: 'Personal integrations' }),
            settings: [
                {
                    id: 'personal-integrations-github',
                    title: i18n.t('settings.user.integrations.github', { defaultValue: 'GitHub' }),
                    description: i18n.t('settings.map.personal-integrations-github.description', {
                        defaultValue:
                            'Your personal GitHub integrations for repo access, code attribution, and pull request authorship. You can connect multiple GitHub accounts or organizations.',
                    }),
                    component: <PersonalGitHubIntegrations />,
                    keywords: ['github', 'integration', 'repos', 'identity', 'link', 'code', 'personal'],
                },
                {
                    id: 'personal-integrations-slack',
                    title: i18n.t('settings.map.personal-integrations-slack.title', { defaultValue: 'Slack' }),
                    description: i18n.t('settings.map.personal-integrations-slack.description', {
                        defaultValue:
                            'Bind your Slack identity to this PostHog account so @PostHog mentions route to you even when your Slack email and PostHog email differ.',
                    }),
                    component: <PersonalSlackIntegrations />,
                    keywords: ['slack', 'integration', 'identity', 'link', 'mention', 'personal'],
                },
                {
                    id: 'personal-integrations-posthog',
                    title: i18n.t('settings.map.personal-integrations-posthog.title', {
                        defaultValue: 'PostHog project',
                    }),
                    description: i18n.t('settings.map.personal-integrations-posthog.description', {
                        defaultValue:
                            'Connect another PostHog project (in another region or your own) to act in it through its API, for example to dispatch tasks that must run there.',
                    }),
                    component: <PersonalPosthogConnections />,
                    keywords: ['posthog', 'integration', 'connect', 'region', 'cross-region', 'task', 'personal'],
                    flag: 'POSTHOG_CONNECT',
                },
            ],
        },
        {
            level: 'user',
            id: 'user-reminders',
            title: i18n.t('settings.map.user-reminders.title', { defaultValue: 'Reminders' }),
            settings: [
                {
                    id: 'reminders',
                    title: i18n.t('settings.map.reminders.title', { defaultValue: 'Reminders' }),
                    description: i18n.t('settings.map.reminders.description', {
                        defaultValue: 'Schedule one-off or recurring nudges that notify you in-app when they are due.',
                    }),
                    component: <Reminders />,
                    keywords: ['reminder', 'notification', 'schedule', 'recurring', 'cron'],
                },
            ],
        },
        {
            level: 'user',
            id: 'user-danger-zone',
            title: i18n.t('settings.organization.idpConfig.scene.dangerZone', { defaultValue: 'Danger zone' }),
            settings: [
                {
                    id: 'user-delete',
                    title: i18n.t('settings.user.dangerZone.deleteAccount', { defaultValue: 'Delete account' }),
                    description: i18n.t('settings.map.user-delete.description', {
                        defaultValue: 'Permanently delete your PostHog account. This action cannot be undone.',
                    }),
                    component: <UserDangerZone />,
                    keywords: ['delete', 'remove', 'account'],
                },
            ],
        },
    ]
}

let cachedSettingsMap: { locale: string; sections: SettingSection[] } | null = null

/**
 * The settings map, in the language the app is currently rendering.
 *
 * The titles and descriptions are what the settings navigation and search index show, so they are
 * resolved when the map is built rather than when the module loads, and rebuilt when the language
 * changes.
 */
export function getSettingsMap(): SettingSection[] {
    const locale = getActiveLocale()
    if (cachedSettingsMap?.locale !== locale) {
        cachedSettingsMap = { locale, sections: buildSettingsMap() }
    }
    return cachedSettingsMap.sections
}
