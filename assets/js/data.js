/* ============================================================
   The Meaning of the Universe — research corpus
   ------------------------------------------------------------
   Each topic is a star in the galaxy and a research environment.
   Each document is a self-contained reading distilled from the
   field — synthetic surveys written to be substantive starting
   points, not citations of specific papers.
   ============================================================ */

export const TOPICS = [
  /* ─────────────────────────  SIMULATION THEORY  ───────────────────────── */
  {
    id: "simulation-theory",
    name: "Simulation Theory",
    cluster: "metaphysics",
    color: "#a78bfa",
    position: [-12, 6, -4],
    size: 1.0,
    tags: ["bostrom", "computational physics", "anthropics", "ontology"],
    summary: "The hypothesis that observable reality is a computation running on substrate we cannot directly inspect — and the testable physics that would follow if it were.",
    conclusion: "After three decades the conversation has shifted from 'is it true?' to 'what would distinguish it?' — and the answer is unexpectedly empirical.",
    conclusionBody: [
      { type: "p", text: "Simulation Theory is no longer the late-night philosophy seminar of 1995. It is now a working frame for at least four serious lines of inquiry: anthropic statistics, computational physics, the holographic principle, and the limits-of-knowledge problem. Each comes with predictions, and a few of those predictions are already being checked." },
      { type: "h4", text: "what the field actually agrees on" },
      { type: "ul", items: [
        "If even one civilization ever builds a high-fidelity ancestor simulation, the population of simulated minds vastly exceeds the population of biological ones. Bostrom's trilemma forces a choice between three uncomfortable conclusions, none of which is 'simulation is unlikely'.",
        "The universe behaves as if discretized at the Planck scale and as if information is the fundamental currency — not matter, not energy. This is independently motivated by black-hole thermodynamics and the holographic principle, but it is also what you would expect from a simulated substrate.",
        "Several proposed experimental signatures (lattice-spacing anisotropy in ultra-high-energy cosmic rays, error-correction patterns in genetic code, observer-dependent quantum collapse) are not crank ideas — they are testable and being tested.",
      ]},
      { type: "h4", text: "what the field still disagrees on" },
      { type: "ul", items: [
        "Whether the question is even decidable from inside the system.",
        "Whether the substrate would have to be quantum, classical, or something else entirely.",
        "Whether 'simulation' and 'mathematical multiverse' are distinguishable — Tegmark argues they are not.",
      ]},
      { type: "p", text: "The honest distillation: we do not know, and the evidence is suggestive but not coercive. The valuable shift is that the question now constrains physics. Theories that forbid certain kinds of simulation — for example, by requiring uncomputable continuous fields — gain testable content. The simulation hypothesis has, in this way, become productive even if it is wrong." },
    ],
    planetTheme: { type: "grid", params: { hue: 0.72, accent: 0.95, glitch: 0.6 } },
    documents: [
      {
        id: "sim-bostrom-revisited",
        type: "survey",
        title: "Bostrom's Trilemma, Twenty-Three Years On",
        author: "synthesis · 2026",
        summary: "A re-examination of the 2003 argument in light of contemporary AI compute curves, neuromorphic substrates, and the actually-observed cost of running large language models.",
        findings: [
          "The 'computational impossibility' horn has weakened — running a coarse human-equivalent simulation appears 5–7 orders of magnitude cheaper than Bostrom assumed.",
          "The 'civilizational filter' horn has strengthened — climate, nuclear, and AI alignment risks make late-stage civilizations look less robust than mid-2000s techno-optimism assumed.",
          "The 'we are simulated' horn is the residual default if neither of the other two holds, and is no longer fringe.",
        ],
        prose: [
          "Nick Bostrom's 2003 paper proposed that at least one of three statements must be true: (1) civilizations almost always go extinct before reaching post-human technological maturity; (2) post-human civilizations almost always decline to run ancestor simulations; or (3) we are almost certainly living in one. The argument is purely combinatorial. If even a tiny fraction of mature civilizations run even a small number of high-fidelity ancestor simulations, the population of simulated experiences swamps the population of biological ones, and reference-class reasoning places us among the simulated.",
          "Twenty-three years later, the empirical inputs have moved. We have built large neural systems that — at training cost roughly comparable to a modest national research budget — can sustain millions of agentic instances simultaneously. The cost of one human-equivalent cognitive simulation is not dropping at Moore's Law rates anymore; it is dropping faster, because algorithmic efficiency gains stack on hardware gains.",
          "Meanwhile the second horn has acquired empirical teeth. Civilizational fragility — once a philosophical worry — is now in the news weekly. Pandemics, geopolitical fracture, climate non-linearities, and the alignment problem all act as filters. A reasonable Bayesian today, conditioned on the last decade, raises P(horn 1) significantly.",
          "The interesting consequence is not 'we are probably simulated'. It is that the trilemma forces explicit accounting of civilizational survival probability. The simulation argument has become, by accident, one of the more rigorous frames for thinking about existential risk.",
          "The cleanest contemporary objection is from David Chalmers: even if we are simulated, this is metaphysically less radical than it sounds. The simulation is then our physical reality, full stop. The trilemma reframes ontology; it does not deny it."
        ],
      },
      {
        id: "sim-lattice-tests",
        type: "experiment",
        title: "Lattice Signatures in Ultra-High-Energy Cosmic Rays",
        author: "experimental review · 2024",
        summary: "Beane, Davoudi, and Savage proposed in 2012 that if spacetime is discretized on a cubic lattice, cosmic rays above a certain energy should show direction-dependent cutoff and a subtle preferred-axis effect. The proposal is now testable.",
        findings: [
          "Current observations from the Pierre Auger Observatory and Telescope Array are consistent with continuous spacetime down to ~10^-27 m — about 8 orders of magnitude finer than electroweak scale.",
          "No preferred-axis anisotropy has been detected to the sensitivity of current arrays.",
          "Next-generation arrays (POEMMA, GRAND) would push the limit by another 3–4 orders of magnitude before hitting the Planck scale.",
        ],
        prose: [
          "If our universe is the output of a computation on a discrete lattice, that lattice has a spacing. Below the spacing, the simulation cannot resolve detail; above it, the lattice imposes preferred directions — the way pixels impose a grid on a digital image. The deep prediction is that cosmic rays of sufficient energy should reveal the grid: there should be subtle direction-dependent cutoffs in the spectrum, oriented along the lattice axes of the underlying simulation.",
          "Beane, Davoudi, and Savage's 2012 paper was the first concrete experimental proposal in the simulation literature. Their reasoning runs through quantum chromodynamics: lattice QCD calculations done at increasing resolution converge on a specific prediction for the cosmic ray spectrum that a continuum theory would produce only in the infinite-resolution limit. By looking for residual lattice artifacts in the actual cosmic ray data, one can put bounds on the lattice spacing of any underlying simulation.",
          "Twelve years of higher-statistics data from Auger and TA have found no such artifacts. The conclusion is not that we are not simulated — it is that any simulation we live in is fine enough that its grid is invisible to current detectors. This is, in itself, an empirical constraint on a metaphysical hypothesis. That is rare.",
          "The deeper philosophical point is that simulation theory has produced a falsifiable prediction class. Falsification by null result is not as glamorous as discovery, but it is how science narrows the space of possible cosmologies."
        ],
      },
      {
        id: "sim-information-physics",
        type: "theoretical",
        title: "Information as Foundation: Wheeler's 'It from Bit' Revisited",
        author: "theoretical review · 2023",
        summary: "Why contemporary physics increasingly treats information — not matter, not energy — as the ground-level currency, and what this means for the simulation question.",
        findings: [
          "Black-hole entropy scales with area, not volume — implying that the information capacity of a region is bounded by its 2D boundary (the holographic principle).",
          "Bekenstein and Bremermann bounds limit how much information can be processed per unit energy per unit time. The universe respects these.",
          "Quantum error correction structures have been discovered in the AdS/CFT correspondence, suggesting reality itself uses techniques familiar from computer engineering.",
        ],
        prose: [
          "John Wheeler's 1989 slogan 'It from Bit' proposed that every physical entity derives its existence from yes-no questions — that information is ontologically prior to matter. At the time the idea was provocative but loose. The intervening decades have made it sharp.",
          "Black holes are the rosetta stone. Their entropy — a measure of how much information they contain — does not scale with their volume, as you might naively expect. It scales with their surface area. This is the holographic principle, and it has been derived from string theory, from loop quantum gravity, and from semi-classical thermodynamics independently. They all agree: the universe stores its information on a boundary, not throughout its bulk.",
          "More recently, work in AdS/CFT correspondence has shown that the way a higher-dimensional spacetime encodes information into a lower-dimensional boundary uses something formally identical to a quantum error-correcting code. The universe, at its deepest layer, appears to use redundancy to protect against decoherence — exactly the technique a competent engineer would use when building a reliable simulation.",
          "Whether this is evidence that we live in a simulation, or evidence that any consistent physical universe must look this way, is genuinely undecided. But the framing has changed. Information is no longer a metaphor in physics. It is the load-bearing concept."
        ],
      },
      {
        id: "sim-consciousness-substrate",
        type: "philosophical",
        title: "The Substrate Problem: Could Consciousness Run on Anything?",
        author: "philosophical analysis · 2025",
        summary: "If consciousness is substrate-independent, simulation is trivially possible. If it requires biological substrate, the entire argument fails at step one. The state of the debate.",
        findings: [
          "Functionalism (Putnam, Dennett, Chalmers' early position) implies substrate-independence and underwrites simulation theory.",
          "Integrated Information Theory (Tononi) implies that consciousness depends on specific causal structure, possibly making digital simulation impossible in principle.",
          "Biological naturalism (Searle) flatly denies that any non-biological system can be conscious — and is currently considered a minority view, but a respectable one.",
        ],
        prose: [
          "Simulation theory has a hidden assumption that rarely gets named: it assumes that whatever runs on the substrate would actually be conscious. If you build a perfect functional duplicate of a human mind out of silicon — or, in the trillion-galaxy-of-rocks-and-pulleys version, out of anything that can pass signals — does the lights-on quality of experience come with it?",
          "Functionalism says yes. If a system implements the right functional organization — receives inputs, processes them through the right kind of state transitions, produces appropriate outputs — then consciousness is automatically present. On this view, simulation theory is trivially compatible with conscious simulated beings. We could be that, right now.",
          "Integrated Information Theory pushes back. Tononi argues that consciousness corresponds to a specific kind of integrated causal structure — phi — and that ordinary computer simulations, despite passing functional tests, do not have the right causal geometry to generate phi. On this view, a digital simulation could pass every behavioral test for sentience while being a 'philosophical zombie' all the way down.",
          "Searle's biological naturalism goes further: consciousness requires specifically biological causal powers, and the question of substrate is not even open. Few working philosophers agree, but few have an actual refutation either.",
          "The honest position: we do not know. And until we do, simulation theory carries an unresolved load-bearing premise. That is not a fatal flaw — the same is true of most interesting metaphysical theses — but it should be named."
        ],
      },
    ],
  },

  /* ─────────────────────────  PLASMA DYNAMICS  ───────────────────────── */
  {
    id: "plasma-dynamics",
    name: "Plasma Dynamics",
    cluster: "physical",
    color: "#fb7185",
    position: [14, -2, 5],
    size: 1.15,
    tags: ["MHD", "fusion", "solar physics", "Birkeland", "Alfvén"],
    summary: "The fourth state of matter — ionized, conductive, and overwhelmingly the most common form of ordinary matter in the universe. The physics of how it moves.",
    conclusion: "Plasma is what 99% of visible matter actually is, and almost none of its behavior follows from the gas-and-solid intuitions we evolved with.",
    conclusionBody: [
      { type: "p", text: "Plasma physics sits at the awkward intersection of being deeply important and badly under-taught. Stars are plasma. The solar wind is plasma. The interstellar medium is plasma. Tokamak interiors are plasma. Lightning is plasma. Yet the curriculum still treats it as a specialty. The result: most physically literate people have intuitions calibrated on liquids and gases that fail badly when applied to the dominant form of matter." },
      { type: "h4", text: "the four distinctive behaviors" },
      { type: "ul", items: [
        "Quasi-neutrality: a plasma maintains charge neutrality at scales above the Debye length, but supports enormous local charge separations below it. This breaks ordinary fluid intuitions.",
        "Magnetic line-freezing: in highly conductive plasma, magnetic field lines are 'frozen into' the matter and drag along when the matter moves. This is the source of nearly all macroscopic plasma drama — solar flares, accretion disks, fusion confinement problems.",
        "Anisotropy: plasma in a magnetic field has wildly different physics along the field versus across it. Heat conducts freely along; barely at all across.",
        "Non-linear coupling: a plasma carries currents, which generate fields, which redirect the currents. Almost everything interesting is the product of this loop.",
      ]},
      { type: "h4", text: "where the open frontier is" },
      { type: "ul", items: [
        "Turbulent reconnection: we know magnetic field lines can break and re-form, releasing the energy of solar flares. We do not have a complete theory of why it happens when it does.",
        "Fusion confinement: ITER and the new private fusion sector are essentially gigantic plasma stability experiments.",
        "Cosmic-scale plasma: Alfvén's heretical 1970s plasma cosmology was wrong on the largest scales but right that plasma effects matter more than mainstream astrophysics initially admitted.",
      ]},
      { type: "p", text: "The honest distillation: plasma is the universe's default state, its physics is genuinely weird, and our mathematical control of it is mediocre. Almost every gap in our understanding of how stars work, how galaxies form, and how to build a fusion reactor is downstream of a plasma physics problem we have not solved." },
    ],
    planetTheme: { type: "plasma", params: { hue: 0.03, accent: 0.12, turbulence: 1.2 } },
    documents: [
      {
        id: "plasma-alfven-waves",
        type: "foundational",
        title: "Alfvén Waves and the Magnetized Fluid",
        author: "review · 2024",
        summary: "Hannes Alfvén's 1942 prediction that magnetic field lines can support transverse waves in a conducting fluid — initially rejected, eventually a Nobel — is now the workhorse of solar physics.",
        findings: [
          "Alfvén waves carry energy along magnetic field lines at a characteristic speed v_A = B / √(μ₀ρ), which can be a substantial fraction of c in low-density plasma.",
          "They are now observed routinely in the solar corona and are a leading candidate for coronal heating.",
          "Their nonlinear cousin — Alfvénic turbulence — controls energy transport in the solar wind.",
        ],
        prose: [
          "When Hannes Alfvén submitted his magnetohydrodynamic-wave paper to Nature in 1942, the referees rejected it as physically impossible. Their reasoning was conventional: in a fluid, transverse waves require a restoring force like surface tension, and a fluid does not have one in its bulk. Alfvén's insight was that a magnetic field, frozen into a conducting fluid, provides exactly such a restoring force. Pluck a magnetic field line, and it springs back.",
          "Alfvén was right. The waves now bear his name and were the foundation of his 1970 Nobel. More important, they turn out to be one of the dominant energy-carrying mechanisms in nearly all astrophysical plasma. The corona of the Sun is heated, at least in part, by Alfvén waves dissipating their energy into the local plasma. The solar wind's structure — and the fact that it is faster than any simple thermodynamic argument predicts — is largely a story of Alfvénic turbulence.",
          "The physics is conceptually clean. A magnetic field line in a conductor acts like a string under tension. The tension is B² / μ₀; the inertia is the mass density of the conducting fluid frozen onto the line. The ratio gives a wave speed. The waves are transverse, polarized perpendicular to the field, and propagate along it. Almost everything else in plasma astrophysics is built on this base.",
          "What is still unsolved: the precise mechanism by which Alfvén-wave energy dissipates into heat. There are at least four serious candidates — phase mixing, resonant absorption, turbulent cascade to ion gyroradius, and reconnection-driven dissipation — and they are probably all happening in different proportions in different regions. The cleanest open problem in solar physics is to determine the proportions."
        ],
      },
      {
        id: "plasma-reconnection",
        type: "frontier",
        title: "Magnetic Reconnection: Why Flares Happen When They Do",
        author: "frontier review · 2025",
        summary: "Reconnection — the breaking and reconnecting of magnetic field lines — is the source of solar flares, geomagnetic storms, and confinement loss in tokamaks. We can simulate it. We cannot predict it.",
        findings: [
          "Classical (Sweet-Parker) reconnection is far too slow to explain observed flare rates by factors of 10^6 or more.",
          "Plasmoid-instability and stochastic-reconnection models now produce realistic rates in simulations.",
          "The trigger problem — what makes a stable configuration suddenly reconnect — remains essentially open.",
        ],
        prose: [
          "Magnetic reconnection is the process by which magnetic field lines, normally frozen into a conducting plasma, manage to break and re-form into a new topology. When this happens, the magnetic energy stored in the old configuration is released — sometimes catastrophically. Solar flares are reconnection events. Coronal mass ejections are reconnection events. Disruptions in tokamak fusion devices are reconnection events.",
          "The problem is that classical theories predict reconnection should be very slow. Sweet and Parker's mid-century calculation gave timescales of years for solar conditions; observations show reconnection happening in minutes. Petschek's 1964 modification helped but still falls short. For decades the literature carried this discrepancy as an open scandal.",
          "The contemporary resolution involves the plasmoid instability: when a current sheet thins past a critical aspect ratio, it spontaneously fragments into a chain of magnetic islands, and reconnection proceeds in parallel across many small sites rather than slowly through one big one. Simulations of this 'plasmoid-mediated' regime now produce reconnection rates compatible with observation.",
          "What remains unsolved is the trigger problem. A flux rope on the sun can sit stable for days, then suddenly erupt. The configurations before and immediately after the trigger look nearly identical to current diagnostic capability. Space weather forecasting depends on solving this. A reliable 24-hour flare forecast would be worth, on the low end, tens of billions of dollars in protected satellite and grid infrastructure. We do not have one."
        ],
      },
      {
        id: "plasma-fusion-status",
        type: "engineering",
        title: "Where the Fusion Plasma Stability Problem Actually Stands",
        author: "status report · 2026",
        summary: "An honest accounting of what plasma physics needs to do for ITER and the private fusion sector to deliver — separating engineering challenges from physics unknowns.",
        findings: [
          "Confinement scaling laws (H-mode, ELM physics) are now sufficiently empirical to design Q>10 devices with reasonable confidence.",
          "The real frontier is divertor heat-flux management — the problem of dumping ~10 MW/m² of plasma exhaust onto a solid surface without melting it.",
          "Alternate concepts (stellarators, FRCs, levitated dipoles) are no longer fringe and have substantial private capital.",
        ],
        prose: [
          "The narrative around fusion has flipped twice in the last decade. In 2015 the consensus was that ITER would prove physics and DEMO would prove engineering, and commercial fusion was thirty years off. Private companies were curiosities. By 2022 the consensus had shifted: high-temperature superconducting magnets had reset the design space, ITER looked unwieldy, and a dozen private companies were promising net-positive plasma by 2030. The current honest picture is somewhere in between.",
          "The plasma stability problem itself is on much firmer ground than commonly appreciated. We have empirical scaling laws — the H-mode threshold, ELM frequency, confinement time vs. plasma parameters — calibrated against thirty years of tokamak data. These scaling laws are not first-principles but they are reliable enough to design with. A device built to ITER specs will, with high probability, produce a burning plasma. The physics community agrees on this.",
          "Where the physics community does not agree is the divertor problem. A reactor-scale tokamak dumps roughly 10 MW/m² of plasma exhaust onto its divertor plates. This is comparable to the heat flux on the surface of the sun. No solid material handles this for long. Liquid-metal divertors, snowflake configurations, and detached-plasma regimes are all under active investigation, but none has been demonstrated at reactor scale.",
          "Alternate confinement schemes — stellarators (Wendelstein 7-X), field-reversed configurations (TAE), levitated dipoles (Helion's approach, though heterodox) — each route around different subsets of the tokamak problems. The private sector has bet roughly $10B on the proposition that at least one of these routes will deliver before tokamaks do. Physics does not yet say who is right."
        ],
      },
      {
        id: "plasma-cosmic-plasma",
        type: "controversial",
        title: "What Plasma Cosmology Got Right (and Mostly Wrong)",
        author: "historical-critical · 2025",
        summary: "Alfvén and Peratt's plasma cosmology — that large-scale cosmic structure is sculpted primarily by electromagnetic forces rather than gravity — failed as a theory of everything. But its narrow claims have aged better than mainstream physics initially expected.",
        findings: [
          "Plasma cosmology's central claim — that galactic-scale structure is electromagnetically driven — is contradicted by overwhelming gravitational evidence (galaxy rotation curves with dark matter, CMB power spectrum, structure formation simulations).",
          "Its peripheral claim — that filamentary plasma structures (Birkeland currents) operate at scales up to clusters of galaxies — has been substantially vindicated. Such structures are now routinely observed.",
          "The lesson is that minority physics traditions can be partly right even when wrong on their headline thesis, and shouldn't be summarily dismissed.",
        ],
        prose: [
          "Hannes Alfvén used his late career to argue that mainstream cosmology had drastically underweighted the role of electromagnetism in shaping large-scale cosmic structure. His student Anthony Peratt extended this into 'plasma cosmology', which proposed that galaxies form not from gravitational instability in dark-matter halos but from Birkeland-current pinches in cosmic-scale plasma filaments.",
          "Plasma cosmology, as a complete alternative to ΛCDM, is wrong. The evidence is overwhelming. Cosmic microwave background acoustic peaks, galaxy rotation curves, gravitational lensing maps, large-scale structure simulations, and the Bullet Cluster all point unambiguously to gravity-dominated structure formation with a substantial dark-matter component. Plasma cosmology has no comparable explanation for any of these.",
          "But — and this is the interesting part — plasma cosmology's narrow technical claims have aged surprisingly well. Filamentary plasma structures, sometimes called Birkeland currents, are now routinely observed connecting clusters of galaxies. The intergalactic medium is increasingly understood to carry organized current systems. The role of magnetic fields in galactic dynamics is taken more seriously now than in 1980.",
          "The cleanest moral is methodological. Plasma cosmology is a case study in a heterodox tradition that was wrong about its headline thesis but right about specific contributions that the mainstream had genuinely overlooked. Recognizing this requires the discipline to separate a school's bold claims from its careful ones — which is rare in any field."
        ],
      },
    ],
  },

  /* ─────────────────────────  WORLD RELIGIONS  ───────────────────────── */
  {
    id: "world-religions",
    name: "World Religions",
    cluster: "humanity",
    color: "#facc15",
    position: [-6, -10, 8],
    size: 1.05,
    tags: ["comparative theology", "mysticism", "anthropology", "perennialism"],
    summary: "The world's enduring traditions of inquiry into ultimate questions — examined for their common architecture, their irreducible disagreements, and what they tell us about the human mind.",
    conclusion: "The traditions converge on architecture and diverge on cosmology. The convergence is more interesting than the divergence.",
    conclusionBody: [
      { type: "p", text: "Comparative religion has a problem: the surface details look incompatible. Hindu cyclical time and Christian linear time, Buddhist non-self and Abrahamic personal soul, Daoist immanence and Islamic transcendence. The temptation is to either declare them all saying the same thing (the perennialist mistake) or declare them mutually incompatible (the materialist mistake). Both are wrong." },
      { type: "h4", text: "what they share, structurally" },
      { type: "ul", items: [
        "A claim that ordinary experience is, in some important sense, a confused or partial version of reality.",
        "A set of practices — meditative, contemplative, devotional, ascetic — for shifting that experience.",
        "Reports from advanced practitioners that converge on a recognizable set of altered states (unity, dissolution of self, encounter with luminosity, dispassionate love).",
        "A social architecture for transmitting practice across generations.",
      ]},
      { type: "h4", text: "what they don't share" },
      { type: "ul", items: [
        "The metaphysics they wrap around the states. A Christian mystic and a Theravada arhat may describe phenomenologically similar experiences and interpret them as different ontological events.",
        "The cosmology — origin stories, eschatology, soteriology.",
        "The social and ethical implications drawn from the same underlying insights.",
      ]},
      { type: "p", text: "The honest distillation: the contemplative cores of the great traditions appear to be exploring a real territory of human experience — the same territory, accessed by different doors. The metaphysics built on top is more like a series of competing interpretations of the same data. This does not make the traditions interchangeable. It makes them comparable in a way that resists both lazy syncretism and dismissive reductionism." },
    ],
    planetTheme: { type: "mandala", params: { hue: 0.13, accent: 0.78, complexity: 7.0 } },
    documents: [
      {
        id: "rel-mystical-convergence",
        type: "comparative",
        title: "The Phenomenology of Mystical States Across Traditions",
        author: "comparative study · 2024",
        summary: "When practitioners of unrelated traditions describe peak contemplative states, they use suspiciously similar phenomenological language. The case for a shared underlying neurology.",
        findings: [
          "Reports of self-dissolution, time-suspension, and unity-with-totality appear across Christian, Sufi, Hindu, Buddhist, Daoist, and indigenous shamanic traditions.",
          "Neuroimaging shows that experienced meditators across traditions exhibit similar patterns of reduced default-mode-network activity during peak practice.",
          "The convergence is not on metaphysics but on phenomenology — what the experience is like, not what it is.",
        ],
        prose: [
          "Walter Stace's 1960 'Mysticism and Philosophy' was the first systematic attempt to catalogue the cross-cultural similarities in mystical experience. He proposed two near-universal features: the dissolution of the experiencing self, and a sense of unity with whatever-is. Six decades of follow-up work — phenomenological, ethnographic, and now neuroscientific — has substantially confirmed his catalogue while adding nuance.",
          "Catholic apophatic mystics (Meister Eckhart, John of the Cross) describe a 'darkness' beyond all images of God. Mahayana Buddhists describe shunyata, the emptiness from which appearance arises. Vedantins describe the dropping-away of upadhis to reveal Atman-Brahman. Sufis describe fana — annihilation of the ego in the Beloved. These descriptions are not identical. But they are recognizably variations on a theme.",
          "Neuroscience over the last two decades has added a layer the philosophers couldn't. fMRI and PET studies of experienced meditators show consistent reductions in default-mode-network activity during peak practice. The DMN is the brain network that constructs the experienced sense of being a continuous self situated in a narrative. Quiet it, and what people report sounds an awful lot like classical mystical experience.",
          "The interpretation is contested. One school holds that this is evidence that mysticism is 'just' a brain state, and the metaphysics is confabulation. Another holds that the brain state is the door, not the destination — the means by which a deeper reality becomes available to perception. The data don't decide between these. They do establish that the experience is real, transmissible, and not particular to any one tradition."
        ],
      },
      {
        id: "rel-axial-age",
        type: "historical",
        title: "The Axial Age Hypothesis and Its Discontents",
        author: "historical review · 2023",
        summary: "Karl Jaspers' 1949 claim that the world's major spiritual traditions emerged in a single window between 800 and 200 BCE has been refined, qualified, and is largely still standing.",
        findings: [
          "The clustering — Confucius, Lao Tzu, Buddha, Mahavira, Zoroaster, the Hebrew prophets, the Greek philosophers — is statistically striking and not adequately explained by chance.",
          "Common pre-conditions across the regions: literacy, agricultural surplus, the rise of trade cities, the breakdown of older sacrificial-state religious orders.",
          "The hypothesis has been weakened by better understanding of pre-axial sophistication in Egypt and Mesopotamia, but not refuted.",
        ],
        prose: [
          "Karl Jaspers noticed something. In the six centuries between roughly 800 and 200 BCE, a strikingly disproportionate share of the world's still-living religious and philosophical traditions came into being. Confucius and Lao Tzu in China. The Buddha and Mahavira in India. Zoroaster in Persia. The Hebrew prophets in Israel. Heraclitus, Pythagoras, Socrates, Plato in Greece. The traditions had little or no contact with each other. Yet they arose nearly simultaneously, and they share something.",
          "What they share, on Jaspers' reading, is a turn from sacrificial-cosmic religion toward an interior, ethical, individually-accountable practice. Pre-axial religion was overwhelmingly about maintaining the right relationship between the polity and the cosmos through ritual. Axial religion shifted the locus of religious life into the individual conscience and toward a transcendent moral standard that could, in principle, judge the polity itself. This is the historical moment when religion becomes something a person can be against the state about.",
          "The Axial Age hypothesis has taken some hits. Egyptologists have demonstrated that the interior ethical-religious turn was prefigured at Amarna in the 14th century BCE. Cuneiform scholarship has shown more sophistication in pre-axial Mesopotamian religion than Jaspers credited. The 'before-and-after' contrast he drew has softened. But the clustering of new movements in the axial window remains, and so does the question of what selected for that clustering.",
          "The most credible contemporary hypothesis points to common pre-conditions across the regions: the rise of literate scribal classes, durable agricultural surplus, trade-city cosmopolitanism, the partial collapse of older state-cult systems. When these conditions converge, the cultural soil seems to grow Axial-style movements. Whether this is causation, correlation, or selection bias in what we count as 'major' traditions is still being argued out."
        ],
      },
      {
        id: "rel-evolution-of-god",
        type: "anthropological",
        title: "The Evolution of God-Concepts: From Local Spirit to Big God",
        author: "anthropology of religion · 2025",
        summary: "Recent work using cross-cultural databases (Seshat, eHRAF) tracks how concepts of the divine evolve as societies scale. The 'big gods' hypothesis is now well-supported, with caveats.",
        findings: [
          "Small-scale societies tend toward many local spirits with limited moral concern.",
          "Societies scaling beyond Dunbar-number ceiling tend to develop or import gods who are moralizing, omniscient, and concerned with cooperation among strangers.",
          "The directionality (do big gods cause scale, or does scale select for big gods?) is now thought to be mostly the latter.",
        ],
        prose: [
          "For most of human history, religious life centered on local spirits — ancestors, place-deities, animal-powers — whose ethical concern, if any, was limited to local kin and ritual obligations. They did not particularly care if you cheated a stranger from the next valley. Yet today's globally-dominant religions feature gods who care intensely about cooperation among strangers and who claim universal moral jurisdiction. How did this transition happen?",
          "Ara Norenzayan's 'Big Gods' thesis proposed that as human societies scaled beyond face-to-face cooperation, they needed mechanisms to enforce trust among strangers. Moralizing high gods — omniscient, judgmental, punishing-rewarding — fit the bill. Societies with such gods could sustain larger cooperative networks; societies without them couldn't. The result is a selection process across cultures, not within them: societies with the right kind of god outcompeted those without.",
          "Initial evidence was suggestive but contested. The Seshat database — a massive cross-cultural historical compilation — has substantially clarified the picture. The current finding is that big-god concepts do appear to be associated with scale, but the direction of causation runs the other way from what was originally proposed: scale precedes big gods, not the reverse. Societies first solve cooperation problems through other means (institutions, written law, market exchange), and then import or evolve moralizing high gods to legitimize and reinforce the order they have already built.",
          "This is a finer-grained story than either 'religion built civilization' or 'civilization invented religion to control people'. It is a co-evolution, in which scale and moralizing theology reinforce each other once both conditions are present. It also implies that traditional moralizing religions are doing real work in maintaining cooperation among strangers — work that secular institutions in nominally post-religious societies are still figuring out how to replicate."
        ],
      },
      {
        id: "rel-perennialism-critique",
        type: "philosophical",
        title: "Perennialism: A Sympathetic Critique",
        author: "philosophy of religion · 2024",
        summary: "The view that all the great traditions point to the same ultimate truth is more sophisticated than its critics allow, and shallower than its proponents claim.",
        findings: [
          "Traditionalist perennialism (Guénon, Schuon, Nasr) makes serious metaphysical claims that cannot be reduced to either kumbaya syncretism or Western Christian universalism in disguise.",
          "But its claim that the metaphysical core is the same beneath divergent forms rests on a privileged interpretation — usually one shaped heavily by neo-Platonism — that not all traditions accept.",
          "The contemporary mature view: traditions share territory but not maps. They illuminate overlapping but distinct features of the same real space.",
        ],
        prose: [
          "The perennialist position — that all the world's great religious traditions are, at their core, articulations of the same underlying truth — has both serious defenders and serious critics. Its critics often caricature it as the naive 'all paths lead up the same mountain' bumper sticker. The mature versions are considerably more careful.",
          "Frithjof Schuon distinguished between the 'exoteric' forms of religions (their dogmas, rituals, social structures) and their 'esoteric' essence (the metaphysical-mystical core). His claim was not that the exoterics agree — they manifestly do not — but that the esoterics point to the same metaphysical reality through different symbolic apertures. Each apparently incompatible exoteric form is then a divinely-given path adapted to a particular human collective, while the esoteric center remains one.",
          "The strongest critique is from comparative philosophy: this framing privileges a specifically neo-Platonic ontology of the One and the Many, then reads other traditions through it. Christian apophatic mysticism fits because it shares neo-Platonic ancestry. Advaita Vedanta fits well too. But Theravada Buddhism actively rejects the metaphysics of a unified ground; non-self is non-self, and a perennialist reading has to soften or paper over the disagreement.",
          "The most defensible mature position holds that the traditions are exploring genuinely overlapping but not identical features of a real territory of human possibility. There is enough convergence to warrant comparison and mutual learning, and enough irreducible disagreement to warrant taking each tradition's metaphysics on its own terms. This is less satisfying than either pure perennialism or pure cultural relativism, which is usually a sign of being closer to right."
        ],
      },
    ],
  },

  /* ─────────────────────────  ECONOMICS  ───────────────────────── */
  {
    id: "economics",
    name: "Economics",
    cluster: "systems",
    color: "#34d399",
    position: [10, -6, -6],
    size: 1.0,
    tags: ["complexity", "monetary policy", "behavioral", "systems"],
    summary: "The study of how humans organize the production, distribution, and meaning of value — increasingly understood as a complex adaptive system rather than an equilibrium machine.",
    conclusion: "The discipline is in the middle of a slow paradigm shift from equilibrium mechanics to complexity, behavioral realism, and explicit attention to power.",
    conclusionBody: [
      { type: "p", text: "Modern economics looks much less like its mid-twentieth-century self than most outside the field realize. The neoclassical synthesis — rational agents, market clearing, equilibrium analysis — is no longer the unchallenged center. Three lines of work have eroded its dominance: behavioral economics demonstrated systematically irrational decision-making; complexity economics showed that markets are emergent, often non-equilibrium systems; and a renewed political economy has put power back in the analytical frame." },
      { type: "h4", text: "what the new consensus actually accepts" },
      { type: "ul", items: [
        "Markets are real and powerful but neither perfectly competitive nor self-correcting in general.",
        "Agents are boundedly rational, prone to systematic bias, and embedded in social-information networks that shape their choices.",
        "Wealth and income distributions are heavy-tailed and largely produced by power-law-generating mechanisms (preferential attachment, returns to scale, political capture), not by Gaussian merit-and-luck.",
        "Monetary and fiscal policy interact with each other and with financial structure in ways the mid-century separation never properly captured.",
      ]},
      { type: "h4", text: "what is still genuinely contested" },
      { type: "ul", items: [
        "The right framework for thinking about money, credit, and central-bank operations (MMT, post-Keynesian, traditional monetarist, and various hybrids).",
        "How to handle the externalities of digital-platform monopolies and AI-driven productivity shifts.",
        "Whether the discipline can or should incorporate ecological constraints into its core equations or treat them as boundary conditions.",
      ]},
      { type: "p", text: "The honest distillation: economics is a richer, weirder, and more humble field than its caricature. The interesting work now is at the boundaries — with complexity science, with neuroscience, with political theory, with ecology. The textbook-level neoclassical material is still useful as a first approximation but is rarely what working economists actually believe describes reality." },
    ],
    planetTheme: { type: "flow", params: { hue: 0.42, accent: 0.58, density: 1.4 } },
    documents: [
      {
        id: "econ-complexity",
        type: "paradigm",
        title: "Complexity Economics: The Santa Fe Program at 35",
        author: "synthesis · 2025",
        summary: "Brian Arthur, John Holland, and colleagues at the Santa Fe Institute proposed in the 1980s that economies should be modeled as complex adaptive systems. The program has matured into a respectable alternative.",
        findings: [
          "Markets exhibit endogenous boom-bust dynamics inconsistent with equilibrium models — and agent-based models reproduce them naturally.",
          "Increasing returns and network effects produce path-dependent outcomes where 'better' technologies routinely lose, contradicting neoclassical efficient-market claims.",
          "Wealth distributions emerge with heavy tails from the operation of fairly minimal preferential-attachment processes — Pareto's empirical regularity is a generic feature of compounded-return systems, not an outcome that requires moral interpretation.",
        ],
        prose: [
          "In 1987 a group of economists and physicists gathered at the Santa Fe Institute to ask a question that mainstream economics largely avoided: what if the economy is a complex adaptive system rather than an equilibrium one? The conference produced no manifesto, but it did seed a research program that has, over the following four decades, matured into something the mainstream can no longer ignore.",
          "The core claim is methodological. Neoclassical economics solves for fixed points: market clearing, rational expectations equilibrium, optimal allocation under constraints. Complexity economics instead simulates the dynamics: heterogeneous agents with bounded rationality interact, the interactions produce emergent macro-patterns, and those patterns feed back into individual behavior. The two approaches do not always disagree on what the long-run looks like, but they often disagree about how the long-run is reached — and about how stable it is.",
          "The empirical strikes against equilibrium thinking have stacked up. Asset markets exhibit fat-tailed return distributions and volatility clustering that pure rational-expectations models simply cannot generate. Agent-based models with realistic heterogeneity generate these patterns easily. The 2008 financial crisis was a coup for the complexity camp: equilibrium DSGE models could not even rationalize what was happening, while agent-based models with credit-network structure had been describing exactly this kind of cascade for a decade.",
          "What has not happened is the displacement of neoclassical theory from textbooks. Equilibrium analysis is still the lingua franca of policy work because it produces clean answers. Complexity economics produces probability distributions over outcomes, which are harder to fit into a memo. The discipline is still working out how to combine the analytical tractability of one with the empirical realism of the other."
        ],
      },
      {
        id: "econ-behavioral-replication",
        type: "empirical",
        title: "Behavioral Economics After the Replication Crisis",
        author: "empirical reassessment · 2024",
        summary: "Many classic behavioral findings have replicated poorly. The field's central insights have survived, but the specific effects are smaller and more contextual than the popular literature suggested.",
        findings: [
          "Loss aversion: real and robust, but typically by a ratio closer to 1.3-1.7 rather than the 2.0 of early literature.",
          "Anchoring: replicates strongly when anchors are subtle, weakly when they're obvious.",
          "Many ego-depletion, priming, and nudge effects have failed to replicate or have been substantially weakened.",
        ],
        prose: [
          "Kahneman and Tversky's work in the 1970s and 1980s established that humans are not the rational utility-maximizers of economic textbooks. We are systematically biased in predictable ways: loss aversion, anchoring, availability cascades, framing effects, hyperbolic discounting. The findings were vivid, the demonstrations elegant, and they propagated rapidly into policy through the 'nudge' movement.",
          "Then came the replication crisis. The mid-2010s saw a series of large-scale replication efforts — the Many Labs projects, the Reproducibility Project — that found many published psychological and behavioral effects either failed to replicate or were dramatically smaller than originally reported. Behavioral economics was substantially exposed.",
          "The current state of the field is more honest than it used to be and more rigorous about effect sizes. The core insight — that humans deviate systematically from rational-actor models — has survived. Loss aversion is real. Anchoring is real. Hyperbolic discounting is real. But the effect sizes are typically smaller than the popular literature suggested, the conditions for the effects are more specific, and many sub-claims (ego depletion, priming via incidental stimuli, broad nudge transferability) have collapsed.",
          "The mature version of the field accepts that humans are limited optimizers operating with high noise, that environmental design can shift behavior in important ways, and that any particular intervention is going to have a smaller and more context-dependent effect than its discoverers initially claimed. This is less exciting than the original promise and more useful as a guide to policy."
        ],
      },
      {
        id: "econ-money-systems",
        type: "theoretical",
        title: "What Money Is: The Three Theories Still Fighting",
        author: "theoretical review · 2025",
        summary: "Commodity theory, credit theory, and chartalism have been arguing about the nature of money since the 1800s. The debate is more practical than it sounds — central-bank policy depends on which theory is right.",
        findings: [
          "Commodity theory (money emerges from barter; modern fiat is a generalization of metal): empirically weak — anthropology shows credit and ledger-money substantially predate coin and metal commodity-money.",
          "Credit theory (money is a record of debt, anchored in trust and law): empirically strong — modern money is almost entirely bank-issued credit, only fractionally backed by central-bank reserves.",
          "Chartalism / MMT (money's value derives from the state's demand for it in taxes): partially correct for fiat regimes, but oversells the consequences for fiscal policy.",
        ],
        prose: [
          "Almost everyone has an intuitive theory of money. Almost no one's intuitive theory is fully right. The argument matters more than people realize, because central banks act on whatever theory their staff implicitly hold, and the theories give different answers about inflation, debt, and crisis response.",
          "Commodity theory — the standard high-school story — runs as follows. People used to barter. Barter is inefficient. So societies converged on a commonly-accepted commodity (gold) as a medium of exchange. Modern paper money is a kind of certificate for gold, and fiat money is a degenerate version of this. The story is intuitive, persistent, and almost completely wrong as anthropology. David Graeber and others have established that credit-based ledgers and unit-of-account systems predate commodity money by millennia. Money emerged not from barter but from temple bookkeeping.",
          "Credit theory — the school of Innes and Schumpeter — takes this seriously. Money is at its base a record of debt: I owe you, written down on something durable. Coins and paper were certificates of these debts; modern bank-deposit money is essentially the same thing run by private banks under a central-bank umbrella. This theory predicts what is actually true: that most money in circulation is created by commercial banks issuing loans, not by central banks printing.",
          "Chartalism — and its modern descendant Modern Monetary Theory — adds that the state imposes a tax denominated in a particular unit, and that creates baseline demand for the state's money. This is correct as a description of where fiat money's value ultimately comes from. The MMT extension — that a sovereign-currency issuer faces no nominal budget constraint and is only limited by real-resource inflation — is partly correct in steady state and partly misleading about transitional dynamics. The argument here is mostly about what 'inflation constraint' actually means in practice.",
          "The synthesis that has slowly emerged from the more thoughtful work: money is fundamentally a social technology of trust and accounting, the state's role is essential for fiat regimes but does not eliminate budget constraints in the practical sense that matters for policy, and ignoring this layer (as much of the macro mainstream did up to 2008) produces predictable disasters."
        ],
      },
      {
        id: "econ-frontier-ai-labor",
        type: "frontier",
        title: "AI, Labor, and the Productivity Question",
        author: "frontier analysis · 2026",
        summary: "What current data show about how generative AI is actually changing labor markets — separating the hype from the measured effects.",
        findings: [
          "Measured productivity gains for AI-augmented knowledge work are real and substantial (20-50% for many task categories) but unevenly distributed across worker skill levels.",
          "The 'AI lifts the bottom' pattern in customer service and some coding tasks has been substantially documented; the 'AI lifts the top' pattern in research and strategy work appears in some studies.",
          "Aggregate employment effects to date are small, but the composition of work is shifting rapidly within job categories.",
        ],
        prose: [
          "Three years into broad availability of capable generative AI, we have enough data to say something more substantive than the early speculation. The picture is more interesting and more uneven than either the boosters or the doomers predicted.",
          "On productivity: the gains are real and they are not small. Field studies of AI-augmented coding work consistently show 25-55% productivity increases on routine tasks, with smaller but still significant gains on harder ones. Customer support productivity rises 14-35% depending on study and operationalization. Knowledge-work composition tasks (drafts, summaries, analysis frameworks) show similar magnitudes. These are not headline-grabbing 10x gains, but they are far larger than typical productivity improvements from new tools.",
          "On distribution of gains: the pattern is genuinely heterogeneous. Several studies have found a 'lifts the bottom' pattern in which less-skilled workers benefit most from AI augmentation — the AI fills in their weaker areas. Other studies, particularly in research and strategy contexts, find the opposite: highly-skilled workers extract more value because they can better judge AI outputs and integrate them. Both are probably true in different domains. The honest summary is that we do not yet have a unified theory of when AI augmentation is leveling and when it is concentrating.",
          "On employment: the aggregate displacement effect to date is small. Some specific job categories (entry-level legal research, customer service tier-1, certain illustration work) have measurably shrunk. Others have grown. Total employment in advanced economies is essentially flat from pre-AI trend lines. This may not last. The within-job composition of work is shifting very fast, and skill demands are being rewritten faster than educational systems can respond. The interesting question for the next decade is not 'will AI cause mass unemployment' but 'will the gains be captured by labor, capital, or platform monopolies'."
        ],
      },
    ],
  },

  /* ─────────────────────────  ESOTERICA  ───────────────────────── */
  {
    id: "esoterica",
    name: "Esoterica",
    cluster: "metaphysics",
    color: "#c084fc",
    position: [-10, 8, 6],
    size: 0.92,
    tags: ["hermeticism", "alchemy", "kabbalah", "occult", "history of ideas"],
    summary: "The Western traditions of hidden knowledge — Hermeticism, alchemy, Kabbalah, ceremonial magic — examined as serious intellectual history rather than caricature.",
    conclusion: "What the modern academy now takes seriously: esotericism was a major channel by which the early modern world thought its way toward the scientific revolution.",
    conclusionBody: [
      { type: "p", text: "For most of the 19th and 20th centuries, academic history of science treated the esoteric traditions as the embarrassing prehistory of real knowledge — alchemy as failed chemistry, astrology as failed astronomy, Hermeticism as superstition. The last forty years of careful scholarship have rewritten this picture substantially. Newton spent more time on alchemy than on physics. Kepler was a working astrologer. The Royal Society's early membership included serious Hermeticists. The story of how reason emerged is not a story of reason against magic; it is a story of how magic became reason." },
      { type: "h4", text: "what serious scholarship has established" },
      { type: "ul", items: [
        "Hermeticism — the Greek-Egyptian late-antique tradition centered on the Corpus Hermeticum — was a significant intellectual force in Renaissance Italy and supplied much of the conceptual scaffolding for early modern natural philosophy.",
        "Alchemy was a serious experimental tradition with real chemical discoveries (phosphorus, hydrochloric acid, distillation techniques) embedded in a symbolic-spiritual framework.",
        "Christian Kabbalah and the broader Renaissance synthesis of Jewish mystical thought were vehicles for sophisticated metaphysical speculation that fed directly into early modern philosophy.",
        "Frances Yates's controversial thesis — that Hermetic-magical thinking actively contributed to the scientific revolution — has been substantially supported (with caveats) by later scholarship.",
      ]},
      { type: "h4", text: "what is still controversial" },
      { type: "ul", items: [
        "How much of the experiential claims of esoteric practitioners (visionary states, alchemical inner work) can be taken at face value versus reinterpreted.",
        "Whether the 'perennial' or 'underground stream' framings (Faivre, Hanegraaff debates) describe a real continuity or a constructed lineage.",
      ]},
      { type: "p", text: "The honest distillation: esoteric traditions are a legitimate field of intellectual history with substantive content, and the post-Enlightenment dismissal was as ideologically motivated as the things it dismissed. Whether the deep metaphysical claims of these traditions are true is a separate question from whether they're historically and philosophically serious. They are." },
    ],
    planetTheme: { type: "crystal", params: { hue: 0.78, accent: 0.55, facets: 8.0 } },
    documents: [
      {
        id: "eso-yates-thesis",
        type: "historical",
        title: "The Yates Thesis: Hermeticism and the Scientific Revolution",
        author: "historical review · 2024",
        summary: "Frances Yates argued that the Hermetic tradition was a major cause — not just contemporary — of the scientific revolution. Forty years of follow-up has been mixed but mostly supportive.",
        findings: [
          "The 'Hermetic core' of the scientific revolution thesis has been weakened — Yates overstated the unity and influence of Hermeticism in the 16th-17th centuries.",
          "Her broader claim that magical and natural-philosophical thinking were entangled has been strengthened by archive work on Newton, Boyle, and others.",
          "The current consensus: Hermeticism was one of several intellectual streams feeding into early science, not the dominant one Yates suggested, but more important than the older historiography acknowledged.",
        ],
        prose: [
          "Frances Yates's 1964 book 'Giordano Bruno and the Hermetic Tradition' detonated a long-running debate in the history of science. Her thesis was bold: the scientific revolution was not the triumph of cold reason over warm superstition. It was the outgrowth of a Renaissance Hermetic-magical movement that valorized the active investigation of nature, the unity of microcosm and macrocosm, and the practical control of natural forces. Bruno was burned not as a proto-scientist but as a Hermetic magus, and his successors carried that ambition into a different vocabulary.",
          "The thesis was contested almost immediately. Brian Vickers and others argued that Yates conflated distinct traditions, overestimated Hermeticism's coherence, and projected later scientific ambitions backward onto figures whose actual concerns were quite different. Some of these critiques landed. Yates was working with an idealized 'Hermetic tradition' that was less unified in practice than in her account.",
          "But the broader claim — that the boundary between magic and science in the 1500s-1600s was much more porous than the standard story allowed — has been substantially vindicated by archival work since. Newton's alchemical manuscripts, suppressed for centuries, turn out to be voluminous and serious. Boyle was deeply involved in alchemical projects. Kepler's astronomical breakthroughs cannot be cleanly separated from his astrological and Pythagorean commitments. The early Royal Society included serious Hermeticists.",
          "The current consensus: Yates was partly wrong and partly right, in roughly equal measure. The Hermetic tradition was not the single hidden engine of the scientific revolution. But the dismissal of magical thinking from the prehistory of science was an ideological move, not a historical finding, and the actual record shows continuous entanglement of what would later be sorted into 'science' and 'occult' compartments."
        ],
      },
      {
        id: "eso-alchemy-real",
        type: "chemical",
        title: "Alchemy as Real Chemistry",
        author: "history of science · 2025",
        summary: "Lawrence Principe, William Newman, and others have spent three decades demonstrating that pre-modern alchemists were doing serious experimental chemistry — and that their symbolic language encoded real procedures.",
        findings: [
          "Phosphorus, hydrochloric acid, antimony chemistry, and many distillation techniques were alchemical discoveries.",
          "Principe and Newman have replicated many classical alchemical procedures in the lab from the original recipes — they work.",
          "The symbolic-spiritual layer of alchemy was not in tension with the chemistry; it was the conceptual framework within which the chemistry was practiced.",
        ],
        prose: [
          "Lawrence Principe of Johns Hopkins has spent thirty years in his laboratory replicating recipes from medieval and early modern alchemical manuscripts. The results have permanently changed the historiography of chemistry. When Principe and his colleague William Newman take an alchemical procedure — say, the preparation of 'philosophical mercury' from antimony — and follow it carefully, the chemistry actually works. The symbolic language is doing something other than mystifying nonsense; it is encoding real procedural knowledge in a tradition-specific vocabulary.",
          "This matters because it changes what 'pre-modern science' was. The standard story treats alchemy as the embarrassing precursor to chemistry — confused, semi-mystical, mostly wrong. The corrected story is that alchemy was experimental chemistry conducted within a symbolic-philosophical framework. The framework included claims about transmutation that turned out to be wrong, but the experimental program produced many genuine discoveries: phosphorus (Brand), hydrochloric acid (Geber tradition), the distinction between acid and base (alchemical lineage), much of distillation technology.",
          "The interesting historiographic question is why the symbolic framework persisted so long. Principe's answer is that it served real epistemological functions: it provided a unifying conceptual scheme for an enormous and otherwise unstructured body of empirical findings; it preserved knowledge across generations through a shared symbolic apprenticeship system; and it linked chemical work to broader cosmological commitments that motivated the practitioners.",
          "The eventual stripping-away of the symbolic layer in the 18th century gave us chemistry as a more efficient research program. But it also lost something — the unified vision of nature in which chemical, physiological, and spiritual transformations were aspects of a single underlying process. Whether that loss was worth what was gained is a question alchemists' modern intellectual heirs (Jung, the Theosophists, contemporary chaos magicians) still argue about."
        ],
      },
      {
        id: "eso-kabbalah-philosophy",
        type: "philosophical",
        title: "Kabbalah as Speculative Metaphysics",
        author: "philosophical review · 2024",
        summary: "Stripped of the apparatus of Jewish mysticism, the core Kabbalistic metaphysics — emanation, divine self-limitation, the sefirotic structure — turns out to be remarkably sophisticated as pure philosophy.",
        findings: [
          "Lurianic Kabbalah's tzimtzum (divine self-contraction) is structurally analogous to several contemporary cosmological proposals, including some models of inflation.",
          "The sefirotic system maps onto a graph-theoretic structure with non-trivial mathematical properties — it is more than mnemonic decoration.",
          "The Christian Kabbalah of Pico della Mirandola and others fed substantively into early modern German idealism through Boehme, Schelling, and Hegel.",
        ],
        prose: [
          "Most of the contemporary popular discussion of Kabbalah is unfortunate. Celebrity-mediated 'red string' Kabbalah, neo-Hermetic appropriations, and outright invention have obscured the fact that the actual Kabbalistic tradition — beginning with the Sefer Yetzirah and developing through the Zohar and Isaac Luria's 16th-century synthesis — is one of the most ambitious systematic metaphysics ever produced.",
          "The central problem Kabbalah addresses is intelligible. If there is a perfect, infinite, undifferentiated divine ground, how does finite, differentiated reality arise from it? The Kabbalistic answer is emanation: reality unfolds through a sequence of ten sefirot, each a partial limitation and articulation of the prior level. The emanative structure is graph-theoretic — the sefirot are connected by 22 'paths', and the full system has non-trivial mathematical properties studied by both Jewish philosophers and contemporary structuralists.",
          "Luria's 16th-century addition was tzimtzum, the doctrine of divine self-contraction. Before creation, the infinite divine fills all possible space. For creation to occur, the divine must withdraw from a region, leaving a primordial void in which finite reality can exist. This is theologically deep — God's first creative act is self-limitation, not assertion — and it is structurally analogous to several contemporary cosmological pictures in which the early universe's geometry and field content emerges from the spontaneous breaking of an originally undifferentiated symmetry.",
          "The transmission of these ideas into Christian Europe began with Pico della Mirandola in the 1480s and continued through Reuchlin, Knorr von Rosenroth, and Jacob Boehme. From Boehme it fed into German Idealism — Schelling's late philosophy is in part a re-articulation of Lurianic Kabbalah in idealist vocabulary, and Hegel's dialectic owes more to this lineage than is usually acknowledged. Reading 19th-century German philosophy without seeing the Kabbalistic substrate misses something essential."
        ],
      },
      {
        id: "eso-modern-occult",
        type: "contemporary",
        title: "The Survival of the Occult: Why It Persists",
        author: "sociology of knowledge · 2025",
        summary: "Esoteric and occult ideas have survived every wave of secularization and rationalization. The current academic explanation is more interesting than the standard 'people are credulous'.",
        findings: [
          "Esoteric practice provides a domain of meaning-making and personal agency in a culture whose dominant institutions offer neither.",
          "The 'cognitive science of religion' frame predicts that some forms of esoteric belief are near-universal byproducts of normal human cognition.",
          "The internet has dramatically lowered the barrier to esoteric practice and produced new hybrid forms (chaos magic, contemporary witchcraft, post-rationalist subcultures).",
        ],
        prose: [
          "If the standard secularization story were correct — that science and reason would steadily displace superstition as education and technology spread — esoteric belief and practice should be in steep decline. They are not. By every measurable indicator, contemporary interest in tarot, astrology, witchcraft, ceremonial magic, and Hermeticism has risen substantially over the last two decades. This is not nostalgia; it is participation. Something is off in the standard story.",
          "One serious explanation comes from the cognitive science of religion. Pascal Boyer, Justin Barrett, and colleagues have argued that certain kinds of supernatural belief are predicted by normal cognitive architecture: agency detection biases predispose us to attribute purpose to events, theory of mind extends naturally to non-human agents, intuitive dualism makes mind-without-body feel coherent. On this view, certain esoteric beliefs are near-universal cognitive default settings that secular institutions discourage but cannot eliminate.",
          "A second explanation is sociological. The dominant institutions of late-modern life — corporate employment, mass media, bureaucratic state services — offer relatively little in the way of personal meaning, agency, or transcendence. Esoteric practice provides exactly these. The contemporary tarot reader is not naively confused about probability; she is making meaning out of her circumstances using a structured symbolic system her institutions don't supply.",
          "A third is technological. The internet has radically lowered both the cost of access to esoteric material and the cost of finding fellow practitioners. Pre-internet, someone interested in Western ceremonial magic might never find a teacher; post-internet, the entire Golden Dawn corpus is online and there are active practice communities. The new forms that have emerged — chaos magic, contemporary online-mediated witchcraft, the strange marriage of rationalist subcultures with magickal practice — are genuinely novel and do not map neatly onto either pre-modern occultism or 19th-century revival movements. We are in a new chapter of the long history of this material."
        ],
      },
    ],
  },

  /* ─────────────────────────  ASTROPHYSICS  ───────────────────────── */
  {
    id: "astrophysics",
    name: "Astrophysics",
    cluster: "physical",
    color: "#60a5fa",
    position: [6, 10, 4],
    size: 1.1,
    tags: ["stellar physics", "compact objects", "exoplanets", "high-energy"],
    summary: "The physics of objects beyond Earth — stars, planets, black holes, accretion disks, gamma-ray bursts, and the rest of the energetic furniture of the universe.",
    conclusion: "Modern astrophysics is at a sweet spot of theoretical maturity and instrumental power; the open problems are sharp and the data is finally arriving.",
    conclusionBody: [
      { type: "p", text: "Astrophysics in 2026 looks much different than it did in 2000. JWST, the LIGO/Virgo gravitational-wave network, the Event Horizon Telescope, and the upcoming Roman, LISA, and CTA missions have either delivered or are about to deliver data of a kind that previous generations could only dream of. At the same time, the theoretical frame is mature: general relativity passes every test, stellar evolution models reproduce most observed populations, planet-formation models have caught up with the exoplanet zoo." },
      { type: "h4", text: "the sharpest open problems" },
      { type: "ul", items: [
        "The Hubble tension: late-universe and early-universe measurements of the expansion rate disagree by about 5σ, and no one knows why.",
        "The structure of compact-object mergers: where does the mass come from for the heaviest binary black holes LIGO is seeing?",
        "Fast Radio Bursts: we now know they are mostly magnetar-related, but the precise emission mechanism is unresolved.",
        "Whether we will detect a technologically-produced signal from another civilization in this generation — currently zero confirmed detections, but the search has barely begun.",
      ]},
      { type: "h4", text: "what's been settled in the last decade" },
      { type: "ul", items: [
        "Black holes exist as compact-object endpoints of stellar evolution, full stop. The Event Horizon Telescope images of M87* and Sgr A* close any lingering doubt.",
        "Gravitational waves from compact binaries are detectable, frequent, and have already given us masses for objects we had no other way to weigh.",
        "Exoplanets are everywhere, in every size class, and around every star type — the cosmic census is now in.",
      ]},
      { type: "p", text: "The honest distillation: astrophysics is in a golden age, and the open problems are not vague philosophical worries but concrete tensions in the data that will plausibly be resolved within the next 10-20 years. If you want to watch physics make progress in real time, this is currently the best seat in the house." },
    ],
    planetTheme: { type: "gas", params: { hue: 0.6, accent: 0.1, bands: 6.0 } },
    documents: [
      {
        id: "astro-hubble-tension",
        type: "frontier",
        title: "The Hubble Tension: What's Going On",
        author: "frontier review · 2026",
        summary: "Measurements of the universe's expansion rate from the early universe (CMB + Planck) and the late universe (Type Ia supernovae + Cepheids) disagree at the 5σ level. After a decade of work, the disagreement has not gone away.",
        findings: [
          "Early-universe value (Planck): H₀ ≈ 67.4 km/s/Mpc.",
          "Late-universe value (SH0ES, distance ladder): H₀ ≈ 73.0 km/s/Mpc.",
          "Multiple independent late-universe methods (TRGB, water masers, gravitational lensing) sit between the two values but generally closer to the high one.",
          "If the tension is real (not systematic), it implies new physics beyond ΛCDM — possibly early dark energy, varying neutrino properties, or modifications to the sound horizon.",
        ],
        prose: [
          "Hubble's constant is the simplest cosmological parameter to define and one of the hardest to measure. It is the rate at which the universe is expanding today: a single number, in units of velocity per distance. Measuring it requires either calibrating local distances (the 'distance ladder') or inferring it from the cosmic microwave background's acoustic structure. Both methods are mature. They give incompatible answers.",
          "The Planck collaboration's CMB-based estimate, derived from the angular scale of acoustic peaks plus a ΛCDM cosmology, is H₀ ≈ 67.4 ± 0.5 km/s/Mpc. The SH0ES team's distance-ladder measurement, which calibrates Type Ia supernovae against Cepheid variables against parallax-measured stars in our own galaxy, gives H₀ ≈ 73.0 ± 1.0 km/s/Mpc. These differ by more than 5 standard deviations. Either one method has a hidden systematic error of a kind that has resisted a decade of searching, or new physics is needed.",
          "The search for systematic errors has been thorough and largely fruitless. Independent late-universe methods — the Tip of the Red Giant Branch distance ladder (which avoids Cepheids), water-maser geometric distances, gravitational-wave standard sirens, time delays in strongly-lensed quasars — give results that cluster around or just below the SH0ES value but are not consistent with the Planck value. The tension is not specific to any one technique.",
          "If the tension is real, the implication is that the ΛCDM cosmological model — six parameters, fits an enormous range of observations — is missing something. The leading candidates are: (a) early dark energy, a transient component that briefly accelerated the very early universe and shifted the sound horizon used to anchor the CMB estimate; (b) interacting dark sector models; (c) modifications to the number or properties of relativistic species in the early universe; (d) more exotic possibilities involving evolving gravitational constants or non-standard recombination. The next decade of data — JWST distance-ladder calibrations, LISA standard sirens, Roman supernova surveys — will probably resolve this. It is one of the cleanest open empirical problems in physics."
        ],
      },
      {
        id: "astro-gw-population",
        type: "data",
        title: "What LIGO's Black-Hole Population Is Telling Us",
        author: "data review · 2025",
        summary: "Six observing runs in, gravitational-wave astronomy has detected hundreds of compact-object mergers and the population shape is surprising.",
        findings: [
          "Binary black hole masses extend well into the 'pair-instability mass gap' that stellar evolution theory said should be empty (50-130 M_sun).",
          "Spin distributions suggest a substantial fraction of detected mergers come from dynamical-formation channels (in dense stellar environments), not just isolated binary evolution.",
          "Black hole-neutron star mergers are confirmed but rarer than expected.",
        ],
        prose: [
          "When LIGO detected the first gravitational wave in September 2015, the immediate scientific consequence was confirming general relativity in the strong-field regime. The longer-term consequence, less appreciated at the time, was opening an entirely new observational channel. We can now measure the masses of objects that are completely invisible to electromagnetic astronomy — stellar-mass black holes in binary systems, which emit nothing detectable until they merge.",
          "Hundreds of detections later, the population shape is informative and surprising. Stellar evolution theory predicts that there should be very few black holes with masses between roughly 50 and 130 solar masses, because pair-instability supernovae destroy stars in that progenitor-mass range. The 'mass gap' is theoretical and well-motivated. LIGO has filled it. The detected population includes substantial numbers of black holes in the gap — most strikingly GW190521, with a primary mass around 85 solar masses.",
          "There are a few ways to explain this. The most likely is hierarchical merger: black holes formed at smaller masses subsequently merge in dense environments (globular clusters, galactic nuclei), and the products merge again, climbing the mass ladder. This is supported by the spin distribution of LIGO events, which is broader and more isotropic than a pure isolated-binary channel would produce.",
          "The broader lesson is that black-hole formation in the universe is not a simple stellar-death story. A significant fraction of the binary mergers we see come from dynamical interactions in dense environments. This means our census of compact objects is partly a census of stellar dynamics, which feeds back into questions about globular cluster formation, supermassive black-hole seeding, and the history of star formation in the first billion years."
        ],
      },
      {
        id: "astro-exoplanet-census",
        type: "survey",
        title: "The Exoplanet Census: What's Out There",
        author: "survey · 2025",
        summary: "Two decades after the first hot Jupiter, we have a statistical picture of the planet population around other stars. Planets are common, diverse, and often radically unlike the Solar System.",
        findings: [
          "Roughly one planet per star is a conservative lower bound; the median may be 2-3.",
          "Planets between Earth and Neptune in size (super-Earths and sub-Neptunes) are the single most common type and have no analog in our Solar System.",
          "Rocky planets in habitable zones are common around small (M-dwarf) stars; less common but still present around Sun-like (G-dwarf) stars.",
          "Most planetary systems do not look like ours in architecture — closely-packed inner systems are typical.",
        ],
        prose: [
          "Twenty years ago, the question 'are exoplanets common?' was open. Today it is not. Kepler, K2, TESS, and ground-based surveys have established that planets are essentially ubiquitous around main-sequence stars. The statistical picture is now reliable enough to discuss as fact rather than estimate.",
          "Two findings from the survey work have permanently altered planetary science. The first is the dominance of super-Earths and sub-Neptunes — planets between roughly 1 and 4 Earth radii. These are the most numerous planet type in the galaxy and they have no representative in our own Solar System. We did not know they existed until we started looking elsewhere. Their internal structures, compositions, and atmospheric properties are an active research area; some appear to be rocky with extended hydrogen envelopes, others may be ocean worlds, others may be something else entirely.",
          "The second is the unexpectedness of system architecture. Our Solar System is not typical. The typical planetary system has many small to medium planets packed closely around its star, with the outer regions sparsely populated. Hot Jupiters — gas giants on tight orbits — exist but are rare, found around perhaps 1% of Sun-like stars. The frequency of Solar-System-like configurations (rocky inner planets, gas giants further out, large outer-system gap) is still being constrained, but it is not the default outcome of planet formation.",
          "JWST is now in the regime of measuring atmospheres for some of these worlds. Definitive biosignature detection is probably another decade away — neither JWST nor its near-term successors are quite sensitive enough on the right targets. But the trajectory is unambiguous: the question 'is there life elsewhere' will, for the first time in human history, be answerable rather than only speculative within most current researchers' careers."
        ],
      },
      {
        id: "astro-frb-magnetars",
        type: "investigation",
        title: "Fast Radio Bursts: The Magnetar Resolution",
        author: "investigation · 2024",
        summary: "FRBs — millisecond radio flashes from extragalactic sources — were a mystery from 2007 to 2020. The dominant population is now understood to come from magnetars, though the precise emission mechanism remains open.",
        findings: [
          "April 2020: SGR 1935+2154, a magnetar in our own galaxy, produced an FRB-luminosity radio burst coincident with X-ray emission. The detection effectively settled the population question.",
          "Repeating FRBs and one-off FRBs may come from the same source class with different environmental conditions, or may represent two distinct populations.",
          "The exact emission mechanism (synchrotron maser, coherent curvature radiation, others) is still debated.",
        ],
        prose: [
          "When Duncan Lorimer found the first fast radio burst in 2007 — a five-millisecond flash of radio waves with a dispersion measure suggesting cosmological distance — the community largely set the discovery aside as a possible instrumental artifact. By 2013 enough additional bursts had been found that FRBs were accepted as real and astrophysical. By 2017 the source list ran to dozens. By 2020 it was in the hundreds, and the question 'what are these things?' was urgent.",
          "Proposed mechanisms had included merging compact objects, exotic objects like cosmic strings, alien transmissions, and various stellar-flare scenarios. The breakthrough came in April 2020, when the magnetar SGR 1935+2154 — a known galactic source about 10 kiloparsecs from Earth — produced a radio burst luminous enough that, if it had come from a galaxy a billion light-years away, would have looked exactly like an FRB. We had caught a magnetar in our own galaxy producing an FRB-class burst.",
          "This essentially settled the population question. Magnetars — neutron stars with magnetic fields a thousand times stronger than ordinary pulsars — can produce FRBs. Whether they produce all FRBs, or only the closer ones we can catch in lower-luminosity bursts, is still being argued. The repeating FRB population (some of which repeat predictably) and the apparently one-off population may both come from magnetars in different evolutionary stages or environments.",
          "The remaining open problem is the precise emission physics. Magnetars produce X-ray and gamma-ray bursts via fairly well-understood mechanisms involving twisted magnetic-field configurations. The radio-burst mechanism is less clear. Synchrotron maser emission from the relativistic shock launched by a magnetar flare is one strong candidate; coherent curvature radiation directly from the magnetar magnetosphere is another. The data needed to discriminate is just beginning to be available."
        ],
      },
    ],
  },

  /* ─────────────────────────  COSMOLOGY  ───────────────────────── */
  {
    id: "cosmology",
    name: "Cosmology",
    cluster: "physical",
    color: "#38bdf8",
    position: [0, 4, 12],
    size: 1.25,
    tags: ["ΛCDM", "inflation", "dark matter", "dark energy", "CMB"],
    summary: "The science of the universe as a whole — its origin, evolution, large-scale structure, and ultimate fate. The most successful and the most embarrassed branch of physics.",
    conclusion: "We have an extremely successful six-parameter model that fits an enormous range of data and tells us we don't know what 95% of the universe is made of.",
    conclusionBody: [
      { type: "p", text: "Modern cosmology is in the strange position of being simultaneously physics's greatest triumph and its largest open problem. The ΛCDM model — six parameters, baked-in inflation, cold dark matter, cosmological-constant dark energy — fits the cosmic microwave background, big bang nucleosynthesis, galaxy clustering, weak lensing, and Type Ia supernovae with extraordinary precision. It is the most successful physical theory in human history by some measures. It is also a theory which tells us that 95% of the energy density of the universe is in two substances we have never detected and do not understand." },
      { type: "h4", text: "what we are very confident of" },
      { type: "ul", items: [
        "The universe is roughly 13.8 billion years old, spatially flat, and has been expanding from a hot dense initial state.",
        "About 5% of the energy density is ordinary atoms and radiation; about 27% is non-luminous matter that interacts gravitationally; about 68% is something with negative pressure driving accelerated expansion.",
        "Structure formed by gravitational collapse of small primordial density perturbations into the dark-matter scaffolding we see in galaxy surveys.",
        "Inflation, or something like it, occurred in the first ~10^-32 seconds and seeded those perturbations.",
      ]},
      { type: "h4", text: "what we don't know" },
      { type: "ul", items: [
        "What dark matter actually is. WIMP searches have come up empty; axion searches are ongoing; primordial black holes remain possible in some mass windows.",
        "What dark energy actually is. The cosmological constant works observationally but is theoretically embarrassing — quantum field theory predicts a value 10^120 times larger than observed.",
        "What happened in the first 10^-32 seconds. Inflation is the dominant model but isn't pinned to specific physics; several alternatives remain viable.",
        "Whether the Hubble tension and other emerging tensions point to genuine new physics or to systematics we haven't found.",
      ]},
      { type: "p", text: "The honest distillation: we have a model that describes 95% of the universe with extreme precision while admitting we don't know what 95% of the universe is. This is not a paradox; it is a feature of working at the edge of what physics can currently see. The next two decades — with LISA, the Vera Rubin Observatory, CMB-S4, and the SKA — are likely to deliver enough new data to settle several of these questions, or to refute ΛCDM itself." },
    ],
    planetTheme: { type: "cmb", params: { hue: 0.55, accent: 0.95, structure: 1.0 } },
    documents: [
      {
        id: "cos-cmb-acoustic",
        type: "foundational",
        title: "The CMB Acoustic Peaks and What They Tell Us",
        author: "review · 2024",
        summary: "The angular power spectrum of the cosmic microwave background contains a series of acoustic peaks that simultaneously fix the universe's geometry, composition, and age. The agreement between theory and data here is one of science's great achievements.",
        findings: [
          "The first acoustic peak's angular position fixes the universe to be spatially flat to better than 0.4%.",
          "The relative heights of the peaks fix the baryon density and the dark-matter density independently.",
          "The damping tail at small angular scales independently constrains the number of relativistic species, the helium abundance, and the recombination physics.",
        ],
        prose: [
          "In the hot dense plasma of the early universe, before the formation of neutral atoms, photons and ordinary matter were tightly coupled. Sound waves — actual pressure waves — propagated through this plasma. When the universe cooled enough that electrons and protons combined into neutral hydrogen (the moment of 'recombination', about 380,000 years after the Big Bang), the photons decoupled from the matter and free-streamed forward. We now detect them as the cosmic microwave background, and they carry a frozen-in record of the sound waves that were oscillating at the moment of decoupling.",
          "The angular power spectrum of the CMB — the variance of temperature fluctuations as a function of angular scale on the sky — shows a sequence of peaks corresponding to the harmonic structure of these sound waves. The position of the first peak depends on the angular scale subtended by the sound horizon at recombination, which depends in turn on the geometry of the universe. A flat universe puts the first peak at angular scale ~1°. A closed universe would shift it left; an open universe right. The Planck satellite's measurement places the first peak at the angular scale predicted by a flat universe to fractional precision of about 0.4%.",
          "The relative heights of the second and third peaks separately constrain how much of the matter density is baryonic versus dark. The basic logic: ordinary matter participates in the acoustic oscillations and modifies them; dark matter falls into the gravitational potential wells without coupling to the radiation and modifies the wells. The amplitudes of successive peaks encode this balance.",
          "The damping tail — the suppression of power at very small angular scales — encodes the physics of photon diffusion at the moment of recombination, which is sensitive to the number of relativistic species, the helium fraction, and the precise rate of recombination. From a single angular power spectrum we extract simultaneously the geometry, age, composition, and key physics of the early universe. The fits are extraordinary. This is what physics looks like when it works."
        ],
      },
      {
        id: "cos-dark-matter",
        type: "frontier",
        title: "Dark Matter: The Current State of the Hunt",
        author: "frontier review · 2026",
        summary: "Direct detection has ruled out the WIMP parameter space that was most favored two decades ago. The search is now diversified across many candidate types.",
        findings: [
          "WIMPs in the 'natural' mass range (~10 GeV to ~1 TeV with weak-scale cross-sections) are essentially excluded by LZ, XENONnT, and PandaX.",
          "Axion searches (ADMX, MADMAX, others) are now reaching the strongest theoretically-motivated parameter space.",
          "Primordial black holes are still allowed in specific mass windows, particularly around 10^-12 to 10^-10 solar masses.",
          "Sterile neutrinos, dark photons, and self-interacting dark matter are all under active investigation.",
        ],
        prose: [
          "Dark matter has been the leading explanation for galactic rotation curves since Vera Rubin's work in the 1970s, for galaxy-cluster dynamics since Zwicky's much earlier observation, and for the CMB and structure formation since the 1980s. The case for its existence as a non-luminous gravitating component is overwhelming. What remains entirely open is what it is made of.",
          "The leading candidate from roughly 1985 to 2015 was the WIMP — weakly-interacting massive particle. WIMPs were predicted by supersymmetry, would naturally produce the observed relic abundance if they had weak-scale couplings, and were detectable in principle by nuclear-recoil experiments deep underground. A generation of physicists built increasingly sensitive WIMP detectors. The detectors have not detected WIMPs. The natural WIMP parameter space is now essentially excluded.",
          "The search has diversified. Axions — light pseudo-Goldstone bosons originally motivated by the strong-CP problem in QCD — are now the leading alternative candidate. They are extremely difficult to detect because their couplings to ordinary matter are extraordinarily small, but the most theoretically-motivated parameter range is now being reached by current experiments. A detection in the next decade is plausible.",
          "Other candidates have moved up the priority list. Sterile neutrinos with masses around a keV could account for dark matter and produce X-ray emission lines from decay; tantalizing but unconfirmed line detections at 3.5 keV have driven a substantial search program. Primordial black holes in the 10^-12 to 10^-10 solar mass range remain allowed by current microlensing surveys. Self-interacting dark matter models address some small-scale structure puzzles in standard cold dark matter.",
          "What is striking about the current state is that we have very strong evidence for the phenomenon and an embarrassing number of plausible models for its identity. This is not the situation we expected to be in 25 years ago, when WIMP discovery seemed imminent. It is, however, what doing real frontier science looks like."
        ],
      },
      {
        id: "cos-inflation-status",
        type: "theoretical",
        title: "Inflation: What's Established, What's Not",
        author: "status review · 2025",
        summary: "Inflation explains the homogeneity, flatness, and primordial perturbation spectrum of the universe — but the specific physics driving it is unknown and several alternatives remain technically viable.",
        findings: [
          "Inflation makes specific predictions (near-scale-invariant perturbations, Gaussianity, tensor-to-scalar ratio in a particular range) that match observations remarkably well.",
          "The specific particle-physics model of inflation is unconstrained — there are hundreds of viable models with very different microphysics.",
          "Alternative models (bouncing cosmologies, string-gas cosmology, ekpyrotic models) remain technically viable but each have significant explanatory gaps.",
          "The next generation of CMB experiments (LiteBIRD, CMB-S4) will detect or rule out tensor modes at much lower amplitudes, potentially pinpointing the energy scale of inflation.",
        ],
        prose: [
          "Alan Guth's 1981 inflation proposal solved several severe problems with hot Big Bang cosmology at a single stroke. Why is the universe so flat? Inflation flattened it. Why are causally-disconnected regions at the same temperature? Inflation brought them into causal contact before stretching them apart. Why do we see no magnetic monopoles, despite generic GUT predictions? Inflation diluted them. And as a bonus, inflation generated the primordial density perturbations that seeded large-scale structure, with a spectrum and amplitude that turned out to match observation.",
          "Forty-five years later, the predictions have held up. The CMB shows the perturbation spectrum inflation predicts. The universe is flat to high precision. The perturbations are nearly Gaussian, as inflation predicts. By any standard measure, this is a successful theory.",
          "It is also, in a strange way, an underdetermined one. The inflation paradigm — accelerated expansion in the very early universe, driven by some scalar field — is what's well-supported. The specific physical realization is not. There are hundreds of distinct inflationary models in the published literature, all of which produce predictions consistent with current data. They differ in the energy scale of inflation, the shape of the inflaton potential, the number of fields involved, the connection to particle physics beyond the Standard Model. Most of these distinctions are below current observational sensitivity.",
          "The cleanest discriminator is primordial gravitational waves — tensor perturbations produced by inflation, imprinted on the CMB as B-mode polarization. The tensor-to-scalar ratio r is bounded below 0.036 by current data. Detecting r at any value would pin down the energy scale of inflation. Ruling it out below 0.001 — which LiteBIRD and CMB-S4 will do — would either find inflation or rule out a major class of inflationary models. This is one of the cleanest open empirical programs in cosmology.",
          "Alternative cosmological models — bouncing cosmologies, ekpyrotic scenarios, string-gas cosmology — remain technically viable but face their own challenges. Each can address some of the problems inflation solves, but typically with explanatory gaps elsewhere. The honest picture is that inflation is the dominant model not because it has won decisively but because no challenger has demonstrated comparable explanatory range."
        ],
      },
      {
        id: "cos-end-of-universe",
        type: "speculative",
        title: "How the Universe Ends",
        author: "long-time survey · 2023",
        summary: "Assuming the cosmological constant is a true constant and not a transient phase, the universe's long-term future is well-defined and bleak.",
        findings: [
          "The expansion will continue and accelerate.",
          "Galaxies outside the Local Group will recede beyond our cosmological horizon within ~150 billion years.",
          "Stars will burn out over the next 10^14 years; degenerate remnants will dominate until proton decay (if it occurs, ~10^34 years).",
          "Black holes will dominate, then evaporate by Hawking radiation, on timescales up to 10^100 years.",
          "The final state — if the cosmological constant is truly constant — is essentially empty de Sitter space with thermal fluctuations.",
        ],
        prose: [
          "If we take the cosmological constant at face value — a true constant of nature, not a slowly-evolving field — the long-term future of the universe is calculable and grim. Accelerated expansion means that the volume of space within our cosmological horizon is, in a comoving sense, shrinking. Distant galaxies recede past the horizon and become permanently inaccessible. Within roughly 150 billion years, every galaxy outside the Local Group will be beyond our reach, even at the speed of light.",
          "On longer timescales, the inventory of matter degrades. The smallest red dwarfs will burn for around 10^13 years; the universe's last actively-fusing stars will go out around then. Stellar remnants — white dwarfs, neutron stars, black holes — accumulate. White dwarfs cool over 10^15-10^16 years toward black dwarfs. If proton decay occurs (a generic GUT prediction not yet observed), ordinary matter will dissolve on timescales of 10^33 to 10^40 years.",
          "Then the era of black holes. Stellar-mass black holes evaporate via Hawking radiation on roughly 10^67-year timescales. Supermassive black holes take 10^100 years. After the last supermassive black hole evaporates, the universe is essentially empty: a vast volume of accelerating de Sitter space populated by thermal fluctuations of the cosmological-constant vacuum.",
          "It is worth saying that this whole calculation is contingent on the cosmological constant being constant. If dark energy is a dynamical field — quintessence — its energy density could decay, the expansion could decelerate, and the long-term future could look entirely different. If dark energy is phantom (equation-of-state w < -1), the universe could end in a 'big rip' on timescales much shorter than 100 billion years. The fate question is sensitive to physics we have not pinned down. The honest summary: 'we know how the universe ends, conditional on what we don't know about dark energy.'"
        ],
      },
    ],
  },

  /* ─────────────────────────  COMPUTATION  ───────────────────────── */
  {
    id: "computation",
    name: "Computation",
    cluster: "systems",
    color: "#22d3ee",
    position: [4, -8, -10],
    size: 1.05,
    tags: ["complexity theory", "quantum", "AI", "limits of computation"],
    summary: "The mathematical study of what can be computed, what cannot, and at what cost — increasingly understood as a fundamental aspect of physical reality.",
    conclusion: "Computation is not merely engineering. It is a physical resource governed by deep theorems, and its limits constrain both what minds can do and what universes can do.",
    conclusionBody: [
      { type: "p", text: "The theory of computation began in 1936 as pure mathematics — Turing and Church trying to formalize what it means to be 'effectively calculable'. It has become, in the intervening 90 years, one of the most consequential frameworks in science. Computation is now understood as a physical resource, subject to thermodynamic constraints. The class P, the class NP, and their relationship encode questions about what nature can efficiently solve. Quantum computation has overturned what we thought was the natural cost of certain problems. And artificial intelligence — itself a particular kind of large-scale computation — is reshaping the economy and possibly the future of cognition." },
      { type: "h4", text: "what computation has settled" },
      { type: "ul", items: [
        "There exist well-defined problems that no machine can solve (the halting problem and many others).",
        "Computation has physical costs — Landauer's bound on the minimum energy of bit erasure is a genuine constraint, not a heuristic.",
        "Quantum computers can efficiently solve at least one classically-hard problem (integer factorization), proving that the quantum and classical complexity hierarchies are different.",
        "Large neural networks trained on huge data exhibit qualitative capabilities that don't appear at smaller scales — a finding nobody predicted and nobody yet fully understands.",
      ]},
      { type: "h4", text: "what's wide open" },
      { type: "ul", items: [
        "The P versus NP problem — the deepest open question in mathematics by some accounts.",
        "Whether quantum computers can achieve scalable advantage on practically-important problems beyond factoring.",
        "The extent and trajectory of AI capabilities, including whether current systems will plateau, accelerate, or undergo qualitative phase transitions.",
        "What computation actually is — whether it is a fundamental physical category or a derived abstraction.",
      ]},
      { type: "p", text: "The honest distillation: computation is more like a chapter of physics than a branch of engineering, and the open problems are pivotal. Whether or not P equals NP. Whether the universe itself computes. Whether minds reduce to computation. What we can and cannot do with current-decade AI. None of these have been settled, and several of them probably will be within the next twenty years." },
    ],
    planetTheme: { type: "circuit", params: { hue: 0.5, accent: 0.65, density: 1.6 } },
    documents: [
      {
        id: "comp-p-vs-np",
        type: "foundational",
        title: "P versus NP: Why the Question Matters",
        author: "expository · 2024",
        summary: "The most famous open problem in theoretical computer science asks whether problems whose solutions can be verified efficiently can also be solved efficiently. The answer would reshape cryptography, optimization, and possibly our understanding of mathematics.",
        findings: [
          "Most working theorists believe P ≠ NP, but the proof has eluded the field since the question was formalized in 1971.",
          "If P = NP, modern public-key cryptography would collapse and most hard optimization problems would become tractable.",
          "If P ≠ NP, the result would be one of the great mathematical theorems, but the practical landscape would be largely unchanged (since current systems already assume it).",
        ],
        prose: [
          "P is the class of decision problems solvable in polynomial time. NP is the class of decision problems whose solutions can be verified in polynomial time. Every problem in P is in NP — if you can solve it efficiently, you can verify the solution efficiently. The question P versus NP asks whether the converse holds: is everything that can be verified efficiently also solvable efficiently?",
          "The question has hung over computer science since Stephen Cook formalized it in 1971. A proof either way would be a landmark mathematical achievement. The Clay Mathematics Institute attached a million-dollar prize. Most working theorists believe P ≠ NP — the intuition is that verifying a solution and finding one feel like genuinely different things, and despite decades of attempts no efficient algorithm has been found for any NP-complete problem. But intuition is not proof, and there have been no near-misses on the proof either way.",
          "The consequences of an answer are asymmetric. If P = NP and the proof is constructive (giving an actual polynomial-time algorithm for an NP-complete problem), much of modern cryptography would immediately collapse. Public-key systems rely on the practical hardness of problems like integer factorization or discrete logarithm; an efficient general algorithm would compromise them. Optimization problems currently considered intractable would become routine. The practical effect would be immediate and revolutionary.",
          "If P ≠ NP — which is the expected outcome — the proof would be a profound mathematical achievement, but the practical landscape would not change much. Systems already assume P ≠ NP. The cryptography would remain secure. The optimization problems would remain hard. The result would primarily be of mathematical interest.",
          "What makes the question genuinely deep is that it connects to questions about the nature of mathematical proof, the structure of efficient computation, and possibly to physics. The fact that we cannot resolve it after fifty years of attack by some of the strongest mathematical minds is itself a piece of evidence about how hard the question is."
        ],
      },
      {
        id: "comp-quantum-status",
        type: "engineering",
        title: "Quantum Computing: Where Things Actually Stand",
        author: "status review · 2026",
        summary: "Twenty years of substantial public and private investment have produced real progress, real limits, and a clearer picture of where the technology is going.",
        findings: [
          "Quantum advantage on specific narrow benchmarks (random circuit sampling, boson sampling) has been demonstrated.",
          "Quantum advantage on practical problems remains aspirational; current devices are too noisy.",
          "Error correction at scale requires roughly 1000-10000 physical qubits per logical qubit; current devices have low thousands of physical qubits.",
          "Useful cryptographically-relevant computation (Shor's algorithm on RSA-2048) requires perhaps 4000 logical qubits — at current overhead ratios, 4-40 million physical qubits.",
        ],
        prose: [
          "Quantum computing has moved from theoretical possibility to engineering reality over the last two decades. We can now build devices with thousands of superconducting qubits. We have demonstrated quantum advantage — meaning, performance on a specific computational task that no classical computer could match in any reasonable time — on a small number of carefully-chosen benchmarks. The first such demonstration was Google's 2019 sycamore result, since reproduced and improved.",
          "What quantum advantage on practical problems requires is different and considerably harder. Today's devices are noisy. They make errors at rates of roughly 10^-3 per gate operation. Useful computation needs error rates in the 10^-15 range. The closing of this gap requires quantum error correction, which works but is expensive: each logical (error-protected) qubit needs roughly 1000-10000 physical qubits depending on the code and architecture.",
          "The headline practical target — Shor's algorithm running on RSA-2048 cryptographic keys — requires roughly 4000 logical qubits running for several hours with sustained low error rates. Translated through the error-correction overhead, that is 4 to 40 million physical qubits. Current devices have low thousands. The gap is not a matter of incremental improvement.",
          "Several routes might close the gap. Better physical qubits (longer coherence times, lower gate errors) would reduce the overhead. Better error-correcting codes (LDPC codes, surface codes with topological protection) would also reduce it. Different physical platforms (neutral atoms, trapped ions, photonic systems) have different scaling characteristics, and one might prove more amenable to scaling than the current superconducting-qubit favorite.",
          "The honest near-term outlook is mixed. Cryptographically-relevant quantum computing is plausibly 10-20 years away if everything goes well — meaning real but not imminent. Quantum advantage on specific chemistry and materials problems may come sooner, on the 5-10 year horizon. Quantum advantage on general optimization (the once-hoped-for broad practical revolution) appears less likely than was thought in the late 2010s. The field has matured and the realistic picture is now less dramatic than the early hype and more substantive than the early skepticism."
        ],
      },
      {
        id: "comp-llm-emergence",
        type: "frontier",
        title: "Emergent Capabilities in Large Models",
        author: "AI research synthesis · 2026",
        summary: "When neural networks pass certain scale thresholds, they develop qualitative capabilities that smaller versions completely lack. The phenomenon is real, the mechanism is contested.",
        findings: [
          "Capabilities like multi-step reasoning, code synthesis, theorem-proving, and reliable instruction-following appear discontinuously as models scale.",
          "The discontinuities are real on some metrics and may be artifacts of metric choice on others; the literature is actively sorting this out.",
          "Mechanistic interpretability has begun to identify specific circuits responsible for specific capabilities, but most of the model's behavior remains opaque.",
          "There is no theoretical model that predicts which capabilities will emerge at which scales.",
        ],
        prose: [
          "By 2022 it had become clear that very large language models behave qualitatively differently from somewhat-large ones. Capabilities that simply did not exist in a 100-million-parameter model — multi-step reasoning, reliable instruction following, code synthesis on novel problems, in-context learning — appeared at the hundred-billion-parameter scale. The phenomenon, dubbed 'emergence', was unexpected. Nobody predicted it, nobody had a theory for it, and nobody had a roadmap for which capabilities would emerge next.",
          "Some of the apparent emergence was an artifact of measurement. If you score a model on accuracy at multi-digit arithmetic, you get a discontinuous curve: zero accuracy for small models, near-zero accuracy for medium models, then a sudden rise. But if you score the same models on a continuous measure — the per-digit probability assigned to the correct answer — you see a smooth improvement curve. The discontinuity was partly in the metric, not the underlying capability. This was the Schaeffer-Miranda 2023 finding and it correctly tempered some of the more dramatic emergence claims.",
          "But not all emergence reduces to metric artifacts. Multi-step reasoning, in particular, does seem to undergo qualitative shifts at scale. A model that cannot reliably perform two-step inference can become quite reliable at it by adding parameters and training data. The mechanism appears to involve the development of internal representations that support chained operations — circuits, in the mechanistic-interpretability vocabulary, that compose to perform tasks the original training did not directly target.",
          "Mechanistic interpretability — the research program of reverse-engineering what is happening inside large neural networks — has made real progress on this front. We can now identify specific circuits responsible for specific simple behaviors (induction heads, IOI circuits, modular addition circuits). But we cannot yet build up from these to a complete account of any large model's behavior. The interpretability frontier is roughly where biology was in 1950: we have the basic units, but the integrated picture is missing.",
          "The most important open question is whether further scaling produces further qualitative gains, plateaus, or enters a different regime entirely. Current evidence is mixed and the scientific situation is unusual: the entities we are studying change faster than our ability to understand them. This is uncomfortable for theory but it is the actual situation."
        ],
      },
      {
        id: "comp-physical-limits",
        type: "theoretical",
        title: "The Physical Limits of Computation",
        author: "theoretical review · 2024",
        summary: "Thermodynamics and quantum mechanics impose absolute limits on how much computation can be performed with given resources. We are still many orders of magnitude from those limits.",
        findings: [
          "Landauer's bound: erasing one bit of information requires dissipating at least kT ln 2 energy as heat (~3 × 10^-21 J at room temperature).",
          "Margolus-Levitin bound: a system with energy E can perform at most 2E/πℏ operations per second.",
          "Bremermann's bound combines the two: a 1-kg computer at room temperature can perform at most ~10^50 operations per second.",
          "Current computers operate at 10^10 to 10^11 operations per second per watt — about 10^9 above the Landauer limit. Quantum-mechanical bounds are similarly distant.",
        ],
        prose: [
          "Computation is a physical process. It uses energy. It produces heat. It is constrained by the laws of thermodynamics and quantum mechanics. This was not obvious for most of the field's history — Turing's original analysis treated computation as a purely abstract activity. The recognition that computation has hard physical limits is one of the deeper conceptual achievements of late-twentieth-century physics.",
          "Rolf Landauer in 1961 showed that erasing one bit of information — irreversibly forgetting it — necessarily produces a minimum amount of heat: kT ln 2, where k is Boltzmann's constant and T is the temperature of the environment. At room temperature, this is about 3 × 10^-21 joules per bit. The bound is fundamental: it does not depend on the specific computing hardware, only on the requirement of consistency with the second law of thermodynamics. It has been experimentally confirmed in single-bit erasure experiments.",
          "The Margolus-Levitin theorem, derived in 1998 from quantum mechanics, gives a different kind of limit: the maximum rate at which a system with given energy can perform distinguishable operations. A system with energy E above its ground state can perform at most 2E/πℏ operations per unit time. This is a quantum speed limit, and it bounds how fast any process — biological, chemical, or computational — can change state.",
          "Combining these limits, Bremermann calculated the maximum computational rate of any 1-kg device at room temperature: about 10^50 operations per second. This is the 'ultimate laptop' bound. Current laptops perform roughly 10^11 operations per second. We are nine orders of magnitude below the Landauer thermal limit on energy efficiency, and roughly forty orders of magnitude below the Bremermann rate limit. Computing has a great deal of headroom.",
          "What is more interesting than the absolute bounds is the principle they encode: computation is a physical category, and the laws of physics dictate its costs. This insight has consequences for cosmology (a universe's computational capacity is bounded by its energy content), for biology (cells are remarkably efficient computers, operating within roughly two orders of magnitude of the Landauer limit), and for our understanding of the relationship between mind, matter, and information. Computation is not separate from physics. It is one of the things physics does."
        ],
      },
    ],
  },

  /* ─────────────────────────  CONSCIOUSNESS  ───────────────────────── */
  {
    id: "consciousness",
    name: "Consciousness",
    cluster: "metaphysics",
    color: "#c4b5fd",
    position: [-8, 12, -8],
    size: 1.1,
    tags: ["hard problem", "qualia", "IIT", "global workspace"],
    summary: "The fact that there is something it is like to be — and the most stubborn open problem in science.",
    conclusion: "We can describe the neural correlates of experience in elaborate detail. We still cannot explain why there is anything to correlate with.",
    conclusionBody: [
      { type: "p", text: "Consciousness is the topic where intelligent people most reliably disagree. Some hold it is a deep mystery requiring new physics. Some hold it is an obvious consequence of information integration. Some hold it does not exist in any non-trivial sense — that the appearance of mystery is itself the illusion. None of these positions has decisively won, and the disagreement is older than the field." },
      { type: "h4", text: "the structure of the debate" },
      { type: "ul", items: [
        "The 'easy problems' — how the brain implements attention, memory, reportability, perceptual discrimination — are tractable in principle and being solved.",
        "The 'hard problem' (Chalmers) — why any of this physical processing is accompanied by subjective experience at all — has not budged.",
        "Major contemporary frameworks: Global Workspace (Baars, Dehaene), Higher-Order Thought (Rosenthal), Integrated Information (Tononi), Predictive Processing (Friston, Clark), Illusionism (Frankish, Dennett).",
      ]},
      { type: "p", text: "The honest distillation: consciousness is the one phenomenon we are most certain of and least able to explain. That asymmetry is the field." },
    ],
    planetTheme: { type: "crystal", params: { hue: 0.74, accent: 0.55, facets: 6.0 } },
    documents: [
      {
        id: "cons-hard-problem",
        type: "philosophical",
        title: "The Hard Problem at Thirty",
        author: "philosophical review · 2024",
        summary: "David Chalmers' 1995 distinction between easy and hard problems of consciousness reshaped the field. Three decades on, the easy problems have advanced; the hard problem has not.",
        findings: [
          "The 'easy problems' (binding, attention, reportability) are now domains of working neuroscience.",
          "The 'hard problem' — why physical processes are accompanied by subjective experience — remains structurally intact.",
          "Materialist responses (Dennett, Frankish, Graziano) reframe the question rather than answering it; non-materialist responses (panpsychism, dualism) accept the question and pay metaphysical costs.",
        ],
        prose: [
          "When David Chalmers introduced the distinction between easy and hard problems of consciousness in 1995, he was framing a methodological complaint as much as a metaphysical one. The neuroscience of his era was racking up impressive results on questions like 'how does the brain bind disparate features into a unified percept?' — and conflating that with progress on the question 'why is there experience at all?' Chalmers' move was to separate these. The first kind, he called easy — not because they are simple but because we know how to make progress on them. The second kind, the hard problem, asks why any of the physical machinery is accompanied by anything inward at all.",
          "Three decades later, the easy problems are recognizably easy in Chalmers' sense. We have good accounts of feature binding, of the conditions under which information becomes accessible to verbal report, of the neural correlates of conscious vs. unconscious processing. The hard problem has not budged. We do not have a single example of a derivation that begins with neural activity and concludes 'and therefore the system experiences X'. Even the best contemporary theories — IIT, Global Workspace, Higher-Order Thought — describe correlates without explaining why those correlates would generate experience rather than nothing.",
          "The standard materialist response is to deny the hard problem is real — to argue that once you've explained all the easy problems, the appearance of a hard problem dissolves. Daniel Dennett's lifelong project was a sophisticated version of this. The trouble is that the dissolution looks, to those who don't accept it, like an avoidance. The non-materialist response — panpsychism, neutral monism, dualism — accepts the problem but pays metaphysical costs (consciousness becomes either ubiquitous or fundamental, neither of which fits easily with what we otherwise know)."
        ],
      },
    ],
  },

  /* ─────────────────────────  MEMORY  ───────────────────────── */
  {
    id: "memory",
    name: "Memory",
    cluster: "humanity",
    color: "#fdba74",
    position: [-14, -4, -2],
    size: 1.0,
    tags: ["episodic", "consolidation", "reconsolidation", "Eichenbaum"],
    summary: "The brain's ongoing reconstruction of a past that never quite happened the way it remembers.",
    conclusion: "Memory is not a storage problem; it is a reconstruction problem with sophisticated indexing and ongoing editorial revision.",
    conclusionBody: [
      { type: "p", text: "The folk picture of memory — recordings filed in a brain-shaped cabinet — is wrong in a specific and important way. Memory is not a retrieval of stored data. It is the active reconstruction of past states from patterns distributed across multiple brain regions, with significant editing on every access. The implications are practical (eyewitness testimony is less reliable than the law assumes) and philosophical (the unified self we feel ourselves to be is in part a memory artifact)." },
      { type: "h4", text: "what neuroscience has settled" },
      { type: "ul", items: [
        "Episodic memory consolidation runs through the hippocampus then migrates to neocortex over time (Squire, McGaugh).",
        "Each retrieval makes the memory labile and susceptible to revision — reconsolidation, demonstrated since the early 2000s.",
        "Memory is reconstructive, not reproductive. False memories can be implanted in healthy subjects with sobering ease.",
      ]},
      { type: "p", text: "The honest distillation: we remember to predict, not to record. Memory's job is not accurate playback but useful inference about likely futures." },
    ],
    planetTheme: { type: "mandala", params: { hue: 0.08, accent: 0.55, complexity: 8.0 } },
    documents: [
      {
        id: "mem-reconsolidation",
        type: "frontier",
        title: "Reconsolidation: Memory's Editing Window",
        author: "neuroscience review · 2025",
        summary: "Every time you remember something, the memory becomes briefly vulnerable to revision. This window — discovered in the early 2000s — has therapeutic implications and philosophical ones.",
        findings: [
          "Retrieved memories undergo a 4-6 hour window of lability before they re-stabilize.",
          "Pharmacological agents (propranolol) administered during this window can blunt emotional intensity of trauma memories.",
          "Implications: the past is not fixed at the level of brain-state. Every recall is also a rewrite.",
        ],
        prose: [
          "Karim Nader's 2000 paper on auditory fear memory in rats was the breakthrough — though the underlying phenomenon had been hinted at decades earlier. Nader showed that when a consolidated fear memory is reactivated, it enters a brief window during which it is once again unstable and vulnerable to disruption by protein synthesis inhibitors. After the window closes, the memory is re-consolidated, possibly in modified form.",
          "Two decades of follow-up has substantially confirmed and extended this. Human reconsolidation experiments using propranolol (a beta-blocker) demonstrate measurable reductions in the emotional intensity of trauma memories when the drug is administered during retrieval. The cognitive content of the memory remains; the autonomic punch is blunted. PTSD treatment protocols using this mechanism are in active development.",
          "The philosophical implication is deeper than the clinical one. Reconsolidation means that the past, as encoded in your brain, is not fixed. Every time you remember something, you also revise it slightly. The narrative self you feel yourself to be is not anchored in stable recordings but in a continuously-updated chronicle that gets edited every time you consult it. This does not mean memory is unreliable in any catastrophic sense — most of the time the edits are small. But it does mean the past you 'remember' is partly authored by the present that does the remembering."
        ],
      },
    ],
  },

  /* ─────────────────────────  LANGUAGE  ───────────────────────── */
  {
    id: "language",
    name: "Language",
    cluster: "humanity",
    color: "#f9a8d4",
    position: [-2, -12, -2],
    size: 1.0,
    tags: ["Chomsky", "embodiment", "semantics", "linguistic relativity"],
    summary: "The structured noise by which one mind shapes another — and the only proven medium of distributed cognition at scale.",
    conclusion: "Language is the technology civilization most depends on and least understands.",
    conclusionBody: [
      { type: "p", text: "Linguistics is the field where the deepest questions look most settled from the outside and most contested from the inside. Generative grammar dominated the second half of the 20th century. Cognitive and embodied approaches displaced much of it. Statistical and computational linguistics have made testable predictions where theory once made hand-waves. Each tradition explains something the others cannot, and no synthesis is in sight." },
      { type: "h4", text: "where there is honest disagreement" },
      { type: "ul", items: [
        "Is grammar specified by an innate biological module (Chomsky) or learned from statistical regularities in input (Tomasello, Bybee)?",
        "Does the language you speak shape the way you think (linguistic relativity), and if so by how much?",
        "Where does meaning come from — formal symbol manipulation, embodied simulation, distributed neural patterns?",
      ]},
      { type: "p", text: "The contemporary picture is that language is both more learned than the strong-Chomskyan view allowed and more structured than pure-empiricist alternatives can explain. The synthesis is in progress." },
    ],
    planetTheme: { type: "flow", params: { hue: 0.92, accent: 0.5, density: 1.2 } },
    documents: [
      {
        id: "lang-chomsky-shift",
        type: "historical",
        title: "What the Chomskyan Era Got Right (and What It Missed)",
        author: "historical-critical · 2024",
        summary: "For fifty years, Chomsky's generative tradition was the dominant frame in linguistics. It has lost that dominance — but not without leaving permanent contributions and unfinished business.",
        findings: [
          "Chomsky's 1957 Syntactic Structures established that natural-language syntax is not amenable to simple statistical induction from input alone — a result that has held up.",
          "His later commitments (universal grammar as a specific innate module, the Minimalist Program) have not aged as well empirically.",
          "Cognitive and usage-based linguistics now account for much of what generative theory once owned, while statistical NLP has overtaken Chomskyan parsers in practice.",
        ],
        prose: [
          "Noam Chomsky's 1957 monograph Syntactic Structures inaugurated modern theoretical linguistics. Its core contribution — that natural-language syntax exhibits structure that cannot be learned by simple stimulus-response or statistical models on the input alone — was correct, important, and durable. The argument from the poverty of the stimulus, while contested, remains one of the more interesting empirical questions in cognitive science.",
          "What followed for half a century was an attempt to specify the innate component required to explain that learnability gap. Universal Grammar, Principles and Parameters, the Minimalist Program — each was a successive attempt to characterize what the language faculty must look like. The trajectory was toward ever-more-minimal innate machinery. The empirical and crosslinguistic record has not been kind to this trajectory. Languages that should not exist on UG-style accounts (Pirahã with no recursion, Riau Indonesian with extreme contextual flexibility) do exist. Children with reduced language input (homesign, late first-language learners) acquire less than the strong nativist view predicts.",
          "Meanwhile, statistical NLP has accomplished tasks (machine translation, parsing) that generative linguistics had treated as the proper domain of formal theory, without using the theory's apparatus. The lesson is not that Chomsky was wrong — the original gap argument was right. The lesson is that the gap is smaller than mid-century estimates, and the missing machinery may be more general than language-specific."
        ],
      },
    ],
  },

  /* ─────────────────────────  DREAMS  ───────────────────────── */
  {
    id: "dreams",
    name: "Dreams",
    cluster: "metaphysics",
    color: "#818cf8",
    position: [-14, 2, 8],
    size: 0.95,
    tags: ["REM", "lucid", "phenomenology", "memory consolidation"],
    summary: "The mind doing maintenance with its content-generation system left on.",
    conclusion: "Dreams are real experiences of imaginary events, occurring during a brain state with measurable physical properties and one of the few experimentally accessible windows into raw cognition.",
    conclusionBody: [
      { type: "p", text: "The dismissal of dreams as 'random noise' has been one of the longer-running unforced errors of mainstream neuroscience. The 1977 Hobson-McCarley activation-synthesis hypothesis was useful as a corrective to overheated Freudianism but oversold the randomness. Three decades of follow-up work has confirmed that REM dreams have measurable functional roles — memory consolidation, emotional processing, predictive simulation — and that the content is structured, not random." },
      { type: "h4", text: "what is now reasonably settled" },
      { type: "ul", items: [
        "REM sleep consolidates emotional and procedural memories; depriving someone of REM measurably impairs both.",
        "Lucid dreaming is real, trainable, and accompanied by reproducible EEG signatures. Communication with lucid dreamers from inside dreams has been demonstrated.",
        "Dream content systematically over-represents threat scenarios and social interactions — consistent with the threat-simulation and social-simulation theories of dream function.",
      ]},
      { type: "p", text: "Dreams are not random and not meaningless. They are not, however, the messages from a hidden self that Freudian theory imagined. They are the brain rehearsing." },
    ],
    planetTheme: { type: "cmb", params: { hue: 0.7, accent: 0.55, structure: 0.8 } },
    documents: [
      {
        id: "dreams-lucid",
        type: "experimental",
        title: "Lucid Dreaming as an Experimental Method",
        author: "experimental psychology · 2025",
        summary: "Once dismissed as folklore, lucid dreaming is now an experimental method for studying conscious processing during sleep — with subjects who can answer questions from inside the dream.",
        findings: [
          "Frequent lucid dreamers can be reliably trained and identified by EEG markers of metacognition during REM.",
          "Pre-arranged eye-movement codes allow communication out of the dream in real time.",
          "Recent work has demonstrated full bidirectional communication: experimenters ask math questions, dreamers respond.",
        ],
        prose: [
          "Lucid dreaming — the state of being aware that one is dreaming while continuing to dream — was treated as folklore through most of the 20th century. The first rigorous demonstration came from Keith Hearne's 1975 PhD work, refined by Stephen LaBerge at Stanford through the 1980s. The trick was that LaBerge's lucid dreamers could agree on a pre-arranged eye-movement sequence (left-right-left-right) when they became lucid; their EOG (electrooculogram) recordings showed the exact pattern at the moment they reported lucidity post-waking.",
          "From there it was an iteration problem. Better training protocols (reality testing, mnemonic induction), longer lucidity durations, more reliable communication. By 2021, Konkoly et al. published two-way communication with lucid dreamers: experimenters asked simple math questions through audio cues during REM, and trained dreamers answered with eye movements. The answers were correct more often than chance allowed.",
          "The methodological implications are large. We now have a way to interrogate conscious processing during a state that was previously a black box. Time perception in dreams (often distorted but in measurable ways), the limits of dream-state cognition (math works, but only simple problems), the conditions for and consequences of lucidity — all are now tractable empirical questions rather than philosophical speculation."
        ],
      },
    ],
  },

  /* ─────────────────────────  MATHEMATICS  ───────────────────────── */
  {
    id: "mathematics",
    name: "Mathematics",
    cluster: "systems",
    color: "#67e8f9",
    position: [8, 0, -14],
    size: 1.15,
    tags: ["Platonism", "structuralism", "Gödel", "unreasonable effectiveness"],
    summary: "The discipline whose contents are independent of any physical fact, and yet which physical reality stubbornly conforms to.",
    conclusion: "Mathematics is either the underlying structure of reality, or a stunningly coincidental human construction. The honest answer is we still do not know.",
    conclusionBody: [
      { type: "p", text: "Eugene Wigner's 1960 essay 'The Unreasonable Effectiveness of Mathematics in the Natural Sciences' framed a puzzle that has not been solved in the sixty-five years since. Why should formal systems invented by mathematicians often centuries before any physical application — projective geometry, group theory, Hilbert space — turn out to be the exact language nature speaks in?" },
      { type: "h4", text: "what the philosophy of math has settled (sort of)" },
      { type: "ul", items: [
        "Platonism (mathematical objects exist independently and we discover them) remains a respectable position despite ontological costs.",
        "Structuralism (mathematics studies abstract structures, not 'objects') accommodates working mathematicians' intuitions better.",
        "Gödel's incompleteness theorems set hard limits on what any formal axiomatic system can prove about itself. They are not philosophical inconveniences — they are theorems.",
      ]},
      { type: "p", text: "The honest distillation: mathematics works as if it describes the world, even when invented in pure abstraction. Why that is, is one of the deepest open questions in philosophy. The mathematicians themselves are mostly too busy doing mathematics to worry about it." },
    ],
    planetTheme: { type: "grid", params: { hue: 0.5, accent: 0.65, glitch: 0.2 } },
    documents: [
      {
        id: "math-godel",
        type: "foundational",
        title: "What Gödel's Incompleteness Actually Says",
        author: "expository · 2024",
        summary: "Few results are more cited and more misunderstood than Gödel's incompleteness theorems. The actual claims are precise, narrower than popular versions, and deeper than they sound.",
        findings: [
          "First incompleteness theorem: any consistent formal system strong enough to express elementary arithmetic contains true statements it cannot prove.",
          "Second incompleteness theorem: such a system cannot prove its own consistency.",
          "Common misreadings (mind exceeds mechanism, truth is relative, mathematics is incomplete in some general sense) are not supported by the theorems.",
        ],
        prose: [
          "Kurt Gödel's 1931 paper 'On Formally Undecidable Propositions of Principia Mathematica and Related Systems' is one of the most consequential mathematical results of the 20th century and one of the most misquoted. The actual claims are precise. Take any formal system that (a) is consistent, (b) is rich enough to express elementary arithmetic, and (c) has a recursively enumerable set of axioms. Then there exist arithmetic statements that are true but unprovable within that system. That is the first incompleteness theorem.",
          "The second theorem strengthens this: such a system also cannot prove its own consistency. If the system can prove 'I am consistent', it isn't.",
          "What the theorems do NOT say: they do not say truth is relative, do not say mathematics is unknowable, do not say the human mind transcends formal systems (the Lucas-Penrose argument trades on a confusion). They do say something deep about the limits of any single formal system to be a complete and consistent account of arithmetic.",
          "The practical implication for mathematics is small — working mathematicians proceed perfectly well without worrying about whether their preferred axiom system can prove its own consistency. The philosophical implication is large. Any system rich enough to be useful is also rich enough to harbor truths it cannot reach. This is not a defect to be fixed. It is a feature of formality."
        ],
      },
    ],
  },

  /* ─────────────────────────  MUSIC  ───────────────────────── */
  {
    id: "music",
    name: "Music",
    cluster: "humanity",
    color: "#fcd34d",
    position: [12, 6, -10],
    size: 1.0,
    tags: ["harmony", "phenomenology", "Pythagoras", "consonance"],
    summary: "The most universally affecting human technology, structured by mathematics neither composers nor listeners typically know.",
    conclusion: "Music's emotional power is real, cross-cultural, and only partially explained by the physical and cognitive science we've directed at it.",
    conclusionBody: [
      { type: "p", text: "Every documented human culture has music. Most use scales whose intervals approximate small integer frequency ratios — even when invented without contact with Pythagoras. Music's universality is well-established; its mechanism is not. Why does an unresolved dominant seventh create yearning? Why does a minor third sound sad in Western ears and not in many non-Western traditions? The answers are partly physical (consonance and the harmonic series), partly cognitive (predictive processing and the violation of expectation), and partly cultural (learned associations) — and we cannot yet say in what proportion." },
      { type: "h4", text: "what is reasonably settled" },
      { type: "ul", items: [
        "Consonance perception has a physical basis in the harmonic series and roughness/beating between partials, but is also strongly culturally modulated.",
        "Musical expectation and its violation drive much of music's emotional content — predictive processing is a productive frame here.",
        "Music engages reward circuitry (nucleus accumbens, ventral tegmental area) in ways closer to food and sex than to language.",
      ]},
      { type: "p", text: "Honest distillation: we know music is universal, structured, and emotionally potent. We do not yet have a unified theory of why a particular sequence of frequencies should reliably move a mind." },
    ],
    planetTheme: { type: "plasma", params: { hue: 0.12, accent: 0.95, turbulence: 1.0 } },
    documents: [
      {
        id: "music-pythagoras",
        type: "foundational",
        title: "The Mathematics of Consonance, Pythagoras to Helmholtz",
        author: "history of science · 2024",
        summary: "Pythagoras' 6th-century BCE discovery that consonant musical intervals correspond to simple integer ratios is one of the most enduring observations in human history.",
        findings: [
          "Octave (2:1), perfect fifth (3:2), perfect fourth (4:3) appear as primary consonances in essentially every documented musical tradition.",
          "Helmholtz (1863) tied consonance perception to overlap of harmonic partials and absence of roughness from close-frequency beating.",
          "Contemporary work shows the picture is more complex — cultural exposure substantially shapes which intervals 'sound right'.",
        ],
        prose: [
          "The Pythagorean observation, recounted in late antique sources, is that strings whose lengths are in simple integer ratios produce intervals we hear as consonant. A 2:1 ratio gives the octave. 3:2 gives the perfect fifth. 4:3 gives the perfect fourth. These ratios appear in tuning systems across cultures that had no contact with each other, suggesting that something in human auditory perception is responding to them, not just to convention.",
          "Hermann von Helmholtz's 1863 'On the Sensations of Tone' provided the first modern explanation. The harmonic series — the natural overtones produced by any pitched sound — means that notes a fifth apart share several upper partials. The brain's auditory system registers this overlap as a kind of fusion. Conversely, dissonant intervals produce close-frequency partials that beat against each other, generating a roughness sensation in the cochlea.",
          "The Helmholtz picture is correct as far as it goes but incomplete. Cross-cultural work has shown that listeners from cultures without Western tonal music do not perceive Western consonance/dissonance the same way. Infants show some innate preferences but they are weaker and more malleable than the strong universalist view predicts. The mathematics of consonance is real; its perception is built on top of that mathematics by a brain that has heard a lot of culturally-specific music."
        ],
      },
    ],
  },

  /* ─────────────────────────  MYTHOLOGY  ───────────────────────── */
  {
    id: "mythology",
    name: "Mythology",
    cluster: "humanity",
    color: "#fca5a5",
    position: [-4, -8, -14],
    size: 1.0,
    tags: ["Campbell", "archetypes", "comparative", "Jung"],
    summary: "The cross-culturally repeated stories that human cultures have used to make sense of birth, death, the heroic, and the cosmic.",
    conclusion: "Myths are not failed science. They are software for managing the human condition, and the convergence across cultures is more striking than the differences.",
    conclusionBody: [
      { type: "p", text: "Joseph Campbell's 'monomyth' overstated the case. Not every culture's story fits the hero's-journey template, and Campbell's selection bias was real. But the corrected picture is still striking: certain narrative structures (death-and-return, the descent to the underworld, the wisdom of the rejected stranger) recur across cultures with no plausible contact, and they recur because they are doing work for the cultures that tell them." },
      { type: "h4", text: "what serious comparative mythology now thinks" },
      { type: "ul", items: [
        "Flood myths, cosmic eggs, world trees, dying-and-rising gods, trickster figures — all genuinely cross-cultural patterns.",
        "The patterns are not evidence of shared historical origin in most cases. They reflect a small set of recurrent human narrative needs.",
        "Jung's archetypes overinterpret the data; the cross-cultural convergence is real but doesn't require a collective unconscious to explain.",
      ]},
      { type: "p", text: "Honest distillation: myths repeat because human conditions repeat. The shape of the stories tells us something about the shape of the species." },
    ],
    planetTheme: { type: "gas", params: { hue: 0.02, accent: 0.1, bands: 4.0 } },
    documents: [
      {
        id: "myth-campbell",
        type: "comparative",
        title: "Campbell's Monomyth: A Careful Assessment",
        author: "comparative mythology · 2025",
        summary: "Joseph Campbell's 'Hero with a Thousand Faces' (1949) proposed a universal narrative pattern beneath the world's mythologies. The thesis has been hugely influential and substantially overstated.",
        findings: [
          "The hero's-journey template fits some traditions (Greek, certain Sumerian, much of Western literature post-Campbell) well; others (Chinese, Japanese, much of Africa) much less well.",
          "Campbell's evidentiary methods involved selecting episodes that fit and ignoring those that did not.",
          "The corrected picture is that several recurring patterns exist (separation/initiation/return is one) but no single monomyth covers all the data.",
        ],
        prose: [
          "Joseph Campbell's 'The Hero with a Thousand Faces' (1949) argued that the world's myths, across cultures and continents, share a single underlying narrative pattern: separation from the ordinary world, initiation through trials, and return with transformative gifts. The book became a touchstone for two generations of thinking about narrative — its influence on George Lucas's Star Wars is direct and acknowledged, and its descendants populate contemporary screenwriting manuals.",
          "Comparative mythologists since Campbell have been more cautious. The pattern fits some traditions well — Mesopotamian Gilgamesh, the Odyssey, certain Christological readings of the Gospels, Tolkien's Frodo. It fits others poorly. The Chinese epic Journey to the West has heroic-journey elements but the narrative architecture is fundamentally different. Many African oral traditions are not journeys at all but cyclical or geographical. Aboriginal Australian Dreamtime narratives are about the shape of land more than the trajectory of persons.",
          "The mature contemporary view is that Campbell identified a real recurring pattern but oversold its universality. The cross-cultural convergence is real, it is just not a single monolith. Several distinct narrative-attractors — death-and-rebirth, the trickster cycle, foundation myths, theogonies — recur across cultures without requiring a single underlying template. Why these and not others is the interesting open question."
        ],
      },
    ],
  },

  /* ─────────────────────────  BIOLOGY  ───────────────────────── */
  {
    id: "biology",
    name: "Biology",
    cluster: "physical",
    color: "#86efac",
    position: [16, 4, 2],
    size: 1.15,
    tags: ["evolution", "emergence", "origin of life", "cell biology"],
    summary: "The most consequential physical phenomenon we know of — chemistry that started keeping records.",
    conclusion: "Biology is what physics looks like once it begins copying itself with errors and selecting on the results.",
    conclusionBody: [
      { type: "p", text: "The unifying insight of modern biology — that all living things on Earth descend from a common ancestor via descent with modification — is one of science's most empirically supported theories. The molecular evidence (DNA's near-universal code, conserved core metabolic pathways, shared developmental machinery) is overwhelming. The remaining controversies are downstream: how did the first replicator arise, how exactly does selection shape complex traits, where are the limits of evolutionary explanation." },
      { type: "h4", text: "what is settled" },
      { type: "ul", items: [
        "Common descent of all known life via DNA-based heredity. The tree (or web) of life is real.",
        "Natural selection is the primary mechanism of adaptive change. Drift, neutral evolution, and horizontal gene transfer also matter.",
        "The basic machinery of cells — protein synthesis from DNA via RNA, ATP-based energy metabolism, membrane-bound compartments — is shared across all domains.",
      ]},
      { type: "h4", text: "what is genuinely open" },
      { type: "ul", items: [
        "The origin of life — how the first self-replicating molecular system arose from prebiotic chemistry — is unsolved.",
        "Whether life elsewhere uses the same fundamental architecture (DNA, ATP, ribosomal translation) or different.",
        "The limits of evolutionary explanation — what level of complex behavior is or isn't reducible to selection-acting-on-variation.",
      ]},
      { type: "p", text: "Honest distillation: biology is the best-confirmed grand theory we have. The pieces it can't yet explain are not refutations; they are the frontier." },
    ],
    planetTheme: { type: "flow", params: { hue: 0.35, accent: 0.55, density: 1.3 } },
    documents: [
      {
        id: "bio-origin",
        type: "frontier",
        title: "The Origin of Life: State of Play",
        author: "frontier review · 2025",
        summary: "Despite seventy years of effort, we do not know how non-living chemistry became living chemistry. The leading proposals are now testable and the experimental front is active.",
        findings: [
          "Miller-Urey (1953) showed amino acids form readily from prebiotic conditions; this part is no longer mysterious.",
          "The hard problem is the transition from prebiotic chemistry to a self-replicating system with heritable variation.",
          "Leading candidates: RNA world (Gilbert), metabolism-first (Wächtershäuser, Russell), lipid-world / autocatalytic sets (Kauffman).",
        ],
        prose: [
          "Stanley Miller's 1953 experiment with a simulated early-Earth atmosphere (reducing gases, electrical discharges) showed that the basic chemical building blocks of biology — amino acids, nucleobases, simple sugars — form readily from non-biological starting materials. This was the easy part. The hard part is how those building blocks organized themselves into a self-replicating system with heritable variation — the threshold for being something Darwinian selection can act on.",
          "The leading family of proposals is the RNA world, originally suggested in passing by Crick and Orgel and developed seriously by Walter Gilbert in 1986. The idea is that RNA — which can both encode information and catalyze reactions — preceded both DNA and proteins as the substrate of early life. RNA's dual capability is the key attractive feature; the experimental evidence for self-replicating ribozymes has accumulated steadily.",
          "Alternative proposals — metabolism-first networks at deep-sea hydrothermal vents (Mike Russell), autocatalytic chemical sets (Stuart Kauffman), lipid-world hypotheses — are not dead. The current state is that we have multiple plausible mechanisms, none of which has been demonstrated end-to-end from prebiotic chemistry to a functioning protocell. The experimental program of the next two decades will likely either close one of these gaps or reveal a mechanism nobody has yet proposed."
        ],
      },
    ],
  },

  /* ─────────────────────────  TIME  ───────────────────────── */
  {
    id: "time",
    name: "Time",
    cluster: "physical",
    color: "#cbd5e1",
    position: [4, 12, 10],
    size: 1.05,
    tags: ["relativity", "arrow", "block universe", "phenomenology"],
    summary: "The dimension we experience as flow but physics describes as a coordinate — and the gap between those descriptions is one of the open problems.",
    conclusion: "Physics treats time as a coordinate without preferred direction. Experience treats it as a flowing river with one direction. Both are right; we don't fully understand how.",
    conclusionBody: [
      { type: "p", text: "Time is where physics and phenomenology most visibly fail to agree. Einstein's general relativity treats time as a coordinate in a four-dimensional spacetime manifold, no different in principle from spatial coordinates. The fundamental equations are time-reversal symmetric. Yet we experience time as flowing, asymmetric, with a sharp difference between past (fixed) and future (open)." },
      { type: "h4", text: "where the physics is settled" },
      { type: "ul", items: [
        "Special and general relativity: simultaneity is observer-dependent, time dilates in motion and gravity, there is no universal 'now'.",
        "Thermodynamic arrow: entropy increases. This is the only fundamental-law source of time-asymmetry we have.",
        "The block universe interpretation (past, present, future all equally real) is taken seriously by working physicists but not without dissent.",
      ]},
      { type: "h4", text: "where the philosophy is open" },
      { type: "ul", items: [
        "What is the relationship between physical time and experienced time?",
        "Why does the universe have such a low-entropy initial state — the precondition for the thermodynamic arrow?",
        "Are presentism (only the now is real) or eternalism (all moments equally real) defensible?",
      ]},
    ],
    planetTheme: { type: "mandala", params: { hue: 0.62, accent: 0.5, complexity: 12.0 } },
    documents: [
      {
        id: "time-arrow",
        type: "theoretical",
        title: "The Arrow of Time and the Past Hypothesis",
        author: "philosophical-physical · 2024",
        summary: "Why does time have a direction? The only fundamental answer involves entropy and an initial low-entropy state — and that initial state is itself unexplained.",
        findings: [
          "The fundamental laws of physics (electromagnetism, gravity, QFT) are time-reversal symmetric at the microphysical level.",
          "The macroscopic arrow of time — distinguishing past from future — derives from entropy increase per the second law of thermodynamics.",
          "Entropy increases only because the universe started in an exceptionally low-entropy state. Why it did is the 'past hypothesis' and is not derived; it is posited.",
        ],
        prose: [
          "If you watch a film of two billiard balls colliding played backwards, the physics looks fine — the trajectories still respect conservation of momentum and energy. The fundamental laws don't tell you which direction time runs. But if you watch a film of a glass shattering played backwards — fragments rising into a perfect vessel — you recognize immediately that this is wrong. Why?",
          "The answer is the second law of thermodynamics: entropy, the disorder of a system, increases over time. The reverse-glass video shows entropy decreasing — which is allowed by the microphysics but overwhelmingly unlikely given the number of microstates involved. The macroscopic arrow of time is statistical, not fundamental. It emerges from the staggering asymmetry between the number of disordered configurations (high entropy) and ordered ones (low entropy).",
          "The deep puzzle is that entropy only increases from now into the future because it was lower in the past. Run time backwards far enough and you reach a state of extraordinarily low entropy — the universe near the Big Bang was in a configuration much more ordered than its number of microstates would suggest. This is the 'past hypothesis' (Albert, Loewer): the assumption that the early universe had very low entropy is needed to ground the arrow of time, but the assumption itself is not derived from any deeper physics. We don't know why the universe started this way."
        ],
      },
    ],
  },

  /* ─────────────────────────  IMAGINATION  ───────────────────────── */
  {
    id: "imagination",
    name: "Imagination",
    cluster: "metaphysics",
    color: "#93c5fd",
    position: [-16, 6, 0],
    size: 1.0,
    tags: ["counterfactual", "mental simulation", "creativity", "aphantasia"],
    summary: "The brain's general-purpose simulator — without which neither planning nor empathy nor art would be possible.",
    conclusion: "Imagination is not a luxury cognitive function but the substrate of nearly every form of higher cognition we value.",
    conclusionBody: [
      { type: "p", text: "Until the 21st century, imagination was treated as a peripheral or even decorative faculty. The reframe — driven by predictive-processing accounts of cognition and by clinical findings on aphantasia (the inability to form mental images) — is that imagination is closer to the core of how the brain works. Planning, episodic memory, theory of mind, counterfactual reasoning, scientific hypothesizing, fiction-reading, empathy — all involve running internal simulations of situations not currently present." },
      { type: "h4", text: "what recent work has established" },
      { type: "ul", items: [
        "Imagination and perception share substantial neural substrate; imagining is closer to a perceptual replay than to a separate faculty.",
        "Aphantasia (lifetime inability to form voluntary mental imagery) affects roughly 1-4% of the population and is associated with specific differences in memory and counterfactual reasoning.",
        "Predictive processing frameworks (Friston, Clark) treat ordinary perception itself as a constrained kind of imagination — the brain's best simulation of what is producing its sensory input.",
      ]},
      { type: "p", text: "Honest distillation: imagination is what minds do. The conscious deliberate kind is just the visible tip of a much more pervasive simulation engine." },
    ],
    planetTheme: { type: "plasma", params: { hue: 0.6, accent: 0.85, turbulence: 1.5 } },
    documents: [
      {
        id: "imag-aphantasia",
        type: "clinical",
        title: "Aphantasia and the Variety of Inner Experience",
        author: "clinical-cognitive review · 2024",
        summary: "1-4% of people lack the ability to voluntarily form mental images. The discovery of this condition has revealed how wide the variation in inner experience actually is.",
        findings: [
          "Aphantasia is not blindness or amnesia — affected individuals describe and recognize things normally but cannot 'see' them with the mind's eye.",
          "First systematically described by Adam Zeman (Exeter) in 2015, the condition turns out to be substantially heritable and stable across the lifetime.",
          "Affected individuals show specific cognitive patterns — often weaker episodic memory, reduced counterfactual imagination, sometimes compensating strengths in abstract reasoning.",
        ],
        prose: [
          "Until 2015, the prevailing assumption was that everyone's inner experience worked roughly similarly. Ask a person to picture an apple, and they would form a more-or-less vivid mental image. Adam Zeman's case study of patient MX — a 65-year-old man who had lost the ability to form mental images after a cardiac procedure — was the trigger that revealed how much variation actually exists.",
          "MX could describe an apple, recognize one, identify color and shape from memory. He simply could not 'see' it. When asked, he reported nothing where the mental image was supposed to be. Follow-up studies revealed that roughly 1-4% of the general population reports the same lifetime absence of voluntary mental imagery — a condition Zeman named aphantasia.",
          "The discovery has had several consequences. Methodologically, it revealed that introspective reports about mental imagery had been quietly assuming a universality that was not there. Empirically, it identified a population that could serve as a natural test case for theories of imagination, memory, and dreaming. Aphantasic individuals on average have weaker episodic memory, less vivid dreams, less spontaneous counterfactual thought. They also often report compensating strengths — abstract verbal-conceptual reasoning is intact and sometimes enhanced. Imagination, it turns out, is not optional for everyone, and the variation reveals what it is doing in the typical case."
        ],
      },
    ],
  },
];

