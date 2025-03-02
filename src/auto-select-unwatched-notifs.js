// ==UserScript==
// @name         Auto-select unwatched
// @namespace    https://github.com/f1r3w4rr10r/fa-utils
// @version      1.0.0
// @description  This automatically selects submission notifications from unwatched users on the current FurAffinity notifications page.
// @author       f1r3w4rr10r
// @match        https://www.furaffinity.net/msg/submissions/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @license      MIT
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  /**
   * @param {string} url
   * @returns {Promise<[string[], string | null]>}
   */
  async function getWatchedFromPage(url) {
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(
        `Could not get watchlist: ${result.status} ${result.statusText} ${url}`,
      );
    }
    const doc = new DOMParser().parseFromString(
      await result.text(),
      "text/html",
    );

    const userLinks = Array.from(doc.querySelectorAll("a")).map((a) => a.href);

    const nextForm = doc.querySelector(".floatright form");
    if (!(nextForm instanceof HTMLFormElement))
      throw new Error(`Could not find the next page form on: ${url}`);

    const nextUrl = nextForm.action;

    return [userLinks, nextUrl === url ? null : nextUrl];
  }

  /**
   * @returns {Promise<string[]>}
   */
  async function getWatched() {
    const watchList = [];

    const userAnchor = document.querySelector("article.mobile-menu a");
    if (!(userAnchor instanceof HTMLAnchorElement))
      throw new Error("Could not get the user anchor.");

    const userName = userAnchor.href.match(/user\/(.+?)$/)[1];

    let nextUrl = `https://www.furaffinity.net/watchlist/by/${userName}/`;

    while (nextUrl !== null) {
      let pageWatchList = [];
      [pageWatchList, nextUrl] = await getWatchedFromPage(nextUrl);
      watchList.push(...pageWatchList);
    }

    return watchList;
  }

  /**
   * @param {string[]} watched
   * @returns {Promise<number>}
   */
  async function iterateLabels(watched) {
    const figures = Array.from(
      document.querySelectorAll("section.gallery figure"),
    );
    let selected = 0;

    for (const figure of figures) {
      const userAnchor = figure.querySelector(
        "figcaption label p:last-child a",
      );
      if (!(userAnchor instanceof HTMLAnchorElement))
        throw new Error("Could not find a user anchor.");

      const userLink = userAnchor.href;

      if (watched.includes(userLink)) continue;

      figure.classList.add("unwatched");
      figure.querySelector("input").checked = true;
      selected += 1;
    }

    return selected;
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync("figure.unwatched { outline: red 3px solid; }");
  document.adoptedStyleSheets.push(sheet);

  const sectionHeader = document.querySelector(".section-header");

  const unwatchedSelectMessage = document.createElement("p");
  unwatchedSelectMessage.textContent =
    "Checking for submissions from unwatched users…";
  sectionHeader.appendChild(unwatchedSelectMessage);

  const watched = await getWatched();

  const selected = await iterateLabels(watched);

  const message = `Selected ${selected} unwatched submissions.`;

  unwatchedSelectMessage.textContent = message;
})();
