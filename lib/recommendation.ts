import { clubsByDomain, domains } from "@/lib/data";
import { domainNames, type RecommendationResult, type ReflectionEntry, type TrialEvent } from "@/lib/types";

export function computeLocalRecommendation(
  reflections: ReflectionEntry[],
  trials: TrialEvent[]
): RecommendationResult {
  if (!reflections.length) {
    return {
      recommendation: "Explore more domains first!",
      clubs: [],
      scores: {},
      reasoning: [
        "Add at least one reflection so the prototype has enough behavioral signal to rank domains.",
      ],
    };
  }

  const scores = Object.fromEntries(domainNames.map((domain) => [domain, 0])) as Record<string, number>;

  reflections.forEach((reflection) => {
    const domain = domains.find((item) => item.name === reflection.domain);
    const note = reflection.notes.toLowerCase();
    const keywordMatches = domain?.keywords.filter((keyword) => note.includes(keyword.toLowerCase())).length ?? 0;
    const activityBoost = reflection.activityType === "Project Sprint" || reflection.activityType === "Mentor Chat" ? 0.6 : 0.25;

    scores[reflection.domain] += reflection.rating * 1.8 + keywordMatches * 0.45 + activityBoost;
  });

  trials.forEach((trial) => {
    scores[trial.domain] = (scores[trial.domain] ?? 0) + 0.9;
  });

  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const [topDomain, topScore] = ranked[0] ?? ["Explore more domains first!", 0];
  const clubs = topDomain in clubsByDomain ? clubsByDomain[topDomain as keyof typeof clubsByDomain] : [];
  const reasoning = [
    `${topDomain} received the strongest combined score from ratings, trial activity, and note keywords.`,
    `Top score: ${topScore.toFixed(2)} across ${reflections.length} reflection entries and ${trials.length} trial events.`,
  ];

  return {
    recommendation: topDomain,
    clubs,
    scores: Object.fromEntries(ranked.map(([domain, score]) => [domain, Number(score.toFixed(2))])),
    reasoning,
  };
}
