import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import * as L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Link, useLocation } from 'wouter';
import { getListNotificationsQueryKey, useCreateUploadSignature, useGetSetupStatus, useListNotifications } from '@/lib/api-client-react';
import { categories, departmentNames, statusLabels, statusTone } from '@/lib/app-data';
import { Activity, ArrowRight, Bell, Check, CircleHelp, ClipboardList, Clock3, FilePlus2, Home, ImagePlus, Landmark, LayoutDashboard, LogOut, MapPin, Menu, ShieldCheck, UserRound, X } from 'lucide-react';

export function DepartmentName({ value }) { return _jsx(_Fragment, { children: value ? departmentNames[value] : 'Not assigned' }); }

export function PageTitle({ eyebrow, title, text, actions }) {
    return _jsxs("div", { className: "mb-7 flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary", children: eyebrow }), _jsx("h1", { className: "font-display text-3xl font-extrabold tracking-[-.045em] md:text-[38px]", children: title }), text && _jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 subtle", children: text })] }), actions] });
}

export function StatusPill({ status }) { return _jsxs("span", { className: "status-pill", style: statusTone[status], children: [_jsx("i", { className: "status-dot" }), statusLabels[status]] }); }

export function SetupNotice({ compact = false }) {
    const setup = useGetSetupStatus();
    if (setup.isLoading)
        return _jsxs("div", { className: "card animate-pulse p-4", children: [_jsx("div", { className: "h-4 w-48 rounded bg-muted" }), _jsx("div", { className: "mt-2 h-3 w-64 rounded bg-muted" })] });
    if (setup.isError)
        return _jsxs("div", { className: "rounded-2xl border border-[#e7c4b7] bg-[#fff2eb] p-4 text-sm text-[#7c4635]", children: ["We couldn\u2019t check service readiness. ", _jsx("button", { className: "ml-2 underline", onClick: () => setup.refetch(), children: "Try again" })] });
    if (setup.data?.ready)
        return null;
    return _jsxs("div", { className: `flex gap-3 rounded-2xl border border-[#e7d2ac] bg-[#fff5df] text-[#725122] ${compact ? 'p-3 text-xs' : 'p-5'}`, "data-testid": "status-services-missing", children: [_jsx("div", { className: "mt-0.5 shrink-0", children: _jsx(CircleHelp, { size: 19 }) }), _jsxs("div", { children: [_jsx("strong", { className: "block font-display text-sm", children: "Some services are not connected yet" }), _jsxs("p", { className: "mt-1 leading-5", children: [setup.data?.message || 'Reports and file storage will become available once the city completes setup.', " ", setup.data?.missing?.length ? `Missing: ${setup.data.missing.join(', ')}.` : ''] })] })] });
}

export function Brand({ inverse = false }) {
    return _jsxs(Link, { href: "/", className: `inline-flex items-center gap-3 font-display text-base font-extrabold tracking-[-.04em] ${inverse ? 'text-[#f8f3e8]' : 'text-primary'}`, "data-testid": "link-home-brand", children: [_jsx("span", { className: "grid h-10 w-10 place-items-center rounded-[13px] bg-accent text-[#173d39]", children: _jsx(Landmark, { size: 21, strokeWidth: 2.2 }) }), _jsx("span", { children: "PurPravah" })] });
}

