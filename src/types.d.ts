/**
 * A list of rules, whose ratings are summed up. Each one rule should represent
 * a different concept and not overlap. Otherwise the same concept might be
 * rated multiple times and be represented disproportionally in the overall
 * rating.
 */
type AdRules = AdRule[];

/**
 * A single rule for matching ads. If there are multiple, non-empty variant
 * arrays, at least one variant in each non-empty array has to match, for the
 * entire rule to match.
 */
interface AdRule {
  /**
   * A descriptive name for the rule.
   */
  ruleName: string;

  /**
   * The rating value that is applied, when the rule matches.
   */
  value: number;

  /**
   * The selector or selector tree to match against.
   */
  selector: AdSelector | SelectorCombiner;
}

/**
 * A result for evaluating rules against a submission.
 */
interface AdRulesResult {
  /**
   * The advertisement level, if there was a match or null.
   */
  level: AdvertisementLevel | null;

  /**
   * The numerical rating of the submission.
   */
  rating: number;
}

/**
 * A log entry for an {@link AdRule} match.
 */
interface AdRuleMatchLogEntry {
  /**
   * The name of the rule that matched.
   */
  ruleName: string;

  /**
   * The rating of the rule that matched.
   */
  value: number;
}

/**
 * A node in a selector tree to combine multiple further
 * {@link SelectorCombiner}s or {@link AdSelector}s.
 */
interface SelectorCombiner {
  operator: "and" | "or";

  operands: (AdSelector | SelectorCombiner)[];
}

/**
 * A leaf node in a selector tree, that matches a given input text against a
 * regular expression.
 */
interface AdSelector {
  /**
   * Which text of the commission to match against.
   */
  target: "name" | "tags" | "description";

  /**
   * The regular expression that has to match.
   */
  pattern: RegExp;
}

/**
 * The data of a submission
 */
interface SubmissionData {
  /**
   * The name of the submission
   */
  name: string;

  /**
   * The tags of the submission
   */
  tags: string;

  /**
   * The description of the submission
   */
  description: string;
}

interface AdvertisementCheckSpecPart {
  triggers: RegExp[];
  isAlwaysAd?: boolean;
  isAdExpressions?: RegExp[];
  isNotAdExpressions?: RegExp[];
}

interface AdvertisementCheckSpec {
  specName: string;
  name?: AdvertisementCheckSpecPart;
  description?: AdvertisementCheckSpecPart;
  untaggedIsAd?: boolean;
  tags?: AdvertisementCheckSpecPart;
}

type AdvertisementLevel = "advertisement" | "ambiguous" | "notAdvertisement";

interface DecisionLogEntryPart {
  trigger: RegExp;
  level: AdvertisementLevel;
  isAlwaysAd?: boolean;
  isAdExpression?: RegExp;
  isNotAdExpression?: RegExp;
}

interface DecisionLogEntry {
  specName: string;
  level: AdvertisementLevel;
  name: DecisionLogEntryPart | null;
  description: DecisionLogEntryPart | null;
  tags: DecisionLogEntryPart | null;
}
