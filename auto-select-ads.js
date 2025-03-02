// ==UserScript==
// @name         Auto-select advertisement submission notifications on FurAffinity
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This automatically selects submission notifications, that are advertisements.
// @author       You
// @match        https://www.furaffinity.net/msg/submissions/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  /**
   * @typedef {Object} AdvertisementCheckSpecPart
   * @property {RegExp[]} triggers
   * @property {boolean} [isAlwaysAd]
   * @property {RegExp[]} [isAdExpressions]
   * @property {RegExp[]} [isNotAdExpressions]
   */

  /**
   * @typedef {Object} AdvertisementCheckSpec
   * @property {AdvertisementCheckSpecPart} [name]
   * @property {boolean} [untaggedIsAd]
   * @property {AdvertisementCheckSpecPart} [tags]
   */

  /**
   * @typedef {"advertisement" | "ambiguous" | "notAdvertisement"} AdvertisementLevel
   */

  class AdvertisementCheckResult {
    /**
     * @param {boolean} isTagged
     * @param {AdvertisementLevel | null} [nameResult]
     * @param {AdvertisementLevel | null} [tagsResult]
     */
    constructor(isTagged, nameResult, tagsResult) {
      this.#isTagged = isTagged;
      this.#nameResult = nameResult ?? null;
      this.#tagsResult = tagsResult ?? null;
    }

    /** @type {AdvertisementLevel | null} */
    #nameResult = null;

    /** @type {AdvertisementLevel | null} */
    #tagsResult = null;

    #isTagged = false;

    /** @type {string[]} */
    #decisionLog = [];

    /**
     * @returns {AdvertisementLevel | null}
     */
    get nameResult() {
      return this.#nameResult;
    }

    /**
     * @param {AdvertisementLevel | null} value
     */
    set nameResult(value) {
      this.#nameResult = this.#coalesceResultLevel(this.#nameResult, value);
    }

    /**
     * @returns {AdvertisementLevel | null}
     */
    get tagsResult() {
      return this.#tagsResult;
    }

    /**
     * @param {AdvertisementLevel | null} value
     */
    set tagsResult(value) {
      this.#tagsResult = this.#coalesceResultLevel(this.#tagsResult, value);
    }

    /**
     * @returns {AdvertisementLevel | null}
     */
    get result() {
      if (
        this.#nameResult === "notAdvertisement" ||
        this.#tagsResult === "notAdvertisement"
      ) {
        return "notAdvertisement";
      }

      if (
        this.#nameResult === "advertisement" ||
        this.#tagsResult === "advertisement"
      ) {
        return "advertisement";
      }

      if (
        this.#nameResult === "ambiguous" ||
        this.#tagsResult === "ambiguous"
      ) {
        return "ambiguous";
      }

      return null;
    }

    /**
     * @returns {boolean}
     */
    get isTagged() {
      return this.#isTagged;
    }

    get decisionLog() {
      return this.#decisionLog;
    }

    /**
     * @param {string} log
     */
    addToLog(log) {
      this.#decisionLog.push(log);
    }

    /**
     * @param {AdvertisementLevel | null} current
     * @param {AdvertisementLevel | null} newValue
     * @returns {AdvertisementLevel | null}
     */
    #coalesceResultLevel(current, newValue) {
      if (newValue === null) {
        return current;
      }

      if (current === "notAdvertisement" || newValue === "notAdvertisement") {
        return "notAdvertisement";
      }

      if (current === "advertisement" && newValue === "ambiguous") {
        return current;
      }

      return newValue;
    }
  }

  // The second "c" is a kyrillic "s";
  const commissionRegexString = "[cс]omm(?:ission)?s?";
  const commissionBoundedRegexString = `(?:^|\\W)${commissionRegexString}\\b`;
  const commissionRegex = new RegExp(commissionBoundedRegexString, "i");

  /** @type {AdvertisementCheckSpec[]} */
  const advertisementCheckSpecs = [
    {
      name: {
        triggers: [
          /\badopt(?:(?:able)?s?|ing)\b/i,
          /\bpicarto\.tv\b/i,
          /\breminder+\b/i,
          /\bstreaming\b/i,
          /^REM$/,
        ],
        isAlwaysAd: true,
      },
    },
    {
      name: {
        triggers: [/\bwip\b/i],
        isAlwaysAd: true,
      },
      tags: {
        triggers: [/\bwip\b/i],
        isAlwaysAd: true,
      },
    },
    {
      name: {
        triggers: [/\bauction\b/i, commissionRegex, /\bwing.its?\b/i],
        isAdExpressions: [
          /\bclosed\b/i,
          /\bhalfbody\b/i,
          /\bopen(?:ed)?\b/i,
          /\bsale\b/i,
          /\bslots?\b/i,
        ],
        isNotAdExpressions: [
          /\bfor\b/i,
          new RegExp(`\\[${commissionRegexString}\\]`, "i"),
          new RegExp(`^${commissionRegexString}$`, "i"),
        ],
      },
    },
    {
      name: {
        triggers: [/\b(?:live)?stream\b/i],
        isAdExpressions: [
          /\blive\b/i,
          /\boffline\b/i,
          /\bonline\b/i,
          /\bpreorders?\b/i,
          /\bslots?\b/i,
          /\bup\b/i,
        ],
      },
    },
    {
      name: {
        triggers: [/\bstream\b/i],
        isAlwaysAd: true,
      },
      tags: {
        triggers: [/\bstream\b/i],
        isAlwaysAd: true,
      },
    },
    {
      name: {
        triggers: [/\by ?c ?h\b/i],
        isAdExpressions: [
          /\bauction\b/i,
          /\bavailable\b/i,
          /\bclosed\b/i,
          /\bdiscount\b/i,
          /\bmultislot\b/i,
          /\bo ?p ?e ?n\b/i,
          /\bprice\b/i,
          /\bpreview\b/i,
          /\braffle\b/i,
          /\brem(?:ind(?:er)?)?\d*\b/i,
          /\brmd\b/i,
          /\bsale\b/i,
          /\bslots?\b/i,
          /\bsold\b/i,
          /\btaken\b/i,
          /\busd\b/i,
          /\b\$\d+\b/i,
        ],
        isNotAdExpressions: [
          /\bby\b/i,
          commissionRegex,
          /\bfinished\b/i,
          /\bfor\b/i,
          /\bfrom\b/i,
          /\bresult\b/i,
        ],
      },
      untaggedIsAd: true,
    },
    {
      name: {
        triggers: [/\by ?c ?h\b/i],
      },
      tags: {
        triggers: [/\bauction\b/i, /\bych\b/i],
        isAlwaysAd: true,
      },
    },
    {
      name: {
        triggers: [/\bdiscount\b/i, /\bsale\b/i],
        isAdExpressions: [
          /\$/,
          /\bbase\b/i,
          /\bclaimed\b/i,
          /\b(?:multi)?slot\b/i,
          /\boffer\b/i,
          /\bprice\b/i,
        ],
      },
    },
    {
      name: {
        triggers: [/\bprice\b/i],
        isAdExpressions: [/\blist\b/i, /\bsheet\b/i],
      },
    },
    {
      name: {
        triggers: [/\braffle\b/i],
        isAdExpressions: [/\bwinners?\b/i],
      },
    },
    {
      name: {
        triggers: [
          /\bboosty\b/i,
          /\bp[@a]treon\b/i,
          /\bsub(?:scribe)?\s?star\b/i,
        ],
        isAdExpressions: [
          /\bdiscount\b/i,
          /\bnow on\b/i,
          /\bposted to\b/i,
          /\bpreview\b/i,
          /\bteaser?\b/i,
        ],
      },
    },
    {
      name: {
        triggers: [/\bshop\b/i],
        isAdExpressions: [/\bprint\b/i],
      },
    },
    {
      name: {
        triggers: [/\b(?:multi)?slots?\b/i],
        isAdExpressions: [/\bavailable\b/i, /\bopen\b/i, /\bsketch\b/i],
      },
    },
    {
      name: {
        triggers: [
          /\bclosed\b/i,
          /\bopen\b/i,
          /\bpoll\b/i,
          /\bpreview\b/i,
          /\brem\b/i,
          /\bsold\b/i,
          /\bteaser\b/i,
          /\bwip\b/i,
        ],
      },
      tags: {
        triggers: [/\bteaser\b/i],
      },
    },
  ];

  /**
   * @param {AdvertisementCheckResult} result
   * @param {string} text
   * @param {AdvertisementCheckSpecPart} spec
   * @returns {AdvertisementLevel | null}
   */
  function checkAgainstAdvertisementSpec(result, text, spec) {
    /** @type {AdvertisementLevel | null} */
    let level = null;

    let log = "";

    for (const regex of spec.triggers) {
      if (regex.test(text)) {
        log += "Trigger: " + regex;
        level = "ambiguous";
        break;
      }
    }

    if (level === "ambiguous") {
      if (spec.isAlwaysAd) {
        log += "\nIs always an ad.";
        level = "advertisement";
      } else if (spec.isAdExpressions) {
        for (const regex of spec.isAdExpressions) {
          if (regex.test(text)) {
            log += "\nAdExpression: " + regex;
            level = "advertisement";
            break;
          }
        }
      }
    }

    if (level !== null && spec.isNotAdExpressions) {
      for (const regex of spec.isNotAdExpressions) {
        if (regex.test(text)) {
          log += "\nIsNotAdExpression: " + regex;
          level = "notAdvertisement";
          break;
        }
      }
    }

    if (log) {
      result.addToLog(log);
    }

    return level;
  }

  /**
   * @param {string} submissionName
   * @param {string} tags
   * @returns {AdvertisementCheckResult}
   */
  function checkAgainstAdvertisementSpecs(submissionName, tags) {
    const isUntagged = tags === "";

    /** @type {AdvertisementCheckResult} */
    const result = new AdvertisementCheckResult(!isUntagged);

    for (const spec of advertisementCheckSpecs) {
      const nameResult = checkAgainstAdvertisementSpec(result, submissionName, {
        triggers: [],
        ...spec.name,
      });

      /** @type {AdvertisementLevel} */
      let tagsResult = null;
      if (isUntagged) {
        if (
          ["advertisement", "ambiguous"].includes(nameResult) &&
          spec.untaggedIsAd
        ) {
          tagsResult = "advertisement";
        }
      } else {
        tagsResult = checkAgainstAdvertisementSpec(result, tags, {
          triggers: [],
          ...spec.tags,
        });
      }

      if (spec.name && spec.tags && (!nameResult || !tagsResult)) {
        continue;
      }

      result.nameResult = nameResult;
      result.tagsResult = tagsResult;
    }

    return result;
  }

  /**
   * @returns {[number, number, number]}
   */
  function iterateLabels() {
    const figures = Array.from(
      document.querySelectorAll("section.gallery figure"),
    );
    let advertisements = 0;
    let ambiguous = 0;
    let untagged = 0;

    for (const figure of figures) {
      const figcaption = figure.querySelector("figcaption");
      const checkbox = figure.querySelector("input");
      const nameAnchor = figcaption.querySelector("a");
      const submissionName = nameAnchor.textContent;
      const tags = figure.querySelector("img").dataset.tags;

      const result = checkAgainstAdvertisementSpecs(submissionName, tags);
      const decisionLog = result.decisionLog;

      if (decisionLog.length) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Log";
        button.addEventListener("click", () => console.log(result.decisionLog));
        checkbox.parentElement.appendChild(button);
      }

      switch (result.result) {
        case "advertisement":
          figure.classList.add("advertisement");
          checkbox.checked = true;
          advertisements += 1;
          break;

        case "ambiguous":
          figure.classList.add("maybe-advertisement");
          ambiguous += 1;
          break;
      }

      if (!result.isTagged) {
        figcaption.classList.add("not-tagged");
        untagged += 1;
      }
    }

    return [advertisements, ambiguous, untagged];
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(
    `
figure.advertisement { outline: orange 3px solid; }
figure.maybe-advertisement { outline: yellow 3px solid; }
figcaption.not-tagged input { outline: orange 3px solid; }
figcaption button { line-height: 1; margin-left: 1rem; padding: 0; }
`.trim(),
  );
  document.adoptedStyleSheets.push(sheet);

  const sectionHeader = document.querySelector(".section-header");

  const advertisementsSelectMessage = document.createElement("p");
  advertisementsSelectMessage.textContent =
    "Checking for advertisement submissions…";
  sectionHeader.appendChild(advertisementsSelectMessage);

  const [advertisements, ambiguous, untagged] = iterateLabels();

  const message = `Selected ${advertisements} advertisement and ${ambiguous} ambiguous submissions. ${untagged} submissions were not tagged.`;

  advertisementsSelectMessage.textContent = message;
})();
