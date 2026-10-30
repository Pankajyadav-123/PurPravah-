import { Link } from 'wouter';
import { ArrowRight, Building2, FilePlus2, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/app-shared';
import { categories } from '@/lib/app-data';

const categoryDetails = {
    road_damage: {
        className: 'road',
        description: 'Potholes, damaged roads, and broken footpaths.',
    },
    electricity: {
        className: 'electricity',
        description: 'Broken streetlights and other electrical problems.',
    },
    garbage: {
        className: 'garbage',
        description: 'Overflowing bins and unclean public spaces.',
    },
    water_leakage: {
        className: 'water',
        description: 'Water leaks, pipeline damage, and supply issues.',
    },
};

const reportingSteps = [
    ['01', 'Report an issue', 'Share the problem and its location.'],
    ['02', 'Track progress', 'Get updates as your report is reviewed.'],
    ['03', 'See the change', 'Follow the issue through resolution.'],
];

const serviceFeatures = [
    [FilePlus2, 'Easy to report', 'Simple and quick issue reporting process.', 'green'],
    [MapPin, 'Clear updates', 'Track your complaint in one place.', 'blue'],
    [Building2, 'Right team', 'Your report reaches the right department.', 'purple'],
    [UsersRound, 'Built together', 'A stronger community starts with you.', 'orange'],
];

export function Landing({ signedIn, profile }) {
    const workspaceHref = profile?.role === 'admin'
        ? '/admin'
        : profile?.role === 'department_staff'
            ? '/department'
            : '/citizen';
    const reportHref = signedIn
        ? profile?.role === 'citizen' ? '/complaints/new' : workspaceHref
        : '/sign-up?returnTo=%2Fcomplaints%2Fnew';
    const trackHref = signedIn
        ? workspaceHref
        : '/sign-in?returnTo=%2Fcitizen';

    return (
        <main className="landing-page" id="home">
            <SiteHeader signedIn={signedIn} profile={profile} />

            <section className="landing-hero">
                <div className="landing-hero-shade" />
                <div className="landing-hero-inner">
                    <div className="landing-hero-copy">
                        <div className="landing-hero-badge">
                            <span className="landing-live-dot" />
                            CLEANER <i>·</i> SAFER <i>·</i> BETTER CITY
                        </div>
                        <h1>
                            Report local issues.
                            <br />
                            Build a <span>better<br className="landing-mobile-break" /> tomorrow.</span>
                        </h1>
                        <p>
                            Your voice can make a difference. Report damaged roads, electricity issues,
                            garbage, or water problems, and follow the response in one place.
                        </p>
                        <div className="landing-hero-actions">
                            <Link className="landing-button landing-button-primary" href={reportHref}>
                                <FilePlus2 size={16} /> Report an issue <ArrowRight size={17} />
                            </Link>
                            <Link className="landing-button landing-button-glass" href={trackHref}>
                                <MapPin size={16} /> Track your complaint
                            </Link>
                        </div>
                        <div className="landing-hero-note">
                            <ShieldCheck size={17} />
                            Every report stays connected to you and the team responsible.
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-trust-strip" aria-label="How the service helps">
                {serviceFeatures.map(([Icon, title, description, tone]) => (
                    <article className="landing-feature" key={title}>
                        <span className={`landing-feature-icon is-${tone}`}><Icon size={24} strokeWidth={1.9} /></span>
                        <div><h2>{title}</h2><p>{description}</p></div>
                    </article>
                ))}
            </section>

            <section className="landing-section" id="issues">
                <div className="landing-section-heading">
                    <span className="landing-eyebrow">HOW CAN WE HELP?</span>
                    <h2>What issue do you see?</h2>
                    <p>Choose a category and tell us what needs attention in your neighborhood.</p>
                </div>
                <div className="landing-issue-grid">
                    {categories.filter(({ value }) => categoryDetails[value]).map((category) => {
                        const Icon = category.icon;
                        const details = categoryDetails[category.value];
                        return (
                            <Link className={`landing-issue-card ${details.className}`} href={reportHref} key={category.value}>
                                <span className="landing-issue-icon"><Icon size={29} strokeWidth={1.8} /></span>
                                <h3>{category.label}</h3>
                                <p>{details.description}</p>
                                <span className="landing-issue-link">Report this issue <ArrowRight size={14} /></span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="landing-how-section" id="how">
                <div className="landing-section-heading">
                    <span className="landing-eyebrow">SIMPLE &amp; TRANSPARENT</span>
                    <h2>Just 3 simple steps</h2>
                    <p>Report. Track. See the change.</p>
                </div>
                <div className="landing-steps-grid">
                    {reportingSteps.map(([number, title, description]) => (
                        <article className="landing-step-card" key={number}>
                            <span className="landing-step-number">{number}</span>
                            <h3>{title}</h3>
                            <p>{description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-cta" id="contact">
                <div>
                    <span className="landing-cta-eyebrow">YOUR CITY. YOUR VOICE.</span>
                    <h2>Let’s build a better city together.</h2>
                    <p>See something that needs attention? Let your city know and stay connected to what happens next.</p>
                </div>
                <Link className="landing-button landing-button-light" href={reportHref}>
                    Get started <ArrowRight size={16} />
                </Link>
            </section>

            <SiteFooter signedIn={signedIn} profile={profile} />
        </main>
    );
}
