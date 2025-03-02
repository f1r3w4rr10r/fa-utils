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
   * @typedef {Object} AdvertisementCheckSpec
   * @property {RegExp[]} triggerExpressions - any of these trigger a closer look
   * @property {boolean} [definitelyAdvertisement]
   *     - a submission with any trigger keyword is definitely an advertisement
   * @property {RegExp[]} [definitelyAdvertisementExpressions]
   *     - a submission with any trigger keyword and any of these keywords is an
   *     advertisement
   * @property {RegExp[]} [definitelyNotAdvertisementExpressions]
   *     - an already checked submission with any of these keywords is
   *     definitely not an advertisement. This overrides everything else.
   */

  /**
   * @typedef {"advertisement" | "ambiguous" | "notAdvertisement"} AdvertisementLevel
   */

  /**
   * @typedef {AdvertisementLevel | "notTagged"} TagAdvertisementLevel
   */

  class AdvertisementCheckResult {
    /**
     * @param {AdvertisementLevel | null} nameResult
     * @param {TagAdvertisementLevel | null} tagsResult
     */
    constructor(nameResult, tagsResult) {
      this.#nameResult = nameResult;
      this.#tagsResult = tagsResult;
    }

    /** @type {AdvertisementLevel | null} */
    #nameResult = null;

    /** @type {TagAdvertisementLevel | null} */
    #tagsResult = null;

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
      this.#nameResult = this.#coalesceNameResultLevel(this.#nameResult, value);
    }

    /**
     * @returns {TagAdvertisementLevel | null}
     */
    get tagsResult() {
      return this.#tagsResult;
    }

    /**
     * @param {TagAdvertisementLevel | null} value
     */
    set tagsResult(value) {
      this.#tagsResult = this.#coalesceTagsResultLevel(this.#tagsResult, value);
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
     * @returns {"notTagged" | null}
     */
    get tagStatus() {
      return this.#tagsResult === "notTagged" ? "notTagged" : null;
    }

    /**
     * @param {AdvertisementLevel | null} current
     * @param {AdvertisementLevel | null} newValue
     * @returns {AdvertisementLevel | null}
     */
    #coalesceNameResultLevel(current, newValue) {
      if (current === "notAdvertisement") {
        return "notAdvertisement";
      }

      if (current === "advertisement" && newValue !== "ambiguous") {
        return newValue;
      }

      if (current !== null && newValue === null) {
        return current;
      }

      return newValue;
    }

    /**
     * @param {TagAdvertisementLevel | null} current
     * @param {TagAdvertisementLevel | null} newValue
     * @returns {TagAdvertisementLevel | null}
     */
    #coalesceTagsResultLevel(current, newValue) {
      if (current === "notTagged" || newValue === "notTagged") {
        return current;
      }

      return this.#coalesceNameResultLevel(current, newValue);
    }
  }

  /** @type {AdvertisementCheckSpec[]} */
  const advertisementCheckSpecs = [
    {
      triggerExpressions: [
        /\badopt(?:able)?s?\b/i,
        /\bpicarto\.tv\b/i,
        /\breminder+\b/i,
        /\bstreaming\b/i,
        /^REM$/,
      ],
      definitelyAdvertisement: true,
    },
    {
      triggerExpressions: [
        /\bauction\b/i,
        /(?:^|\W)[cс]omm(?:ission)?s?\b/i, // The second "c" is a kyrillic "s"
        /\bwing.its?\b/i,
      ],
      definitelyAdvertisementExpressions: [
        /\bclosed\b/i,
        /\bhalfbody\b/i,
        /\bopen(?:ed)?\b/i,
        /\bsale\b/i,
        /\bslots?\b/i,
      ],
      definitelyNotAdvertisementExpressions: [/\bfor\b/i],
    },
    {
      triggerExpressions: [/\b(?:live)?stream\b/i],
      definitelyAdvertisementExpressions: [
        /\blive\b/i,
        /\boffline\b/i,
        /\bonline\b/i,
        /\bpreorders?\b/i,
        /\bslots?\b/i,
        /\bup\b/i,
      ],
    },
    {
      triggerExpressions: [/y ?c ?h/i],
      definitelyAdvertisementExpressions: [
        /\bauction\b/i,
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
      ],
      definitelyNotAdvertisementExpressions: [
        /\bby\b/i,
        /\bcommission\b/i,
        /\bfinished\b/i,
        /\bfor\b/i,
        /\bfrom\b/i,
        /\bresult\b/i,
      ],
    },
    {
      triggerExpressions: [/\bdiscount\b/i, /\bsale\b/i],
      definitelyAdvertisementExpressions: [
        /\$/,
        /\bbase\b/i,
        /\bclaimed\b/i,
        /\b(?:multi)?slot\b/i,
        /\bprice\b/i,
      ],
    },
    {
      triggerExpressions: [/\bprice\b/i],
      definitelyAdvertisementExpressions: [/\blist\b/i, /\bsheet\b/i],
    },
    {
      triggerExpressions: [/\braffle\b/i],
      definitelyAdvertisementExpressions: [/\bwinners?\b/i],
    },
    {
      triggerExpressions: [
        /\bboosty\b/i,
        /\bpatreon\b/i,
        /\bsub(?:scribe)?\s?star\b/i,
      ],
      definitelyAdvertisementExpressions: [/\bpreview\b/i, /\bteaser\b/i],
    },
    {
      triggerExpressions: [/\bshop\b/i],
      definitelyAdvertisementExpressions: [/\bprint\b/i],
    },
    {
      triggerExpressions: [/\b(?:multi)?slots?\b/i],
      definitelyAdvertisementExpressions: [
        /\bavailable\b/i,
        /\bopen\b/i,
        /\bsketch\b/i,
      ],
    },
    {
      triggerExpressions: [
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
  ];

  /**
   * @param {string} text
   * @param {AdvertisementCheckSpec} spec
   * @returns {AdvertisementLevel | null}
   */
  function checkAgainstAdvertisementSpec(text, spec) {
    /** @type {AdvertisementLevel | null} */
    let result = null;

    for (const regex of spec.triggerExpressions) {
      if (regex.test(text)) {
        result = "ambiguous";
        break;
      }
    }

    if (result === "ambiguous") {
      if (spec.definitelyAdvertisement) result = "advertisement";
      else if (spec.definitelyAdvertisementExpressions) {
        for (const regex of spec.definitelyAdvertisementExpressions) {
          if (regex.test(text)) {
            result = "advertisement";
            break;
          }
        }
      }
    }

    if (result !== null && spec.definitelyNotAdvertisementExpressions) {
      for (const regex of spec.definitelyNotAdvertisementExpressions) {
        if (regex.test(text)) {
          result = "notAdvertisement";
          break;
        }
      }
    }

    return result;
  }

  /**
   * @param {string} submissionName
   * @param {string} tags
   * @returns {AdvertisementCheckResult}
   */
  function checkAgainstAdvertisementSpecs(submissionName, tags) {
    /** @type {AdvertisementCheckResult} */
    const result = new AdvertisementCheckResult(
      null,
      tags === "" ? "notTagged" : null,
    );

    for (const spec of advertisementCheckSpecs) {
      result.nameResult = checkAgainstAdvertisementSpec(submissionName, spec);
      result.tagsResult =
        result.tagsResult === "notTagged"
          ? "notTagged"
          : checkAgainstAdvertisementSpec(tags, spec);
    }

    return result;
  }

  /**
   * @returns {[number, number]}
   */
  function iterateLabels() {
    const figures = Array.from(
      document.querySelectorAll("section.gallery figure"),
    );
    let advertisements = 0;
    let ambiguous = 0;

    for (const figure of figures) {
      const nameAnchor = figure.querySelector("figcaption a");
      const submissionName = nameAnchor.textContent;
      const tags = figure.querySelector("img").dataset.tags;

      const result = checkAgainstAdvertisementSpecs(submissionName, tags);

      switch (result.result) {
        case "advertisement":
          figure.classList.add("advertisement");
          figure.querySelector("input").checked = true;
          advertisements += 1;
          break;

        case "ambiguous":
          figure.classList.add("maybe-advertisement");
          ambiguous += 1;
          break;
      }

      if (result.tagStatus === "notTagged") {
        nameAnchor.classList.add("not-tagged");
      }
    }

    return [advertisements, ambiguous];
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(
    `
a.not-tagged { color: orange; }
figure.advertisement { outline: orange 3px solid; }
figure.maybe-advertisement { outline: yellow 3px solid; }
`.trim(),
  );
  document.adoptedStyleSheets.push(sheet);

  const sectionHeader = document.querySelector(".section-header");

  const advertisementsSelectMessage = document.createElement("p");
  advertisementsSelectMessage.textContent =
    "Checking for advertisement submissions…";
  sectionHeader.appendChild(advertisementsSelectMessage);

  const [advertisements, ambiguous] = iterateLabels();

  const message = `Selected ${advertisements} advertisement and ${ambiguous} ambiguous submissions.`;

  advertisementsSelectMessage.textContent = message;
})();
