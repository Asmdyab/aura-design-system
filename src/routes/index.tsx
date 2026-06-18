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
  ArrowLeft,
  Sparkles,
  BookOpen,
  BookMarked,
  ScrollText,
  Library,
  Star,
  GraduationCap,
  Crown,
  Check,
  Facebook,
  Twitter,
} from "lucide-react";
import logoSrc from "../assets/logo.png";

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

/* ---------- Cursor blob ---------- */

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

/* ---------- Scroll progress ---------- */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-right bg-foreground"
    />
  );
}

/* ---------- Nav ---------- */

function Nav() {
  const { scrollY } = useScroll();
  const width = useTransform(scrollY, [0, 200], ["min(960px, calc(100% - 2rem))", "min(720px, calc(100% - 2rem))"]);
  const padY = useTransform(scrollY, [0, 200], [8, 6]);
  const bg = useTransform(scrollY, [0, 200], ["rgba(248,250,252,0.6)", "rgba(248,250,252,0.85)"]);

  const links = ["الرئيسية", "البرامج", "الأسعار", "اتصل بنا"];

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
          <img
            src={logoSrc}
            alt="أكاديمية القرآن"
            className="h-8 w-auto"
          />
        </a>
        <ul className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <li key={l}>
              <motion.a
                whileHover={{ y: -1 }}
                href={`#${l}`}
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
            ابدأ الآن <ArrowLeft className="h-3.5 w-3.5" />
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
          أكاديمية قرآنية رائدة
          <ArrowLeft className="h-3 w-3" />
        </motion.a>

        <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-6xl md:text-7xl">
          <WordReveal text="تعلم القرآن الكريم" />
          <br />
          <WordReveal text="بالتجويد والتدبر" className="text-muted-foreground" />
          <WordReveal text="مع نخبة المعلمين" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease, delay: 0.4 }}
          className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
        >
          رحلتك مع القرآن تبدأ هنا — برامج تعليمية متكاملة للحفظ والتجويد والتفسير
          بإشراف نخبة من المعلمين المجازين بأعلى الأسانيد.
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
              ابدأ رحلتك المجانية
              <motion.span
                className="inline-flex"
                whileHover={{ x: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.span>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-pill)]"
            >
              <BookOpen className="h-4 w-4" /> تعرف على برامجنا
            </a>
          </Magnetic>
        </motion.div>

        <QuranPreview />
      </motion.div>
    </section>
  );
}

/* ---------- Quran Preview Card ---------- */

