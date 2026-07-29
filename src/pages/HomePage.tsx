import { Link } from 'react-router-dom';
import { sarsCov2PublicInstance } from '../data/publicInstances';
import { usePageMeta } from '../lib/pageMeta';
import { buildConsoleShareHash } from '../lib/serverUrl';

const exampleQuery = `default
  .filter(region = 'Europe')
  .map({"S[69]" := S.at(69), "S[70]" := S.at(70), "S[501]" := S.at(501)})
  .groupBy({count := count()}, {pangoLineage, "S[69]", "S[70]", "S[501]"})
  .orderBy({count.desc()})
  .limit(10)`;

const exampleShareLink = `/console/${buildConsoleShareHash(sarsCov2PublicInstance.server, exampleQuery)}`;

export default function HomePage() {
    usePageMeta();

    return (
        <>
            <section className='home-hero border-b border-base-300 bg-linear-to-b from-primary/8 to-base-100'>
                <div className='mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-6 lg:py-28'>
                    <div className='hero-copy max-w-3xl'>
                        <h1 className='text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl'>
                            Analytical database for sequences
                        </h1>
                        <p className='mt-6 max-w-2xl text-lg leading-relaxed text-base-content/70 sm:text-xl'>
                            SILO stores genomic sequences and their metadata. Its query language supports filtering,
                            aggregation, and queries on reference-aligned nucleotide and amino-acid sequences.
                        </p>
                        <div className='mt-8 flex flex-wrap gap-3'>
                            <Link className='btn btn-primary' to='/docs'>
                                Read the documentation
                            </Link>
                            <a
                                className='btn btn-outline'
                                href='https://github.com/GenSpectrum/LAPIS-SILO'
                                target='_blank'
                                rel='noreferrer'
                            >
                                View on GitHub
                            </a>
                        </div>
                    </div>
                    <div className='hero-query self-center overflow-hidden rounded-box border border-base-300 bg-neutral shadow-sm'>
                        <div className='flex items-center gap-1.5 border-b border-neutral-content/15 px-4 py-3'>
                            <span className='size-2.5 rounded-full bg-error' />
                            <span className='size-2.5 rounded-full bg-warning' />
                            <span className='size-2.5 rounded-full bg-success' />
                            <span className='ml-2 text-xs text-neutral-content/55'>SILO query language</span>
                            <Link className='hero-execute btn ml-auto btn-xs' to={exampleShareLink}>
                                Execute
                            </Link>
                        </div>
                        <pre className='overflow-x-auto p-5 text-sm leading-7 text-neutral-content'>
                            <code>{exampleQuery}</code>
                        </pre>
                    </div>
                </div>
            </section>

            <section className='capabilities-section mx-auto max-w-7xl px-4 py-14 lg:px-6 lg:py-20'>
                <div className='max-w-3xl'>
                    <h2 className='text-3xl font-bold tracking-tight'>Queries on metadata and sequences</h2>
                    <p className='mt-4 leading-relaxed text-base-content/70'>
                        A query is a pipeline of operations on a table. It can filter and aggregate metadata, retrieve
                        records, or inspect changes relative to reference sequences.
                    </p>
                </div>
                <div className='mt-8 grid gap-4 md:grid-cols-3'>
                    <Capability title='Filter and retrieve'>
                        Select records by metadata, lineages, and sequence changes.
                    </Capability>
                    <Capability title='Aggregate'>Group, count, order, and transform data.</Capability>
                    <Capability title='Query sequences'>
                        Query substitutions, deletions, insertions, mutation profiles, and reference positions.
                    </Capability>
                </div>
            </section>

            <GetStartedSection />
            <ProjectsSection />
        </>
    );
}

function GetStartedSection() {
    return (
        <section className='get-started-section border-y border-base-300 bg-base-200'>
            <div className='mx-auto max-w-7xl px-4 py-14 lg:px-6 lg:py-16'>
                <div className='text-center'>
                    <h2 className='text-3xl font-bold tracking-tight'>Get started</h2>
                    <p className='mt-3 text-base-content/70'>
                        Read the documentation, work through exercises, or query a SILO instance.
                    </p>
                </div>
                <div className='mt-8 grid gap-5 md:grid-cols-3'>
                    <PathCard
                        to='/docs'
                        eyebrow='Read'
                        title='Documentation'
                        description='Read about SILO data and queries, or look up query-language and HTTP API behavior.'
                        action='Browse documentation'
                    />
                    <PathCard
                        to='/exercises'
                        eyebrow='Practice'
                        title='Exercises'
                        description='Write queries against a fixed SARS-CoV-2 dataset and compare the results with reference queries.'
                        action='Start an exercise'
                    />
                    <PathCard
                        to='/console'
                        eyebrow='Use'
                        title='Console'
                        description='Connect to a public SILO instance or query your own data directly from the browser (using WebAssembly)'
                        action='Open the console'
                    />
                </div>
            </div>
        </section>
    );
}

function ProjectsSection() {
    return (
        <section className='projects-section mx-auto max-w-7xl px-4 py-14 lg:px-6 lg:py-20'>
            <div className='grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>SILO in other projects</h2>
                    <p className='mt-3 leading-relaxed text-base-content/70'>
                        GenSpectrum uses SILO for genomic data queries. Loculus uses SILO as its query engine, and
                        Pathoplexus is built with Loculus.
                    </p>
                </div>
                <div className='grid gap-3 sm:grid-cols-3'>
                    <ProjectLink href='https://genspectrum.org/' label='GenSpectrum' />
                    <ProjectLink href='https://loculus.org/' label='Loculus' />
                    <ProjectLink href='https://pathoplexus.org/' label='Pathoplexus' />
                </div>
            </div>
        </section>
    );
}

function Capability({ title, children }: { title: string; children: string }) {
    return (
        <div className='capability-card card border border-base-300 bg-base-100 card-sm'>
            <div className='card-body'>
                <h3 className='card-title text-base'>{title}</h3>
                <p className='text-sm leading-relaxed text-base-content/65'>{children}</p>
            </div>
        </div>
    );
}

function ProjectLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            className='project-link btn h-auto justify-start bg-base-100 px-4 py-4 text-base'
            href={href}
            target='_blank'
            rel='noreferrer'
        >
            {label}
            <span className='ml-auto text-base-content/40'>↗</span>
        </a>
    );
}

function PathCard({
    to,
    eyebrow,
    title,
    description,
    action,
}: {
    to: string;
    eyebrow?: string;
    title: string;
    description: string;
    action: string;
}) {
    return (
        <Link
            className='path-card card border border-base-300 bg-base-100 transition-colors hover:border-primary/50 hover:no-underline'
            to={to}
        >
            <div className='card-body'>
                {eyebrow && <p className='text-xs font-semibold tracking-wide text-primary uppercase'>{eyebrow}</p>}
                <h3 className='card-title text-xl'>{title}</h3>
                <p className='leading-relaxed text-base-content/65'>{description}</p>
                <div className='mt-3 card-actions'>
                    <span className='link font-medium link-primary'>{action} →</span>
                </div>
            </div>
        </Link>
    );
}
