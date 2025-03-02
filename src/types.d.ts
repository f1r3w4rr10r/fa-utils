interface AdvertisementCheckSpecPart {
  triggers: RegExp[];
  isAlwaysAd?: boolean;
  isAdExpressions?: RegExp[];
  isNotAdExpressions?: RegExp[];
}

interface AdvertisementCheckSpec {
  specName: string;
  name?: AdvertisementCheckSpecPart;
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
  tags: DecisionLogEntryPart | null;
}
