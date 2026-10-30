import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
    getGetDashboardSummaryQueryKey,
    getListComplaintsQueryKey,
    useCreateComplaint,
    useGetSetupStatus,
} from '@/lib/api-client-react';
import { categories } from '@/lib/app-data';
import { queryClient } from '@/lib/query-client';
import {
    ComplaintLocationMap,
    PageTitle,
    SetupNotice,
    UploadPhoto,
} from '@/components/app-shared';
import {
    ArrowLeft,
    FilePlus2,
    MapPin,
    Send,
    ShieldCheck,
} from 'lucide-react';

const localityFields = [
    { name: 'city', label: 'City', placeholder: 'e.g. Lucknow', optional: true },
    { name: 'village', label: 'Village / municipality', placeholder: 'Village or municipality', optional: true },
    { name: 'district', label: 'District', placeholder: 'e.g. Lucknow District', optional: false },
    { name: 'state', label: 'State / province', placeholder: 'e.g. Uttar Pradesh', optional: false },
];

export function NewComplaint() {
    const [, navigate] = useLocation();
    const setup = useGetSetupStatus();
    const create = useCreateComplaint();
    const [form, setForm] = useState({
        category: 'road_damage',
        description: '',
        address: '',
        city: '',
        village: '',
        district: '',
        state: '',
        latitude: 26.8467,
        longitude: 80.9462,
        photoUrl: '',
    });
    const [error, setError] = useState('');
    const [hasLocation, setHasLocation] = useState(false);
    const [locationMessage, setLocationMessage] = useState('');

    const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
    const setLocation = (latitude, longitude, message) => {
        set('latitude', latitude);
        set('longitude', longitude);
        setHasLocation(true);
        setLocationMessage(message);
    };

    const useMyLocation = () => {
        setLocationMessage('');
        if (!navigator.geolocation) {
            setLocationMessage('Location access is not available in this browser. Pin the location on the map instead.');
            return;
        }
        setLocationMessage('Finding your location…');
        navigator.geolocation.getCurrentPosition(
            position => setLocation(
                position.coords.latitude,
                position.coords.longitude,
                'Your current location is selected.',
            ),
            () => setLocationMessage('We could not access your location. Pin it on the map instead.'),
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
        );
    };

    const submit = (event) => {
        event.preventDefault();
        setError('');
        if (!setup.data?.ready) {
            setError('The report service is not ready yet. Please try again later.');
            return;
        }
        if (!form.district.trim() || !form.state.trim()) {
            setError('District and state/province are required to submit your report.');
            return;
        }
        if (form.description.trim().length < 10 || form.address.trim().length < 4) {
            setError('Add at least 10 characters describing the issue and a more complete street or landmark location.');
            return;
        }
        if (!hasLocation
            || !Number.isFinite(form.latitude)
            || Math.abs(form.latitude) > 90
            || !Number.isFinite(form.longitude)
            || Math.abs(form.longitude) > 180) {
            setError('Choose a valid location using GPS or the map.');
            return;
        }
        if (!form.photoUrl) {
            setError('Upload a photo of the issue before submitting.');
            return;
        }

        const data = {
            ...form,
            description: form.description.trim(),
            address: [
                form.address,
                form.village,
                form.city,
                form.district,
                form.state,
            ].map(value => value.trim()).filter(Boolean).join(', '),
            city: form.city.trim(),
            village: form.village.trim(),
            district: form.district.trim(),
            state: form.state.trim(),
        };
        create.mutate({ data }, {
            onSuccess: complaint => {
                void queryClient.invalidateQueries({
                    queryKey: getListComplaintsQueryKey({ mineOnly: true }),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetDashboardSummaryQueryKey(),
                });
                navigate(`/complaints/${complaint.id}`);
            },
        });
    };

    const validLatitude = Number.isFinite(form.latitude) && Math.abs(form.latitude) <= 90
        ? form.latitude
        : 27.7172;
    const validLongitude = Number.isFinite(form.longitude) && Math.abs(form.longitude) <= 180
        ? form.longitude
        : 85.324;
    const selectMapLocation = (latitude, longitude) =>
        setLocation(latitude, longitude, 'Map pin selected. Add a nearby street or landmark above.');

    return (
        <>
            <SetupNotice />
            <div className="mt-6">
                <PageTitle
                    eyebrow="New report"
                    title="Tell us what needs attention."
                    text="Add the issue, a map pin, and nearby city or local-area details to help the right team find it."
                    actions={
                        <Link href="/citizen" className="btn btn-quiet">
                            <ArrowLeft size={15} /> Back to reports
                        </Link>
                    }
                />
            </div>

            <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
                <div className="card p-5 md:p-7">
                    <div className="mb-5 flex items-center gap-3 border-b border-[#e6e4d9] pb-5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7eee4] text-primary">
                            <FilePlus2 size={18} />
                        </span>
                        <div>
                            <div className="text-sm font-extrabold">Issue details</div>
                            <div className="mt-0.5 text-xs subtle">Tell us what you see, not what you think caused it.</div>
                        </div>
                    </div>

                    <label className="label">What kind of issue is it?</label>
                    <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3">
                        {categories.map(({ value, label, icon: Icon }) => (
                            <button
                                type="button"
                                onClick={() => set('category', value)}
                                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition ${
                                    form.category === value
                                        ? 'border-primary bg-[#e8f0e7] text-primary'
                                        : 'border-[#e1e2d7] bg-[#faf9f2] text-[#61736a] hover:border-[#aac2b5]'
                                }`}
                                data-testid={`select-category-${value}`}
                                key={value}
                            >
                                <Icon size={16} /> {label}
                            </button>
                        ))}
                    </div>

                    <div className="mb-5">
                        <label className="label" htmlFor="description">Describe the issue</label>
                        <textarea
                            id="description"
                            className="field min-h-[130px] resize-y"
                            maxLength={2000}
                            placeholder="What happened? Is it blocking a path, affecting nearby homes, or getting worse?"
                            value={form.description}
                            onChange={event => set('description', event.target.value)}
                            data-testid="input-complaint-description"
                        />
                        <div className="mt-1 text-right text-[10px] subtle">{form.description.length}/2000</div>
                    </div>

                    <section className="mb-5" aria-labelledby="location-heading">
                        <h2 id="location-heading" className="label">Where is it?</h2>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-[#819087]" size={16} />
                            <input
                                id="address"
                                className="field !pl-10"
                                minLength={4}
                                maxLength={300}
                                placeholder="Street, landmark, ward or nearby address"
                                value={form.address}
                                onChange={event => set('address', event.target.value)}
                                data-testid="input-complaint-address"
                            />
                        </div>
                        <p className="mt-1.5 text-[11px] subtle">Enter a street or landmark, then add any local-area details that apply.</p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {localityFields.map(({ name, label, placeholder, optional }) => (
                                <label key={name}>
                                    <span className="label">
                                        {label}{' '}
                                        <span className="font-normal subtle">
                                            ({optional ? 'optional' : 'required'})
                                        </span>
                                    </span>
                                    <input
                                        className="field"
                                        required={!optional}
                                        maxLength={120}
                                        aria-required={!optional}
                                        placeholder={placeholder}
                                        value={form[name]}
                                        onChange={event => set(name, event.target.value)}
                                        data-testid={`input-complaint-${name}`}
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#46645a]">Pin the issue location</span>
                            <button
                                type="button"
                                className="btn btn-quiet !px-3 !py-2 text-xs"
                                onClick={useMyLocation}
                                data-testid="button-use-my-location"
                            >
                                <MapPin size={14} /> Use my location
                            </button>
                        </div>
                        <p className="mt-2 text-[11px] leading-5 subtle">
                            Choose a point on the map or use GPS. The map pin and area fields are saved with your report.
                        </p>
                        <ComplaintLocationMap
                            center={[validLatitude, validLongitude]}
                            hasLocation={hasLocation}
                            onPick={selectMapLocation}
                        />
                        <p
                            className={`mt-2 text-[11px] ${locationMessage ? 'text-[#426f49]' : 'subtle'}`}
                            aria-live="polite"
                        >
                            {locationMessage || (hasLocation
                                ? `Selected: ${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
                                : 'No location selected yet.')}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label>
                                <span className="label">Latitude</span>
                                <input
                                    type="number"
                                    className="field"
                                    step="any"
                                    value={form.latitude}
                                    onChange={event => setLocation(
                                        Number(event.target.value),
                                        form.longitude,
                                        'Coordinates entered manually.',
                                    )}
                                    data-testid="input-latitude"
                                />
                            </label>
                            <label>
                                <span className="label">Longitude</span>
                                <input
                                    type="number"
                                    className="field"
                                    step="any"
                                    value={form.longitude}
                                    onChange={event => setLocation(
                                        form.latitude,
                                        Number(event.target.value),
                                        'Coordinates entered manually.',
                                    )}
                                    data-testid="input-longitude"
                                />
                            </label>
                        </div>
                    </section>

                    <UploadPhoto
                        purpose="complaint"
                        value={form.photoUrl}
                        onUploaded={url => set('photoUrl', url)}
                    />

                    {error && <div className="mt-4 rounded-xl bg-[#fff0e9] px-4 py-3 text-xs text-[#94543e]">{error}</div>}
                    {create.isError && (
                        <div className="mt-4 rounded-xl bg-[#fff0e9] px-4 py-3 text-xs text-[#94543e]">
                            Your report couldn’t be submitted. Check the details and try again.
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e4d9] pt-5">
                        <p className="max-w-sm text-[11px] leading-5 subtle">Submitting sends your report to the civic service desk for review.</p>
                        <button
                            disabled={create.isPending || setup.isLoading || !setup.data?.ready}
                            className="btn btn-primary"
                            type="submit"
                        >
                            {create.isPending ? 'Sending report…' : 'Submit report'} <Send size={15} />
                        </button>
                    </div>
                </div>

                <aside className="space-y-4">
                    <div className="card bg-[#e8eee4] p-5">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d6e4d5] text-primary">
                            <ShieldCheck size={19} />
                        </div>
                        <h3 className="mt-4 font-display text-sm font-extrabold">What happens next?</h3>
                        <ol className="mt-4 space-y-4">
                            {[
                                ['01', 'We review the report', 'A team member checks the details.'],
                                ['02', 'It reaches the right team', 'The responsible department is assigned.'],
                                ['03', 'You follow the progress', 'Updates appear in your report history.'],
                            ].map(([number, title, detail]) => (
                                <li className="flex gap-3" key={number}>
                                    <span className="font-display text-xs font-extrabold text-[#c27648]">{number}</span>
                                    <span>
                                        <b className="block text-xs">{title}</b>
                                        <small className="mt-1 block text-[10px] leading-4 subtle">{detail}</small>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="rounded-2xl border border-[#e6d4ba] bg-[#fff4df] p-4 text-xs leading-5 text-[#715733]">
                        <strong className="block">Please don’t include private information.</strong>
                        Describe the public issue and its location. Do not add passwords, identity numbers, or personal contact details.
                    </div>
                </aside>
            </form>
        </>
    );
}
