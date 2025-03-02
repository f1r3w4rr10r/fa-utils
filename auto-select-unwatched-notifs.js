// ==UserScript==
// @name         Auto-select submission notifications from unwatched users on FurAffinity
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This automatically selects submission notifications from unwatched users on the current FurAffinity notifications page.
// @author       You
// @match        https://www.furaffinity.net/msg/submissions/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  /**
   * @param {string} url
   * @returns {Promise<[string[], string | null]>}
   */
  async function getWatchedFromPage(url) {
    console.debug("Getting watched users from: ", url);

    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(
        `Could not get watchlist: ${result.status} ${result.statusText} ${url}`
      );
    }
    const doc = new DOMParser().parseFromString(
      await result.text(),
      "text/html"
    );

    const userLinks = Array.from(doc.querySelectorAll("a")).map((a) => a.href);

    const nextUrl = doc.querySelector(".floatright form").action;

    console.debug("Got watched users from: ", url, "Next: ", nextUrl);

    return [userLinks, nextUrl === url ? null : nextUrl];
  }

  /**
   * @returns {Promise<string[]>}
   */
  async function getWatched() {
    console.debug("Getting the list of watched users.");

    const watchList = [];

    const userAnchor = document.querySelector("article.mobile-menu a");
    const userName = userAnchor.href.match(/user\/(.+?)$/)[1];

    let nextUrl = `https://www.furaffinity.net/watchlist/by/${userName}/`;

    while (nextUrl !== null) {
      let pageWatchList = [];
      [pageWatchList, nextUrl] = await getWatchedFromPage(nextUrl);
      watchList.push(...pageWatchList);
    }

    console.debug("Got the list of watched users.");

    return watchList;
  }

  /**
   * @param {HTMLElement} label
   * @returns {string}
   */
  function getUserLink(label) {
    return label.querySelector("p:last-child > a").href;
  }

  /**
   * @param {HTMLElement} label
   * @returns {void}
   */
  function selectSubmission(label) {
    label.querySelector("input").checked = true;
  }

  /**
   * @returns {NodeListOf<HTMLLabelElement>}
   */
  function getLabels() {
    return document.querySelectorAll("section.gallery label");
  }

  /**
   * @param {NodeListOf<HTMLElement>} labels
   * @param {string[]} watched
   * @returns {Promise<CounterCache>}
   */
  async function iterateLabels(labels, watched) {
    let selected = 0;

    for (const label of labels) {
      const userLink = getUserLink(label);

      if (watched.includes(userLink)) {
        console.debug("Watched and not checked: ", userLink);
        continue;
      }

      console.debug("Not watched and checked: ", userLink);
      selectSubmission(label);
      selected += 1;
    }

    return selected;
  }

  const watched = await getWatched();

  console.log("Currently watching: ", watched.length);

  const selected = await iterateLabels(getLabels(), watched);

  const message = `Selected ${selected} unwatched submissions.`;

  console.log(message);

  document.querySelector(".section-header h2").textContent += ` | ${message}`;
})();