/* ============================================================
   Sub-topics — orbiting moons under a parent topic.
   Smaller scope but same shape: each has its own conclusion
   and document set. Rendered as orbiting bodies in planet view.
   ============================================================ */

export const SUB_TOPICS = {
  "world-religions": [
    {
      id: "buddhism",
      parentId: "world-religions",
      name: "Buddhism",
      color: "#f59e0b",
      tags: ["dharma", "Theravada", "Mahayana", "meditation"],
      orbit: { radius: 7.0, speed: 0.18, phase: 0.3, tilt: 0.12 },
      planetTheme: { type: "mandala", params: { hue: 0.10, accent: 0.55, complexity: 9.0 } },
      summary: "A 2,500-year-old tradition built around the diagnostic — suffering, its cause, its cessation, and the path — that became the most psychologically sophisticated of the major religions.",
      conclusion: "Buddhism is best read as the world's most rigorous program in applied phenomenology, wearing the clothes of a religion.",
      conclusionBody: [
        { type: "p", text: "Whatever else Buddhism is, it is the most empirically-minded of the great traditions. The Four Noble Truths are a diagnostic schema, not a creed: identify suffering, locate its cause, posit that the cause can be removed, prescribe a practice. Twenty-five centuries of practitioners have refined the prescription with something approximating an experimental method." },
        { type: "h4", text: "what is widely shared across the schools" },
        { type: "ul", items: [
          "The doctrine of anatta — non-self — applied as a phenomenological observation rather than a metaphysical claim.",
          "Dependent origination: phenomena arise in conditioned chains, not from independent essences.",
          "The contemplative cultivation of attention, equanimity, and insight as the path to the cessation of suffering.",
        ]},
        { type: "h4", text: "where the schools diverge" },
        { type: "ul", items: [
          "Theravada emphasizes individual liberation through monastic practice and the Pali canon.",
          "Mahayana adds the bodhisattva ideal — postponing personal liberation for the sake of all sentient beings.",
          "Vajrayana adds tantric methods that use desire and identification rather than purely renouncing them.",
        ]},
        { type: "p", text: "The honest distillation: Buddhism's metaphysics are debated; its method is robust. What converts skeptics is not the cosmology but the experiential delivery on its claims about attention, suffering, and what is and is not the self." },
      ],
      documents: [
        {
          id: "buddhism-anatta",
          type: "doctrinal",
          title: "Anatta: Non-Self as a Phenomenological Claim",
          author: "doctrinal review · 2024",
          summary: "Buddhism's denial of a persistent self is often misread as nihilism. The careful reading: the self is not denied as an experience, only as an independently-existing entity.",
          findings: [
            "Anatta is not 'there is no you'; it is 'the you you assume is a fixed thing isn't one'.",
            "The doctrine has empirical content: directed attention can be brought to bear on the self-construction process and observe its components.",
            "Modern neuroscience finds the experience of self maps onto the default-mode network, which is plastic and can be quieted — exactly what the tradition's claims predict.",
          ],
          prose: [
            "Of all the Buddhist doctrines, anatta — non-self — is the one Western readers most frequently mistranslate into nihilism. The phrase 'there is no self' suggests denial of existence, of personhood, of moral responsibility. Read that way, it is incoherent: who is being told there is no self?",
            "The careful reading is different. Anatta is a phenomenological claim about what the self actually is, not a metaphysical claim that the self does not exist. What we ordinarily call 'self' is a continuously-constructed bundle of sensations, perceptions, memories, intentions, and consciousness — five aggregates, in classical formulation — none of which is itself the self, and none of which is permanent.",
            "The contemplative claim is that this construction can be observed in real time by trained attention. The bundle assembles itself moment-to-moment from inputs; the experience of being a continuous thing-having-experiences is itself one of the experiences, not the substrate underlying them. What Buddhists call 'insight' is, in part, becoming able to perceive this construction as it happens.",
            "Contemporary neuroscience has partly converged on the same picture from the other direction. The default-mode network — the brain network active when we are not engaged in external tasks — appears to be the substrate of the constructed self. fMRI studies of experienced meditators show consistent reductions in DMN activity during practice, correlated with the phenomenological reports of self-dissolution. The brain has a self-construction subsystem; it can be quieted; what remains is conscious experience without a center."
          ],
        },
        {
          id: "buddhism-paths",
          type: "comparative",
          title: "Theravada, Mahayana, Vajrayana: One Diagnosis, Three Treatments",
          author: "comparative survey · 2023",
          summary: "The three major Buddhist vehicles agree on the diagnostic and diverge on the prescription. The differences are real and matter for practice.",
          findings: [
            "Theravada keeps closest to the Pali canon and emphasizes monastic discipline.",
            "Mahayana introduces the bodhisattva path, expanded cosmology, and emptiness as a positive teaching.",
            "Vajrayana uses tantric methods — visualization, mantra, deity yoga — within a Mahayana metaphysical frame.",
          ],
          prose: [
            "All three major Buddhist vehicles accept the Four Noble Truths and the Eightfold Path as the foundational frame. They diverge on what fully waking up looks like, who can do it, and how. The differences are not trivial and they shape the day-to-day practice of practitioners in each tradition.",
            "Theravada, the older surviving form, keeps closest to the historical material in the Pali canon. The goal is the arhat — individually liberated, the chain of suffering broken at the personal level. The method is monastic, gradual, and built on the systematic cultivation of ethics, concentration, and wisdom. Theravada is the dominant form in Sri Lanka, Thailand, Burma, and Cambodia.",
            "Mahayana introduces the bodhisattva ideal: liberation is reframed as a project for the benefit of all sentient beings, and the practitioner takes the vow to remain in samsara as long as any being still suffers. The metaphysical apparatus also expands — emptiness (shunyata) becomes a central positive teaching, and a much larger cosmology of Buddhas and bodhisattvas develops. Mahayana is the dominant form in East Asia.",
            "Vajrayana, sometimes considered a branch of Mahayana and sometimes a third vehicle, adds tantric methods: complex visualizations, mantra recitation, deity yoga, and practices designed to use rather than suppress the energies of desire and identification. The path is described as faster and more dangerous than the others. Vajrayana is the dominant form in Tibet and Mongolia.",
            "The schools have argued with each other for two millennia and reached no resolution; the contemporary mature view is that they are different treatments suited to different temperaments, all addressing the same diagnostic. Modern Western practitioners often draw from all three with less inter-school argument than traditional Asian practitioners would expect."
          ],
        },
      ],
    },
    {
      id: "sufism",
      parentId: "world-religions",
      name: "Sufism",
      color: "#fde047",
      tags: ["Islamic mysticism", "tariqa", "fana", "Rumi"],
      orbit: { radius: 9.0, speed: 0.13, phase: 2.5, tilt: -0.15 },
      planetTheme: { type: "crystal", params: { hue: 0.12, accent: 0.08, facets: 6.0 } },
      summary: "The mystical and contemplative dimension of Islam — older than the orthodoxy/heresy distinction, and the source of much of the world's most-quoted devotional poetry.",
      conclusion: "Sufism is what happens when Islamic monotheism is asked to deliver the experience of God, not merely belief in God.",
      conclusionBody: [
        { type: "p", text: "Sufism is sometimes described as 'Islam's mystical wing', but this can mislead. Sufism is not a wing of Islam; it is the contemplative tradition within Islam, and for most of Islamic history was simply how serious Muslims pursued nearness to the divine. The orthodoxy/Sufism distinction is partly a 19th-20th century construct produced by reform movements that wanted to legislate religion as belief and ritual only." },
        { type: "h4", text: "what the major orders share" },
        { type: "ul", items: [
          "The doctrine of dhikr — remembrance of God through repetition of divine names and phrases.",
          "Sustained training under a sheikh within a tariqa (path/order) tracing initiatic lineage back to the Prophet.",
          "The goal of fana — annihilation of the ego in the divine, with subsequent baqa, subsisting in God.",
        ]},
        { type: "h4", text: "where the orders differ" },
        { type: "ul", items: [
          "The Mevlevi (Rumi's order) use whirling dance as a primary practice; the Naqshbandiya emphasize silent dhikr; the Qadiriya emphasize ecstatic vocal practices.",
          "Some orders are politically engaged and have shaped state formation; others are explicitly apolitical.",
          "Theological framing ranges from highly Sharia-compliant (Naqshbandiya) to more antinomian (the Malamatiya).",
        ]},
        { type: "p", text: "The honest distillation: Sufism is the contemplative-mystical core of one of the world's three Abrahamic traditions, with a literary heritage that rivals any in human history. Its practical methods — dhikr, sustained relationship with a teacher, sustained community — are sophisticated and have been transmitted continuously for over a thousand years." },
      ],
      documents: [
        {
          id: "sufism-rumi",
          type: "literary",
          title: "Rumi and the Globalized Sufi",
          author: "literary-historical · 2025",
          summary: "Jalaluddin Rumi is the best-selling poet in modern North America, almost entirely in translations that strip out the Islam. The phenomenon tells us something about both Rumi and us.",
          findings: [
            "Rumi's actual corpus — the Masnavi and the Divan-i Shams-i Tabrizi — is densely Quranic and assumes the reader is a practicing Muslim.",
            "The most popular English versions (Coleman Barks) are not translations from Persian but adaptations from prior English translations, with Islamic references substantially softened.",
            "The result is a Rumi who is genuinely useful to non-Muslim readers and also genuinely different from the Rumi practiced by Mevlevi Sufis.",
          ],
          prose: [
            "Jalaluddin Rumi died in Konya in 1273, leaving behind one of the largest and most cited bodies of devotional poetry in any language. The Masnavi runs to 25,000 verses and is sometimes called 'the Quran in Persian'. The Divan-i Shams, written after the disappearance of Rumi's beloved companion Shams-i Tabrizi, contains some of the most intense ecstatic poetry produced anywhere.",
            "Seven hundred years later, Rumi is the best-selling poet in the United States. This is genuinely strange. American readers do not generally read 13th-century Sunni Muslim mystics. The mechanism by which Rumi crossed over is largely the work of Coleman Barks, whose adaptations from the 1990s onward made Rumi readable to a non-Muslim audience by softening or removing specifically Islamic references and rendering the result in an accessible English idiom.",
            "Barks's Rumi is widely loved and not strictly a translation. Barks does not read Persian; he works from prior English translations and produces what he calls 'versions'. The result is a Rumi who speaks of beloved, of separation and union, of the soul's longing — but rarely of Allah, of the Prophet, of the specific Islamic theological frame within which the original poetry operates.",
            "This is not necessarily a critique. Barks's Rumi has introduced millions of readers to genuine Sufi insight in a form they can absorb. But the contrast with Sufi practitioners — who read Rumi within the full Islamic-mystical context, often in Persian, embedded in regular practice — is striking. There are now effectively two Rumis: the global devotional poet read in airports, and the Sufi master read in tariqas. Both are real. They are not the same."
          ],
        },
        {
          id: "sufism-tariqa",
          type: "practical",
          title: "The Tariqa: How a Sufi Order Actually Operates",
          author: "ethnographic · 2024",
          summary: "Beyond the poetry, Sufism is a sustained social technology for transmitting contemplative practice across generations. How an active order actually works.",
          findings: [
            "Every active tariqa traces an unbroken initiatic chain (silsila) back to the Prophet via successive sheikhs.",
            "Initiation is gradual; the relationship with the sheikh is the central transmission mechanism, not text.",
            "Daily practice combines obligatory Islamic ritual with order-specific dhikr, often performed in group.",
          ],
          prose: [
            "Sufism as a literary tradition is widely accessible; Sufism as a practiced tradition is much less so. Practiced Sufism is organized through tariqas — orders, each tracing its lineage back to the Prophet Muhammad through a continuous chain of sheikh-to-student transmissions. To be a practicing Sufi means to have been initiated into a specific tariqa by a specific sheikh, and to be engaged in ongoing relationship with that line.",
            "The structure has functional reasons. Sufi practice involves states and stations (ahwal and maqamat) that are dangerous to navigate alone — the literature is full of practitioners who failed to find a teacher and lost their way, or burned themselves out. The sheikh's role is to assign practices appropriate to the disciple's current condition, to recognize stages of progress, and to keep the disciple oriented toward the goal rather than toward intermediate states.",
            "A typical week in an active tariqa includes the five obligatory daily prayers (this is non-negotiable; Sufism is Islam, not a substitute for it), private daily dhikr assigned by the sheikh, often a weekly group gathering for collective dhikr, and periodic intensive retreats. The practices are ordered: the disciple does not invent her own practice but receives a specific protocol that has been refined over generations.",
            "This is a slow tradition. It is not designed for the quick contact-mysticism of a weekend retreat. The serious work begins after years of preparatory practice. The literature on this is mostly in Arabic, Persian, Turkish, and Urdu, and most of it has never been translated. The contemporary Western seeker who wants to encounter actual practiced Sufism has to find an active tariqa willing to take them on, and the bar for that is real."
          ],
        },
      ],
    },
  ],

  "astrophysics": [
    {
      id: "black-holes",
      parentId: "astrophysics",
      name: "Black Holes",
      color: "#9333ea",
      tags: ["event horizon", "Hawking radiation", "supermassive", "EHT"],
      orbit: { radius: 7.5, speed: 0.12, phase: 1.0, tilt: 0.2 },
      planetTheme: { type: "cmb", params: { hue: 0.72, accent: 0.05, structure: 0.6 } },
      summary: "Regions of spacetime so curved that even light cannot escape — once a theoretical curiosity, now imaged, weighed, and observed merging.",
      conclusion: "Black holes are no longer a hypothesis. They are catalogued objects whose properties are measured to several decimal places.",
      conclusionBody: [
        { type: "p", text: "The conceptual journey of black holes from 'unphysical singularity in someone's calculation' to 'object whose shadow we have photographed' has played out over a single century. The 2019 image of M87*'s event horizon, and the 2022 image of Sagittarius A* at the center of our own galaxy, are not just pretty pictures — they are direct tests of general relativity in the strong-field regime, and GR passed." },
        { type: "h4", text: "what is settled" },
        { type: "ul", items: [
          "Stellar-mass black holes exist as endpoints of massive-star evolution and are the dark partners in many X-ray binaries.",
          "Supermassive black holes (10^6 to 10^10 solar masses) sit at the centers of essentially all large galaxies, including ours.",
          "Compact-binary mergers detected via gravitational waves are at least partly black-hole mergers, and the population has filled in faster than any theorist predicted.",
        ]},
        { type: "h4", text: "what is wide open" },
        { type: "ul", items: [
          "How supermassive black holes get to be supermassive so early — quasars at z > 7 imply growth mechanisms we don't fully understand.",
          "The information paradox — does information that falls into a black hole survive in subtle correlations in Hawking radiation, or is it lost? — has been the central problem of quantum gravity for fifty years.",
        ]},
      ],
      documents: [
        {
          id: "bh-eht-image",
          type: "discovery",
          title: "What the Event Horizon Telescope Actually Imaged",
          author: "instrumental · 2023",
          summary: "The famous 'black hole picture' is a synthesized image from a planet-scale VLBI array combining stations from Hawaii to Antarctica. Reading it properly requires understanding what the data really show.",
          findings: [
            "The dark central region is the 'shadow' of the event horizon, magnified by gravitational lensing by a factor of ~2.6.",
            "The bright ring is photons orbiting near the photon sphere and being deflected toward us.",
            "The ring's diameter, shape, and asymmetry simultaneously constrain the black hole's mass, spin, and orientation.",
          ],
          prose: [
            "The April 2019 release of the Event Horizon Telescope's image of M87* — a six-billion-solar-mass black hole at the center of the M87 galaxy — was widely described as 'the first picture of a black hole'. The phrasing is approximately right but worth unpacking, because the data are not what a casual viewer assumes.",
            "M87* is too small in angular size for any single telescope to resolve. The EHT solves this by performing very-long-baseline interferometry across a global array of millimeter-wave radio telescopes — from Hawaii, Arizona, Mexico, Chile, Spain, and Antarctica. The effective aperture is the diameter of the Earth. The signals from each station are atomic-clock-synchronized, recorded to disk, physically shipped to processing centers, and correlated to extract the interferometric visibilities.",
            "The image is then reconstructed from those visibilities via algorithms similar in spirit to MRI reconstruction. It is not a direct photograph; it is an inferred image consistent with the measured interference pattern. Multiple independent reconstruction pipelines were run blind against the data and they converged on the same picture, which is the key calibration of the result.",
            "What the picture shows: a dark central region — the 'shadow' of the event horizon, gravitationally magnified by a factor of about 2.6 — surrounded by a bright photon ring from light orbiting near the photon sphere. The diameter, shape, and brightness asymmetry of the ring jointly constrain the black hole's mass, spin parameter, and viewing geometry. Everything checks out against general relativity. The 2022 release of Sagittarius A* at our galactic center used the same technique and produced an image consistent with GR for a black hole roughly 4 million solar masses."
          ],
        },
        {
          id: "bh-information",
          type: "frontier",
          title: "The Information Paradox: Still the Hardest Problem in Quantum Gravity",
          author: "theoretical · 2025",
          summary: "Hawking showed in 1974 that black holes radiate and eventually evaporate. The radiation appears thermal — and that's a problem, because quantum mechanics says information must be preserved.",
          findings: [
            "Pure quantum states evolve to pure states; thermal radiation is mixed; black-hole evaporation appears to violate this.",
            "The 2019-2020 'Page curve' calculations from AdS/CFT-adjacent methods strongly suggest information does survive — encoded in subtle correlations across the radiation.",
            "We do not yet have a complete description of the mechanism in our universe (which is not AdS), but the holographic principle is now considered the most likely framework for the resolution.",
          ],
          prose: [
            "Stephen Hawking's 1974 calculation showed that black holes are not perfectly black — quantum effects near the horizon cause them to radiate at a temperature inversely proportional to their mass. Over very long timescales, a black hole radiates away its entire mass and disappears. This is in itself a remarkable result. What made it a fifty-year crisis in theoretical physics is what happens to the information that fell in.",
            "Quantum mechanics imposes unitary evolution: the information content of a pure quantum state is preserved as it evolves. If you throw a book into a black hole, the precise quantum state of the book is preserved, in principle, somewhere. Hawking's calculation, however, indicated that the radiation emitted is essentially thermal — characterized only by temperature, carrying no information about what fell in. If the black hole evaporates completely, leaving only thermal radiation, the information appears to be lost. This contradicts a foundational principle of quantum mechanics.",
            "For decades the field was split. Hawking himself, for most of his life, argued that information is genuinely lost and quantum mechanics must be modified. His former student Don Page and most of the string-theory community argued the opposite — that information must be preserved and Hawking's calculation was missing subtle correlations.",
            "Beginning around 2019, calculations using techniques from the AdS/CFT correspondence and 'replica wormholes' produced what is now considered substantial evidence for the information-preserving side. The 'Page curve' — the time-evolution of the entanglement entropy of the radiation — has the shape that conservation of information requires, not the shape that information loss would produce. The mechanism appears to involve subtle correlations across the radiation that are imperceptible to any local measurement but reconstruct the full quantum information in principle.",
            "These calculations are in highly idealized setups (anti-de Sitter spacetime, mathematically tractable). Transferring the results to our actual universe is in progress and not yet complete. But the consensus has shifted: information is preserved, the holographic principle is the framework, and Hawking — generously — would now probably agree."
          ],
        },
      ],
    },
  ],

  "computation": [
    {
      id: "cryptography",
      parentId: "computation",
      name: "Cryptography",
      color: "#06b6d4",
      tags: ["RSA", "elliptic curve", "post-quantum", "zero-knowledge"],
      orbit: { radius: 7.0, speed: 0.16, phase: 1.5, tilt: -0.1 },
      planetTheme: { type: "circuit", params: { hue: 0.52, accent: 0.7, density: 2.0 } },
      summary: "The mathematical practice of constructing protocols that work in the presence of adversaries — and the field with the cleanest open exposure to the quantum threat.",
      conclusion: "Modern cryptography is mostly solved as engineering and partly unsolved as theory — and the quantum transition is forcing a reckoning with the parts we never quite proved.",
      conclusionBody: [
        { type: "p", text: "Cryptography in 2026 is in an unusual position. The systems we deploy daily — TLS, signature schemes, key exchange — work reliably and are not the bottleneck in actual security failures (those come from implementation bugs, supply chains, and humans). At the same time, the field's theoretical foundations rest on unproven assumptions, and the imminent arrival of cryptographically-relevant quantum computers is forcing a transition to entirely new mathematical primitives." },
        { type: "h4", text: "what is settled" },
        { type: "ul", items: [
          "Symmetric cryptography (AES, ChaCha20) is on solid empirical footing and not under near-term threat from quantum computers — Grover's algorithm only halves effective key length.",
          "Public-key cryptography based on factoring (RSA) and discrete logs (Diffie-Hellman, ECDSA) is broken by sufficiently large quantum computers via Shor's algorithm.",
          "NIST has standardized post-quantum replacements (CRYSTALS-Kyber for KEM, CRYSTALS-Dilithium for signatures); migration is in progress.",
        ]},
        { type: "h4", text: "what is wide open" },
        { type: "ul", items: [
          "We do not have a proof that any cryptographic system is secure. All security reductions terminate in unproven assumptions (P ≠ NP, lattice-problem hardness, etc.).",
          "Zero-knowledge proofs, fully homomorphic encryption, and multi-party computation are theoretically achievable but practically expensive.",
          "Side-channel attacks, implementation flaws, and quantum side channels remain the actual source of most security failures.",
        ]},
      ],
      documents: [
        {
          id: "crypto-post-quantum",
          type: "transition",
          title: "The Post-Quantum Migration: Where We Are",
          author: "policy/technical · 2026",
          summary: "NIST has standardized the first batch of post-quantum primitives. The actual migration of the world's deployed cryptography is the larger problem and is just beginning.",
          findings: [
            "CRYSTALS-Kyber (lattice-based KEM) and CRYSTALS-Dilithium (lattice-based signatures) were finalized by NIST in 2024.",
            "Falcon and SPHINCS+ are alternates for signatures.",
            "TLS 1.3 hybrid modes (combining classical and post-quantum key exchange) are deployed by Cloudflare, Google, and others; full transition will take many years.",
          ],
          prose: [
            "The cryptography-relevant quantum computer does not yet exist, but the cryptographic community has been planning its arrival for a decade. NIST began the Post-Quantum Cryptography Standardization process in 2016 with a call for candidate algorithms. Hundreds of submissions, multiple rounds of analysis, several embarrassing breaks of candidates, and eight years later, the first standards are finalized.",
            "The chosen primitives are lattice-based for the most part. CRYSTALS-Kyber is the standard key-encapsulation mechanism — the post-quantum replacement for the elliptic-curve Diffie-Hellman that today negotiates session keys in most TLS connections. CRYSTALS-Dilithium is the primary signature scheme. Falcon, also lattice-based, is an alternate signature scheme with smaller signatures but harder implementation. SPHINCS+, based purely on hash functions, is conservatively secure and an option for use cases where simplicity matters more than performance.",
            "The standards are settled; the migration is where the actual work lives. The world has roughly thirty years of accumulated cryptographic infrastructure — embedded systems, signed firmware, long-lived certificates, encrypted archives — most of which is currently relying on classical primitives. 'Harvest now, decrypt later' attacks make this urgent for any data with long-term confidentiality requirements: an adversary records encrypted traffic today and decrypts it once a quantum computer becomes available.",
            "Major providers have begun rolling out hybrid TLS modes that combine classical and post-quantum key exchange — Cloudflare, Google, and Amazon have all deployed hybrid Kyber to substantial fractions of their edges. This protects against future quantum attacks while preserving compatibility with current clients. Full migration of the world's cryptography will be a decade-plus project."
          ],
        },
        {
          id: "crypto-zk",
          type: "frontier",
          title: "Zero-Knowledge Proofs: The Other Cryptographic Revolution",
          author: "frontier · 2025",
          summary: "Beyond the post-quantum transition, the deepest current development in applied cryptography is the practicality of zero-knowledge proofs.",
          findings: [
            "ZK proofs allow proving that a statement is true without revealing why it is true — long theoretical, now practical.",
            "ZK-SNARKs and ZK-STARKs have brought verification to sub-millisecond range for many real circuits.",
            "Applications: scaling layer-2 blockchains, anonymous credentials, verified machine learning inference, private contact tracing.",
          ],
          prose: [
            "Zero-knowledge proofs were introduced by Goldwasser, Micali, and Rackoff in 1985. The idea — proving you know a secret without revealing the secret — sounds magical and the original constructions were too inefficient for practical use. For thirty years ZK proofs were a beautiful theoretical result with limited applications. That changed in the mid-2010s.",
            "ZK-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge), starting with the Pinocchio protocol and Groth16 construction, brought ZK proofs to the point where one party could prove the correctness of an arbitrary computation, and another party could verify the proof in milliseconds and with constant-size proofs, regardless of how large the original computation was. This is genuinely strange. A statement about a computation that took an hour can be verified in 10 milliseconds.",
            "ZK-STARKs, introduced around 2018, give up the constant-size proofs of SNARKs in exchange for not requiring a trusted setup and being post-quantum secure. Both families are now production-deployed.",
            "The applications have started landing. Layer-2 blockchain scaling (zkSync, StarkNet) uses ZK proofs to compress thousands of transactions into a single mainnet verification. Anonymous credential systems let users prove they are over 18 or are a verified employee without revealing identity. Verified machine learning inference allows a service to prove it ran a specific model on your inputs without revealing the model weights. The general pattern: anywhere we currently rely on trust because verification was too expensive, ZK proofs let us substitute mathematics.",
            "The frontier today is bringing the prover's costs down. Generating a ZK proof for a complex computation can still take orders of magnitude longer than the original computation. This is fine for blockchain settings where verification cost dominates, less fine for real-time applications. Hardware acceleration for ZK proving is now a $1B+ research and commercial sector."
          ],
        },
      ],
    },
  ],
};

