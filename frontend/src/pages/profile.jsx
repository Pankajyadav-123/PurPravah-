import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getGetProfileQueryKey, getListComplaintsQueryKey, useGetSetupStatus, useListComplaints, useUpdateProfile } from '@/lib/api-client-react';
import { categories, departmentNames, statusLabels } from '@/lib/app-data';
import { queryClient } from '@/lib/query-client';
import { InlineError, ListPanel, LoadingPage, PageTitle, SetupNotice } from '@/components/app-shared';
import { ArrowRight, Check, Clock3, FilePlus2, MapPin, ShieldCheck, UserRound } from 'lucide-react';

export function ProfilePage({ profile }) {
    const [, navigate] = useLocation();
    const update = useUpdateProfile();
    const setup = useGetSetupStatus();
    const reportParams = { mineOnly: true };
    const reports = useListComplaints(reportParams, {
        query: {
            enabled: profile?.role === 'citizen' && setup.data?.ready === true,
            queryKey: getListComplaintsQueryKey(reportParams),
        },
    });
    const requestedReturnTo = new URLSearchParams(window.location.search).get('returnTo');
    const returnTo = requestedReturnTo?.startsWith('/')
        && !requestedReturnTo.startsWith('//')
        && !requestedReturnTo.startsWith('/\\')
        && requestedReturnTo !== '/profile'
        ? requestedReturnTo
        : null;
    const [name, setName] = useState(profile?.name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const save = (event) => {
        event.preventDefault();
        setMessage('');
        setError('');
        if (name.trim().length < 2 || phone.trim().length < 7 || phone.trim().length > 24) {
            setError('Enter your name and a valid mobile number.');
            return;
        }
        update.mutate({ data: { name: name.trim(), phone: phone.trim() } }, {
            onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
                setMessage('Your profile has been saved.');
                if (returnTo) navigate(returnTo);
            },
        });
    };
    return (
        <>
            <div className="mt-6">
                <PageTitle
                    eyebrow="Your account"
                    title="Profile details"
                    text="Keep your contact details and all your civic reports together in one place."
                />
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
                <form onSubmit={save} className="card p-5 md:p-7">
                    <div className="mb-6 flex items-center gap-3 border-b border-[#e6e4d9] pb-5">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#deeadc] text-primary">
                            <UserRound size={20} />
                        </span>
                        <div>
                            <div className="text-sm font-extrabold">{profile?.email}</div>
                            <div className="mt-1 text-[10px] text-[#86938a]">Signed in securely with your password</div>
                        </div>
                    </div>
                    <label className="mb-4 block">
                        <span className="label">Full name</span>
                        <input
                            className="field"
                            minLength={2}
                            maxLength={100}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Your name"
                            data-testid="input-profile-name"
                        />
                    </label>
                    <label className="mb-4 block">
                        <span className="label">Mobile number</span>
                        <input
                            className="field"
                            type="tel"
                            minLength={7}
                            maxLength={24}
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="+977 98…"
                            data-testid="input-profile-phone"
                        />
                        <span className="mt-1.5 block text-[10px] subtle">
                            Used only for your citizen profile. Phone sign-in is not required.
                        </span>
                    </label>
                    <div className="mb-5 rounded-xl bg-[#f2f2e9] p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#829087]">Account access</div>
                        <div className="mt-1 text-xs font-semibold capitalize text-[#36574d]">
                            {profile?.role?.replace('_', ' ') || 'Citizen'}
                            {profile?.department ? ` · ${departmentNames[profile.department]}` : ''}
                        </div>
                    </div>
                    {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
                    {message && <p className="mb-3 text-xs font-semibold text-[#42734c]">{message}</p>}
                    {update.isError && (
                        <p className="mb-3 text-xs text-destructive">We couldn’t save your details. Please try again.</p>
                    )}
                    <button className="btn btn-primary" type="submit" disabled={update.isPending}>
                        {update.isPending ? 'Saving profile…' : 'Save profile'} <Check size={15} />
                    </button>
                </form>
                <aside className="rounded-2xl border border-[#d7dfd4] bg-[#e9efe5] p-5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d9e7d8] text-primary">
                        <ShieldCheck size={18} />
                    </div>
                    <h3 className="mt-4 font-display text-sm font-extrabold">Your information stays useful</h3>
                    <p className="mt-2 text-xs leading-5 text-[#62766a]">
                        Your account email identifies your sign-in. Your name and phone number make your resident
                        profile complete and help city teams recognize reports.
                    </p>
                </aside>
            </div>
            {profile?.role === 'citizen' && (
                <section className="mt-8">
                    <PageTitle
                        eyebrow="Your activity"
                        title={`Your reports${reports.data ? ` (${reports.data.length})` : ''}`}
                        text="Track each report, its current status, and updates from the city."
                        actions={
                            <Link href="/complaints/new" className="btn btn-primary">
                                <FilePlus2 size={16} /> New report
                            </Link>
                        }
                    />
                    {setup.isError && (
                        <InlineError text="Report services could not be checked." retry={() => setup.refetch()} />
                    )}
                    {!setup.isLoading && setup.data?.ready !== true
                        ? <SetupNotice />
                        : <ListPanel
                            complaints={reports.data}
                            loading={setup.isLoading || reports.isLoading}
                            error={reports.isError}
                            retry={() => reports.refetch()}
                            emptyTitle="No reports yet"
                            emptyText="When you report a local issue, its status and updates will appear here."
                        />}
                </section>
            )}
        </>
    );
}
