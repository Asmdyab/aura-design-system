import { createFileRoute } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  useInView,
  AnimatePresence,
  animate,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
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

/* ---------- Reusable motion primitives ---------- */

function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15, mass: 0.4 });

  function onMove(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease, delay: i * 0.06 }}
            className="inline-block pr-[0.25em]"
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref}>
      {Math.round(val).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------- Cursor blob (global) ---------- */

function CursorBlob() {
  const x = useSpring(useMotionValue(-200), { stiffness: 120, damping: 20, mass: 0.6 });
  const y = useSpring(useMotionValue(-200), { stiffness: 120, damping: 20, mass: 0.6 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.06),transparent_60%)] blur-2xl md:block"
    />
  );
}

/* ---------- Nav ---------- */

function Nav() {
  const { scrollY } = useScroll();
  const width = useTransform(scrollY, [0, 200], ["min(960px, calc(100% - 2rem))", "min(720px, calc(100% - 2rem))"]);
  const padY = useTransform(scrollY, [0, 200], [8, 6]);
  const bg = useTransform(scrollY, [0, 200], ["rgba(248,250,252,0.6)", "rgba(248,250,252,0.85)"]);

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease }}
      style={{ width }}
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
    >
      <motion.nav
        style={{ paddingTop: padY, paddingBottom: padY, backgroundColor: bg }}
        className="flex items-center justify-between rounded-full border border-border/70 px-2 pl-5 shadow-[var(--shadow-pill)] backdrop-blur-xl"
      >
        <a href="#" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <motion.span
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background"
          >
            <Code2 className="h-3.5 w-3.5" />
          </motion.span>
          Codeforge
        </a>
        <ul className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {["Features", "Pricing", "Docs", "Blog"].map((l) => (
            <li key={l}>
              <motion.a
                whileHover={{ y: -1 }}
                href={`#${l.toLowerCase()}`}
                className="relative rounded-full px-3 py-1.5 transition-colors hover:text-foreground"
              >
                {l}
              </motion.a>
            </li>
          ))}
        </ul>
        <Magnetic>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-sm font-medium text-background"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Magnetic>
      </motion.nav>
    </motion.header>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [0, 200]), {
    stiffness: 80,
    damping: 20,
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 1], [0, 6]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  // mouse-tracked spotlight
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${mx}% ${my}%, rgba(15,23,42,0.07), transparent 60%)`;

  function onMove(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32"
    >
      <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
      <motion.div style={{ background: spotlight }} className="absolute inset-0 pointer-events-none" />

      <motion.div
        style={{ y, scale, opacity, filter }}
        className="container mx-auto max-w-5xl px-6 text-center"
      >
        <motion.a
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          whileHover={{ y: -2 }}
          href="#"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-pill)] backdrop-blur hover:text-foreground"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-3 w-3" />
          </motion.span>
          Introducing Codeforge 2.0
          <ArrowRight className="h-3 w-3" />
        </motion.a>

        <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-6xl md:text-7xl">
          <WordReveal text="Ship production code" />
          <br />
          <WordReveal text="10x faster" className="text-muted-foreground" />
          <WordReveal text=" with AI" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease, delay: 0.4 }}
          className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
        >
          Your AI coding partner writes, reviews, and refactors code instantly.
          Build features in minutes, not days.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease, delay: 0.55 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Magnetic>
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            >
              Start building free
              <motion.span
                className="inline-flex"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-pill)]"
            >
              <Terminal className="h-4 w-4" /> npx codeforge init
            </a>
          </Magnetic>
        </motion.div>

        <TerminalPreview />
      </motion.div>
    </section>
  );
}

/* ---------- Terminal with 3D tilt + typewriter ---------- */

function TerminalPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 10);
    rx.set(-py * 10);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  const lines = [
    { p: "$", c: "codeforge generate", t: "" },
    { p: "›", c: "Analyzing repository…", t: "context loaded" },
    { p: "›", c: "Drafting PR: add Stripe checkout", t: "12 files" },
    { p: "✓", c: "Tests passing", t: "94% coverage" },
    { p: "✓", c: "Pushed branch", t: "feat/checkout" },
  ];

  return (
    <div className="mx-auto mt-16 max-w-3xl [perspective:1200px]">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease }}
        style={{
          rotateX: rx,
          rotateY: ry,
          transformStyle: "preserve-3d",
        }}
        className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
          {["#f87171", "#fbbf24", "#34d399"].map((c, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 300 }}
              className="h-2.5 w-2.5 rounded-full opacity-60"
              style={{ background: c }}
            />
          ))}
          <span className="ml-3 text-xs text-muted-foreground font-mono">
            ~/app — codeforge
          </span>
        </div>
        <div className="p-6 font-mono text-sm">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.18, duration: 0.5, ease }}
              className="flex items-baseline gap-3 py-1"
            >
              <span className="w-3 text-muted-foreground">{l.p}</span>
              <span className="text-foreground">{l.c}</span>
              {l.t && (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.18 }}
                  viewport={{ once: true }}
                  className="ml-auto text-xs text-muted-foreground"
                >
                  {l.t}
                </motion.span>
              )}
            </motion.div>
          ))}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block h-4 w-1.5 translate-y-0.5 bg-foreground"
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Marquee logos ---------- */

function Logos() {
  const logos = ["Linear", "Vercel", "Stripe", "Notion", "Figma", "Raycast", "Supabase", "Anthropic"];
  return (
    <section className="border-y border-border/60 bg-secondary/30 py-12 overflow-hidden">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Trusted by engineering teams at
      </p>
      <div className="relative mt-6 mx-auto max-w-6xl [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          className="flex w-max gap-16 whitespace-nowrap"
        >
          {[...logos, ...logos].map((l, i) => (
            <span
              key={i}
              className="text-lg font-semibold tracking-tight text-muted-foreground/80"
            >
              {l}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Features (interactive grid) ---------- */

const features = [
  { icon: Zap, title: "Instant generation", body: "Describe the change. Codeforge writes the diff, runs tests, and opens the PR in seconds." },
  { icon: GitBranch, title: "Aware of your repo", body: "Trained on your codebase conventions, types, and APIs. Suggestions actually fit." },
  { icon: Shield, title: "Reviews that catch bugs", body: "Static analysis plus reasoning — flags edge cases your linter never will." },
  { icon: Code2, title: "Refactor at scale", body: "Rename across services, migrate APIs, modernize stacks. One command, every file." },
  { icon: Terminal, title: "Lives in your terminal", body: "CLI, editor, and CI. No new app to learn — Codeforge meets you where you work." },
  { icon: Sparkles, title: "Tuned for production", body: "Type-safe, tested, and documented output. The kind of code you'd actually merge." },
];

function FeatureCard({ f, i }: { f: (typeof features)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const glow = useMotionTemplate`radial-gradient(280px circle at ${mx}px ${my}px, rgba(15,23,42,0.06), transparent 70%)`;

  function onMove(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease, delay: i * 0.07 }}
      className="group relative overflow-hidden bg-card p-8"
    >
      <motion.div style={{ background: glow }} className="pointer-events-none absolute inset-0" />
      <motion.div
        whileHover={{ rotate: -6, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background"
      >
        <f.icon className="h-5 w-5" />
      </motion.div>
      <h3 className="relative mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="py-28 md:py-36">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
          >
            Features
          </motion.p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            <WordReveal text="Everything you need to ship." />
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            A toolkit built for the way modern teams actually write software.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-20 grid grid-cols-2 gap-8 rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-card)] sm:grid-cols-4">
          {[
            { v: 10, s: "x", l: "Faster shipping" },
            { v: 94, s: "%", l: "Test coverage" },
            { v: 12000, s: "+", l: "Repos powered" },
            { v: 99, s: ".9%", l: "Uptime SLA" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                <Counter to={s.v} suffix={s.s} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing with animated highlight ---------- */

const tiers = [
  { name: "Hobby", price: 0, desc: "For personal projects and exploration.", features: ["100 generations / mo", "1 repository", "Community support"], cta: "Start free" },
  { name: "Pro", price: 20, desc: "For developers shipping every day.", features: ["Unlimited generations", "Unlimited repositories", "PR reviews & refactors", "Priority support"], cta: "Start Pro trial" },
  { name: "Team", price: 60, desc: "For teams that ship together.", features: ["Everything in Pro", "Shared context & memory", "SSO + audit logs", "Dedicated support"], cta: "Talk to sales" },
];

function Pricing() {
  const [active, setActive] = useState(1);

  return (
    <section id="pricing" className="border-t border-border bg-secondary/30 py-28 md:py-36">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Pricing</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            <WordReveal text="Simple, honest pricing." />
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">Hover a plan to highlight it.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => {
            const isActive = active === i;
            return (
              <motion.div
                key={t.name}
                onMouseEnter={() => setActive(i)}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, ease, delay: i * 0.08 }}
                className="relative"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="price-highlight"
                      className="absolute inset-0 rounded-2xl bg-foreground shadow-[var(--shadow-elevated)]"
                      transition={{ type: "spring", stiffness: 200, damping: 28 }}
                    />
                  )}
                </AnimatePresence>
                <div
                  className={`relative flex flex-col rounded-2xl border p-8 transition-colors duration-500 ${
                    isActive
                      ? "border-foreground text-background"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  <h3 className="text-lg font-semibold tracking-tight">{t.name}</h3>
                  <p className={`mt-1 text-sm ${isActive ? "text-background/70" : "text-muted-foreground"}`}>
                    {t.desc}
                  </p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-semibold tracking-tight">
                      ${t.price}
                    </span>
                    <span className={`text-sm ${isActive ? "text-background/70" : "text-muted-foreground"}`}>
                      /mo
                    </span>
                  </div>
                  <ul className="mt-7 space-y-3 text-sm">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-background" : "text-foreground"}`} />
                        <span className={isActive ? "text-background/90" : "text-foreground"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#"
                    className={`mt-8 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.03] ${
                      isActive ? "bg-background text-foreground" : "border border-border bg-background text-foreground"
                    }`}
                  >
                    {t.cta}
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */

function CTA() {
  return (
    <section className="py-28 md:py-36">
      <div className="container mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 text-center shadow-[var(--shadow-elevated)] md:p-20"
        >
          <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -right-32 -top-32 h-80 w-80 rounded-full border border-dashed border-border"
          />
          <div className="relative">
            <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              <WordReveal text="Start shipping today." />
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              Join thousands of developers building faster with Codeforge.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Magnetic>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
                >
                  Get started free <ArrowRight className="h-4 w-4" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground"
                >
                  Read the docs
                </a>
              </Magnetic>
            </div>
          </div>
        </motion.div>
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
          {[Github, Twitter].map((I, i) => (
            <motion.a
              key={i}
              whileHover={{ y: -2, scale: 1.08 }}
              href="#"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <I className="h-4 w-4" />
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ---------- Scroll progress bar ---------- */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-foreground"
    />
  );
}

/* ---------- How it works (sticky scroll-driven) ---------- */

const steps = [
  {
    k: "01",
    title: "Connect your repo",
    body: "One-click GitHub auth. Codeforge clones, indexes, and learns your conventions in under a minute.",
    chip: "github.com/acme/api",
  },
  {
    k: "02",
    title: "Describe the change",
    body: "Plain English in your editor, terminal, or PR. Codeforge plans the diff before touching a file.",
    chip: "add stripe checkout flow",
  },
  {
    k: "03",
    title: "Review the diff",
    body: "Type-checked, tested, documented. Inline reasoning explains every non-obvious line.",
    chip: "+482 −37 across 12 files",
  },
  {
    k: "04",
    title: "Ship to production",
    body: "Opens a PR, runs CI, waits for green. You merge. Codeforge keeps watching for regressions.",
    chip: "✓ Deployed to main",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // map progress → active step index (0..3)
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const [active, setActive] = useState(0);
  useEffect(() => {
    return progress.on("change", (v) => {
      const i = Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length)));
      setActive(i);
    });
  }, [progress]);

  // visual transforms tied directly to scroll
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const yShift = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="how"
      ref={ref}
      className="relative border-t border-border"
      style={{ height: `${steps.length * 90}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:gap-20">
          {/* Left: copy + steps */}
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              From prompt to PR,
              <br />
              <span className="text-muted-foreground">in four moves.</span>
            </h2>

            {/* progress rail */}
            <div className="relative mt-10">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden />
              <motion.div
                style={{ scaleY: barScale }}
                className="absolute left-[15px] top-2 bottom-2 w-px origin-top bg-foreground"
                aria-hidden
              />
              <ul className="space-y-7">
                {steps.map((s, i) => {
                  const isActive = i === active;
                  const isDone = i < active;
                  return (
                    <li key={s.k} className="relative pl-12">
                      <motion.span
                        animate={{
                          scale: isActive ? 1.15 : 1,
                          backgroundColor: isActive || isDone ? "#0F172A" : "#FFFFFF",
                          color: isActive || isDone ? "#F8FAFC" : "#64748B",
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-[11px] font-medium"
                      >
                        {s.k}
                      </motion.span>
                      <motion.div
                        animate={{ opacity: isActive ? 1 : 0.4, x: isActive ? 0 : -4 }}
                        transition={{ duration: 0.5, ease }}
                      >
                        <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {s.body}
                        </p>
                      </motion.div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right: animated visual */}
          <div className="relative hidden items-center justify-center lg:flex [perspective:1200px]">
            <motion.div
              style={{ rotate, y: yShift }}
              className="absolute h-72 w-72 rounded-3xl border border-dashed border-border"
            />
            <motion.div
              style={{ rotate: useTransform(scrollYProgress, [0, 1], [12, -10]) }}
              className="absolute h-96 w-96 rounded-full border border-border"
            />

            <div className="relative w-[360px] [transform-style:preserve-3d]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 30, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -30, rotateX: 15 }}
                  transition={{ duration: 0.6, ease }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">step {steps[active].k}</span>
                    <span className="inline-flex h-2 w-2 rounded-full bg-foreground" />
                  </div>
                  <div className="mt-6 font-mono text-sm text-foreground">
                    <span className="text-muted-foreground">›</span> {steps[active].chip}
                  </div>
                  <div className="mt-6 space-y-2">
                    {[0, 1, 2].map((j) => (
                      <motion.div
                        key={j}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.2 + j * 0.12, duration: 0.6, ease }}
                        style={{ originX: 0 }}
                        className="h-2 rounded-full bg-secondary"
                      >
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: [0.2, 0.6, 0.9][j] }}
                          transition={{ delay: 0.4 + j * 0.12, duration: 0.8, ease }}
                          style={{ originX: 0 }}
                          className="h-full rounded-full bg-foreground"
                        />
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    {steps.map((_, j) => (
                      <motion.span
                        key={j}
                        animate={{
                          width: j === active ? 24 : 6,
                          backgroundColor:
                            j <= active ? "#0F172A" : "#E2E8F0",
                        }}
                        transition={{ duration: 0.4, ease }}
                        className="h-1.5 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials (horizontal scroll-driven) ---------- */

const quotes = [
  { q: "Codeforge writes the PR I would've written on my best day — in 90 seconds.", a: "Maya Chen", r: "Staff Engineer, Linear" },
  { q: "We cut migration work from quarters to weeks. The diffs are boring in the best way.", a: "Jonas Weber", r: "CTO, Hover" },
  { q: "It catches the bug I forgot about three commits ago. Spooky, in a good way.", a: "Priya Natarajan", r: "Eng Lead, Stripe" },
  { q: "Our juniors ship like seniors. Our seniors ship like demigods.", a: "Tom Ardent", r: "VP Eng, Notion" },
];

function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // translate the row horizontally as user scrolls vertically
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-62%"]);

  return (
    <section ref={ref} className="relative border-t border-border" style={{ height: "260vh" }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container mx-auto max-w-6xl px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Loved by builders
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            The teams shipping fastest
            <br />
            <span className="text-muted-foreground">use Codeforge.</span>
          </h2>
        </div>

        <motion.div style={{ x }} className="mt-14 flex gap-6 px-6 will-change-transform">
          {quotes.map((q, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease, delay: i * 0.05 }}
              className="flex h-80 w-[420px] shrink-0 flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
            >
              <blockquote className="text-xl font-medium leading-snug tracking-[-0.01em] text-foreground">
                "{q.q}"
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                  {q.a
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </span>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{q.a}</div>
                  <div className="text-muted-foreground">{q.r}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Tools Showcase (Devin-style scroll animation) ---------- */

const toolCards = [
  { name: "Jira", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M11.53 2c0 5.1 4.14 9.24 9.24 9.24h.76v.76c0 5.1-4.14 9.24-9.24 9.24H2v-9.24C2 6.9 6.43 2.47 11.53 2z"/></svg>
  )},
  { name: "Notion", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M4 3h10l6 6v12H4V3zm10 1.5V9h4.5L14 4.5zM6 5v14h12V10h-5V5H6z"/></svg>
  )},
  { name: "Figma", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M8 24a4 4 0 004-4v-4H8a4 4 0 000 8zm0-20a4 4 0 000 8h4V4H8zm8 0h-4v8h4a4 4 0 000-8zm-4 12h4a4 4 0 11-4 0zm8-8a4 4 0 11-4 4 4 4 0 014-4z"/></svg>
  )},
  { name: "Vercel", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M12 2L2 22h20L12 2z"/></svg>
  )},
  { name: "AWS", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 opacity-40"><path d="M6.76 11.24l1.42 1.42L12 8.83l3.83 3.83 1.41-1.42L12 6 6.76 11.24zM12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
  )},
  { name: "Sentry", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M13.93 2.18a2.07 2.07 0 00-3.59 0L.41 19.46A2.07 2.07 0 002.2 22.5h6.09a.69.69 0 000-1.38H2.2a.69.69 0 01-.6-1L11.54 3a.69.69 0 011.2 0l4.37 7.57a7.35 7.35 0 00-3.84 6.14.69.69 0 001.38.08 6 6 0 013.47-5.13l2.25 3.89a2.07 2.07 0 01-1.79 3.1h-1a.69.69 0 000 1.39h1A3.45 3.45 0 0021.56 16z"/></svg>
  )},
  { name: "Datadog", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><circle cx="12" cy="12" r="10"/></svg>
  )},
  { name: "Stripe", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 opacity-40"><path d="M13.48 8.26c0-.84.7-1.17 1.85-1.17a12.12 12.12 0 015.1 1.33V4.14a14.32 14.32 0 00-5.1-.86C11.5 3.28 9 5.18 9 8.45c0 5 6.91 4.2 6.91 6.36 0 1-.87 1.32-2.08 1.32a13.24 13.24 0 01-5.56-1.52v4.33A15 15 0 0013.83 20c3.88 0 6.55-1.92 6.55-5.22 0-5.4-6.9-4.44-6.9-6.52z"/></svg>
  )},
  { name: "MongoDB", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-7v4h4l-5 7z"/></svg>
  )},
  { name: "PostgreSQL", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M17.13 4.57a7.38 7.38 0 00-4.53-1.57c-1.8 0-3.24.53-4.3 1.37A6.49 6.49 0 006 8.91c0 3.35 2.62 5.71 6.49 5.71h.07c3.49 0 5.8-1.96 6.24-4.98.18-1.19-.08-2.78-1.67-5.07zM12 22a10 10 0 110-20 10 10 0 010 20z"/></svg>
  )},
  { name: "Docker", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M20.83 10.2a4.42 4.42 0 00-2.12-.72 6.65 6.65 0 00-.69-2A3.1 3.1 0 0016.38 6l-.41-.26-.3.37a4.73 4.73 0 00-.68 1.47c-.25.94-.1 1.83.43 2.58a5.18 5.18 0 01-1.84.44H2.55A.55.55 0 002 11.15a9.9 9.9 0 00.58 3.52A5.52 5.52 0 005 17.78c1.3.86 3.42 1.22 5.76 1.22a15.84 15.84 0 004.08-.5 10.6 10.6 0 003.22-1.65 9.09 9.09 0 002.14-2.42A8.24 8.24 0 0021.5 11a.42.42 0 00-.02-.02 3.04 3.04 0 00-.65-.78zM4 10h2V8H4v2zm3 0h2V8H7v2zm0 3h2v-2H7v2zm3-3h2V8h-2v2zm0 3h2v-2h-2v2zm3-3h2V8h-2v2zm0 3h2v-2h-2v2zm3-3h2V8h-2v2z"/></svg>
  )},
  { name: "Snowflake", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 opacity-40"><path d="M12 2l1.09 3.41L16 4l-1.09 3.41L18.32 6l-1.91 2.91L20 9.82l-3.41 1.09L18 14l-3.41-1.09L16 16l-2.91-1.91L12 18l-1.09-3.91L8 16l1.09-3.09L5.68 14l1.91-2.91L4 10.18l3.41-1.09L6 6l3.41 1.09L8 4l2.91 1.91L12 2z"/></svg>
  )},
];

// Column layout: 7 columns with different vertical offsets for parallax
const columnConfig = [
  { cards: [0, 1], yMultiplier: 1.2, startOffset: 120 },
  { cards: [2, 3], yMultiplier: 0.7, startOffset: 40 },
  { cards: [4, 5], yMultiplier: 1.0, startOffset: 80 },
  { cards: [6], yMultiplier: 0.5, startOffset: 0 },
  { cards: [7, 8], yMultiplier: 0.9, startOffset: 60 },
  { cards: [9, 10], yMultiplier: 0.6, startOffset: 20 },
  { cards: [11], yMultiplier: 1.1, startOffset: 100 },
];

const integrations = [
  {
    name: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
    ),
    desc: "Codeforge ships PRs the way your team does — picking up review feedback and CI results to get each PR approved and merged.",
  },
  {
    name: "Linear",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M3.36 7.14l13.5 13.5c-.87.28-1.8.36-2.74.36C8.27 21 3 15.73 3 9.88c0-.94.08-1.87.36-2.74zm-1 4.38A9.1 9.1 0 0012.48 21.62L2.36 11.52zM21.64 12.48A9.1 9.1 0 0011.52 2.36L21.64 12.48zm-.28-1.34C20.57 6.24 17.76 3.43 14.86 2.64L21.36 9.14c-.28.87-.36 1.8-.36 2z"/></svg>
    ),
    desc: "Assign Codeforge tickets directly in Linear, or add a Codeforge label.",
  },
  {
    name: "Slack",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
    ),
    desc: "Tag Codeforge in any conversation to surface relevant context, dig into issues, or turn discussions directly into PRs.",
  },
];

function ToolsShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Phase transitions based on scroll progress
  const headerOpacity = useTransform(scrollYProgress, [0.15, 0.35], [1, 0]);
  const headerBlur = useTransform(scrollYProgress, [0.15, 0.35], [0, 12]);
  const headerFilter = useMotionTemplate`blur(${headerBlur}px)`;
  const headerY = useTransform(scrollYProgress, [0.05, 0.35], [0, -120]);

  // Grid cards fade & rise
  const gridOpacity = useTransform(scrollYProgress, [0.05, 0.15, 0.4, 0.5], [0, 1, 1, 0]);
  const gridY = useTransform(scrollYProgress, [0.05, 0.15, 0.4, 0.5], [200, 0, -100, -300]);

  // Integration cards phase
  const intOpacity = useTransform(scrollYProgress, [0.45, 0.55], [0, 1]);
  const intY = useTransform(scrollYProgress, [0.45, 0.55], [80, 0]);

  const [activeInt, setActiveInt] = useState(1);

  // Spring-smoothed values
  const smoothGridY = useSpring(gridY, { stiffness: 60, damping: 20 });
  const smoothHeaderY = useSpring(headerY, { stiffness: 60, damping: 20 });
  const smoothIntY = useSpring(intY, { stiffness: 60, damping: 20 });

  return (
    <section
      ref={sectionRef}
      id="tools"
      className="relative"
      style={{ height: "350vh" }}
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden"
        style={{ background: "oklch(0.965 0 0)" }}
      >
        {/* Header */}
        <motion.div
          style={{ opacity: headerOpacity, filter: headerFilter, y: smoothHeaderY }}
          className="absolute z-10 text-center px-6"
        >
          <h2 className="text-5xl font-semibold tracking-[-0.03em] sm:text-6xl md:text-7xl">
            Able to work with{" "}
            <span style={{ color: "oklch(0.55 0.18 260)" }}>hundreds of tools</span>
          </h2>
        </motion.div>

        {/* Tool cards grid */}
        <motion.div
          style={{ opacity: gridOpacity, y: smoothGridY }}
          className="absolute inset-0 flex items-end justify-center gap-3 px-4 pb-8 md:gap-4 md:px-8"
        >
          {columnConfig.map((col, ci) => (
            <motion.div
              key={ci}
              className="flex flex-col gap-3 md:gap-4"
              style={{
                y: useTransform(
                  scrollYProgress,
                  [0.05, 0.4],
                  [col.startOffset, -col.startOffset * col.yMultiplier]
                ),
              }}
            >
              {col.cards.map((cardIdx) => {
                const tool = toolCards[cardIdx];
                return (
                  <div
                    key={cardIdx}
                    className="flex h-28 w-28 items-center justify-center rounded-2xl border border-border/50 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48"
                    style={{ background: "oklch(0.975 0 0)" }}
                  >
                    {tool.icon}
                  </div>
                );
              })}
            </motion.div>
          ))}
        </motion.div>

        {/* Integration showcase cards */}
        <motion.div
          style={{ opacity: intOpacity, y: smoothIntY }}
          className="absolute inset-x-0 flex items-center justify-center gap-4 px-4 md:gap-6 md:px-8"
        >
          {integrations.map((int, i) => {
            const isActive = i === activeInt;
            return (
              <motion.div
                key={int.name}
                onClick={() => setActiveInt(i)}
                animate={{
                  flex: isActive ? 3 : 1,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 28 }}
                className="relative cursor-pointer overflow-hidden rounded-3xl"
                style={{
                  height: "min(70vh, 520px)",
                  minWidth: isActive ? 0 : 100,
                }}
              >
                {/* Active state: dark bg with content */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col items-center rounded-3xl bg-foreground text-background p-8 md:p-12"
                    >
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-background">{int.icon}</span>
                        <span className="text-3xl font-semibold tracking-tight md:text-4xl">{int.name}</span>
                      </div>
                      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-background/70 md:text-base">
                        {int.desc}
                      </p>
                      {/* Fake screenshot area */}
                      <div className="mt-6 w-full max-w-lg flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
                        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                          <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                          <span className="ml-3 text-xs text-white/40 font-mono">{int.name.toLowerCase()}.com</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {[0, 1, 2, 3].map((j) => (
                            <motion.div
                              key={j}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: 0.2 + j * 0.1, duration: 0.5, ease }}
                              style={{ originX: 0 }}
                              className="h-3 rounded-full bg-white/10"
                            >
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: [0.3, 0.5, 0.8, 0.6][j] }}
                                transition={{ delay: 0.4 + j * 0.1, duration: 0.6, ease }}
                                style={{ originX: 0 }}
                                className="h-full rounded-full bg-white/20"
                              />
                            </motion.div>
                          ))}
                          <div className="mt-4 flex items-start gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-white/15" />
                            <div className="flex-1 space-y-2">
                              <div className="h-2.5 w-24 rounded bg-white/15" />
                              <div className="h-2 w-full rounded bg-white/8" />
                              <div className="h-2 w-3/4 rounded bg-white/8" />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-blue-400/20" />
                            <div className="flex-1 space-y-2">
                              <div className="h-2.5 w-20 rounded bg-white/15" />
                              <div className="h-2 w-full rounded bg-white/8" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed state: light bg with icon */}
                {!isActive && (
                  <div
                    className="flex h-full items-center justify-center rounded-3xl border border-border/50"
                    style={{ background: "oklch(0.955 0 0)" }}
                  >
                    <span className="text-muted-foreground/50">{int.icon}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <CursorBlob />
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <ToolsShowcase />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
