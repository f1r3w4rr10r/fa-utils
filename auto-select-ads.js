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
   * @property {string[]} mustHaveKeywords
   * @property {boolean} [definitelyAdvertisement]
   * @property {string[]} [definitelyAdvertisementKeywords]
   * @property {string[]} [definitelyNotAdvertisementKeywords]
   */

  /**
   * @typedef {"advertisement" | "ambiguous" | "notAdvertisement"} AdvertisementCheckResult
   */

  /** @type {AdvertisementCheckSpec[]} */
  const advertisementCheckSpecs = [
    {
      mustHaveKeywords: ["adopt"],
      definitelyAdvertisement: true,
    },
    {
      mustHaveKeywords: ["reminder"],
      definitelyAdvertisement: true,
    },
    {
      mustHaveKeywords: ["streaming"],
      definitelyAdvertisement: true,
    },
    {
      mustHaveKeywords: ["commission", "comm"],
      definitelyAdvertisementKeywords: ["open", "closed"],
      definitelyNotAdvertisementKeywords: ["for"],
    },
    {
      mustHaveKeywords: ["stream"],
      definitelyAdvertisementKeywords: ["live", "online"],
    },
    {
      mustHaveKeywords: ["ych"],
      definitelyAdvertisementKeywords: [
        "auction",
        "closed",
        "multislot",
        "open",
        "remind",
        "rmd",
      ],
      definitelyNotAdvertisementKeywords: [
        "commission",
        "finished",
        "from",
        "result",
      ],
    },
    {
      mustHaveKeywords: ["rem"],
    },
    {
      mustHaveKeywords: ["open"],
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

    for (const keyword of spec.mustHaveKeywords) {
      if (name.includes(keyword)) {
        result = "ambiguous";
        break;
      }
    }

    if (result === "ambiguous") {
      if (spec.definitelyAdvertisement) result = "advertisement";
      else if (spec.definitelyAdvertisementKeywords) {
        for (const keyword of spec.definitelyAdvertisementKeywords) {
          if (name.includes(keyword)) {
            result = "advertisement";
            break;
          }
        }
      }
    }

    if (result !== null && spec.definitelyNotAdvertisementKeywords) {
      for (const keyword of spec.definitelyNotAdvertisementKeywords) {
        if (name.includes(keyword)) {
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
    const name = submissionName.toLowerCase();
    let atLeastOneAmbiguous = false;

    for (const spec of advertisementCheckSpecs) {
      const result = checkAgainstAdvertisementSpec(name, spec);
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
