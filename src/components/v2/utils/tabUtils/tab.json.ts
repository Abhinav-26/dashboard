/*
 * Copyright (c) 2024. Devtron Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const DefaultViewTabsJSON = [
    {
        name: 'TERMINAL',
        isSelected: false,
    },
    {
        name: 'SUMMARY',
        isSelected: false,
    },
    {
        name: 'MANIFEST',
        isSelected: true,
    },
    {
        name: 'EVENTS',
        isSelected: false,
    },
    {
        name: 'LOGS',
        isSelected: false,
    },
]

export const ManifestTabJSON = [
    {
        name: 'Live manifest',
        isSelected: true,
        isDisabled: false,
    },
    {
        name: 'Compare',
        isSelected: false,
        isDisabled: false,
    },
    {
        name: 'Helm generated manifest',
        isSelected: false,
        isDisabled: false,
    },
] as const
