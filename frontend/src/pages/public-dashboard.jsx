import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Activity, CalendarClock, Check, CircleHelp, Clock3, MapPin, ShieldCheck } from 'lucide-react';
import { useGetPublicComplaintStats } from '@/lib/api-client-react';
import { InlineError, LoadingPage, reportPinIcon, SiteFooter, SiteHeader } from '@/components/app-shared';
import { categories, statusLabels } from '@/lib/app-data';

const cards = [
    { key: 'total', label: 'Total complaints', icon: CircleHelp, tone: 'blue' },
    { key: 'pending', label: 'Awaiting action', icon: Clock3, tone: 'amber' },
    { key: 'inProgress', label: 'In progress', icon: Activity, tone: 'teal' },
    { key: 'resolved', label: 'Solved', icon: Check, tone: 'green' },
];

function formatDate(value) {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDuration(start, end = new Date()) {
    const elapsedMinutes = Math.max(0, Math.floor((new Date(end) - new Date(start)) / 60000));
    const days = Math.floor(elapsedMinutes / 1440);
    const hours = Math.floor((elapsedMinutes % 1440) / 60);
    const minutes = elapsedMinutes % 60;

    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function PublicMapViewport({ complaints }) {
    const map = useMap();

    useEffect(() => {
        const locations = complaints
            .filter(({ mapLatitude, mapLongitude }) => Number.isFinite(mapLatitude) && Number.isFinite(mapLongitude))
            .map(({ mapLatitude, mapLongitude }) => [mapLatitude, mapLongitude]);

        if (!locations.length) {
            map.setView([26.8467, 80.9462], 11);
        } else if (locations.length === 1) {
            map.setView(locations[0], 12);
        } else {
            map.fitBounds(locations, { padding: [32, 32], maxZoom: 12 });
        }
    }, [complaints, map]);

    return null;
}

function PublicComplaintsMap({ complaints }) {
    const mappableComplaints = complaints.filter(
        ({ mapLatitude, mapLongitude }) => Number.isFinite(mapLatitude) && Number.isFinite(mapLongitude),
    );

    return (
        <div className="public-complaints-map-wrap">
            <MapContainer center={[26.8467, 80.9462]} zoom={11} className="public-complaints-map">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <PublicMapViewport complaints={mappableComplaints} />
                {mappableComplaints.map((complaint) => (
                    <Marker
                        key={complaint.publicId}
                        position={[complaint.mapLatitude, complaint.mapLongitude]}
                        icon={reportPinIcon}
                    >
                        <Popup>
                            <strong>{categories.find(({ value }) => value === complaint.category)?.label ?? 'Civic issue'}</strong>
                            <br />
                            {statusLabels[complaint.status]}
                            <br />
                            {[complaint.area, complaint.district].filter(Boolean).join(', ') || 'Approximate location'}
                            <br />
                            {complaint.publicId}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            <p className="public-map-privacy">Map pins are approximate and rounded to protect exact report locations.</p>
        </div>
    );
}

export function PublicDashboardPage({ signedIn, profile }) {
    const stats = useGetPublicComplaintStats();
    const recentComplaints = stats.data?.recentComplaints ?? [];
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const filteredComplaints = useMemo(() => recentComplaints.filter((complaint) => (
        (categoryFilter === 'all' || complaint.category === categoryFilter)
        && (statusFilter === 'all' || complaint.status === statusFilter)
    )), [recentComplaints, categoryFilter, statusFilter]);
    const resolvedPercent = stats.data?.total
        ? Math.round((stats.data.resolved / stats.data.total) * 100)
        : 0;

    return (
        <main className="public-dashboard">
            <SiteHeader signedIn={signedIn} profile={profile} />

            <section className="public-dashboard-hero">
                <span className="public-dashboard-eyebrow"><span /> PUBLIC SERVICE OVERVIEW</span>
                <h1>Community complaints,<br /><span>clear for everyone.</span></h1>
                <p>See what needs attention, which area is affected, and how city teams are responding. Personal details and precise locations stay private.</p>
            </section>

            <section className="public-dashboard-content" aria-label="Public complaint statistics">
                {stats.isLoading && <LoadingPage />}
                {stats.isError && (
                    <InlineError
                        text="Public complaint statistics could not be loaded."
                        retry={() => stats.refetch()}
                    />
                )}
                {stats.data && (
                    <>
                        <div className="public-stat-grid">
                            {cards.map(({ key, label, icon: Icon, tone }) => (
                                <article className={`public-stat-card is-${tone}`} key={key}>
                                    <span className="public-stat-icon"><Icon size={20} /></span>
                                    <span className="public-stat-label">{label}</span>
                                    <strong>{stats.data[key].toLocaleString()}</strong>
                                    {key === 'resolved' && <span className="public-stat-footnote">of all complaints</span>}
                                </article>
                            ))}
                        </div>

                        <section className="public-resolution-card">
                            <div className="public-resolution-heading">
                                <div>
                                    <span className="public-dashboard-eyebrow">SERVICE PROGRESS</span>
                                    <h2>Complaints resolved</h2>
                                    <p>{stats.data.resolved.toLocaleString()} of {stats.data.total.toLocaleString()} total complaints</p>
                                </div>
                                <strong>{resolvedPercent}%</strong>
                            </div>
                            <div
                                className="public-resolution-track"
                                role="progressbar"
                                aria-label="Percentage of complaints resolved"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={resolvedPercent}
                            >
                                <span style={{ width: `${resolvedPercent}%` }} />
                            </div>
                            {stats.data.rejected > 0 && (
                                <p className="public-rejected-note">
                                    {stats.data.rejected.toLocaleString()} {stats.data.rejected === 1 ? 'complaint was' : 'complaints were'} reviewed and not accepted.
                                </p>
                            )}
                        </section>

                        <section className="public-complaints-section" aria-labelledby="public-complaints-heading">
                            <div className="public-complaints-heading">
                                <div>
                                    <span className="public-dashboard-eyebrow">COMMUNITY REPORTS</span>
                                    <h2 id="public-complaints-heading">Complaint map and reports</h2>
                                    <p>Explore approximate locations and filter the latest {recentComplaints.length} reports.</p>
                                </div>
                                <span className="public-complaints-count">
                                    {filteredComplaints.length} shown
                                </span>
                            </div>
                            <div className="public-complaint-filters">
                                <label>
                                    <span>Problem type</span>
                                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                                        <option value="all">All types</option>
                                        {categories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>Status</span>
                                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                        <option value="all">All statuses</option>
                                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </label>
                            </div>
                            {filteredComplaints.length ? (
                                <>
                                <PublicComplaintsMap complaints={filteredComplaints} />
                                <div className="public-complaints-list">
                                    {filteredComplaints.map((complaint) => {
                                        const category = categories.find(({ value }) => value === complaint.category);
                                        const resolved = complaint.status === 'resolved';
                                        const rejected = complaint.status === 'rejected';
                                        const Icon = category?.icon ?? CircleHelp;
                                        const location = [complaint.area, complaint.district, complaint.state]
                                            .filter(Boolean)
                                            .join(', ');

                                        return (
                                            <article className="public-complaint-card" key={complaint.publicId}>
                                                <div className="public-complaint-card-top">
                                                    <span className="public-complaint-category-icon"><Icon size={19} /></span>
                                                    <div className="public-complaint-title">
                                                        <span className="public-complaint-id">{complaint.publicId}</span>
                                                        <h3>{category?.label ?? 'Civic issue'}</h3>
                                                    </div>
                                                    <span className={`public-complaint-status is-${complaint.status}`}>
                                                        {statusLabels[complaint.status]}
                                                    </span>
                                                </div>
                                                <p className="public-complaint-description">{complaint.description}</p>
                                                <div className="public-complaint-meta">
                                                    <span><MapPin size={14} />{location || 'Location not provided'}</span>
                                                    <span><CalendarClock size={14} />Reported {formatDate(complaint.createdAt)}</span>
                                                    <span>
                                                        <Clock3 size={14} />
                                                        {resolved
                                                            ? complaint.resolvedAt
                                                                ? `Resolved in ${formatDuration(complaint.createdAt, complaint.resolvedAt)}`
                                                                : 'Resolution time unavailable'
                                                            : rejected
                                                                ? 'Closed after review'
                                                                : `Open for ${formatDuration(complaint.createdAt)}`}
                                                    </span>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                                </>
                            ) : (
                                <div className="public-complaints-empty">
                                    {recentComplaints.length ? 'No reports match these filters.' : 'No community reports yet.'}
                                </div>
                            )}
                        </section>

                        <p className="public-privacy-note">
                            <ShieldCheck size={17} />
                            Issue descriptions, categories, status, report dates, and approximate area are public. Names, contact details, photos, exact addresses, and GPS coordinates are never displayed.
                        </p>
                    </>
                )}
            </section>

            <SiteFooter />
        </main>
    );
}
