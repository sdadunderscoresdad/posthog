import { deepEqual as equal } from 'fast-equals'
import { Trans } from 'react-i18next'

import { i18n } from 'lib/i18n/i18n'
import { LemonTag } from 'lib/lemon-ui/LemonTag'

import {
    isExperimentFunnelMetric,
    isExperimentMeanMetric,
    isExperimentRatioMetric,
} from '~/queries/schema/schema-general'
import { ExperimentMetric } from '~/queries/schema/schema-general'
import { getDefaultMetricTitle } from '~/scenes/experiments/MetricsView/shared/utils'

import { ActivityClause, clause } from './clauses'

const getOutlierHandlingChanges = (metricBefore: ExperimentMetric, metricAfter: ExperimentMetric): string | null => {
    // bail if it's a metric type change
    if (!isExperimentMeanMetric(metricBefore) || !isExperimentMeanMetric(metricAfter)) {
        return null
    }

    // check if the outlier handling was removed completely
    if (
        metricBefore.upper_bound_percentile &&
        !metricAfter.upper_bound_percentile &&
        metricBefore.lower_bound_percentile &&
        !metricAfter.lower_bound_percentile
    ) {
        return i18n.t('experimentActivity.metric.removedOutlierHandlingBounds', {
            defaultValue: 'removed the outlier handling lower and upper bounds',
        })
    }

    // check if the lower bound was removed
    if (metricBefore.lower_bound_percentile && !metricAfter.lower_bound_percentile) {
        return i18n.t('experimentActivity.metric.removedOutlierHandlingLowerBound', {
            defaultValue: 'removed the outlier handling lower bound percentile',
        })
    }

    // check if the upper bound was removed
    if (metricBefore.upper_bound_percentile && !metricAfter.upper_bound_percentile) {
        return i18n.t('experimentActivity.metric.removedOutlierHandlingUpperBound', {
            defaultValue: 'removed the outlier handling upper bound percentile',
        })
    }

    // check if the outlier handling was added completely
    if (
        !metricBefore.upper_bound_percentile &&
        !metricBefore.lower_bound_percentile &&
        metricAfter.upper_bound_percentile &&
        metricAfter.lower_bound_percentile
    ) {
        return i18n.t('experimentActivity.metric.setOutlierHandlingBothBounds', {
            defaultValue:
                'set the outlier handling lower bound percentile to {{ lower }} and upper bound percentile to {{ upper }}',
            lower: metricAfter.lower_bound_percentile,
            upper: metricAfter.upper_bound_percentile,
        })
    }

    // check if ONLY the lower bound was changed
    if (
        !metricBefore.upper_bound_percentile &&
        metricBefore.lower_bound_percentile &&
        !metricAfter.upper_bound_percentile &&
        metricAfter.lower_bound_percentile
    ) {
        return i18n.t('experimentActivity.metric.setOutlierHandlingLowerBound', {
            defaultValue: 'set the outlier handling lower bound percentile to {{ lower }}',
            lower: metricAfter.lower_bound_percentile,
        })
    }

    // check if ONLY the upper bound was changed
    if (
        metricBefore.upper_bound_percentile &&
        !metricBefore.lower_bound_percentile &&
        metricAfter.upper_bound_percentile &&
        !metricAfter.lower_bound_percentile
    ) {
        return i18n.t('experimentActivity.metric.setOutlierHandlingUpperBound', {
            defaultValue: 'set the outlier handling upper bound percentile to {{ upper }}',
            upper: metricAfter.upper_bound_percentile,
        })
    }

    return null
}

const removeFingerprint = ({ fingerprint, ...metric }: ExperimentMetric): ExperimentMetric => metric

const getRatioChanges = (metricBefore: ExperimentMetric, metricAfter: ExperimentMetric): string | null => {
    // bail if it's a metric type change
    if (!isExperimentRatioMetric(metricBefore) || !isExperimentRatioMetric(metricAfter)) {
        return null
    }

    // check if both numerator and denominator were changed
    if (
        !equal(metricBefore.numerator, metricAfter.numerator) &&
        !equal(metricBefore.denominator, metricAfter.denominator)
    ) {
        return i18n.t('experimentActivity.metric.changedNumeratorAndDenominator', {
            defaultValue: 'changed the numerator and denominator',
        })
    }

    // check if the numerator was changed
    if (!equal(metricBefore.numerator, metricAfter.numerator)) {
        return i18n.t('experimentActivity.metric.changedNumerator', { defaultValue: 'changed the numerator' })
    }

    // check if the denominator was changed
    if (!equal(metricBefore.denominator, metricAfter.denominator)) {
        return i18n.t('experimentActivity.metric.changedDenominator', { defaultValue: 'changed the denominator' })
    }

    // check if outlier handling was changed for either component
    if (!equal(metricBefore.numerator_outlier_handling, metricAfter.numerator_outlier_handling)) {
        return i18n.t('experimentActivity.metric.changedNumeratorOutlierHandling', {
            defaultValue: 'changed the numerator outlier handling',
        })
    }
    if (!equal(metricBefore.denominator_outlier_handling, metricAfter.denominator_outlier_handling)) {
        return i18n.t('experimentActivity.metric.changedDenominatorOutlierHandling', {
            defaultValue: 'changed the denominator outlier handling',
        })
    }

    return null
}