function QuranPreview() {
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

  const verses = [
    { text: "الرَّحْمَٰنُ ﴿١﴾", highlight: false },
    { text: "عَلَّمَ الْقُرْآنَ ﴿٢﴾", highlight: true },
    { text: "خَلَقَ الْإِنسَانَ ﴿٣﴾", highlight: false },
    { text: "عَلَّمَهُ الْبَيَانَ ﴿٤﴾", highlight: false },
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
        className="overflow-hidden rounded-2xl border border-border bg-card text-right shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
          {["#29477B", "#489C9D", "#6CC6B8"].map((c, i) => (
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
          <span className="mr-3 text-xs text-muted-foreground">
            القرآن الكريم — سورة الرحمن
          </span>
        </div>
        <div className="p-8 leading-loose text-right">
          <p className="text-xl md:text-2xl text-foreground">
            <span className="text-primary font-semibold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          </p>
          <div className="mt-4">
            {verses.map((l, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.18, duration: 0.5, ease }}
                className={`text-lg md:text-xl ${l.highlight ? "text-secondary font-semibold" : "text-foreground/80"}`}
              >
                {l.text}
              </motion.p>
            ))}
          </div>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block h-5 w-1.5 translate-y-0.5 bg-foreground"
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Logos / Institutions ---------- */

function Logos() {
  const logos = ["جامعة الأزهر", "مجمع الملك فهد", "الهيئة العالمية", "رابطة العالم الإسلامي", "جامعة أم القرى", "جامعة الإمام", "وزارة الشؤون الإسلامية", "الندوة العالمية"];
  return (
    <section className="border-y border-border/60 bg-secondary/30 py-12 overflow-hidden">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
        يشرف على تعليمنا
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

/* ---------- Features ---------- */

const features = [
  { icon: BookOpen, title: "تحفيظ القرآن", body: "برامج متدرجة لحفظ القرآن الكريم مع متابعة شخصية وتسميع دوري يشرف عليها معلمون مجازون." },
  { icon: ScrollText, title: "أحكام التجويد", body: "تعلم أحكام التجويد تطبيقياً بأسلوب مبسط مع قراء مجازين يتابعون تلاوتك ويصححونها." },
  { icon: Library, title: "تفسير القرآن", body: "فهم معاني القرآن الكريم من خلال تفسير السلف الصالح ودراسة أسباب النزول." },
  { icon: Star, title: "التدبر", body: "دورات متخصصة في تدبر آيات القرآن الكريم وربطها بالواقع المعاصر." },
  { icon: GraduationCap, title: "الإجازة", body: "طرق الإجازة بالسند المتصل إلى النبي ﷺ مع متابعة دقيقة حتى الإتقان." },
  { icon: Crown, title: "علوم القرآن", body: "دراسة علوم القرآن كالناسخ والمنسوخ والمكي والمدني وأصول التفسير." },
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
    <section id="البرامج" className="py-28 md:py-36">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
          >
            برامجنا
          </motion.p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            <WordReveal text="برامج تعليمية متكاملة." />
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            منهج علمي متكامل يجمع بين الحفظ والتجويد والفهم والتدبر.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>

        <div className="mt-20 grid grid-cols-2 gap-8 rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-card)] sm:grid-cols-4">
          {[
            { v: 5000, s: "+", l: "طالب مسجل" },
            { v: 100, s: "+", l: "معلم مجاز" },
            { v: 30, s: "+", l: "برنامج تعليمي" },
            { v: 95, s: "%", l: "نسبة الرضا" },
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

/* ---------- Pricing ---------- */

const tiers = [
  { name: "الأساسي", price: 0, desc: "للمبتدئين في رحلة تعلم القرآن.", features: ["درس واحد أسبوعياً", "متابعة عبر المجموعات", "محتوى تعليمي أساسي"], cta: "ابدأ مجاناً" },
  { name: "المتقدم", price: 99, desc: "للمنتظمين في طلب العلم والإتقان.", features: ["دروس مكثفة أسبوعياً", "متابعة فردية مع معلم", "تصحيح تلاوة مستمر", "جلسات تدبر أسبوعية"], cta: "ابدأ تجربتك" },
  { name: "المتميز", price: 199, desc: "لطالب الإجازة والتميز في القرآن.", features: ["جميع مزايا المتقدم", "طريق إجازة بالسند", "جلسات خاصة أسبوعية", "تقييم دوري شامل", "شهادة معتمدة"], cta: "تواصل معنا" },
];

function Pricing() {
  const [active, setActive] = useState(1);

  return (
    <section id="الأسعار" className="border-t border-border bg-secondary/30 py-28 md:py-36">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">الباقات</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            <WordReveal text="اختر الباقة المناسبة لك." />
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">مرر فوق الباقة لتحديدها.</p>
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
                      {t.price === 0 ? "مجاناً" : `${t.price} ر.س`}
                    </span>
                    {t.price > 0 && (
                      <span className={`text-sm ${isActive ? "text-background/70" : "text-muted-foreground"}`}>
                        /شهرياً
                      </span>
                    )}
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
              <WordReveal text="ابدأ رحلتك مع القرآن اليوم." />
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              انضم إلى آلاف الطلاب حول العالم في رحلة حفظ القرآن وتعلم أحكامه.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Magnetic>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
                >
                  سجل الآن <ArrowLeft className="h-4 w-4" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground"
                >
                  تعرف على المزيد
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
          <img
            src={logoSrc}
            alt="أكاديمية القرآن"
            className="h-8 w-auto"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} أكاديمية القرآن. جميع الحقوق محفوظة.
        </p>
        <div className="flex items-center gap-2">
          {[Twitter, Facebook].map((I, i) => (
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

/* ---------- How it works ---------- */

const steps = [
  {
    k: "٠١",
    title: "سجل في البرنامج",
    body: "اختر البرنامج المناسب لك وقدم طلب التسجيل. فريقنا يتواصل معك لتأكيد التسجيل.",
    chip: "اختيار البرنامج المناسب",
  },
  {
    k: "٠٢",
    title: "ادرس مع معلمك",
    body: "تبدأ رحلتك التعليمية مع معلم مجاز يتابع تلاوتك ويصححها ويخطط لمسارك.",
    chip: "جلسات تعليمية تفاعلية",
  },
  {
    k: "٠٣",
    title: "متابعة وتقييم",
    body: "تقييم دوري لمستواك مع تقارير أسبوعية عن تقدمك ونقاط القوة والتحسين.",
    chip: "✓ متابعة مستمرة",
  },
  {
    k: "٠٤",
    title: "احصل على الإجازة",
    body: "بعد الإتقان تحصل على إجازة بالسند المتصل إلى النبي ﷺ وشهادة معتمدة.",
    chip: "✓ إجازة بالسند",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const [active, setActive] = useState(0);
  useEffect(() => {
    return progress.on("change", (v) => {
      const i = Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length)));
      setActive(i);
    });
  }, [progress]);

  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const yShift = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="كيف-تعمل"
      ref={ref}
      className="relative border-t border-border"
      style={{ height: `${steps.length * 90}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              رحلتك التعليمية
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              من التسجيل إلى الإجازة،
              <br />
              <span className="text-muted-foreground">في أربع خطوات.</span>
            </h2>

            <div className="relative mt-10">
              <div className="absolute right-[15px] top-2 bottom-2 w-px bg-border" aria-hidden />
              <motion.div
                style={{ scaleY: barScale }}
                className="absolute right-[15px] top-2 bottom-2 w-px origin-top bg-foreground"
                aria-hidden
              />
              <ul className="space-y-7">
                {steps.map((s, i) => {
                  const isActive = i === active;
                  const isDone = i < active;
                  return (
                    <li key={s.k} className="relative pr-12">
                      <motion.span
                        animate={{
                          scale: isActive ? 1.15 : 1,
                          backgroundColor: isActive || isDone ? "#0F172A" : "#FFFFFF",
                          color: isActive || isDone ? "#F8FAFC" : "#64748B",
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-[11px] font-medium"
                      >
                        {s.k}
                      </motion.span>
                      <motion.div
                        animate={{ opacity: isActive ? 1 : 0.4, x: isActive ? 0 : 4 }}
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
                    <span>الخطوة {steps[active].k}</span>
                    <span className="inline-flex h-2 w-2 rounded-full bg-foreground" />
                  </div>
                  <div className="mt-6 text-sm text-foreground">
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

/* ---------- Testimonials ---------- */

const quotes = [
  { q: "بارك الله في القائمين على هذه الأكاديمية. منهجهم في التحفيظ متميز جداً والمعلمون على مستوى عالٍ من الإتقان.", a: "أحمد السلمي", r: "طالب في برنامج الإجازة" },
  { q: "الحمد لله حصلت على إجازة في القرآن بعد سنة من المتابعة. الأسلوب التعليمي رائع والمتابعة فردية.", a: "نورة القحطاني", r: "مجازة في القرآن الكريم" },
  { q: "أنصح كل من يرغب في تعلم التجويد بالتسجيل هنا. المعلمون يصححون الحرف حرفاً حتى الإتقان.", a: "سارة العمري", r: "طالبة في برنامج التجويد" },
  { q: "حفظت ثلاثة أجزاء في ستة أشهر بطريقة لم أكن أتوقعها. البرنامج منظم والمتابعة ممتازة.", a: "خالد البدر", r: "طالب في برنامج التحفيظ" },
];

function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-62%"]);

  return (
    <section ref={ref} className="relative border-t border-border" style={{ height: "260vh" }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container mx-auto max-w-6xl px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            آراء الطلاب
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            طلابنا يتحدثون عن
            <br />
            <span className="text-muted-foreground">تجربتهم معنا.</span>
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
                  {q.a.split(" ").map((p) => p[0]).join("")}
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

/* ---------- Tools / Resources ---------- */

const resourceCards = [
  { name: "المصحف الشريف" },
  { name: "تفسير الطبري" },
  { name: "تفسير ابن كثير" },
  { name: "صحيح البخاري" },
  { name: "معجم اللغة" },
  { name: "أحكام التجويد" },
  { name: "القراءات العشر" },
  { name: "الناسخ والمنسوخ" },
  { name: "أسباب النزول" },
  { name: "إعراب القرآن" },
  { name: "بلاغة القرآن" },
  { name: "مقارئ إلكترونية" },
];

const columnConfig = [
  { cards: [0, 1], yMultiplier: 1.2, startOffset: 120 },
  { cards: [2, 3], yMultiplier: 0.7, startOffset: 40 },
  { cards: [4, 5], yMultiplier: 1.0, startOffset: 80 },
  { cards: [6], yMultiplier: 0.5, startOffset: 0 },
  { cards: [7, 8], yMultiplier: 0.9, startOffset: 60 },
  { cards: [9, 10], yMultiplier: 0.6, startOffset: 20 },
  { cards: [11], yMultiplier: 1.1, startOffset: 100 },
];

const programIntegrations = [
  {
    name: "برنامج الحفظ",
    desc: "برنامج متكامل لحفظ القرآن الكريم مع متابعة يومية وتسميع دوري. يشرف عليه معلمون مجازون يضعون خططاً مخصصة لكل طالب حسب مستواه.",
  },
  {
    name: "برنامج التجويد",
    desc: "تعلم أحكام التجويد تطبيقياً مع قراء مجازين. تصحيح التلاوة حرفاً حرفاً مع شرح مبسط لأحكام النون الساكنة والمدود وغيرها.",
  },
  {
    name: "برنامج التفسير",
    desc: "فهم معاني القرآن وتدبر آياته من خلال تفسير السلف الصالح. دراسة أسباب النزول والمكي والمدني والناسخ والمنسوخ.",
  },
];

function ToolsShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const headerOpacity = useTransform(scrollYProgress, [0.15, 0.35], [1, 0]);
  const headerBlur = useTransform(scrollYProgress, [0.15, 0.35], [0, 12]);
  const headerFilter = useMotionTemplate`blur(${headerBlur}px)`;
  const headerY = useTransform(scrollYProgress, [0.05, 0.35], [0, -120]);

  const gridOpacity = useTransform(scrollYProgress, [0.05, 0.15, 0.4, 0.5], [0, 1, 1, 0]);
  const gridY = useTransform(scrollYProgress, [0.05, 0.15, 0.4, 0.5], [200, 0, -100, -300]);

  const intOpacity = useTransform(scrollYProgress, [0.45, 0.55], [0, 1]);
  const intY = useTransform(scrollYProgress, [0.45, 0.55], [80, 0]);

  const [activeInt, setActiveInt] = useState(1);

  const smoothGridY = useSpring(gridY, { stiffness: 60, damping: 20 });
  const smoothHeaderY = useSpring(headerY, { stiffness: 60, damping: 20 });
  const smoothIntY = useSpring(intY, { stiffness: 60, damping: 20 });

  return (
    <section
      ref={sectionRef}
      id="الموارد"
      className="relative"
      style={{ height: "350vh" }}
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden"
        style={{ background: "oklch(0.965 0 0)" }}
      >
        <motion.div
          style={{ opacity: headerOpacity, filter: headerFilter, y: smoothHeaderY }}
          className="absolute z-10 text-center px-6"
        >
          <h2 className="text-5xl font-semibold tracking-[-0.03em] sm:text-6xl md:text-7xl">
            مكتبة قرآنية متكاملة{" "}
            <span style={{ color: "oklch(0.55 0.18 260)" }}>من الموارد والمراجع</span>
          </h2>
        </motion.div>

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
                const resource = resourceCards[cardIdx];
                return (
                  <div
                    key={cardIdx}
                    className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border/50 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-44 lg:w-44"
                    style={{ background: "oklch(0.975 0 0)" }}
                  >
                    <span className="text-xs md:text-sm font-semibold text-muted-foreground text-center leading-relaxed px-2">
                      {resource.name}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          style={{ opacity: intOpacity, y: smoothIntY }}
          className="absolute inset-x-0 flex items-center justify-center gap-4 px-4 md:gap-6 md:px-8"
        >
          {programIntegrations.map((int, i) => {
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
                        <BookOpen className="h-8 w-8 text-background" />
                        <span className="text-3xl font-semibold tracking-tight md:text-4xl">{int.name}</span>
                      </div>
                      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-background/70 md:text-base">
                        {int.desc}
                      </p>
                      <div className="mt-6 w-full max-w-lg flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
                        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                          <span className="h-2.5 w-2.5 rounded-full bg-secondary/60" />
                          <span className="h-2.5 w-2.5 rounded-full bg-accent-light/60" />
                          <span className="mr-3 text-xs text-white/40">{int.name}</span>
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

                {!isActive && (
                  <div
                    className="flex h-full items-center justify-center rounded-3xl border border-border/50"
                    style={{ background: "oklch(0.955 0 0)" }}
                  >
                    <span className="text-muted-foreground/50 text-sm font-semibold">{int.name}</span>
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

/* ---------- Index ---------- */

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
