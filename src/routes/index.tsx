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
                          backgroundColor: isActive || isDone ? "oklch(0.18 0 0)" : "oklch(1 0 0)",
                          color: isActive || isDone ? "oklch(0.985 0 0)" : "oklch(0.55 0 0)",
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
                            j <= active ? "oklch(0.18 0 0)" : "oklch(0.92 0 0)",
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

function Index() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <CursorBlob />
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
