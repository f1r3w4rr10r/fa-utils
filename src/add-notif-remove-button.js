// ==UserScript==
// @name         Add a "Remove Notification" button to submissions
// @namespace    https://github.com/f1r3w4rr10r/fa-utils
// @version      1.0.0
// @description  This adds a "Remove Notification" button next to the "+Fav" buttons.
// @author       f1r3w4rr10r
// @match        https://www.furaffinity.net/view/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @license      MIT
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  const upperFavLink = document.querySelector('.fav > [href^="/fav/"]');
  if (!(upperFavLink instanceof HTMLAnchorElement))
    throw new Error(
      "'upperFavLink' was not an instance of 'HTMLAnchorElement'.",
    );

  const href = upperFavLink.href;
  const urlMatch = href.match(/\/fav\/(\d+)\//);
  if (!urlMatch) {
    console.error("The fav URL did not match.", href);
    throw new Error("The fav URL did not match.");
  }

  const submissionId = urlMatch[1];
  if (!submissionId) throw new Error("Could not extract a submission ID.");

  const lowerFavLink = document.querySelector(
    '.favorite-nav > [href^="/fav/"]',
  );
  if (!(lowerFavLink instanceof HTMLAnchorElement))
    throw new Error(
      "'lowerFavLink' was not an instance of 'HTMLAnchorElement'.",
    );

  /**
   * @param {string} id the submission ID
   * @returns {HTMLButtonElement}
   */
  function createNotifRemoveButton(id) {
    const button = document.createElement("button");
    button.textContent = "- S";
    button.addEventListener("click", async () => {
      button.textContent = "⟳";

      const result = await fetch("/msg/submissions/old@24/", {
        method: "POST",
        body: new URLSearchParams({
          "messagecenter-action": "remove_checked",
          "submissions[]": id,
        }),
        redirect: "manual",
      });

      if (result.type !== "opaqueredirect") {
        console.error("Could not remove the submission notification.", result);
        button.textContent = "☓";
      }

      button.textContent = "✓";
    });

    return button;
  }

  const upperButton = createNotifRemoveButton(submissionId);
  upperFavLink.parentElement?.insertAdjacentElement("beforebegin", upperButton);

  const lowerButton = createNotifRemoveButton(submissionId);
  lowerFavLink.insertAdjacentElement("beforebegin", lowerButton);
})();
