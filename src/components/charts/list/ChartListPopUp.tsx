import React, { useEffect, useState } from 'react'
import { ChartListPopUpType, ChartListType } from '../charts.types'
import {
    showError,
    Progressing,
    InfoColourBar,
    GenericEmptyState,
    ImageType,
} from '@devtron-labs/devtron-fe-common-lib'
import { ReactComponent as Close } from '../../../assets/icons/ic-close.svg'
import { ReactComponent as Search } from '../../../assets/icons/ic-search.svg'
import { ReactComponent as Clear } from '../../../assets/icons/ic-error.svg'
import { getChartRepoList } from '../../../services/service'
import { ReactComponent as SyncIcon } from '../../../assets/icons/ic-arrows_clockwise.svg'
import Tippy from '@tippyjs/react'
import { toast } from 'react-toastify'
import { EMPTY_STATE_STATUS, TOAST_INFO } from '../../../config/constantMessaging'
import { reSyncChartRepo } from '../../chartRepo/chartRepo.service'
import { List } from '../../globalConfigurations/GlobalConfiguration'
import { ReactComponent as Help } from '../../../assets/icons/ic-help.svg'
import { NavLink } from 'react-router-dom'
import { URLS } from '../../../config'
import { ReactComponent as Add } from '../../../assets/icons/ic-add.svg'
import EmptyFolder from '../../../assets/img/Empty-folder.png'
import NoResults from '../../../assets/img/empty-noresult@2x.png'

