import '../css/app.css';
import 'react-toastify/dist/ReactToastify.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function FlashToasts() {
    const { props } = usePage();
    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash?.success, props.flash?.error]);
    return null;
}

function FaviconFromBranding() {
    const { props } = usePage();
    useEffect(() => {
        const url = props.branding?.favicon_url;
        if (url) {
            const link = document.getElementById('app-favicon') || document.querySelector('link[rel="icon"]');
            if (link) link.href = url;
        }
    }, [props.branding?.favicon_url]);
    return null;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ).then((module) => {
            const Page = module.default;
            return function AppWithToasts(props) {
                return (
                    <>
                        <ToastContainer position="top-right" autoClose={3000} theme="light" />
                        <FlashToasts />
                        <FaviconFromBranding />
                        <Page {...props} />
                    </>
                );
            };
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
