// ==UserScript==
// @name         Outline already faved
// @namespace    https://github.com/f1r3w4rr10r/fa-utils
// @version      1.0.0
// @description  This automatically outlines submissions, that are already faved.
// @author       f1r3w4rr10r
// @match        https://www.furaffinity.net/gallery/*
// @match        https://www.furaffinity.net/scraps/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @license      MIT
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  /**
   * @param {Element} figure
   * @returns {Promise<boolean>}
   */
  async function checkIfFaved(figure) {
    const url = figure.querySelector("a").href;
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(
        `Could not get faved status: ${result.status} ${result.statusText} ${url}`,
      );
    }

    const doc = new DOMParser().parseFromString(
      await result.text(),
      "text/html",
    );

    const firstButton = doc.querySelector(".favorite-nav a:first-child");
    const secondButton = doc.querySelector(".favorite-nav a:nth-child(2)");
    if (
      !(firstButton instanceof HTMLAnchorElement) ||
      !(secondButton instanceof HTMLAnchorElement)
    )
      throw new Error(`One of the buttons could not be found on: ${url}`);

    if (/\bunfav\b/.test(firstButton.href)) return true;
    if (/\bunfav\b/.test(secondButton.href)) return true;
    return false;
  }

  /**
   * @yields {Promise<boolean>}
   */
  async function* iterateFigures() {
    const figures = Array.from(
      document.querySelectorAll("section.gallery figure"),
    );

    for (const figure of figures) {
      const isFaved = await checkIfFaved(figure);
      if (isFaved) figure.classList.add("faved");
      yield isFaved;
    }
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync("figure.faved { outline: green 3px solid; }");
  document.adoptedStyleSheets.push(sheet);

  const sectionHeader = document.querySelector(".submission-list");

  const baseMessage = "Selecting faved submissions…";

  const messagePara = document.createElement("p");
  messagePara.textContent = baseMessage;
  sectionHeader.prepend(messagePara);

  let checked = 0;
  let faved = 0;

  for await (const isFaved of iterateFigures()) {
    if (isFaved) faved += 1;
    checked += 1;

    messagePara.textContent = `${baseMessage} ${faved}/${checked}`;
  }

  messagePara.textContent = `Selected ${faved}/${checked} faved submissions.`;
})();
