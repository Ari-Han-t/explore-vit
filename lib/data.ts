import { activities as activityValues, domainNames, type DomainCard, type MentorProfile } from "@/lib/types";

export const activities = [...activityValues];

export const domains: DomainCard[] = [
  {
    slug: "data-science",
    name: domainNames[0],
    prompt: "Pattern-heavy and curious",
    summary: "Best for students who like extracting signal from messy information, building dashboards, and experimenting with models.",
    clubs: ["AI/ML Club", "Data Club", "Analytics Society"],
    keywords: ["python", "ml", "analysis", "model", "data", "statistics", "visualization"],
    workshops: [
      {
        title: "Campus Sentiment Dashboard",
        format: "Notebook sprint",
        duration: "90 min",
        takeaway: "Clean a small student dataset and visualize trends that matter.",
      },
      {
        title: "Mini Recommender Jam",
        format: "Hands-on lab",
        duration: "2 hrs",
        takeaway: "Build a lightweight recommendation baseline using text features.",
      },
    ],
  },
  {
    slug: "competitive-programming",
    name: domainNames[1],
    prompt: "Fast-thinking and puzzle-driven",
    summary: "Great for students who enjoy constraints, logic, runtime tradeoffs, and measurable progress through practice.",
    clubs: ["ICPC Chapter", "CodeChef VIT", "Hack Circle"],
    keywords: ["algorithms", "cp", "graphs", "dynamic programming", "logic", "optimization"],
    workshops: [
      {
        title: "Greedy to Graphs",
        format: "Problem-solving set",
        duration: "75 min",
        takeaway: "Feel the pace of timed coding and pattern recognition.",
      },
      {
        title: "Contest Simulation",
        format: "Mock round",
        duration: "2 hrs",
        takeaway: "Learn how pressure, debugging, and ranking feel in practice.",
      },
    ],
  },
  {
    slug: "core-engineering",
    name: domainNames[2],
    prompt: "Systems-minded and build-focused",
    summary: "A fit for students who want to understand hardware, design physical systems, and solve reliability-heavy problems.",
    clubs: ["IEEE VIT", "Electronica", "Robotics Club"],
    keywords: ["electronics", "circuits", "mechanics", "embedded", "design", "control systems"],
    workshops: [
      {
        title: "Sensor to Signal Lab",
        format: "Bench session",
        duration: "2 hrs",
        takeaway: "Work with sensors, measurements, and practical troubleshooting.",
      },
      {
        title: "Design for Reliability",
        format: "Case-led workshop",
        duration: "90 min",
        takeaway: "Break down a product into constraints, tolerances, and failure modes.",
      },
    ],
  },
  {
    slug: "research",
    name: domainNames[3],
    prompt: "Theory-first and inquiry-led",
    summary: "Ideal for students who like reading papers, framing questions, and chasing novel ideas even when the path is uncertain.",
    clubs: ["GDC", "IRC VIT", "Lab Fellowship Cohort"],
    keywords: ["papers", "research", "experiments", "literature review", "hypothesis", "publication"],
    workshops: [
      {
        title: "Paper Reading Circle",
        format: "Reading session",
        duration: "60 min",
        takeaway: "Practice extracting a problem statement and methodology from a paper.",
      },
      {
        title: "Experiment Design Sprint",
        format: "Research studio",
        duration: "2 hrs",
        takeaway: "Turn a vague question into a defensible experimental setup.",
      },
    ],
  },
  {
    slug: "entrepreneurship",
    name: domainNames[4],
    prompt: "User-focused and opportunity-seeking",
    summary: "Works well for students who enjoy ambiguity, customer discovery, pitching, and building around real-world pain points.",
    clubs: ["E-Cell", "Founders Circle", "Product Guild"],
    keywords: ["startup", "product", "users", "pitch", "market", "founder", "business"],
    workshops: [
      {
        title: "Campus Problem Discovery",
        format: "Field interview sprint",
        duration: "90 min",
        takeaway: "Learn how to listen for pain points instead of jumping to solutions.",
      },
      {
        title: "Zero-to-Pitch",
        format: "Idea lab",
        duration: "2 hrs",
        takeaway: "Convert a raw observation into a product hypothesis and short pitch.",
      },
    ],
  },
];

export const mentors: MentorProfile[] = [
  {
    id: "mentor-1",
    name: "Aarav Menon",
    role: "Final-year CSE student, ML internship track",
    domain: "Data Science",
    bio: "Helps juniors figure out whether they enjoy model-building, analytics, or the product side of data work.",
    tags: ["Python", "ML projects", "Internships"],
    slots: ["Mon, 5:00 PM", "Wed, 7:30 PM", "Sat, 11:00 AM"],
    sessionPitch: "Bring one project idea or one point of confusion, and we will map it to a practical learning path.",
  },
  {
    id: "mentor-2",
    name: "Sneha Iyer",
    role: "ICPC prep lead and systems problem-solver",
    domain: "Competitive Programming",
    bio: "Great for students deciding whether they genuinely enjoy algorithms or are just following the crowd.",
    tags: ["Graphs", "Contests", "Interview prep"],
    slots: ["Tue, 6:00 PM", "Thu, 8:00 PM", "Sun, 10:30 AM"],
    sessionPitch: "We will look at your problem-solving habits and decide whether CP should be a major pillar or just a supporting skill.",
  },
  {
    id: "mentor-3",
    name: "Kavin Raj",
    role: "ECE senior working on embedded systems",
    domain: "Core Engineering",
    bio: "Useful if you want to compare software-heavy routes with electronics, robotics, or systems design.",
    tags: ["Embedded", "Robotics", "Design reviews"],
    slots: ["Mon, 8:30 PM", "Fri, 5:30 PM", "Sat, 4:00 PM"],
    sessionPitch: "We can unpack what core engineering actually feels like week to week before you commit to that route.",
  },
  {
    id: "mentor-4",
    name: "Priya Natarajan",
    role: "Research assistant and student founder",
    domain: "Research",
    bio: "Bridges research thinking with product instincts, especially for students who like open-ended work.",
    tags: ["Literature reviews", "Experiments", "Product thinking"],
    slots: ["Wed, 6:30 PM", "Fri, 7:00 PM", "Sun, 12:00 PM"],
    sessionPitch: "We will use your reflections to decide whether your curiosity is pointing toward research, products, or both.",
  },
];

export const clubsByDomain = Object.fromEntries(domains.map((domain) => [domain.name, domain.clubs])) as Record<
  (typeof domainNames)[number],
  string[]
>;
