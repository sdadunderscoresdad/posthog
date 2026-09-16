import { render } from '@testing-library/react'

import { ActivityLogItem, HumanizedChange } from 'lib/components/ActivityLog/humanizeActivity'

import { ActivityScope } from '~/types'

import { dashboardActivityDescriber } from './dashboardActivityDescriber'

const textOf = (result: HumanizedChange): string => {
    const { container } = render(<>{result.description}</>)
    return (container.textContent ?? '').replace(/\u00a0/g, ' ')
}

const shareLoginItem = (activity: string): ActivityLogItem =>
    ({
        activity,
        created_at: '2026-05-21T00:00:00Z',
        scope: ActivityScope.DASHBOARD,
        item_id: '7',
        user: { first_name: 'Alice', last_name: 'Adams', email: 'alice@example.com' },
        detail: {
            name: 'Funnel dashboard',
            changes: [{ after: { client_ip: '1.2.3.4', password_note: 'hunter2' } }],
            merge: null,
            trigger: null,
        },
    }) as unknown as ActivityLogItem

describe('dashboardActivityDescriber', () => {
    it.each(['share_login_success', 'share_login_failed'])('names the dashboard and the IP on a %s row', (activity) => {
        const text = textOf(dashboardActivityDescriber(shareLoginItem(activity)))

        expect(text).toContain('Funnel dashboard')
        expect(text).toContain('1.2.3.4')
    })
})
