import React, { Component } from 'react'
import { Switch, Route, Redirect, NavLink } from 'react-router-dom';
import AppListContainer from './AppListContainer';
import ExternalListContainer from './ExternalListContainer';
import { ListContainerProps, ListContainerState } from './types';
import { AppListViewType } from '../config';

export default class ListContainer extends React.Component<ListContainerProps, ListContainerState> {
    constructor(props) {
        super(props)

        this.state = {
            collapsed: false,
            code: 0,
            view: AppListViewType.LOADING,
        }
    }

    renderListHeader() {
        const path = this.props.match.path;
        return <>
            <ul role="tablist" className="tab-list bcn-0 pl-20">
                <li className="tab-list__tab ellipsis-right">
                    <NavLink activeClassName="active" to={`${path}/devtron-apps`} className="tab-list__tab-link">Devtron Apps [A]</NavLink>
                </li>
                <li className="tab-list__tab">
                    <NavLink activeClassName="active" to={`${path}/external-apps`} className="tab-list__tab-link">External Apps [E]</NavLink>
                </li>
            </ul>
        </>
    }

    renderRouter() {
        const path = this.props.match.path;
        return <Switch>
            <Route path={`${path}/devtron-apps`} component={AppListContainer} />
            <Route path={`${path}/external-apps`} component={ExternalListContainer} />
            <Redirect to={`${path}/scans`} />
        </Switch>
    }

    render() {
        { console.log(this.props) }
        return (
            <div>
                {this.renderListHeader()}
                {this.renderRouter()}
            </div>
        )
    }
}