function ChartListPopUp({ onClose }: ChartListPopUpType) {
    const [searchApplied, setSearchApplied] = useState<boolean>(false)
    const [searchText, setSearchText] = useState<string>('')
    const [chartList, setChartList] = useState<ChartListType[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [fetching, setFetching] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const [showAddPopUp, setShowAddPopUp] = useState<boolean>(false)
    const [enabled, toggleEnabled] = useState()
    const [filteredChartList, setFilteredChartList] = useState<ChartListType[]>([])
    const [noResults, setNoResults] = useState(false)

    useEffect(() => {
        getChartFilter()
    }, [])

    const setStore = (event): void => {
        setSearchText(event.target.value)
    }

    const toggleAddPopUp = () => {
        setShowAddPopUp(!showAddPopUp)
    }

    const renderAddPopUp = (): JSX.Element => {
        return (
            <div className="chart-list__add w-200 en-2 bw-1 br-4 bcn-0 fw-4 fs-13 cn-9 mt-8">
                <NavLink className="pl-8 pr-8 flex left" to={URLS.GLOBAL_CONFIG_CHART}>
                    Add Chart repositories
                </NavLink>

                <NavLink className="pl-8 pr-8 flex left" to={`${URLS.GLOBAL_CONFIG_DOCKER}/0`}>
                    Add OCI Registries
                </NavLink>
            </div>
        )
    }
    const renderChartListHeaders = () => {
        return (
            <div className="pt-12 pb-12 pl-16 pr-16 flex dc__content-space dc__border-bottom fw-6">
                <span>Helm chart sources</span>
                <div className="flex">
                    <div className="flex cb-5 fw-6 cursor" onClick={toggleAddPopUp}>
                        <Add className="icon-dim-20 fcb-5 mr-8" />
                        Add
                    </div>
                    <div className="dc__divider ml-12 mr-4" />
                    <button className="dc__transparent flex mr-8" onClick={onClose}>
                        <Close className="dc__page-header__close-icon icon-dim-24 cursor" />
                    </button>
                </div>
                {showAddPopUp && renderAddPopUp()}
            </div>
        )
    }

    const getChartFilter = async () => {
        setIsLoading(true)
        try {
            const [{ result: chartRepoListResp }] = await Promise.all([getChartRepoList()])
            let chartRepos = chartRepoListResp || []
            chartRepos.sort((a, b) => a['name'].localeCompare(b['name']))
            setChartList(chartRepos)
            setFilteredChartList(chartRepos)
        } catch (err) {
            showError(err)
        } finally {
            setIsLoading(false)
        }
    }

    async function refetchCharts(e) {
        if (fetching) {
            return
        }
        setFetching(true)
        toast.success(TOAST_INFO.RE_SYNC)
        await reSyncChartRepo()
            .then((response) => {
                setFetching(false)
            })
            .catch((error) => {
                showError(error)
                setFetching(false)
            })
    }

    const renderInfoText = (isEmptyState?: boolean): JSX.Element => {
        const renderNavigationeToOCIRepository = () => {
            return (
                <>
                    <NavLink className="ml-4 mr-4" to={URLS.GLOBAL_CONFIG_CHART}>
                        Chart repositories
                    </NavLink>
                    or
                    <NavLink className="ml-4 mr-4" to={URLS.GLOBAL_CONFIG_DOCKER}>
                        OCI Registries
                    </NavLink>
                </>
            )
        }
        return (
            <div>
                {isEmptyState ? (
                    <>Add a {renderNavigationeToOCIRepository()} to view and deploy helm charts.</>
                ) : (
                    <>
                        Showing Chart repositories and OCI Registries (used as chart repositories). You can add other{' '}
                        {renderNavigationeToOCIRepository()} as chart sources.
                    </>
                )}
            </div>
        )
    }

    const renderChartList = () => {
       if (chartList.length && !filteredChartList.length) {
        return (renderEmptyState(true))
    }
        return (
            <div>
                {filteredChartList.length > 0 &&
                    filteredChartList.map((list) => {
                        return (
                            <div className="flex dc__content-space pt-6 pb-6 pl-16 pr-16">
                                <div>{list.name}</div>
                                <Tippy
                                    className="default-tt"
                                    arrow={false}
                                    placement="top"
                                    content="Refetch chart from repositories"
                                >
                                    <div className="chartRepo_form__subtitle">
                                        <a
                                            rel="noreferrer noopener"
                                            target="_blank"
                                            className={`dc__link ${!fetching ? 'cursor' : ''}`}
                                            onClick={refetchCharts}
                                        >
                                            <span>
                                                <SyncIcon className="scn-5" />
                                            </span>
                                        </a>

                                        <Tippy
                                            className="default-tt"
                                            arrow={false}
                                            placement="bottom"
                                            content={enabled ? 'Disable chart repository' : 'Enable chart repository'}
                                        >
                                            <span
                                                data-testid={`${'name'}-chart-repo-toggle-button`}
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                {loading ? (
                                                    <Progressing />
                                                ) : (
                                                    <List.Toggle
                                                        onSelect={(en) => toggleEnabled(en)}
                                                        enabled={enabled}
                                                    />
                                                )}
                                            </span>
                                        </Tippy>
                                    </div>
                                </Tippy>
                            </div>
                        )
                    })}
                <InfoColourBar
                    message={renderInfoText()}
                    classname="question-bar mb-16 ml-16 mr-16"
                    Icon={Help}
                    iconClass="icon-dim-20 fcv-5"
                />
            </div>
        )
    }

    const handleFilterChanges = (_searchText: string): void => {
        const _filteredData = chartList.filter((cluster) => cluster.name.indexOf(_searchText.toLowerCase()) >= 0)
        setFilteredChartList(_filteredData)
        setNoResults(_filteredData.length === 0)
    }

    const clearSearch = (): void => {
        if (searchApplied) {
            handleFilterChanges('')
            setSearchApplied(false)
        }
        setSearchText('')
    }

    const handleFilterKeyPress = (event): void => {
        const theKeyCode = event.key
        if (theKeyCode === 'Enter') {
            handleFilterChanges(event.target.value)
            setSearchApplied(true)
        } else if (theKeyCode === 'Backspace' && searchText.length === 1) {
            clearSearch()
        }
    }

    const renderChartListSearch = () => {
        return (
            <div className="dc__position-rel dc__block en-2 bw-1 br-4 h-32 m-12">
                <Search className="search__icon icon-dim-18" />
                <input
                    type="text"
                    placeholder="Search by repository registry"
                    value={searchText}
                    className="search__input"
                    onChange={setStore}
                    data-testid="chart-store-list-search-box"
                    onKeyDown={handleFilterKeyPress}
                />
                {searchApplied && (
                    <button className="search__clear-button" type="button" onClick={clearSearch}>
                        <Clear className="icon-dim-18 icon-n4 dc__vertical-align-middle" />
                    </button>
                )}
            </div>
        )
    }

    const renderEmptyState = (noChartFound?: boolean) => {
        return (
            <GenericEmptyState
                image={noChartFound ? NoResults : EmptyFolder}
                title={noChartFound ? <>No result for "{searchText}"</> : EMPTY_STATE_STATUS.CHART.NO_SOURCE_TITLE }
                subTitle={noChartFound ? EMPTY_STATE_STATUS.CHART.NO_CHART_FOUND : renderInfoText(true)}
                imageType={ImageType.Medium}
                classname="dc__align-reload-center"
            />
        )
    }

    const renderChartListBody = () => {
        if (isLoading) {
            return (
                <div className="mh-400 flex column">
                    <Progressing size={24} />
                    <span className="dc__loading-dots mt-12">Loading Chart source</span>
                </div>
            )
        }
          else if (!chartList.length) {
            return renderEmptyState()
        }
        return (
            <>
                {renderChartListSearch()}
                {renderChartList()}
            </>
        )
    }

    return (
        <div className="dc__transparent-div bcn-0">
            <div className="chart-store__list w-400 br-4 bcn-0 en-2 bw-1 fw-4">
                {renderChartListHeaders()}
                {renderChartListBody()}
            </div>
        </div>
    )
}

export default ChartListPopUp
