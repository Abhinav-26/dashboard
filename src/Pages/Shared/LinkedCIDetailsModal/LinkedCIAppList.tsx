import React from 'react'
import { Link } from 'react-router-dom'
import {
    SortableTableHeaderCell,
    AppStatus,
    UseUrlFiltersReturnType,
    GenericEmptyState,
} from '@devtron-labs/devtron-fe-common-lib'
import { URLS } from '../../../config'
import { LinkedCIAppDto } from './types'
import appListLoading from './constants'
import { SortableKeys } from '../../GlobalConfigurations/Authorization/PermissionGroups/List/constants'
import EmptyStateImage from '../../../assets/img/empty-noresult@2x.png'

const AppListRow = ({ appId, appName, deploymentStatus, environmentName, triggerMode }: LinkedCIAppDto) => {
    return (
        <Link to={`${URLS.APP}/${appId}`} target="_blank" style={{ textDecoration: 'none' }}>
            <div className="display-grid dc__align-items-center linked-ci-detail__table-row cn-9 pl-20 pr-20 pt-8 pb-8 fs-13 fw-4 dc__hover-n50 ">
                <span className="dc__ellipsis-right">{appName}</span>
                <span>{environmentName}</span>
                <span>{triggerMode}</span>
                <AppStatus appStatus={deploymentStatus} />
            </div>
        </Link>
    )
}

const LinkedCIAppList = ({
    appList,
    totalCount,
    isLoading,
    urlFilters,
}: {
    appList: LinkedCIAppDto[]
    totalCount: number
    isLoading: boolean
    urlFilters: UseUrlFiltersReturnType<SortableKeys>
}) => {
    const renderClearFiltersButton = () => {
        return (
            <button type="button" className="bcb-5 w-125px-imp fs-13 fw-6 lh-20 cn-0 dc__border-radius-4-imp">
                <span className="pl-12 pr-12 pb-8 pt-8">Clear Filters</span>
            </button>
        )
    }

    if (!isLoading && totalCount === 0) {
        return (
            <GenericEmptyState
                image={EmptyStateImage}
                classname="fs-16"
                title="No Results"
                subTitle="We could not find any matching results"
                isButtonAvailable
                renderButton={renderClearFiltersButton}
            />
        )
    }
    const { sortOrder } = urlFilters

    return (
        <div className="flexbox-col dc__content-space flex-grow-1">
            <div className="flexbox-col flex-grow-1">
                <div className="display-grid dc__align-items-center linked-ci-detail__table-row dc__uppercase pl-20 pr-20 pt-6 pb-6 dc__border-bottom fs-12 fw-6 cn-7">
                    {/* todo (Arun) -- fix this */}
                    <SortableTableHeaderCell
                        title="Application"
                        sortOrder={sortOrder}
                        isSorted
                        triggerSorting={() => {}}
                        disabled={isLoading}
                    />
                    <span>Deploys To (ENV)</span>
                    <span>Trigger Mode</span>
                    <span>Last Deployment Status</span>
                </div>
                {isLoading ? (
                    <div className="flexbox-col flex-grow-1 show-shimmer-loading">
                        {appListLoading.map((appData) => (
                            <div
                                className="display-grid dc__align-items-center linked-ci-detail__table-row pl-20 pr-20 pt-10 pb-10"
                                key={appData.appId}
                            >
                                <span className="child child-shimmer-loading" />
                                <span className="child child-shimmer-loading" />
                                <span className="child child-shimmer-loading" />
                                <span className="child child-shimmer-loading" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flexbox-col flex-grow-1 dc__overflow-auto">
                        {appList.map((appData) => (
                            <AppListRow {...appData} key={`${appData.appId}-${appData.environmentId}`} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default LinkedCIAppList