/* Edges — symmetric. Encoded once. */
export const EDGES = [
  ["simulation-theory", "computation"],
  ["simulation-theory", "cosmology"],
  ["simulation-theory", "esoterica"],
  ["plasma-dynamics", "astrophysics"],
  ["plasma-dynamics", "cosmology"],
  ["world-religions", "esoterica"],
  ["world-religions", "cosmology"],
  ["economics", "computation"],
  ["economics", "world-religions"],
  ["esoterica", "cosmology"],
  ["astrophysics", "cosmology"],
  // new constellations among the 10 added
  ["consciousness", "simulation-theory"],
  ["consciousness", "memory"],
  ["consciousness", "dreams"],
  ["consciousness", "imagination"],
  ["memory", "language"],
  ["memory", "dreams"],
  ["language", "computation"],
  ["language", "music"],
  ["dreams", "imagination"],
  ["dreams", "esoterica"],
  ["mathematics", "computation"],
  ["mathematics", "music"],
  ["mathematics", "cosmology"],
  ["mathematics", "astrophysics"],
  ["music", "mathematics"],
  ["mythology", "world-religions"],
  ["mythology", "esoterica"],
  ["mythology", "language"],
  ["biology", "astrophysics"],
  ["biology", "computation"],
  ["biology", "consciousness"],
  ["time", "cosmology"],
  ["time", "consciousness"],
  ["time", "memory"],
  ["imagination", "esoterica"],
  ["imagination", "music"],
  ["imagination", "mythology"],
];

