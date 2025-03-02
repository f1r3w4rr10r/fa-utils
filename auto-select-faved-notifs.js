// ==UserScript==
// @name         Auto-select already faved submission notifications on FurAffinity
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This automatically selects submission notifications, that are already faved.
// @author       You
// @match        https://www.furaffinity.net/msg/submissions/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(async function () {
  /**
   * @returns {NodeListOf<HTMLLabelElement>}
   */
  function getLabels() {
    return document.querySelectorAll("section.gallery label");
  }

  /**
   * @param {HTMLElement} label
   * @returns {string}
   */
  function getSubmissionLink(label) {
    return label.querySelector("a").href;
  }

  /**
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async function checkIfFaved(url) {
    console.debug("Checking if submission is faved: ", url);

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

    const favUrl =
      doc.querySelector(".favorite-nav a:nth-child(2)")?.href ?? "";

    const faved = /\bunfav\b/.match(favUrl);

    console.debug("Submission is faved: ", url, faved);

    return faved;
  }

  /**
   * @param {HTMLElement} label
   */
  function outlineSubmission(label) {
    const figure = label.parentElement.parentElement;
    if (!(figure instanceof HTMLElement)) return;

    figure.style.outline = "green 3px solid";
  }

  /**
   * @param {HTMLElement} label
   * @returns {void}
   */
  function selectSubmission(label) {
    label.querySelector("input").checked = true;
  }

  /**
   * @param {NodeListOf<HTMLElement>} labels
   * @yields {Promise<boolean>}
   */
  async function* iterateLabels(labels) {
    for (const label of labels) {
      const isFaved = await checkIfFaved(getSubmissionLink(label));
      if (isFaved) {
        outlineSubmission(label);
        selectSubmission(label);
      }
      yield isFaved;
    }
  }

  const sectionHeader = document.querySelector(".section-header");

  const baseMessage = "Selecting faved submissions…";

  const outlineFavedMessage = document.createElement("p");
  outlineFavedMessage.textContent = baseMessage;
  sectionHeader.appendChild(outlineFavedMessage);

  let checked = 0;
  let faved = 0;

  for await (const isFaved of iterateLabels(getLabels())) {
    checked += 1;
    if (isFaved) faved += 1;

    outlineFavedMessage.textContent = `${baseMessage} | Checked: ${checked} | Faved: ${faved}`;
  }

  outlineFavedMessage.textContent = `Selected ${faved} faved submissions.`;
})();
