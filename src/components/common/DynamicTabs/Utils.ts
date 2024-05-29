import { Dayjs } from 'dayjs'
import { OptionType } from '@devtron-labs/devtron-fe-common-lib'
import { DynamicTabType, TabsDataType } from './Types'
import { MARK_AS_STALE_DATA_CUT_OFF_MINS } from '../../ResourceBrowser/Constants'

export const COMMON_TABS_SELECT_STYLES = {
    control: (base) => ({
        ...base,
        borderRadius: '4px 4px 0 0',
        borderBottom: 'none',
        boxShadow: 'none',
        cursor: 'text',
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '2px 32px',
    }),
    menu: (base) => ({
        ...base,
        marginTop: 0,
        borderRadius: '0 0 4px 4px',
        width: '298px',
        marginLeft: '1px',
        overflow: 'hidden',
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: 'calc(100vh - 200px)',
        paddingTop: 0,
    }),
    noOptionsMessage: (base) => ({
        ...base,
        color: 'var(--N600)',
    }),
}

export const EMPTY_TABS_DATA = {
    fixedTabs: [],
    dynamicTabs: [],
}

export const initTabsData = (
    tabs: DynamicTabType[],
    setTabsData: React.Dispatch<React.SetStateAction<TabsDataType>>,
    setSelectedTab: React.Dispatch<React.SetStateAction<OptionType & DynamicTabType>>,
    updateMenuState: () => void,
): void => {
    const fixedTabs = []
    const dynamicTabs = []
    tabs.forEach((tab) => {
        const tabOption = {
            ...tab,
            label: tab.title,
            value: tab.id,
        }
        // NOTE: dynamic tabs are supposed to have position as Number.MAX_SAFE_INTEGER
        if (tab.position < Number.MAX_SAFE_INTEGER) {
            fixedTabs.push(tabOption)
        } else {
            dynamicTabs.push(tabOption)
        }

        if (tabOption.isSelected) {
            setSelectedTab(tabOption)
        }
    })

    setTabsData({
        fixedTabs,
        dynamicTabs,
    })

    // Update menu state when dynamicTabs are not present
    if (dynamicTabs.length === 0) {
        updateMenuState()
    }
}

export const checkIfDataIsStale = (start: Dayjs, now: Dayjs): boolean => {
    return now.diff(start, 'minutes') > MARK_AS_STALE_DATA_CUT_OFF_MINS
}