/* Cluster colors (legend) */
export const CLUSTERS = {
  metaphysics: { color: "#a78bfa", label: "metaphysics" },
  physical:    { color: "#fb7185", label: "physical" },
  systems:     { color: "#34d399", label: "systems" },
  humanity:    { color: "#facc15", label: "humanity" },
};

export function topicById(id) {
  return TOPICS.find(t => t.id === id);
}

export function subTopicsOf(parentId) {
  return SUB_TOPICS[parentId] || [];
}

export function subTopicById(id) {
  for (const parentId of Object.keys(SUB_TOPICS)) {
    const found = SUB_TOPICS[parentId].find(s => s.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * Find any entry — top-level topic or moon — by id.
 * Returns { entry, kind: "topic" | "moon", parent? }.
 */
export function resolveById(id) {
  const topic = topicById(id);
  if (topic) return { entry: topic, kind: "topic" };
  const sub = subTopicById(id);
  if (sub) return { entry: sub, kind: "moon", parent: topicById(sub.parentId) };
  return null;
}

/**
 * Flat searchable list of every topic + every moon, with the fields
 * we search against. Used for local fuzzy match before falling
 * back to the AI generator.
 */
export function allSearchable() {
  const out = [];
  for (const t of TOPICS) {
    out.push({ id: t.id, kind: "topic", name: t.name, tags: t.tags || [], summary: t.summary, ref: t });
  }
  for (const parentId of Object.keys(SUB_TOPICS)) {
    for (const s of SUB_TOPICS[parentId]) {
      out.push({ id: s.id, kind: "moon", name: s.name, tags: s.tags || [], summary: s.summary, ref: s, parentId });
    }
  }
  return out;
}

export function connectionsOf(id) {
  const set = new Set();
  for (const [a, b] of EDGES) {
    if (a === id) set.add(b);
    if (b === id) set.add(a);
  }
  return [...set].map(topicById).filter(Boolean);
}

/**
 * Register a user-generated topic or moon at runtime.
 * Mutates the in-memory data so the rest of the app sees it.
 * The caller is responsible for persisting to localStorage.
 */
export function registerGeneratedTopic(topic) {
  TOPICS.push(topic);
}
export function registerGeneratedMoon(moon) {
  if (!SUB_TOPICS[moon.parentId]) SUB_TOPICS[moon.parentId] = [];
  SUB_TOPICS[moon.parentId].push(moon);
}

export function registerGeneratedEdge(a, b) {
  // dedupe — don't add reverse or duplicate
  for (const [x, y] of EDGES) {
    if ((x === a && y === b) || (x === b && y === a)) return false;
  }
  EDGES.push([a, b]);
  return true;
}
