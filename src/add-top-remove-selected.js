// ==UserScript==
// @name         Add a "Remove Selected" button
// @namespace    https://github.com/f1r3w4rr10r/fa-utils
// @version      1.0.0
// @description  This adds a second "Remove Selected" button to the top of the submission notifications pages.
// @author       f1r3w4rr10r
// @match        https://www.furaffinity.net/msg/submissions/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  const topButtonsContainer = document.querySelector(
    "section.gallery-section .aligncenter",
  );

  const button = document.createElement("button");
  button.className = "standard remove-checked";
  button.type = "submit";
  button.name = "messagecenter-action";
  button.value = "remove_checked";
  button.textContent = "Remove Selected";
  topButtonsContainer.appendChild(button);
})();
