import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  Code2,
  GitBranch,
  Zap,
  Shield,
  Terminal,
  Check,
  Github,
  Twitter,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Nav() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease }}
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[min(960px,calc(100%-2rem))]"
    >
      <nav className="flex items-center justify-between rounded-full border border-border/80 bg-background/70 px-2 py-2 pl-5 shadow-[var(--shadow-pill)] backdrop-blur-xl">
        <a href="#" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <Code2 className="h-3.5 w-3.5" />
          </span>
          Codeforge
        </a>
        <ul className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {["Features", "Pricing", "Docs", "Blog"].map((l) => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase()}`}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <a
            href="#"
            className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            Sign in
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </nav>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
      <motion.div style={{ y, opacity }} className="container mx-auto max-w-5xl px-6 text-center">
        <FadeUp>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-pill)] transition-colors hover:text-foreground"
          >
            <Sparkles className="h-3 w-3" /> Introducing Codeforge 2.0
            <ArrowRight className="h-3 w-3" />
          </a>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-6xl md:text-7xl">
            Ship production code
            <br />
            <span className="text-muted-foreground">10x faster</span> with AI
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Your AI coding partner writes, reviews, and refactors code instantly.
            Build features in minutes, not days.
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
            >
              Start building free <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-pill)] transition-colors hover:bg-secondary"
            >
              <Terminal className="h-4 w-4" /> npx codeforge init
            </a>
          </div>
        </FadeUp>

        <FadeUp delay={0.36}>
          <TerminalPreview />
        </FadeUp>
      </motion.div>
    </section>
  );
}

function TerminalPreview() {
  const lines = [
    { p: "$", c: "codeforge generate", t: "" },
    { p: "›", c: "Analyzing repository…", t: "context loaded" },
    { p: "›", c: "Drafting PR: add Stripe checkout", t: "12 files" },
    { p: "✓", c: "Tests passing", t: "94% coverage" },
    { p: "✓", c: "Pushed branch", t: "feat/checkout" },
  ];
  return (
    <div className="mx-auto mt-16 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease }}
        className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-3 text-xs text-muted-foreground font-mono">~/app — codeforge</span>
        </div>
        <div className="p-6 font-mono text-sm">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
              className="flex items-baseline gap-3 py-1"
            >
              <span className="w-3 text-muted-foreground">{l.p}</span>
              <span className="text-foreground">{l.c}</span>
              {l.t && (
                <span className="ml-auto text-xs text-muted-foreground">{l.t}</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Logos() {
  const logos = ["Linear", "Vercel", "Stripe", "Notion", "Figma", "Raycast"];
  return (
    <section className="border-y border-border/60 bg-secondary/30 py-12">
      <FadeUp>
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by engineering teams at
        </p>
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {logos.map((l) => (
            <span
              key={l}
              className="text-lg font-semibold tracking-tight text-muted-foreground/80"
            >
              {l}
            </span>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

const features = [
  {
    icon: Zap,
    title: "Instant generation",
    body: "Describe the change. Codeforge writes the diff, runs tests, and opens the PR in seconds.",
  },
  {
    icon: GitBranch,
    title: "Aware of your repo",
    body: "Trained on your codebase conventions, types, and APIs. Suggestions actually fit.",
  },
  {
    icon: Shield,
    title: "Reviews that catch bugs",
    body: "Static analysis plus reasoning — flags edge cases your linter never will.",
  },
  {
    icon: Code2,
    title: "Refactor at scale",
    body: "Rename across services, migrate APIs, modernize stacks. One command, every file.",
  },
  {
    icon: Terminal,
    title: "Lives in your terminal",
    body: "CLI, editor, and CI. No new app to learn — Codeforge meets you where you already work.",
  },
  {
    icon: Sparkles,
    title: "Tuned for production",
    body: "Type-safe, tested, and documented output. The kind of code you'd actually merge.",
  },
];

function Features() {
  return (
    <section id="features" className="py-28 md:py-36">
      <div className="container mx-auto max-w-6xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Features
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Everything you need to ship.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A toolkit built for the way modern teams actually write software.
          </p>
        </FadeUp>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease, delay: i * 0.06 }}
              className="group relative bg-card p-8 transition-colors hover:bg-secondary/40"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const tiers = [
  {
    name: "Hobby",
    price: "$0",
    desc: "For personal projects and exploration.",
    features: ["100 generations / mo", "1 repository", "Community support"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$20",
    desc: "For developers shipping every day.",
    features: [
      "Unlimited generations",
      "Unlimited repositories",
      "PR reviews & refactors",
      "Priority support",
    ],
    cta: "Start Pro trial",
    featured: true,
  },
  {
    name: "Team",
    price: "$60",
    desc: "For teams that ship together.",
    features: [
      "Everything in Pro",
      "Shared context & memory",
      "SSO + audit logs",
      "Dedicated support",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border bg-secondary/30 py-28 md:py-36">
      <div className="container mx-auto max-w-6xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Simple, honest pricing.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when your team is ready.
          </p>
        </FadeUp>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease, delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                t.featured
                  ? "border-foreground bg-foreground text-background shadow-[var(--shadow-elevated)]"
                  : "border-border bg-card shadow-[var(--shadow-card)]"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold tracking-tight">{t.name}</h3>
              <p
                className={`mt-1 text-sm ${
                  t.featured ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {t.desc}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">{t.price}</span>
                <span
                  className={`text-sm ${
                    t.featured ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  /mo
                </span>
              </div>
              <ul className="mt-7 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        t.featured ? "text-background" : "text-foreground"
                      }`}
                    />
                    <span className={t.featured ? "text-background/90" : "text-foreground"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`mt-8 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02] ${
                  t.featured
                    ? "bg-background text-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {t.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-28 md:py-36">
      <div className="container mx-auto max-w-4xl px-6">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 text-center shadow-[var(--shadow-elevated)] md:p-20">
            <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
            <div className="relative">
              <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                Start shipping today.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
                Join thousands of developers building faster with Codeforge.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
                >
                  Get started free <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground"
                >
                  Read the docs
                </a>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <Code2 className="h-3.5 w-3.5" />
          </span>
          Codeforge
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Codeforge Labs. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Twitter className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
