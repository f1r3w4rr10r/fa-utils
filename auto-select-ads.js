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
   * @typedef {"advertisement" | "ambiguous" | "notAdvertisement"} AdvertisementCheckResult
   */

  /** @type {AdvertisementCheckSpec[]} */
  const advertisementCheckSpecs = [
    {
      triggerExpressions: [
        /\badopt(?:able)?\b/i,
        /\bpicarto\.tv\b/i,
        /\breminder\b/i,
        /\bstreaming\b/i,
      ],
      definitelyAdvertisement: true,
    },
    {
      triggerExpressions: [/\bcomm(?:ission)?\b/i],
      definitelyAdvertisementExpressions: [/\bopen\b/i, /\bclosed\b/i],
      definitelyNotAdvertisementExpressions: [/\bfor\b/i],
    },
    {
      triggerExpressions: [/\bstream\b/i],
      definitelyAdvertisementExpressions: [/\blive\b/i, /\bonline\b/i],
    },
    {
      triggerExpressions: [/\bych\b/i],
      definitelyAdvertisementExpressions: [
        /\bauction\b/i,
        /\bclosed\b/i,
        /\bmultislot\b/i,
        /\bopen\b/i,
        /\bremind(?:er)?\b/i,
        /\brmd\b/i,
      ],
      definitelyNotAdvertisementExpressions: [
        /\bcommission\b/i,
        /\bfinished\b/i,
        /\bfor\b/i,
        /\bfrom\b/i,
        /\bresult\b/i,
      ],
    },
    {
      triggerExpressions: [/\bsale\b/i],
      definitelyAdvertisementExpressions: [/\$/, /\bprice\b/i],
    },
    {
      triggerExpressions: [/\bopen\b/i, /\braffle\b/i, /\brem\b/i],
    },
  ];

  /**
   * @param {string} name
   * @param {AdvertisementCheckSpec} spec
   * @returns {AdvertisementCheckResult | null}
   */
  function checkAgainstAdvertisementSpec(name, spec) {
    /** @type {AdvertisementCheckResult | null} */
    let result = null;

    for (const regex of spec.triggerExpressions) {
      if (regex.test(name)) {
        result = "ambiguous";
        break;
      }
    }

    if (result === "ambiguous") {
      if (spec.definitelyAdvertisement) result = "advertisement";
      else if (spec.definitelyAdvertisementExpressions) {
        for (const regex of spec.definitelyAdvertisementExpressions) {
          if (regex.test(name)) {
            result = "advertisement";
            break;
          }
        }
      }
    }

    if (result !== null && spec.definitelyNotAdvertisementExpressions) {
      for (const regex of spec.definitelyNotAdvertisementExpressions) {
        if (regex.test(name)) {
          result = "notAdvertisement";
          break;
        }
      }
    }

    return result;
  }

  /**
   * @param {string} submissionName
   * @returns {AdvertisementCheckResult}
   */
  function checkAgainstAdvertisementSpecs(submissionName) {
    let atLeastOneAmbiguous = false;

    for (const spec of advertisementCheckSpecs) {
      const result = checkAgainstAdvertisementSpec(submissionName, spec);
      if (result === null) continue;

      if (result !== "ambiguous") return result;

      atLeastOneAmbiguous = true;
    }

    return atLeastOneAmbiguous ? "ambiguous" : "notAdvertisement";
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
      const submissionName = figure.querySelector("figcaption a").textContent;

      const result = checkAgainstAdvertisementSpecs(submissionName);
      switch (result) {
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
    }

    return [advertisements, ambiguous];
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(
    `
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