export function SiteHeader({ signedIn = false, profile, accountControls = false, unread = 0, onOpenWorkspace }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [location] = useLocation();
    const currentPath = location.split(/[?#]/, 1)[0] || '/';
    const isActive = href => currentPath === href || (href !== '/' && currentPath.startsWith(`${href}/`));
    const workspaceHref = profile?.role === 'admin'
        ? '/admin'
        : profile?.role === 'department_staff'
            ? '/department'
            : '/citizen';

    return (
        <header className={`landing-header ${accountControls ? 'is-workspace-header' : ''}`}>
            <div className="landing-header-inner">
                <Brand />
                {!accountControls && (
                    <button
                        type="button"
                        className="landing-menu-toggle"
                        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                )}
                {!accountControls && menuOpen && (
                    <button
                        type="button"
                        className="landing-nav-backdrop"
                        aria-label="Close navigation"
                        onClick={() => setMenuOpen(false)}
                    />
                )}
                {!accountControls && (
                    <nav className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
                        <button type="button" className="landing-nav-close" onClick={() => setMenuOpen(false)}>
                            <X size={19} />
                        </button>
                        <Link href="/" className={isActive('/') ? 'is-active' : ''} aria-current={isActive('/') ? 'page' : undefined} onClick={() => setMenuOpen(false)}>Home</Link>
                        <Link href="/about" className={isActive('/about') ? 'is-active' : ''} aria-current={isActive('/about') ? 'page' : undefined} onClick={() => setMenuOpen(false)}>About</Link>
                        <Link href="/public-dashboard" className={isActive('/public-dashboard') ? 'is-active' : ''} aria-current={isActive('/public-dashboard') ? 'page' : undefined} onClick={() => setMenuOpen(false)}>Public dashboard</Link>
                        <Link href="/contact" className={isActive('/contact') ? 'is-active' : ''} aria-current={isActive('/contact') ? 'page' : undefined} onClick={() => setMenuOpen(false)}>Contact</Link>
                        {signedIn ? (
                            <Link className={`landing-nav-action ${isActive(workspaceHref) ? 'is-active' : ''}`} aria-current={isActive(workspaceHref) ? 'page' : undefined} href={workspaceHref} onClick={() => setMenuOpen(false)}>My workspace</Link>
                        ) : (
                            <div className="landing-nav-auth">
                                <Link href="/sign-in" className={isActive('/sign-in') ? 'is-active' : ''} aria-current={isActive('/sign-in') ? 'page' : undefined} onClick={() => setMenuOpen(false)}>Login</Link>
                                <Link className={`landing-nav-action ${isActive('/sign-up') ? 'is-active' : ''}`} aria-current={isActive('/sign-up') ? 'page' : undefined} href="/sign-up" onClick={() => setMenuOpen(false)}>Sign up</Link>
                            </div>
                        )}
                    </nav>
                )}
                <div className="landing-header-actions">
                    {accountControls ? (
                        <>
                            <button
                                type="button"
                                onClick={onOpenWorkspace}
                                className="inline-flex rounded-lg border border-[#d9ded2] bg-[#faf9f2] p-2.5 text-[#42635a] md:hidden"
                                aria-label="Open workspace navigation"
                            >
                                <Menu size={17} />
                            </button>
                            <Link href="/notifications" className={`relative rounded-xl border border-[#d9ded2] bg-[#faf9f2] p-2.5 text-[#42635a] ${isActive('/notifications') ? 'ring-2 ring-[#08a66b]' : ''}`} aria-label="Notifications" aria-current={isActive('/notifications') ? 'page' : undefined}>
                                <Bell size={16} />
                                {unread > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#d8834e]" />}
                            </Link>
                        </>
                    ) : signedIn ? (
                        <Link className="landing-button landing-button-primary" href={workspaceHref}>
                            My workspace <ArrowRight size={15} />
                        </Link>
                    ) : (
                        <>
                            <Link className="landing-button landing-button-login" href="/sign-in">Login</Link>
                            <Link className="landing-button landing-button-primary" href="/sign-up">
                                Sign up <ArrowRight size={15} />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export function SiteFooter({ signedIn = false, profile }) {
    const workspaceHref = profile?.role === 'admin'
        ? '/admin'
        : profile?.role === 'department_staff'
            ? '/department'
            : '/citizen';

    return (
        <footer className="landing-footer">
            <div className="landing-footer-main">
                <div className="landing-footer-brand">
                    <Brand inverse />
                </div>
                <div className="landing-footer-column">
                    <h2>Quick links</h2>
                    <Link href="/">Home</Link>
                    <Link href="/about">About us</Link>
                    <Link href="/public-dashboard">Public dashboard</Link>
                    <Link href="/contact">Contact</Link>
                    <a href="/#issues">Report an issue</a>
                </div>
                <div className="landing-footer-column">
                    <h2>Issue categories</h2>
                    <a href="/#issues">Road problems</a>
                    <a href="/#issues">Electricity</a>
                    <a href="/#issues">Garbage &amp; sanitation</a>
                    <a href="/#issues">Water problems</a>
                </div>
                <div className="landing-footer-column">
                    <h2>Your account</h2>
                    {signedIn ? <Link href={workspaceHref}>My workspace</Link> : <Link href="/sign-in">Login</Link>}
                    <Link href={signedIn ? '/profile' : '/sign-up'}>{signedIn ? 'My profile' : 'Create account'}</Link>
                </div>
            </div>
            <div className="landing-footer-bottom">
                <span>© {new Date().getFullYear()} PurPravah</span>
            </div>
        </footer>
    );
}

export function AppShell({ children, profile, onSignOut }) {
    const [open, setOpen] = useState(false);
    const [location] = useLocation();
    const role = profile?.role;
    const items = role === 'admin'
        ? [{ href: '/', label: 'Home', icon: Home }, { href: '/admin', label: 'Overview', icon: LayoutDashboard }, { href: '/notifications', label: 'Notifications', icon: Bell }, { href: '/profile', label: 'My profile', icon: UserRound }]
        : role === 'department_staff'
            ? [{ href: '/', label: 'Home', icon: Home }, { href: '/department', label: 'Assigned work', icon: ClipboardList }, { href: '/notifications', label: 'Notifications', icon: Bell }, { href: '/profile', label: 'My profile', icon: UserRound }]
            : [{ href: '/', label: 'Home', icon: Home }, { href: '/citizen', label: 'My reports', icon: LayoutDashboard }, { href: '/complaints/new', label: 'Report an issue', icon: FilePlus2 }, { href: '/notifications', label: 'Notifications', icon: Bell }, { href: '/profile', label: 'My profile', icon: UserRound }];
    const { data: notifications } = useListNotifications({ query: { enabled: !!role, queryKey: getListNotificationsQueryKey(), refetchInterval: 30000 } });
    const unread = notifications?.filter(n => !n.read).length || 0;
    const current = location.split(/[?#]/, 1)[0] || '/';
    const isActive = href => current === href
        || (href !== '/' && current.startsWith(`${href}/`))
        || (href === '/citizen' && current.startsWith('/complaints/') && current !== '/complaints/new');

    return (
        <div className="shell civic-app flex bg-[#f4f2e8]">
            {open && <button aria-label="Close menu" className="fixed inset-0 z-[60] bg-[#183d37]/30 md:z-30" onClick={() => setOpen(false)} />}
            <aside className={'fixed inset-y-0 right-0 z-[70] flex w-[min(85vw,320px)] flex-col bg-[#193f39] px-4 py-5 text-[#f3f0e5] transition-transform duration-200 md:inset-y-0 md:left-0 md:right-auto md:z-40 md:w-[252px] md:translate-x-0 ' + (open ? 'translate-x-0' : 'translate-x-full')}>
                <div className="flex items-center justify-between px-2">
                    <Brand inverse />
                    <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#bed0c7] md:hidden" aria-label="Close navigation"><X size={18} /></button>
                </div>
                <div className="mt-9 px-3 text-[9px] font-bold uppercase tracking-[.19em] text-[#91afa3]">Your workspace</div>
                <nav className="mt-3 space-y-1">
                    {items.map(({ href, label, icon: Icon }) => (
                        <Link
                            href={href}
                            onClick={() => setOpen(false)}
                            data-testid={'nav-' + label.toLowerCase().replaceAll(' ', '-')}
                            aria-current={isActive(href) ? 'page' : undefined}
                            className={'side-link flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold ' + (isActive(href) ? 'bg-[#2d5a51] text-[#fff8e9]' : 'text-[#c1d2ca] hover:bg-[#244d45]')}
                            key={href}
                        >
                            <Icon size={17} />
                            {label}
                            {label === 'Notifications' && unread > 0 && <span className="ml-auto rounded-full bg-[#dc8a51] px-1.5 py-0.5 text-[9px] text-white">{unread}</span>}
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto rounded-2xl border border-[#41655b] bg-[#224a42] p-4">
                    <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-[#d9935e] text-[#183c36]"><ShieldCheck size={17} /></div>
                    <div className="text-xs font-bold">Your report matters.</div>
                    <p className="mt-1 text-[10px] leading-4 text-[#b7ccc2]">Every update is linked to the team responsible for action.</p>
                    <Link href="/complaints/new" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#f1b37f]">Start a report <ArrowRight size={12} /></Link>
                </div>
                <button onClick={onSignOut} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#b7ccc2] hover:bg-[#244d45]" data-testid="button-sign-out"><LogOut size={16} /> Sign out</button>
            </aside>
            <div className="min-w-0 flex-1 md:ml-[252px]">
                <SiteHeader signedIn profile={profile} accountControls unread={unread} onOpenWorkspace={() => setOpen(true)} />
                <main className="mx-auto min-h-[calc(100dvh-190px)] w-full max-w-[1380px] px-4 py-7 md:px-8 md:py-9">{children}</main>
                <SiteFooter signedIn profile={profile} />
            </div>
        </div>
    );
}

export function MissingProfile({ profile }) {
    const [, navigate] = useLocation();
    useEffect(() => {
        if (!profile?.name || !profile?.phone) {
            navigate('/profile');
        }
    }, [profile?.name, profile?.phone, navigate]);
    if (!profile?.name || !profile?.phone) {
        return _jsx("div", { className: "py-24 text-center subtle", children: "Taking you to your profile\u2026" });
    }
    return null;
}

export function ComplaintRow({ complaint }) {
    const itemIcon = categories.find(c => c.value === complaint.category)?.icon || CircleHelp;
    const Icon = itemIcon;
    return _jsxs(Link, { href: `/complaints/${complaint.id}`, "data-testid": `link-complaint-${complaint.id}`, className: "group flex flex-wrap items-center gap-4 border-b border-[#e6e4d9] px-4 py-4 last:border-0 hover:bg-[#f8f7ef] md:px-5", children: [_jsx("span", { className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8eee4] text-primary", children: _jsx(Icon, { size: 18 }) }), _jsxs("span", { className: "min-w-[160px] flex-1", children: [_jsx("span", { className: "block text-[10px] font-bold uppercase tracking-[.1em] text-[#87938b]", children: complaint.publicId }), _jsx("span", { className: "mt-1 block font-semibold text-[#294b43]", children: categories.find(c => c.value === complaint.category)?.label || complaint.category }), _jsx("span", { className: "mt-1 block truncate text-xs text-[#78877e]", children: complaint.address })] }), _jsx(StatusPill, { status: complaint.status }), _jsx("span", { className: "hidden w-28 text-right text-[11px] text-[#78877e] md:block", children: new Date(complaint.updatedAt).toLocaleDateString() }), _jsx(ArrowRight, { className: "text-[#a4afa5] transition-transform group-hover:translate-x-1", size: 16 })] });
}

export function ListPanel({ complaints, loading, error, retry, emptyTitle = 'No reports yet', emptyText = 'When you report a local issue, its journey will appear here.' }) {
    if (loading)
        return _jsx("div", { className: "card overflow-hidden p-5", children: _jsx("div", { className: "animate-pulse space-y-5", children: [1, 2, 3].map(i => _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "h-10 w-10 rounded-xl bg-muted" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-3 w-32 rounded bg-muted" }), _jsx("div", { className: "h-3 w-3/4 rounded bg-muted" })] })] }, i)) }) });
    if (error)
        return _jsxs("div", { className: "card py-12 text-center", children: [_jsx("div", { className: "mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff0e7] text-[#a65e3a]", children: _jsx(CircleHelp, { size: 21 }) }), _jsx("p", { className: "mt-3 text-sm font-bold", children: "Reports couldn\u2019t be loaded" }), _jsx("p", { className: "mt-1 text-xs subtle", children: "Check your connection and try again." }), _jsx("button", { className: "btn btn-quiet mt-4", onClick: retry, children: "Try again" })] });
    if (!complaints?.length)
        return _jsxs("div", { className: "card px-6 py-14 text-center", children: [_jsx("span", { className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e7eee4] text-primary", children: _jsx(FilePlus2, { size: 23 }) }), _jsx("h3", { className: "mt-4 font-display text-lg font-extrabold", children: emptyTitle }), _jsx("p", { className: "mx-auto mt-2 max-w-sm text-sm leading-6 subtle", children: emptyText }), _jsxs(Link, { href: "/complaints/new", className: "btn btn-primary mt-5", children: ["Report an issue ", _jsx(ArrowRight, { size: 15 })] })] });
    return _jsx("div", { className: "card overflow-hidden", children: complaints.map((c) => _jsx(ComplaintRow, { complaint: c }, c.id)) });
}

export function Metric({ label, value, icon: Icon, caption }) { return _jsxs("div", { className: "card flex items-start justify-between p-4 md:p-5", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-bold uppercase tracking-[.12em] text-[#849188]", children: label }), _jsx("div", { className: "mt-2 font-display text-3xl font-extrabold tracking-[-.06em] text-[#21473f]", children: value }), _jsx("div", { className: "mt-1 text-[10px] text-[#86938a]", children: caption })] }), _jsx("span", { className: "grid h-9 w-9 place-items-center rounded-xl bg-[#e8eee4] text-primary", children: _jsx(Icon, { size: 17 }) })] }); }

export function InlineError({ text, retry }) { return _jsxs("div", { className: "mb-4 flex items-center justify-between rounded-xl border border-[#e8c9b8] bg-[#fff2e9] px-4 py-3 text-xs text-[#895642]", children: [text, _jsx("button", { className: "font-bold underline", onClick: retry, children: "Retry" })] }); }

export function UploadPhoto({ purpose, onUploaded, value }) {
    const signature = useCreateUploadSignature();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const upload = async (file) => {
        if (!file)
            return;
        setError('');
        if (!file.type.startsWith('image/')) {
            setError('Choose an image file.');
            return;
        }
        setBusy(true);
        try {
            const signed = await signature.mutateAsync({ data: { purpose } });
            const body = new FormData();
            body.append('file', file);
            body.append('api_key', signed.apiKey);
            body.append('timestamp', String(signed.timestamp));
            body.append('signature', signed.signature);
            body.append('folder', signed.folder);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: 'POST', body });
            if (!response.ok)
                throw new Error('Cloudinary could not save this image.');
            const result = await response.json();
            onUploaded(result.secure_url);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
        }
        finally {
            setBusy(false);
        }
    };
    return _jsxs("div", { children: [_jsxs("label", { className: "label", children: ["Photo evidence ", _jsx("span", { className: "font-normal subtle", children: "\u2014 required" })] }), _jsxs("label", { className: "flex min-h-[118px] cursor-pointer items-center gap-4 rounded-xl border border-dashed border-[#b8c8bb] bg-[#f5f6ed] p-4 transition hover:bg-[#edf2e8]", children: [_jsx("span", { className: "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e2ebdf] text-primary", children: busy ? _jsx("span", { className: "h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" }) : _jsx(ImagePlus, { size: 20 }) }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-sm font-bold", children: busy ? 'Uploading photo…' : value ? 'Photo attached' : 'Add a photo' }), _jsx("span", { className: "mt-1 block text-xs leading-5 subtle", children: value ? 'Choose a different image if needed.' : 'Upload a clear image before submitting.' })] }), _jsx("input", { className: "sr-only", type: "file", accept: "image/*", disabled: busy, onChange: e => void upload(e.target.files?.[0]), "data-testid": `input-photo-${purpose}` })] }), error && _jsx("p", { className: "mt-2 text-xs text-destructive", children: error }), value && _jsx("img", { className: "mt-2 max-h-44 rounded-xl object-cover", src: value, alt: "Uploaded report evidence" })] });
}

export const reportPinIcon = L.divIcon({
    className: '',
    html: '<span class="civic-map-pin"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

export function MapClickHandler({ onPick }) {
    useMapEvents({
        click: event => onPick(event.latlng.lat, event.latlng.lng),
    });
    return null;
}

export function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom(), { animate: true });
    }, [center, map]);
    return null;
}

export function ComplaintLocationMap({ center, hasLocation, onPick, interactive = true, }) {
    return _jsxs(MapContainer, { center: center, zoom: 13, className: "complaint-map", scrollWheelZoom: interactive, dragging: interactive, children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), interactive && onPick && _jsx(MapClickHandler, { onPick: onPick }), _jsx(RecenterMap, { center: center }), hasLocation && _jsx(Marker, { position: center, icon: reportPinIcon })] });
}

export function LoadingPage() { return _jsxs("div", { className: "card animate-pulse p-6", children: [_jsx("div", { className: "h-3 w-28 rounded bg-muted" }), _jsx("div", { className: "mt-4 h-8 w-2/3 rounded bg-muted" }), _jsx("div", { className: "mt-6 h-40 rounded-xl bg-muted" })] }); }
