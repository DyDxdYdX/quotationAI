import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { type RouteName, route } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx`)),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize Ziggy route helper with initial page props
        const initializeRoute = () => {
            const ziggy = (props.initialPage?.props as any)?.ziggy;
            if (ziggy) {
                /* eslint-disable */
                // @ts-expect-error
                window.route = <T extends RouteName>(name: T, params?: any, absolute?: boolean) =>
                    route(name, params, absolute, {
                        ...ziggy,
                        location: new URL(ziggy.location),
                    });
                /* eslint-enable */
            }
        };

        initializeRoute();

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
