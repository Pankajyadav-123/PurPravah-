import { Link } from 'wouter';
import { ArrowRight, Check, ClipboardList, Eye, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/app-shared';

const principles = [
    {
        icon: UsersRound,
        title: 'Residents are partners',
        text: 'Local knowledge helps city teams understand what needs attention in each neighborhood.',
    },
    {
        icon: Eye,
        title: 'Progress stays visible',
        text: 'Reports keep their status and updates together, so residents can follow what happens next.',
    },
    {
        icon: ShieldCheck,
        title: 'Work reaches the right team',
        text: 'Reports are organized by issue and routed to the department responsible for follow-up.',
    },
];

const steps = [
    ['01', 'Share the issue', 'Describe the problem and add its location.'],
    ['02', 'The team reviews it', 'The responsible city team receives the report.'],
    ['03', 'Follow the updates', 'Check progress and resolution details in your account.'],
];

export function AboutPage({ signedIn, profile }) {
    const workspaceHref = profile?.role === 'admin'
        ? '/admin'
        : profile?.role === 'department_staff'
            ? '/department'
            : '/citizen';
    const reportHref = signedIn
        ? profile?.role === 'citizen' ? '/complaints/new' : workspaceHref
        : '/sign-up?returnTo=%2Fcomplaints%2Fnew';

    return (
        <main className="landing-page about-page">
            <SiteHeader signedIn={signedIn} profile={profile} />

            <section className="about-hero">
                <div className="about-hero-inner">
                    <span className="landing-eyebrow">ABOUT PURPRAVAH</span>
                    <h1>Your neighborhood.<br /><span>Your voice in city services.</span></h1>
                    <p>
                        PurPravah helps residents report local issues and gives city teams a shared place
                        to review reports, record progress, and keep people informed.
                    </p>
                    <Link className="landing-button landing-button-primary" href={reportHref}>
                        Make a report <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="about-hero-mark" aria-hidden="true"><MapPin size={84} strokeWidth={1.2} /></div>
            </section>

            <section className="landing-section about-intro">
                <div className="about-intro-copy">
                    <span className="landing-eyebrow">A BETTER WAY TO WORK TOGETHER</span>
                    <h2>Make local problems easier to act on.</h2>
                    <p>
                        A damaged road, a broken streetlight, overflowing waste, or a water leak can affect
                        an entire community. PurPravah brings the report and its follow-up into one clear
                        process, connecting residents with the city teams responsible for action.
                    </p>
                </div>
                <div className="about-checklist">
                    <div><Check size={17} /><span>Share useful details and a location</span></div>
                    <div><Check size={17} /><span>Keep reports and updates together</span></div>
                    <div><Check size={17} /><span>See how the response progresses</span></div>
                </div>
            </section>

            <section className="landing-how-section about-principles">
                <div className="landing-section-heading">
                    <span className="landing-eyebrow">WHAT GUIDES US</span>
                    <h2>Built for clear civic collaboration</h2>
                    <p>One shared process helps residents and city teams stay connected from report to response.</p>
                </div>
                <div className="about-principles-grid">
                    {principles.map(({ icon: Icon, title, text }) => (
                        <article className="about-principle-card" key={title}>
                            <span><Icon size={22} /></span>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-section about-process">
                <div className="landing-section-heading">
                    <span className="landing-eyebrow">HOW IT WORKS</span>
                    <h2>From a local concern to a visible response</h2>
                </div>
                <div className="landing-steps-grid">
                    {steps.map(([number, title, text]) => (
                        <article className="landing-step-card" key={number}>
                            <span className="landing-step-number">
                                {number === '01' ? <MapPin size={18} /> : number === '02' ? <ClipboardList size={18} /> : <Check size={18} />}
                            </span>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-cta about-cta">
                <div>
                    <span className="landing-cta-eyebrow">YOUR CITY. YOUR VOICE.</span>
                    <h2>Help make your neighborhood better.</h2>
                    <p>Report an issue and stay connected to its progress.</p>
                </div>
                <Link className="landing-button landing-button-light" href={reportHref}>
                    Get started <ArrowRight size={16} />
                </Link>
            </section>

            <SiteFooter signedIn={signedIn} profile={profile} />
        </main>
    );
}
