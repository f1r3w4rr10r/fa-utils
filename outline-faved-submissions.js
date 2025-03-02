// ==UserScript==
// @name         Outline already faved submissions on FurAffinity
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This automatically outlines submissions, that are already faved.
// @author       You
// @match        https://www.furaffinity.net/gallery/*
// @match        https://www.furaffinity.net/scraps/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  /**
   * @param {HTMLElement} figure
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

    if (/\bunfav\b/.match(firstButton?.href ?? "")) return true;
    if (/\bunfav\b/.match(secondButton?.href ?? "")) return true;
    return false;
  }

  /**
   * @yields {Promise<boolean>}
   */
  async function* iterateFigures() {
    for (const figure of document.querySelectorAll("section.gallery figure")) {
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
