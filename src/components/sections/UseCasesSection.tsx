import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useRef, useState } from "react";
import {
  Check,
  BookMarked,
  BookAudio,
  GraduationCap,
  Star,
  ChevronDown,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

interface UseCaseData {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
}

const useCases: UseCaseData[] = [
  {
    id: "hifz",
    icon: BookMarked,
    title: "برنامج تحفيظ القرآن",
    subtitle: "خطط حفظ منظمة لكل طالب",
    description: "رحلة حفظ متكاملة مع خطط شخصية ومتابعة يومية",
    gradientFrom: "#0A5C70",
    gradientTo: "#3B52D4",
    features: [
      "خريطة حفظ شخصية تناسب مستواك",
      "متابعة يومية للمراجعة والتثبيت",
      "جلسات فردية مع معلم متخصص",
      "تقارير تقدم دورية للوالدين",
      "جداول مرنة تناسب جميع الأعمار",
    ],
  },
  {
    id: "tajweed",
    icon: BookAudio,
    title: "برنامج التلاوة والتجويد",
    subtitle: "أتقن نطقك وتلاوتك مع أمهر القراء",
    description: "تصحيح التجويد وإتقان التلاوة مع معلمين متخصصين",
    gradientFrom: "#2EC4A5",
    gradientTo: "#0A5C70",
    features: [
      "جلسات تصحيح تجويد مكثفة وفردية",
      "ممارسة تلاوة حية مع المعلم",
      "ملاحظات صوتية دقيقة للأداء",
      "تمارين تفاعلية للنطق والمخارج",
      "تقييمات دورية لبناء الثقة والإتقان",
    ],
  },
  {
    id: "ijazah",
    icon: GraduationCap,
    title: "برنامج الإجازة والدراسات المتقدمة",
    subtitle: "تعلّم مع علماء معتمدين بأعلى الأسانيد",
    description: "طريقك نحو الإجازة بالسند المتصل إلى النبي ﷺ",
    gradientFrom: "#3B52D4",
    gradientTo: "#1a2f8a",
    features: [
      "طريق إجازة منهجي متكامل الخطوات",
      "إتقان التجويد المتقدم برواية حفص",
      "التعلم بالسند المتصل إلى الرسول ﷺ",
      "تقييم أداء مفصل مع شهادات مرحلية",
      "إرشاد علمي مخصص من كبار المختصين",
    ],
  },
];

function VisualMockup({ data }: { data: UseCaseData }) {
  switch (data.id) {
    case "hifz":
      return (
        <div className="w-full rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-2 w-20 bg-white/30 rounded" />
              <div className="h-1.5 w-14 bg-white/20 rounded mt-1" />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { name: "سورة البقرة", progress: "w-3/4" },
              { name: "سورة آل عمران", progress: "w-1/2" },
              { name: "سورة النساء", progress: "w-1/3" },
            ].map((surah, i) => (
              <div
                key={i}
                className="h-9 rounded-lg bg-white/15 flex items-center px-3 gap-2"
              >
                <span className="text-[11px] text-white/70 truncate">
                  {surah.name}
                </span>
                <div className="mr-auto h-2 w-16 bg-white/20 rounded-full overflow-hidden shrink-0">
                  <div
                    className={`h-full ${surah.progress} bg-white/40 rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-white/50">التقدم العام</span>
            <span className="text-[10px] text-white/70 font-semibold">٪٦٥</span>
          </div>
          <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-[65%] bg-white/50 rounded-full" />
          </div>
        </div>
      );
    case "tajweed":
      return (
        <div className="w-full rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 shadow-lg">
          <div className="flex items-center justify-center mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent mr-0.5" />
            </div>
          </div>
          <div className="flex items-end justify-center gap-[3px] h-16">
            {[3, 6, 4, 8, 5, 10, 7, 12, 8, 14, 9, 11, 6, 8, 4].map(
              (h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: h * 3 }}
                  transition={{ delay: 0.3 + i * 0.03, duration: 0.4, ease }}
                  className="w-1.5 rounded-full bg-white/50"
                />
              ),
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-white/50">حرف</span>
            <span className="text-[10px] text-white/70 font-semibold">مخارج الحروف</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            {["أ", "ع", "ح", "ه", "خ", "غ", "ق", "ك"].map((letter, i) => (
              <span
                key={i}
                className="text-[11px] text-white/60 font-semibold"
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      );
    case "ijazah":
      return (
        <div className="w-full rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 shadow-lg">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="border border-white/20 rounded-xl p-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white/70" />
                </div>
              </div>
              <div className="h-2 w-24 bg-white/40 rounded mx-auto mt-3" />
              <div className="h-1.5 w-16 bg-white/20 rounded mx-auto mt-1.5" />
              <div className="flex justify-center gap-1 mt-3">
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <div className="w-2 h-2 rounded-full bg-white/40" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <span className="text-[10px] text-white/50">إجازة معتمدة</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-[10px] text-white/50">بسند متصل</span>
            </div>
          </div>
        </div>
      );
  }
}

function ExpandableCard({
  data,
  isActive,
  onActivate,
  prefersReducedMotion,
}: {
  data: UseCaseData;
  isActive: boolean;
  onActivate: () => void;
  prefersReducedMotion: boolean;
}) {
  const Icon = data.icon;

  return (
    <motion.button
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      className="relative cursor-pointer overflow-hidden rounded-3xl text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 h-full w-full"
      style={{
        minWidth: 0,
        background: `linear-gradient(135deg, ${data.gradientFrom}, ${data.gradientTo})`,
      }}
      role="tab"
      aria-expanded={isActive}
      tabIndex={0}
      aria-label={data.title}
    >
      <motion.div
        animate={{ scale: isActive ? 1.06 : 1 }}
        transition={{ duration: 0.7, ease }}
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(135deg, ${data.gradientTo}, ${data.gradientFrom})`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ scale: isActive ? 1.2 : 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 200, damping: 15 }
          }
        >
          <Icon className="w-8 h-8 text-white/90" />
        </motion.div>
        <span
          className={`mt-4 text-white/90 font-semibold text-sm text-center leading-relaxed transition-opacity duration-300 ${isActive ? "opacity-0" : "opacity-100"
            }`}
        >
          {data.title}
        </span>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: prefersReducedMotion ? 0 : 0.1 }}
            className="absolute inset-0 p-6 md:p-8 lg:p-10 flex flex-col justify-center"
          >
            <div className="flex gap-4 md:gap-8 h-full items-center">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                  {data.title}
                </h3>
                <p className="mt-2 text-white/80 text-sm md:text-base font-medium">
                  {data.subtitle}
                </p>
                <p className="mt-1 text-white/60 text-xs md:text-sm">
                  {data.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {data.features.map((f, fi) => (
                    <motion.li
                      key={fi}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: prefersReducedMotion ? 0 : 0.2 + fi * 0.07,
                        duration: 0.4,
                        ease,
                      }}
                      className="flex items-center gap-2.5 text-white/80 text-sm"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      <span>{f}</span>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center gap-2">
                  {[0, 1, 2, 3].map((dot) => (
                    <motion.div
                      key={dot}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        delay: prefersReducedMotion ? 0 : 0.4 + dot * 0.08,
                        duration: 0.4,
                        ease,
                      }}
                      style={{ originX: 0 }}
                      className={`h-1.5 rounded-full ${dot === 0
                          ? "w-8 bg-white/90"
                          : "w-4 bg-white/30"
                        }`}
                    />
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ y: prefersReducedMotion ? 0 : -4 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.15, duration: 0.5, ease }}
                className="hidden sm:flex w-[35%] max-w-[220px] items-center justify-center"
              >
                <VisualMockup data={data} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function MobileAccordionCard({
  data,
  isExpanded,
  onToggle,
  prefersReducedMotion,
}: {
  data: UseCaseData;
  isExpanded: boolean;
  onToggle: () => void;
  prefersReducedMotion: boolean;
}) {
  const Icon = data.icon;

  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${data.gradientFrom}, ${data.gradientTo})`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 md:p-5 text-white text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-expanded={isExpanded}
        aria-label={data.title}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-white/80 shrink-0" />
          <span className="font-semibold text-white text-sm md:text-base">
            {data.title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.3, ease }
          }
        >
          <ChevronDown className="w-5 h-5 text-white/70" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={
              prefersReducedMotion
                ? { height: "auto", opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            animate={{ height: "auto", opacity: 1 }}
            exit={
              prefersReducedMotion
                ? { height: "auto", opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-5 pb-4 md:pb-5">
              <p className="text-white/70 text-sm">{data.subtitle}</p>
              <ul className="mt-3 space-y-2">
                {data.features.map((f, fi) => (
                  <motion.li
                    key={fi}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : fi * 0.05,
                      duration: 0.3,
                    }}
                    className="flex items-center gap-2 text-white/80 text-sm"
                  >
                    <Check className="w-4 h-4 text-white/70 shrink-0" />
                    <span>{f}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-4">
                <VisualMockup data={data} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const tileHeights = [
  "clamp(90px, 13vw, 150px)",
  "clamp(110px, 17vw, 195px)",
  "clamp(100px, 15vw, 175px)",
];

/* Preview tile shown before morph */
function PreviewTile({ data, index }: { data: UseCaseData; index: number }) {
  const Icon = data.icon;
  return (
    <motion.div
      layoutId={`usecase-morph-${data.id}`}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/20"
      style={{
        background: `linear-gradient(135deg, ${data.gradientFrom}, ${data.gradientTo})`,
        width: "clamp(90px, 13vw, 160px)",
        height: tileHeights[index],
      }}
      transition={{ delay: index * 0.06, duration: 0.5, ease }}
    >
      <Icon className="w-7 h-7 text-white/80" />
      <span className="text-[11px] text-white/70 font-semibold text-center leading-tight px-2">
        {data.title}
      </span>
    </motion.div>
  );
}

export function UseCasesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"grid" | "morph">("grid");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  /* ---- header fade / blur (mirrors ToolsShowcase) ---- */
  const headerOpacity = useTransform(scrollYProgress, [0.12, 0.32], [1, 0]);
  const headerBlur = useTransform(scrollYProgress, [0.12, 0.32], [0, 12]);
  const headerFilter = useMotionTemplate`blur(${headerBlur}px)`;
  const headerY = useTransform(scrollYProgress, [0.05, 0.32], [0, 100]);
  const smoothHeaderY = useSpring(headerY, { stiffness: 60, damping: 20 });

  /* ---- preview tile parallax (mirrors columnConfig) ---- */
  const tileY0 = useTransform(scrollYProgress, [0.05, 0.38], [100, -80]);
  const tileY1 = useTransform(scrollYProgress, [0.05, 0.38], [60, -40]);
  const tileY2 = useTransform(scrollYProgress, [0.05, 0.38], [80, -60]);
  const tileYs = [tileY0, tileY1, tileY2];

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > 0.36 && phase === "grid") setPhase("morph");
    if (v < 0.22 && phase !== "grid") setPhase("grid");
  });

  return (
    <section
      ref={sectionRef}
      id="استخدامات-الأكاديمية"
      style={{ height: "350vh" }}
      className="relative"
    >
      {/* ---- sticky viewport ---- */}
      <div
        className="sticky top-0 flex h-screen flex-col items-center justify-start overflow-hidden py-14"
        style={{ background: "oklch(0.972 0 0)" }}
      >
        {/* header — fades as you scroll */}
        <motion.div
          style={{ opacity: headerOpacity, filter: headerFilter, y: smoothHeaderY }}
          className="absolute z-10 text-center px-6 max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-[var(--shadow-pill)]">
              <span>📖</span>
              <span>رحلة تعلم القرآن</span>
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-80px" }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="mt-5 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
          >
            طوّر تجربتك في{" "}
            <span style={{ color: "oklch(0.5 0.2 270)" }}>تعلم القرآن الكريم</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-80px" }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground leading-relaxed"
          >
            سواء كنت مبتدئاً أو طفلاً أو تستعد للحصول على الإجازة، فإن
            أكاديميتنا توفر لك إرشاداً شخصياً ومعلمين مؤهلين ومسارات تعليمية
            منظمة لمساعدتك على تحقيق أهدافك القرآنية
          </motion.p>
        </motion.div>

        {/* ---- morphing area ---- */}
        <LayoutGroup>
          <AnimatePresence mode="wait">
            {phase === "grid" ? (
              /* small preview tiles rising upward */
              <motion.div
                key="preview-grid"
                className="absolute inset-0 flex items-end justify-center gap-6 pb-24 px-6"
              >
                {useCases.map((uc, i) => (
                  <motion.div key={uc.id} style={{ y: tileYs[i] }}>
                    <PreviewTile data={uc} index={i} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              /* large expandable cards */
              <motion.div
                key="expanded-cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 flex items-center justify-center px-6 md:px-10"
              >
                <div
                  className="hidden md:flex gap-4 w-full max-w-6xl"
                  style={{ height: "min(70vh, 520px)" }}
                  role="tablist"
                  aria-label="استخدامات الأكاديمية"
                  onMouseLeave={() => {
                    if (!prefersReducedMotion) setActiveIndex(0);
                  }}
                >
                  {useCases.map((uc, i) => (
                    <motion.div
                      key={uc.id}
                      layoutId={`usecase-morph-${uc.id}`}
                      className="relative overflow-hidden rounded-3xl"
                      animate={{ flexGrow: activeIndex === i ? 3 : 1 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 250, damping: 30, mass: 0.8 }
                      }
                      style={{ minWidth: 0, flexShrink: 1, flexBasis: 0 }}
                    >
                      <ExpandableCard
                        data={uc}
                        isActive={activeIndex === i}
                        onActivate={() => setActiveIndex(i)}
                        prefersReducedMotion={!!prefersReducedMotion}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* mobile accordion */}
                <div
                  className="flex md:hidden flex-col gap-3 w-full max-w-6xl"
                  role="accordion"
                >
                  {useCases.map((uc, i) => (
                    <MobileAccordionCard
                      key={uc.id}
                      data={uc}
                      isExpanded={activeIndex === i}
                      onToggle={() =>
                        setActiveIndex(activeIndex === i ? -1 : i)
                      }
                      prefersReducedMotion={!!prefersReducedMotion}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
}