export const getMetricChanges = (before: ExperimentMetric[], after: ExperimentMetric[]): ActivityClause[] | null => {
    if (after.length > before.length) {
        return [clause(i18n.t('experimentActivity.metric.added', { defaultValue: 'added a metric' }), 'to')]
    }
    if (after.length < before.length) {
        return [clause(i18n.t('experimentActivity.metric.removed', { defaultValue: 'removed a metric' }), 'from')]
    }

    /**
     * we need to find the metric that was changed and the value that was changed.
     * we can use the `fingerprint` to identify the metric that was changed.
     * There could only be one metric that was changed.
     */
    const metricAfter = after.find(
        (afterMetric) => !before.some((beforeMetric) => beforeMetric.fingerprint === afterMetric.fingerprint)
    )
    const metricBefore = before.find(
        (beforeMetric) => !after.some((afterMetric) => afterMetric.fingerprint === beforeMetric.fingerprint)
    )

    if (!metricAfter || !metricBefore) {
        return null
    }

    /**
     * there are special cases where the fingerprint is THE only difference between the metrics.
     * we need to handle these cases.
     */
    if (equal(removeFingerprint(metricAfter), removeFingerprint(metricBefore))) {
        return null
    }

    /**
     * the metric the change belongs to, named whichever way the metric names itself
     */
    const metricName = metricBefore.name || getDefaultMetricTitle(metricBefore)

    const changes: ActivityClause[] = []
    // check if the metric type was changed:
    if (metricAfter.metric_type !== metricBefore.metric_type) {
        changes.push(
            clause(
                <Trans
                    i18nKey="experimentActivity.metric.changedType"
                    values={{ before: metricBefore.metric_type, after: metricAfter.metric_type }}
                    components={{ Before: <LemonTag>{null}</LemonTag>, After: <LemonTag>{null}</LemonTag> }}
                    defaults="changed the type from <Before>{{ before }}</Before> to <After>{{ after }}</After>"
                />,
                'for'
            )
        )
    }

    // check if the goal was changed
    if (metricAfter.goal !== metricBefore.goal) {
        changes.push(
            clause(
                <Trans
                    i18nKey="experimentActivity.metric.setGoal"
                    values={{ goal: metricAfter.goal }}
                    components={{ Goal: <span className="italic" /> }}
                    defaults="set the goal <Goal>{{ goal }}</Goal>"
                />,
                'for'
            )
        )
    }

    // check if conversion window was removed (reset to default)
    if (metricBefore.conversion_window && !metricAfter.conversion_window) {
        changes.push(
            clause(
                i18n.t('experimentActivity.metric.conversionWindowDefault', {
                    defaultValue: 'set the conversion window to the experiment duration',
                }),
                'for'
            )
        )
    }
    if (
        metricAfter.conversion_window &&
        (metricBefore.conversion_window !== metricAfter.conversion_window ||
            metricBefore.conversion_window_unit !== metricAfter.conversion_window_unit)
    ) {
        changes.push(
            clause(
                i18n.t('experimentActivity.metric.conversionWindowSet', {
                    defaultValue: 'set the conversion window to {{ window }} {{ unit }}',
                    window: metricAfter.conversion_window,
                    unit: metricAfter.conversion_window_unit,
                }),
                'for'
            )
        )
    }

    // check if the step order was changed for funnel metrics
    if (
        isExperimentFunnelMetric(metricBefore) &&
        isExperimentFunnelMetric(metricAfter) &&
        metricBefore.funnel_order_type !== metricAfter.funnel_order_type
    ) {
        changes.push(
            clause(
                i18n.t('experimentActivity.metric.stepOrderSet', {
                    defaultValue: 'set the step order to {{ order }}',
                    order: metricAfter.funnel_order_type,
                }),
                'for'
            )
        )
    }

    // check if the outlier handling was changed for mean metrics
    const outlierHandlingChanges = getOutlierHandlingChanges(metricBefore, metricAfter)
    if (outlierHandlingChanges) {
        changes.push(clause(outlierHandlingChanges, 'for'))
    }

    // check if the series was changed for funnel metrics
    if (
        isExperimentFunnelMetric(metricBefore) &&
        isExperimentFunnelMetric(metricAfter) &&
        !equal(metricBefore.series, metricAfter.series)
    ) {
        changes.push(
            clause(
                i18n.t('experimentActivity.metric.changedFunnelSeries', { defaultValue: 'changed the funnel series' }),
                'for'
            )
        )
    }

    // check if the source event was changed for mean metrics
    if (
        isExperimentMeanMetric(metricBefore) &&
        isExperimentMeanMetric(metricAfter) &&
        !equal(metricBefore.source, metricAfter.source)
    ) {
        changes.push(
            clause(
                i18n.t('experimentActivity.metric.changedSourceEvent', { defaultValue: 'changed the source event' }),
                'for'
            )
        )
    }

    // check numerator and denominator changes for ratio metrics
    const ratioChanges = getRatioChanges(metricBefore, metricAfter)
    if (ratioChanges) {
        changes.push(clause(ratioChanges, 'for'))
    }

    if (changes.length === 0) {
        return [
            clause(
                <Trans
                    i18nKey="experimentActivity.metric.changedMetric"
                    values={{ name: metricName }}
                    components={{ Name: <LemonTag>{null}</LemonTag> }}
                    defaults="changed the metric <Name>{{ name }}</Name>"
                />,
                'for'
            ),
        ]
    }

    /**
     * let's add a way to identify which metric was changed
     * appending the name or series identifier to the last change
     */
    return [
        ...changes.slice(0, -1),
        clause(
            <span>
                {changes[changes.length - 1].text}{' '}
                <Trans
                    i18nKey="experimentActivity.metric.forTheMetric"
                    values={{ name: metricName }}
                    components={{ Name: <LemonTag>{null}</LemonTag> }}
                    defaults="for the metric <Name>{{ name }}</Name>"
                />
            </span>,
            'in'
        ),
    ]
}
