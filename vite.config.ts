import { defineConfig, PluginOption, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'

import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { createRequire } from 'node:module'
import requireTransform from 'vite-plugin-require-transform'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

const WRONG_CODE = `import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";`

function reactVirtualized(): PluginOption {
    return {
        name: 'flat:react-virtualized',
        // Note: we cannot use the `transform` hook here
        //       because libraries are pre-bundled in vite directly,
        //       plugins aren't able to hack that step currently.
        //       so instead we manually edit the file in node_modules.
        //       all we need is to find the timing before pre-bundling.
        configResolved: async () => {
            const require = createRequire(import.meta.url)
            const reactVirtualizedPath = require.resolve('react-virtualized')
            const { pathname: reactVirtualizedFilePath } = new url.URL(reactVirtualizedPath, import.meta.url)
            const file = reactVirtualizedFilePath.replace(
                path.join('dist', 'commonjs', 'index.js'),
                path.join('dist', 'es', 'WindowScroller', 'utils', 'onScroll.js'),
            )
            const code = await fs.readFile(file, 'utf-8')
            const modified = code.replace(WRONG_CODE, '')
            await fs.writeFile(file, modified)
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
        base: '/dashboard/',
        preview: {
            port: 3000,
        },
        plugins: [
            // @TODO: Check if we can remove the config object inside the react plugin
            react({
                // Use React plugin in all *.jsx and *.tsx files
                include: '**/*.{jsx,tsx}',
            }),
            viteTsconfigPaths(),
            svgr({
                svgrOptions: {},
            }),
            reactVirtualized(),
            requireTransform(),
            NodeGlobalsPolyfillPlugin({
                process: true,
            }),
        ],
        // test: {
        //     globals: true,
        //     environment: 'jsdom',
        //     setupFiles: './src/setupTests.ts',
        //     css: true,
        //     reporters: ['verbose'],
        //     coverage: {
        //         reporter: ['text', 'json', 'html'],
        //         include: ['src/**/*'],
        //         exclude: [],
        //     },
        // },
        server: {
            port: 3000,
            proxy: {
                '/orchestrator': {
                    // @TODO: Change this to a default value
                    target: 'https://devtron-badal.devtron.info/',
                    changeOrigin: true,
                    // rewrite: (path) => {
                    //   console.log(path)
                    //   return path.replace(/^\/orchestrator/, '')},
                },
                '/grafana': 'https://demo.devtron.info/',
            },
        },
        define: {
            global: 'globalThis',
        },
        resolve: {
            alias: {
                // process: 'process/browser',
                // @TODO: This can be removed
                // src: path.resolve(__dirname, 'src')
            },
        },
        // build: {
            // manifest: true,
        //     rollupOptions: {
        //         plugins: [
        //             // Enable rollup polyfills plugin
        //             // used during production bundling
        //             // rollupNodePolyFill({exclude: ["node_modules/xlsx/**"]}),
        //             // Add the inject plugin for Buffer
        //             // inject({ Buffer: ['Buffer', 'Buffer'] }),
        //         ],
        //         external: ["Buffer"]
        //     },
        // },
})
