import { Routes } from '../../config'
import { get, post } from '../../services/api'
import { ClusterListResponse, ResponseType } from '../../services/service.types'
import { Nodes } from '../app/types'
import {
    APIResourceResponse,
    CreateResourcePayload,
    CreateResourceResponse,
    ResourceListPayloadType,
    ResourceListResponse,
} from './Types'

export const getClusterList = (): Promise<ClusterListResponse> => {
    return get(Routes.CLUSTER_LIST_PERMISSION)
}

export const namespaceListByClusterId = (clusterId: string): Promise<ResponseType> => {
    return get(`${Routes.CLUSTER_NAMESPACE}/${clusterId}`)
}

export const getResourceList = (
    resourceListPayload: ResourceListPayloadType,
    signal?: AbortSignal,
): Promise<ResourceListResponse> => {
    return post(Routes.K8S_RESOURCE_LIST, resourceListPayload, {
        signal,
    })
}

export const getResourceGroupList = (clusterId: string): Promise<APIResourceResponse> => {
    return Promise.resolve({
        code: 200,
        status: 'OK',
        result: {
            apiResources: [{ gvk: { Group: 'apps', Version: 'v1', Kind:Nodes.DaemonSet }, namespaced: true }],
            allowedAll: false,
        },
    })
    return get(`${Routes.API_RESOURCE}/${clusterId}`)
}

export const createNewResource = (resourceListPayload: CreateResourcePayload): Promise<CreateResourceResponse> => {
    return post(Routes.K8S_RESOURCE_CREATE, resourceListPayload)
}

export const deleteResource = (resourceListPayload: ResourceListPayloadType): Promise<CreateResourceResponse> => {
    return post(Routes.DELETE_RESOURCE, resourceListPayload)
}
