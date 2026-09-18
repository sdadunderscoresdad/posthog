import { i18n } from 'lib/i18n/i18n'

import type { ErrorTrackingIssue } from '~/queries/schema/schema-general'

import {
    AssigneeIconDisplay,
    AssigneeLabelDisplay,
    AssigneeResolver,
} from 'products/error_tracking/frontend/components/Assignee/AssigneeDisplay'
import { LabelIndicator, StatusIndicator } from 'products/error_tracking/frontend/components/Indicators'
import type { ErrorTrackingStatusSelectValue } from 'products/error_tracking/frontend/components/IssueFilters/Status'

import { WidgetTileFilterReadOnlyValue } from '../widgetTileFiltersReadOnly'

export function ErrorTrackingStatusReadOnlyValue({ status }: { status: ErrorTrackingStatusSelectValue }): JSX.Element {
    if (status === 'all') {
        return (
            <WidgetTileFilterReadOnlyValue>
                <LabelIndicator
                    intent="muted"
                    label={i18n.t('dashboardWidgets.errorTracking.filters.allLabel', { defaultValue: 'All' })}
                    size="small"
                />
            </WidgetTileFilterReadOnlyValue>
        )
    }
    return (
        <WidgetTileFilterReadOnlyValue>
            <StatusIndicator status={status} size="small" />
        </WidgetTileFilterReadOnlyValue>
    )
}

export function ErrorTrackingAssigneeReadOnlyValue({
    assignee,
}: {
    assignee: ErrorTrackingIssue['assignee']
}): JSX.Element {
    return (
        <WidgetTileFilterReadOnlyValue>
            <AssigneeResolver assignee={assignee}>
                {({ assignee: resolvedAssignee }) => (
                    <>
                        <AssigneeIconDisplay assignee={resolvedAssignee} size="small" />
                        <AssigneeLabelDisplay
                            assignee={resolvedAssignee}
                            placeholder={i18n.t('dashboardWidgets.errorTracking.filters.anyAssignee', {
                                defaultValue: 'Any assignee',
                            })}
                            size="small"
                            className="text-primary"
                        />
                    </>
                )}
            </AssigneeResolver>
        </WidgetTileFilterReadOnlyValue>
    )
}
