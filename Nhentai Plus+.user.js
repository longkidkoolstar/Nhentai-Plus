// ==UserScript==
// @name         Nhentai Plus+
// @namespace    github.com/longkidkoolstar
// @version      8.1.0
// @description  Enhances the functionality of Nhentai website.
// @author       longkidkoolstar
// @match        https://nhentai.net/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js
// @icon         https://i.imgur.com/AOs1HMS.png
// @license      MIT
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @grant        GM.deleteValue
// @grant        GM.openInTab
// @grant        GM.listValues
// @grant        GM.xmlHttpRequest
// ==/UserScript==


//----------------------- **Change Log** ------------------------------------------

const CURRENT_VERSION = "8.1.0";
const CHANGELOG_URL = "https://api.jsonstorage.net/v1/json/d206ce58-9543-48db-a5e4-997cfc745ef3/a5efadba-2c0f-4962-8c17-70f2e3f5e5fc";

(async () => {
  const lastSeenVersion = await GM.getValue("lastSeenVersion", "0.0.0");

  if (CURRENT_VERSION !== lastSeenVersion) {
    try {
      const res = await fetch(CHANGELOG_URL);
      const changelogData = await res.json();
      const log = changelogData[CURRENT_VERSION];

      if (log) {
        const msg = `🆕 Version ${CURRENT_VERSION} (${log.date})\n\n` +
                    log.changes.map(line => `• ${line}`).join("\n");

        showChangelogPopup(msg);
      }

      await GM.setValue("lastSeenVersion", CURRENT_VERSION);
    } catch (err) {
      console.error("Error fetching or displaying changelog:", err);
    }
  }
})();

function showChangelogPopup(message) {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.bottom = "20px";
  popup.style.right = "20px";
  popup.style.maxWidth = "350px";
  popup.style.backgroundColor = "#1e1e1e";
  popup.style.color = "#fff";
  popup.style.padding = "16px";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
  popup.style.zIndex = 99999;
  popup.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  popup.style.opacity = "0";
  popup.style.transform = "translateY(20px)";
  popup.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  popup.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <strong style="font-size: 16px;">Changelog</strong>
      <button style="background: transparent; color: #aaa; border: none; cursor: pointer; font-size: 18px; line-height: 1; padding: 0;">&times;</button>
    </div>
    <pre style="white-space: pre-wrap; font-size: 13px; line-height: 1.4; margin: 0; color: #ddd;">${message}</pre>
  `;

  popup.querySelector("button").addEventListener("click", () => {
    popup.style.opacity = "0";
    popup.style.transform = "translateY(20px)";
    setTimeout(() => popup.remove(), 300);
  });

  document.body.appendChild(popup);
  
  // Trigger animation
  setTimeout(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
  }, 10);
  
  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      popup.style.opacity = "0";
      popup.style.transform = "translateY(20px)";
      setTimeout(() => popup.remove(), 300);
    }
  }, 15000);
}


//----------------------- **Change Log** ------------------------------------------

//----------------------- **Fix Menu OverFlow**----------------------------------

// Nhentai Plus+.user.js
$(document).ready(async function() {
    // Remove the 'required' attribute from the search input when must-add tags are enabled
    const searchInput = document.querySelector('form.search input[name="q"]');
    if (searchInput) {
        const mustAddTagsEnabled = await GM.getValue('mustAddTagsEnabled', false);
        const mustAddTags = (await GM.getValue('mustAddTags', [])).map(tag => tag.toLowerCase());
        if (mustAddTagsEnabled && mustAddTags.length > 0) {
            searchInput.removeAttribute('required');
        }
    }
    var styles = `
        @media (max-width: 644px) {
            nav .collapse.open {
                max-height: 600px;
            }
        }
    `;
    $("<style>").html(styles).appendTo("head");
});
//--------------------------**Fix Menu OverFlow**------------------------------------

/**
 * Detects and removes old-format cache entries while preserving important data
 */
async function cleanupOldData() {
    console.log("Starting cleanup of old format entries...");
    const allKeys = await GM.listValues();
    let removedCount = 0;

    // Find and delete old manga_URL_ID format keys
    const oldMangaKeys = allKeys.filter(key => key.startsWith('manga_http'));
    for (const key of oldMangaKeys) {
        await GM.deleteValue(key);
        removedCount++;
    }

    // Find and handle URL to title mappings (old format bookmarks)
    for (const key of allKeys) {
        // Skip keys that are part of the new format or important lists
        if (key === 'bookmarkedPages' ||
            key === 'bookmarkedMangas' ||
            key.startsWith('manga_') ||
            key.startsWith('bookmark_manga_ids_')) {
            continue;
        }

        // Check if it's an old-style URL to title mapping
        const value = await GM.getValue(key);
        if (typeof value === 'string' &&
            (value.startsWith('Tag: ') ||
             value.startsWith('Search: ') ||
             value.startsWith('Artist: ') ||
             value.startsWith('Character: ') ||
             value.startsWith('Group: ') ||
             value.startsWith('Parody: '))) {

            // This is an old-style bookmark title, safe to remove
            await GM.deleteValue(key);
            removedCount++;
        }
    }

    // Get all stored keys
    const storedKeys = await GM.listValues();

    // Filter keys that match the old title storage format
    const oldTitleKeys = storedKeys.filter(key => key.startsWith('title_'));

    // Delete each old title key
    for (const key of oldTitleKeys) {
        await GM.deleteValue(key);
        console.log(`Deleted old title storage key: ${key}`);
        removedCount++;
    }

    console.log(`Cleanup complete! Removed ${removedCount} old format entries.`);
    return removedCount;
}

cleanupOldData();
/**
 * Detects and removes old-format cache entries while preserving important data
 */
//------------------------  **Find Similar Button**  ------------------

// Initialize maxTagsToSelect from localStorage or default to 5
let maxTagsToSelect = GM.getValue('maxTagsToSelect');
if (maxTagsToSelect === undefined) {
    maxTagsToSelect = 5;
    GM.setValue('maxTagsToSelect', maxTagsToSelect);
} else {
    maxTagsToSelect = parseInt(maxTagsToSelect); // Ensure it's parsed as an integer
}

// Array to store locked tags
const lockedTags = [];

// Function to create and insert 'Find Similar' button
async function createFindSimilarButton() {
    const findSimilarEnabled = await GM.getValue('findSimilarEnabled', true);
    if (!findSimilarEnabled) return;

    if (isNaN(maxTagsToSelect)) {
        maxTagsToSelect = await GM.getValue('maxTagsToSelect');
        if (maxTagsToSelect === undefined) {
            maxTagsToSelect = 5;
            GM.setValue('maxTagsToSelect', maxTagsToSelect);
        }
    }

    const downloadButton = document.getElementById('download');
    if (!downloadButton) {
        console.log('Download button not found.');
        return;
    }

    const findSimilarButtonHtml = `
        <a class="btn btn-primary btn-disabled tooltip find-similar">
            <i class="fas fa-search"></i>
            <span>Find Similar</span>
            <div class="top">Click to find similar hentai<i></i></div>
            <div id="lockedTagsCount">Locked tags: ${lockedTags.length}</div>
        </a>
    `;
    const findSimilarButton = $(findSimilarButtonHtml);

    // Insert 'Find Similar' button next to the download button
    // Find the "Find Alt." button
    const findAltButton = document.querySelector('a.btn.btn-primary.btn-disabled.tooltip.find-similar');

    // Insert 'Find Similar' button next to the "Find Alt." button
    if (findAltButton && downloadButton) {
        $(findAltButton).after(findSimilarButton);
    } else {
        console.log('Download button or Find Alt. button not found.');
    }

    $('#lockedTagsCount').hide();

// Nhentai Plus+.user.js (154-221)
// Handle click event for 'Find Similar' button
findSimilarButton.click(async function() {
    const tagsContainer = $('div.tag-container.field-name:contains("Tags:")');
    if (!tagsContainer.length) {
        console.log('Tags container not found.');
        return;
    }

    // Find all tag links within the container
    const tagLinks = tagsContainer.find('a.tag');

    // Update locked tags counter
    if (!tagLinks.length) {
        console.log('No tag links found.');
        return;
    }

    // Extract tag data (name and count) and assign probabilities based on count
    const tagsData = Array.from(tagLinks).map(tagLink => {
        const tagName = $(tagLink).find('.name').text().trim();
        const tagCount = parseInt($(tagLink).find('.count').text().replace('K', '')) || 0;
        const probability = Math.sqrt(tagCount); // Adjust this formula as needed
        return { name: tagName, count: tagCount, probability: probability };
    });

    // Shuffle tag data array to randomize selection
    shuffleArray(tagsData);

    const selectedTags = [];
    let numTagsSelected = 0;

    // Add locked tags to the selected tags array
    lockedTags.forEach(tag => {
        selectedTags.push(tag);
        numTagsSelected++;
    });

    tagsData.forEach(tag => {
        if (numTagsSelected < maxTagsToSelect && !lockedTags.includes(tag.name) && Math.random() < tag.probability) {
            selectedTags.push(tag.name);
            numTagsSelected++;
        }
    });

    // Join selected tag names into a search string
    const searchTags = selectedTags.join(' ');

    const findSimilarType = await GM.getValue('findSimilarType', 'immediately');
    const searchInput = $('input[name="q"]');

    if (findSimilarType === 'immediately') {
        if (searchInput.length > 0) {
            // Update search input value with selected tags
            searchInput.val(searchTags);
        } else {
            // If search input not found, create and submit a hidden form
            const hiddenSearchFormHtml = `
                <form role="search" action="/search/" method="GET" style="display: none;">
                    <input type="hidden" name="q" value="${searchTags}" />
                </form>
            `;
            const hiddenSearchForm = $(hiddenSearchFormHtml);
            $('body').append(hiddenSearchForm);
            hiddenSearchForm.submit();
        }
        // Submit the form
        $('button[type="submit"]').click();
    } else if (findSimilarType === 'input-tags') {
        if (searchInput.length > 0) {
            // Update search input value with selected tags
            searchInput.val(searchTags);
        } else {
            // If search input not found, create a hidden input
            const hiddenSearchInputHtml = `
                <input type="hidden" name="q" value="${searchTags}" />
            `;
            const hiddenSearchInput = $(hiddenSearchInputHtml);
            $('body').append(hiddenSearchInput);
        }
    }

    // Create and display the slider (only once)
    if (!$('#tagSlider').length) {
        createSlider();
    }
});

    // Handle double-click event for 'Find Similar' button
    findSimilarButton.dblclick(async function() {
        const searchTags = lockedTags.join(' ');

        const searchInput = $('input[name="q"]');
        if (searchInput.length > 0) {
            // Update search input value with locked tags only
            searchInput.val(searchTags);
        } else {
            // If search input not found, create and submit a hidden form with locked tags only
            const hiddenSearchFormHtml = `
                <form role="search" action="/search/" method="GET" style="display: none;">
                    <input type="hidden" name="q" value="${searchTags}" />
                </form>
            `;
            const hiddenSearchForm = $(hiddenSearchFormHtml);
            $('body').append(hiddenSearchForm);
            hiddenSearchForm.submit();
        }

        // Create and display the slider (only once)
        if (!$('#tagSlider').length) {
            createSlider();
        }
    });
}

// Function to create and display the slider
async function createSlider() {
    const sliderHtml = `
        <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <input type="range" min="1" max="10" value="${maxTagsToSelect}" id="tagSlider">
            <label for="tagSlider">Max Tags to Select: <span id="tagSliderValue">${maxTagsToSelect}</span></label>
        </div>
    `;
    $(document.body).append(sliderHtml);

    // Retrieve saved maxTagsToSelect value from GM storage (if available)
    const savedMaxTags = await GM.getValue('maxTagsToSelect');
    if (savedMaxTags !== undefined) {
        maxTagsToSelect = parseInt(savedMaxTags);
        $('#tagSlider').val(maxTagsToSelect);
        $('#tagSliderValue').text(maxTagsToSelect);
    }

    // Update maxTagsToSelect based on slider value and save to GM storage
    $('#tagSlider').on('input', async function() {
        maxTagsToSelect = parseInt($(this).val());
        $('#tagSliderValue').text(maxTagsToSelect);

        // Store the updated maxTagsToSelect value in GM storage
        await GM.setValue('maxTagsToSelect', maxTagsToSelect);
    });
}

// Call the function to create 'Find Similar' button
createFindSimilarButton();

function updateLockedTagsCounter() {
    const lockedTagsCount = lockedTags.length;
    const lockedTagsCounter = $('#lockedTagsCount');
    if (lockedTagsCount > 0) {
        lockedTagsCounter.text(`Locked tags: ${lockedTagsCount}`).show();
        if (lockedTagsCount > maxTagsToSelect) {
            lockedTagsCounter.css('color', 'red');
        } else {
            lockedTagsCounter.css('color', ''); // Reset color to default
        }
    } else {
        lockedTagsCounter.hide();
    }
}

// Function to toggle lock buttons based on findSimilarEnabled
async function toggleLockButtons() {
    const findSimilarEnabled = await GM.getValue('findSimilarEnabled', true);
    if (findSimilarEnabled) {
        $('span.lock-button').show();
    } else {
        $('span.lock-button').hide();
    }
}

// Event listener for locking/unlocking tags
$(document).on('click', 'span.lock-button', function(event) {
    event.stopPropagation(); // Prevent tag link click event from firing

    const tagName = $(this).prev('a.tag').find('.name').text().trim();

    if (lockedTags.includes(tagName)) {
        // Tag is already locked, unlock it
        const index = lockedTags.indexOf(tagName);
        if (index !== -1) {
            lockedTags.splice(index, 1);
        }
        $(this).html('<i class="fas fa-plus"></i>'); // Change icon to plus
        updateLockedTagsCounter();
    } else {
        // Lock the tag
        lockedTags.push(tagName);
        $(this).html('<i class="fas fa-minus"></i>'); // Change icon to minus
        updateLockedTagsCounter();
    }
});

// Add lock button next to each tag
const tagsContainer = $('div.tag-container.field-name:contains("Tags:")');
if (tagsContainer.length) {
    const tagLinks = tagsContainer.find('a.tag');
    tagLinks.each(function(index, tagLink) {
        const lockButtonHtml = `
            <span class="lock-button" data-tag-index="${index}">
                <i class="fas fa-plus"></i>
            </span>
        `;
        const lockButton = $(lockButtonHtml);
        $(tagLink).after(lockButton);
    });
}

// Initialize lock buttons visibility based on findSimilarEnabled
toggleLockButtons();

console.log('Script setup complete.');

// Function to shuffle an array (Fisher-Yates shuffle algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


//------------------------  **Find Similar Button**  ------------------

//-----------------------  **Find Alternative Manga Button**  ------------------


// Adds a button to the page that allows the user to find alternative manga to the current one.
// Checks if the feature is enabled in the settings before appending the button.

async function addFindAltButton() {
    const findAltmangaEnabled = await GM.getValue('findAltmangaEnabled', true);
    if (!findAltmangaEnabled) return;

    // Get the download button
    const downloadButton = document.getElementById('download');
    if (!downloadButton) {
        console.log('Download button not found.');
        return;
    }

    const copyTitleButtonHtml = `
        <a class="btn btn-primary btn-disabled tooltip find-similar">
            <i class="fas fa-code-branch"></i>
            <span>Find Alt.</span>
            <div class="top">Click to find alternative manga to this one<i></i></div>
        </a>
    `;
    const copyTitleButton = $(copyTitleButtonHtml);

    // Handle click event for the button
    copyTitleButton.click(function() {
        // Get the title element
        const titleElement = $('h1.title');
        if (!titleElement.length) {
            console.log('Title element not found.');
            return;
        }

        // Extract the text content from the pretty class if it exists
        let titleText;
        const prettyElement = titleElement.find('.pretty');
        if (prettyElement.length) {
            titleText = prettyElement.text();
        } else {
            titleText = titleElement.text();
        }

        // Remove text inside square brackets [], parentheses (), 'Ch.', 'ch.', 'Vol.', 'vol.', and all Chinese and Japanese characters
        const cleanedTitleText = titleText.replace(/[\[\]\(\)]|Ch\.|ch\.|Vol\.|vol\.|Ep\.|Ep|ep\.|ep|\|[\u3002\uFF01-\uFF5E\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]|(?<!\w)-(?!\w)|\d+/g, '').trim();

        // Find the search input
        const searchInput = $('input[name="q"]');
        if (searchInput.length > 0) {
            // Update search input value with cleaned title text
            searchInput.val(cleanedTitleText);
            // Click the search button
            const searchButton = $('button[type="submit"]');
            if (searchButton.length) {
                searchButton.click();
            }
        } else {
            console.log('Search input not found.');
        }
    });

    // Insert 'Find Similar' button next to the download button
    $(downloadButton).after(copyTitleButton);
}
// Call the function to add the Copy Title button
addFindAltButton();

//------------------------  **Find Alternative Manga Button**  ------------------

//------------------------  **Find Alternative Manga Button(Thumbnail Version)**  ------------------

(async function() {
    const findAltMangaThumbnailEnabled = await GM.getValue('findAltMangaThumbnailEnabled', true); // Default to true if not set
    if (!findAltMangaThumbnailEnabled) return; // Exit if the feature is not enabled

    const flagEn = "https://i.imgur.com/vSnHmmi.gif";
    const flagJp = "https://i.imgur.com/GlArpuS.gif";
    const flagCh = "https://i.imgur.com/7B55DYm.gif";
    const non_english_fade_opacity = 0.3;
    const partially_fade_all_non_english = true;
    const mark_as_read_system_enabled = true;
    const marked_as_read_fade_opacity = 0.3;
    const auto_group_on_page_comics = true;
    const version_grouping_filter_brackets = false;

    let MARArray = [];
    GM.getValue("MARArray", "[]").then((value) => {
        if (typeof value === 'string') {
            MARArray = JSON.parse(value);
        }

        GM.addStyle(`
            .overlayFlag {
                position: absolute;
                display: inline-block;
                top: 3px;
                left: 3px;
                z-index: 3;
                width: 18px;
                height: 12px;
            }
            .numOfVersions {
                border-radius: 10px;
                padding: 5px 10px;
                position: absolute;
                background-color: rgba(0,0,0,.7);
                color: rgba(255,255,255,.8);
                top: 7.5px;
                left: 105px;
                font-size: 12px;
                font-weight: 900;
                opacity: 1;
                width: 40px;
                z-index: 2;
                display: none;
            }
            .findVersionButton {
                border-radius: 10px;
                padding: 5px 10px;
                position: absolute;
                background-color: rgba(0,0,0,.4);
                color: rgba(255,255,255,.8);
                bottom: 7.5px;
                left: 7.5px;
                font-size: 12px;
                font-weight: 900;
                opacity: 1;
                width: 125px;
                z-index: 2;
                cursor: pointer;
            }
            .versionNextButton {
                border-radius: 10px;
                padding: 5px 10px;
                position: absolute;
                background-color: rgba(0,0,0,.7);
                color: rgba(255,255,255,.8);
                top: 7.5px;
                right: 7.5px;
                font-size: 12px;
                font-weight: 900;
                opacity: 1;
                display: none;
                z-index: 2;
                cursor: pointer;
            }
            .versionPrevButton {
                border-radius: 10px;
                padding: 5px 10px;
                position: absolute;
                background-color: rgba(0,0,0,.7);
                color: rgba(255,255,255,.8);
                top: 7.5px;
                left: 7.5px;
                font-size: 12px;
                font-weight: 900;
                opacity: 1;
                z-index: 2;
                display: none;
                cursor: pointer;
            }
            .newTabButton {
                border-radius: 10px;
                padding: 5px 10px;
                position: absolute;
                background-color: rgba(0,0,0,.4);
                color: rgba(255,255,255,.8);
                bottom: 7.5px;
                right: 7.5px;  /* Position on the right side */
                font-size: 12px;
                font-weight: 900;
                opacity: 1;
                width: auto;  /* Smaller width since text is shorter */
                z-index: 2;
                cursor: pointer;
                text-align: center;
            }

            /* Add hover effect */
            .newTabButton:hover {
                background-color: rgba(0,0,0,.7);
            }
        `);

        function IncludesAll(string, search) {
            string = CleanupSearchString(string);
            search = CleanupSearchString(search);
            if (string.length == 0 || search.length == 0) return false;
            let searches = search.split(" ");
            for (let i = 0; i < searches.length; i++) {
                if (!!searches[i] && searches[i].length > 0 && !string.includes(searches[i])) return false;
            }
            return true;
        }

        async function AddAltVersionsToThis(target) {
            let place = target;
            const coverElement = place.parent().find(".cover:visible");
            const href = coverElement.attr('href');
            const captionTitle = place.parent().find(".cover:visible > .caption").text();

            try {
                let titles = [captionTitle]; // Start with the caption title

                // Try to get the title from the manga page if href exists
                if (href) {
                    try {
                        const response = await fetch(`https://nhentai.net${href}`);

                        if (response.ok) {
                            const html = await response.text();
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');

                            const titleElement = doc.querySelector('.title');

                            if (titleElement) {
                                const prettySpan = titleElement.querySelector('.pretty');
                                let titleText = prettySpan ? prettySpan.textContent.trim() : titleElement.textContent.trim();
                                const cleanedTitleText = titleText.replace(/[\[\]\(\)]|Ch\.|ch\.|Vol\.|vol\.|Ep\.|Ep|ep\.|ep|\|[\u3002\uFF01-\uFF5E\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]|(?<!\w)-(?!\w)|\d+/g, '').trim();

                                // Add the cleaned title if it's different from the caption title
                                if (cleanedTitleText && cleanedTitleText !== captionTitle) {
                                    titles.push(cleanedTitleText);
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching title from manga page:", error);
                    }
                }

                // Process search with all collected titles
                await processSearchWithMultipleTitles(titles);

            } catch (error) {
                console.error("Error in AddAltVersionsToThis:", error);
                // Fallback to just the caption title if there's an error
                processSearch(captionTitle);
            }

            // Function to process search with multiple titles and combine results
            async function processSearchWithMultipleTitles(titles) {
                let allResults = [];
                let processedHrefs = new Set(); // To track unique results

                for (const title of titles) {
                    if (!title || title.trim() === '') continue;

                    try {
                        // Use fetch API instead of jQuery's $.get to avoid XHR interception issues
                        const response = await fetch(BuildUrl(title));
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const text = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');
                        const found = doc.querySelectorAll(".container > .gallery");

                        if (found && found.length > 0) {
                            // Add unique results to allResults
                            for (let i = 0; i < found.length; i++) {
                                const resultHref = found[i].querySelector(".cover")?.getAttribute('href');

                                if (resultHref && !processedHrefs.has(resultHref)) {
                                    processedHrefs.add(resultHref);
                                    allResults.push(found[i]);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error searching for title "${title}":`, error);
                    }
                }

                if (allResults.length === 0) {
                    alert("No results found for any of the search terms");
                    return;
                }

                // Process the combined results
                place.parent().find(".cover").remove();
                try {
                    for (let i = 0; i < allResults.length; i++) {
                        // Convert DOM element to jQuery object for consistent handling
                        const $result = $(allResults[i]);
                        
                        if (partially_fade_all_non_english) {
                            $result.find(".cover > img, .cover > .caption").css("opacity", non_english_fade_opacity);
                        }

                        const dataTags = $result.attr("data-tags") || "";
                        
                        if (dataTags.includes("12227")) {
                            $result.find(".caption").append(`<img class="overlayFlag" src="` + flagEn + `">`);
                            $result.find(".cover > img, .cover > .caption").css("opacity", "1");
                        } else {
                            if (dataTags.includes("6346")) {
                                $result.find(".caption").append(`<img class="overlayFlag" src="` + flagJp + `">`);
                            } else if (dataTags.includes("29963")) {
                                $result.find(".caption").append(`<img class="overlayFlag" src="` + flagCh + `">`);
                            }
                            if (!partially_fade_all_non_english) {
                                $result.find(".cover > img, .cover > .caption").css("opacity", "1");
                            }
                        }

                        if (mark_as_read_system_enabled) {
                            let MARArraySelector = MARArray.join("'], .cover[href='");
                            $result.find(".cover[href='" + MARArraySelector + "']").append("<div class='readTag'>READ</div>");
                            let readTag = $result.find(".readTag");
                            if (!!readTag && readTag.length > 0) {
                                readTag.parent().parent().find(".cover > img, .cover > .caption").css("opacity", marked_as_read_fade_opacity);
                            }
                        }

                        let thumbnailReplacement;
                        const $img = $result.find(".cover > img");
                        const dataSrc = $img.attr("data-src");
                        
                        if (dataSrc) {
                            thumbnailReplacement = dataSrc
                                .replace(/\/\/.+?\.nhentai/g, "//i1.nhentai")  // Fixed CDN path
                                .replace("thumb.", "1.");  // Generic replacement for all extensions
                        } else {
                            thumbnailReplacement = $img.attr("src")
                                .replace(/\/\/.+?\.nhentai/g, "//i1.nhentai")  // Fixed CDN path
                                .replace("thumb.", "1.");  // Generic replacement for all extensions
                        }

                        $img.attr("src", thumbnailReplacement);
                        place.parent().append($result.find(".cover"));
                    }
                } catch (er) {
                    alert("Error modifying data: " + er);
                    return;
                }

                place.parent().find(".cover:not(:first)").css("display", "none");
                place.parent().find(".versionPrevButton, .versionNextButton, .numOfVersions").show(200);
                place.parent().find(".numOfVersions").text("1/" + (allResults.length));
                place.hide(200);
            }

            // Original search function as fallback
            async function processSearch(title) {
                try {
                    // Use fetch API instead of jQuery's $.get to avoid XHR interception issues
                    const response = await fetch(BuildUrl(title));
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const text = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const foundElements = doc.querySelectorAll(".container > .gallery");
                    
                    if (!foundElements || foundElements.length <= 0) {
                        alert("Error reading data");
                        return;
                    }
                    
                    // Convert NodeList to jQuery collection for easier manipulation
                    const found = $(foundElements);
                    
                    place.parent().find(".cover").remove();
                    try {
                        for (let i = 0; i < found.length; i++) {
                            const $item = $(found[i]);
                            
                            if (partially_fade_all_non_english) {
                                $item.find(".cover > img, .cover > .caption").css("opacity", non_english_fade_opacity);
                            }

                            const dataTags = $item.attr("data-tags") || "";
                            
                            if (dataTags.includes("12227")) {
                                $item.find(".caption").append(`<img class="overlayFlag" src="` + flagEn + `">`);
                                $item.find(".cover > img, .cover > .caption").css("opacity", "1");
                            } else {
                                if (dataTags.includes("6346")) {
                                    $item.find(".caption").append(`<img class="overlayFlag" src="` + flagJp + `">`);
                                } else if (dataTags.includes("29963")) {
                                    $item.find(".caption").append(`<img class="overlayFlag" src="` + flagCh + `">`);
                                }
                                if (!partially_fade_all_non_english) {
                                    $item.find(".cover > img, .cover > .caption").css("opacity", "1");
                                }
                            }

                            if (mark_as_read_system_enabled) {
                                let MARArraySelector = MARArray.join("'], .cover[href='");
                                $item.find(".cover[href='" + MARArraySelector + "']").append("<div class='readTag'>READ</div>");
                                let readTag = $item.find(".readTag");
                                if (!!readTag && readTag.length > 0) {
                                    readTag.parent().parent().find(".cover > img, .cover > .caption").css("opacity", marked_as_read_fade_opacity);
                                }
                            }

                            let thumbnailReplacement;
                            const $img = $item.find(".cover > img");
                            const dataSrc = $img.attr("data-src");
                            
                            if (dataSrc) {
                                thumbnailReplacement = dataSrc
                                    .replace(/\/\/.+?\.nhentai/g, "//i1.nhentai")  // Fixed CDN path
                                    .replace("thumb.", "1.");  // Generic replacement for all extensions
                            } else {
                                thumbnailReplacement = $img.attr("src")
                                    .replace(/\/\/.+?\.nhentai/g, "//i1.nhentai")  // Fixed CDN path
                                    .replace("thumb.", "1.");  // Generic replacement for all extensions
                            }

                            $img.attr("src", thumbnailReplacement);
                            place.parent().append($item.find(".cover"));
                        }
                    } catch (er) {
                        alert("Error modifying data: " + er);
                        return;
                    }
                    place.parent().find(".cover:not(:first)").css("display", "none");
                    place.parent().find(".versionPrevButton, .versionNextButton, .numOfVersions").show(200);
                    place.parent().find(".numOfVersions").text("1/" + (found.length));
                    place.hide(200);
                } catch (e) {
                    alert("Error getting data: " + e);
                }
            }
        }

        function CleanupSearchString(title) {
            title = title.replace(/\[.*?\]/g, "");
            title = title.replace(/\【.*?\】/g, "");
            if (version_grouping_filter_brackets) title = title.replace(/\(.*?\)/g, "");
            return title.trim();
        }

        function BuildUrl(title) {
            let url = CleanupSearchString(title);
            url = url.trim();
            url = url.replace(/(^|\s){1}[^\w\s\d]{1}(\s|$){1}/g, " "); // remove all instances of a lone symbol character
            url = url.replace(/\s+/g, '" "'); // wrap all terms with ""
            url = '"' + url + '"';
            url = encodeURIComponent(url);
            url = "https://nhentai.net/search/?q=" + url;
            return url;
        }

       async function GroupAltVersionsOnPage() {
        // Check if the feature is enabled
        const mangagroupingenabled = await GM.getValue('mangagroupingenabled', true);
        if (!mangagroupingenabled) return;
            let i = 0;
            let found = $(".container > .gallery");
            while (!!found && i < found.length) {
                AddAltVersionsToThisFromPage(found[i]);
                i++;
                found = $(".container > .gallery");
            }
        }

        function AddAltVersionsToThisFromPage(target) {
            let place = $(target);
            place.addClass("ignoreThis");
            let title = place.find(".cover > .caption").text();
            if (!title || title.length <= 0) return;
            let found = $(".container > .gallery:not(.ignoreThis)");
            let numOfValid = 0;
            for (let i = 0; i < found.length; i++) {
                let cap = $(found[i]).find(".caption");
                if (cap.length == 1) {
                    if (IncludesAll(cap.text(), title)) {
                        if (partially_fade_all_non_english) {
                            $(found[i]).find(".cover > img, .cover > .caption").css("opacity", non_english_fade_opacity);
                        }

                        if ($(found[i]).attr("data-tags").includes("12227")) {
                            $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagEn + `">`);
                            $(found[i]).find(".cover > img, .cover > .caption").css("opacity", "1");
                        } else {
                            if ($(found[i]).attr("data-tags").includes("6346")) {
                                $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagJp + `">`);
                            } else if ($(found[i]).attr("data-tags").includes("29963")) {
                                $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagCh + `">`);
                            }
                            if (!partially_fade_all_non_english) {
                                $(found[i]).find(".cover > img, .cover > .caption").css("opacity", "1");
                            }
                        }

                        if (mark_as_read_system_enabled) {
                            let MARArraySelector = MARArray.join("'], .cover[href='");
                            $(found[i]).find(".cover[href='" + MARArraySelector + "']").append("<div class='readTag'>READ</div>");
                            let readTag = $(found[i]).find(".readTag");
                            if (!!readTag && readTag.length > 0) {
                                readTag.parent().parent().find(".cover > img, .cover > .caption").css("opacity", marked_as_read_fade_opacity);
                            }
                        }

                        place.append($(found[i]).find(".cover"));
                        $(found[i]).addClass("deleteThis");
                        numOfValid++;
                    }
                } else {
                    let addThese = false;
                    for (let j = 0; j < cap.length; j++) {
                        if (IncludesAll($(cap[j]).text(), title)) {
                            addThese = true;
                            break;
                        }
                    }

                    if (addThese) {
                        for (let j = 0; j < cap.length; j++) {
                            place.append($(cap[j]).parent());
                        }
                        $(found[i]).addClass("deleteThis");
                        numOfValid += cap.length;
                    }
                }
            }
            numOfValid++;
            place.removeClass("deleteThis");
            place.removeClass("ignoreThis");
            $(".deleteThis").remove();
            if (numOfValid > 1) {
                place.find(".cover:not(:first)").css("display", "none");
                place.find(".versionPrevButton, .versionNextButton, .numOfVersions").show(200);
                place.find(".numOfVersions").text("1/" + numOfValid);
            }
        }

        if ($(".container.index-container, #favcontainer.container, #recent-favorites-container, #related-container").length !== 0) {
            $(".cover").parent().append("<div class='findVersionButton'>Find Alt Versions</div>");
            $(".cover").parent().append("<div class='numOfVersions'>1/1</div>");
            $(".cover").parent().append("<div class='versionNextButton'>►</div>");
            $(".cover").parent().append("<div class='versionPrevButton'>◄</div>");

            $(".findVersionButton").click(function(e) {
                e.preventDefault();
                AddAltVersionsToThis($(this));
            });

            if (auto_group_on_page_comics) GroupAltVersionsOnPage();

            $(".versionPrevButton").click(function(e) {
                e.preventDefault();
                let toHide = $(this).parent().find(".cover").filter(":visible");
                let toShow = toHide.prev();
                if (!toShow || toShow.length <= 0) return;
                if (!toShow.is(".cover")) toShow = toHide.prevUntil(".cover", ":last").prev();
                if (!toShow || toShow.length <= 0) return;
                toHide.hide(100);
                toShow.show(100);
                let n = $(this).parent().find(".numOfVersions");
                n.text((Number(n.text().split("/")[0]) - 1) + "/" + n.text().split("/")[1]);
            });
            $(".versionNextButton").click(function(e) {
                e.preventDefault();
                let toHide = $(this).parent().find(".cover").filter(":visible");
                let toShow = toHide.next();
                if (!toShow || toShow.length <= 0) return;
                if (!toShow.is(".cover")) toShow = toHide.nextUntil(".cover", ":last").next();
                if (!toShow || toShow.length <= 0) return;
                toHide.hide(100);
                toShow.show(100);
                let n = $(this).parent().find(".numOfVersions");
                n.text((Number(n.text().split("/")[0]) + 1) + "/" + n.text().split("/")[1]);
            });
        }
    });

})(); // Self-invoking function for the toggle check

//------------------------  **Find Alternative Manga Button(Thumbnail Version)**  ------------------

// ------------------------  *Bookmarks**  ------------------
function injectCSS() {
    const css = `
        /* Bookmark animation */
        @keyframes bookmark-animation {
            0% {
                transform: scale(1) rotate(0deg);
            }
            50% {
                transform: scale(1.2) rotate(20deg);
            }
            100% {
                transform: scale(1) rotate(0deg);
            }
        }

        /* Add a class for the animation */
        .bookmark-animating {
            animation: bookmark-animation 0.4s ease-in-out;
        }
    `;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

injectCSS(); // Inject the CSS when the userscript runs

// Function to create and insert bookmark button
async function createBookmarkButton() {
    // Check if the feature is enabled in settings
    const bookmarksEnabled = await GM.getValue('bookmarksEnabled', true);
    if (!bookmarksEnabled) {
        return;
    }

    // Check if the page is already bookmarked
    const bookmarkedPages = await GM.getValue('bookmarkedPages', []);
    const currentPage = window.location.href;
    const isBookmarked = bookmarkedPages.includes(currentPage);

    // Bookmark button HTML using Font Awesome 5.13.0
    const bookmarkButtonHtml = `
        <a class="btn btn-primary bookmark-btn" style="margin-left: 10px;">
            <i class="bookmark-icon ${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
        </a>
    `;
    const bookmarkButton = $(bookmarkButtonHtml);

    // Append the bookmark button as a child of the h1 element if it exists
    const h1Element = document.querySelector("#content > h1");
    if (h1Element) {
        h1Element.append(bookmarkButton[0]);
    }

    // Handle click event for the bookmark button
    bookmarkButton.click(async function() {
        const bookmarkIcon = $(this).find('i.bookmark-icon');
        const bookmarkedPages = await GM.getValue('bookmarkedPages', []);
        const currentPage = window.location.href;
        const isBookmarked = bookmarkedPages.includes(currentPage);

        // Add animation class
        bookmarkIcon.addClass('bookmark-animating');

        if (isBookmarked) {
            // Remove the bookmark
            const updatedBookmarkedPages = bookmarkedPages.filter(page => page !== currentPage);
            await GM.setValue('bookmarkedPages', updatedBookmarkedPages);
            await GM.deleteValue(currentPage);

            // Get the list of manga IDs for this bookmark
            const bookmarkMangaIds = await GM.getValue(`bookmark_manga_ids_${currentPage}`, []);

            // Delete the bookmark's manga ID list
            await GM.deleteValue(`bookmark_manga_ids_${currentPage}`);

            // For each manga associated with this bookmark
            const allKeys = await GM.listValues();
            const mangaKeys = allKeys.filter(key => key.startsWith('manga_'));

            for (const key of mangaKeys) {
                const mangaInfo = await GM.getValue(key);

                // If this manga is associated with the deleted bookmark
                if (mangaInfo && mangaInfo.bookmarks && mangaInfo.bookmarks.includes(currentPage)) {
                    // Remove this bookmark from the manga's bookmarks list
                    mangaInfo.bookmarks = mangaInfo.bookmarks.filter(b => b !== currentPage);

                    // If this manga is no longer in any bookmarks, delete it entirely
                    if (mangaInfo.bookmarks.length === 0) {
                        await GM.deleteValue(key);
                        console.log(`Deleted orphaned manga: ${key}`);
                    } else {
                        // Otherwise, update the manga info with the bookmark removed
                        await GM.setValue(key, mangaInfo);
                        console.log(`Updated manga ${key}: removed bookmark reference`);
                    }
                }
            }

            // Switch icon class to 'far' when unbookmarking
            bookmarkIcon.addClass('far').removeClass('fas');
        } else {
            // Add the bookmark
            bookmarkedPages.push(currentPage);
            await GM.setValue('bookmarkedPages', bookmarkedPages);

            // Switch icon class to 'fas' when bookmarking
            bookmarkIcon.addClass('fas').removeClass('far');
        }

        // Remove animation class after animation ends
        setTimeout(() => {
            bookmarkIcon.removeClass('bookmark-animating');
        }, 400); // Match the duration of the CSS animation (0.4s)
    });
}




// Only execute if not on the settings page or favorites page
if (window.location.href.indexOf('nhentai.net/settings') === -1 && window.location.href.indexOf('nhentai.net/favorites') === -1) {
    createBookmarkButton();
}






async function addBookmarkButton() {
    const bookmarksPageEnabled = await GM.getValue('bookmarksPageEnabled', true);
    if (!bookmarksPageEnabled) return;
    // Create the bookmark button
    const bookmarkButtonHtml = `
      <li>
        <a href="/bookmarks/">
          <i class="fa fa-bookmark"></i>
          Bookmarks
        </a>
      </li>
    `;
    const bookmarkButton = $(bookmarkButtonHtml);

    // Append the bookmark button to the dropdown menu
    const dropdownMenu = $('ul.dropdown-menu');
    dropdownMenu.append(bookmarkButton);

    // Append the bookmark button to the menu
    const menu = $('ul.menu.left');
    menu.append(bookmarkButton);

    // Call updateMenuOrder to ensure proper tab order
    setTimeout(updateMenuOrder, 100);
}

async function addOfflineFavoritesButton() {
    const offlineFavoritingEnabled = await GM.getValue('offlineFavoritingEnabled', true);
    const offlineFavoritesPageEnabled = await GM.getValue('offlineFavoritesPageEnabled', true);
    const isLoggedIn = !document.querySelector('.menu-sign-in');
    if (offlineFavoritingEnabled && offlineFavoritesPageEnabled && !isLoggedIn) {
        // Create the offline favorites button
        const offlineFavoritesButtonHtml = `
          <li>
            <a href="/favorite/">
              <i class="fa fa-heart"></i>
              Offline Favorites
            </a>
          </li>
        `;
        const offlineFavoritesButton = $(offlineFavoritesButtonHtml);

        // Append to dropdown menu
        const dropdownMenu = $('ul.dropdown-menu');
        dropdownMenu.append(offlineFavoritesButton);

        // Append to main menu
        const menu = $('ul.menu.left');
        menu.append(offlineFavoritesButton);

        // Call updateMenuOrder to ensure proper tab order
        setTimeout(updateMenuOrder, 100);
    }
}

addBookmarkButton(); // Call the function to add the bookmark button
addOfflineFavoritesButton(); // Call the function to add the offline favorites button


// Delete error message on unsupported bookmarks page
(async function() {
    if (window.location.href.includes('/bookmarks')) {
        // Remove not found heading
        const notFoundHeading = document.querySelector('h1');
        if (notFoundHeading?.textContent === '404 – Not Found') {
            notFoundHeading.remove();
        }

        // Remove not found message
        const notFoundMessage = document.querySelector('p');
        if (notFoundMessage?.textContent === "Looks like what you're looking for isn't here.") {
            notFoundMessage.remove();
        }

// Function to fetch the title of a webpage with caching and retries
async function fetchTitleWithCacheAndRetry(url, retries = 3) {
    // Check if we have cached manga IDs for this bookmark
    const mangaIds = await GM.getValue(`bookmark_manga_ids_${url}`, []);

    // If we have cached manga data, use it to construct the title
    if (mangaIds.length > 0) {
        // For bookmarks with multiple manga, we'll show a count
        if (mangaIds.length > 1) {
            let itemCount = mangaIds.length;
            let itemSuffix = itemCount > 25 ? `+` : ``;
            return `${url} (${itemCount}${itemSuffix} items)`;
        }
        // For a single manga, fetch its details
        else {
            const mangaId = mangaIds[0];
            const mangaInfo = await GM.getValue(`manga_${mangaId}`);

            if (mangaInfo && mangaInfo.title) {
                return mangaInfo.title;
            }
        }
    }

    // If no cached data found, fetch the title directly
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) {
                // If we get a 429, wait for a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            let title = doc.querySelector('title').innerText;

            // Remove "» nhentai: hentai doujinshi and manga" from the title
            const unwantedPart = "» nhentai: hentai doujinshi and manga";
            if (title.includes(unwantedPart)) {
                title = title.replace(unwantedPart, '').trim();
            }

            // We no longer cache the title directly with the URL as the key
            // Instead, we'll create proper relationships when manga data is saved

            return title;
        } catch (error) {
            console.error(`Error fetching title for: ${url}. Attempt ${i + 1} of ${retries}`, error);
            if (i === retries - 1) {
                return url; // Fallback to URL if all retries fail
            }
        }
    }
}

// Function to display bookmarked pages with active loading for unfetched bookmarks
async function displayBookmarkedPages() {
    let bookmarkedPages = await GM.getValue('bookmarkedPages', []);
    let bookmarkedMangas = await GM.getValue('bookmarkedMangas', []);
    const bookmarkArrangementType = await GM.getValue('bookmarkArrangementType', 'default');

    if (Array.isArray(bookmarkedPages) && Array.isArray(bookmarkedMangas)) {
        // Sort bookmarked mangas based on arrangement type
        if (bookmarkArrangementType === 'alphabetical') {
            bookmarkedMangas.sort((a, b) => {
                const titleA = a.title ? a.title.toLowerCase() : '';
                const titleB = b.title ? b.title.toLowerCase() : '';
                return titleA.localeCompare(titleB);
            });
        } else if (bookmarkArrangementType === 'reverse-alphabetical') {
            bookmarkedMangas.sort((a, b) => {
                const titleA = a.title ? a.title.toLowerCase() : '';
                const titleB = b.title ? b.title.toLowerCase() : '';
                return titleB.localeCompare(titleA);
            });
        }
        
        // Get manga IDs for each bookmark page to sort by item count
        const bookmarkItemCounts = {};
        if (bookmarkArrangementType === 'most-items' || bookmarkArrangementType === 'least-items') {
            // We'll need to fetch the manga counts for each bookmark
            for (const page of bookmarkedPages) {
                const mangaIds = await GM.getValue(`bookmark_manga_ids_${page}`, []);
                bookmarkItemCounts[page] = mangaIds.length;
            }
            
            // Sort bookmarked pages based on item count
            if (bookmarkArrangementType === 'most-items') {
                bookmarkedPages.sort((a, b) => bookmarkItemCounts[b] - bookmarkItemCounts[a]);
            } else if (bookmarkArrangementType === 'least-items') {
                bookmarkedPages.sort((a, b) => bookmarkItemCounts[a] - bookmarkItemCounts[b]);
            }
        }
        // Note: For default arrangement, we keep the original order (most recent first)

        const bookmarksContainer = $('<div id="bookmarksContainer" class="container">');
        const bookmarksTitle = $('<h2 class="bookmarks-title">Bookmarked Pages</h2>');
        const bookmarksList = $('<ul class="bookmarks-list">');
        const searchInput = $('<input type="text" id="searchBookmarks" placeholder="Search bookmarks..." class="search-input">');
        const mangaBookmarksTitle = $('<h2 class="bookmarks-title">Bookmarked Mangas</h2>');
        const mangaBookmarksList = $('<ul class="bookmarks-grid">');
        const tagSearchInput = $('<input type="text" id="searchMangaTags" placeholder="Search manga tags..." class="search-input">');

        // Get the bookmarks page order from storage or use default order
        const defaultOrder = ['bookmarksTitle', 'searchInput', 'tagSearchInput', 'bookmarksList', 'mangaBookmarksTitle', 'mangaBookmarksList'];
        const bookmarksOrder = await GM.getValue('bookmarksContainerOrder', defaultOrder);

        // Create a map of element names to their actual elements
        const elementsMap = {
            'bookmarksTitle': bookmarksTitle,
            'searchInput': searchInput,
            'tagSearchInput': tagSearchInput,
            'bookmarksList': bookmarksList,
            'mangaBookmarksTitle': mangaBookmarksTitle,
            'mangaBookmarksList': mangaBookmarksList
        };

        // Append elements in the order specified by bookmarksOrder
        bookmarksOrder.forEach(elementName => {
            if (elementsMap[elementName]) {
                bookmarksContainer.append(elementsMap[elementName]);
            }
        });
        $('body').append(bookmarksContainer);

        // Add CSS styles
        const styles = `
            #bookmarksContainer {
                margin: 20px auto;
                padding: 20px;
                background-color: #2c2c2c;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                width: 80%;
                max-width: 600px;
            }
            .bookmarks-title {
                font-size: 24px;
                margin-bottom: 10px;
                color: #e63946;
            }
            .search-input {
                width: calc(100% - 20px);
                padding: 10px;
                margin-bottom: 20px;
                border-radius: 5px;
                border: 1px solid #ccc;
                font-size: 16px;
            }
            .bookmarks-list {
                list-style: none;
                padding: 0;
                max-height: 100%;
                overflow-y: hidden;
            }
            .bookmark-link {
                display: block;
                padding: 10px;
                font-size: 18px;
                color: #f1faee;
                text-decoration: none;
                transition: background-color 0.3s, color 0.3s;
            }
            .bookmark-link:hover {
                background-color: #e63946;
                color: #1d3557;
            }

            .delete-button:hover {
                color: #f1faee;
            }
                .delete-button-pages {
                position: relative;
                top: -32px;
                float: right;
                background: none;
                border: none;
                color: #e63946;
                cursor: pointer;
                font-size: 14px;
            }

            .delete-button-pages:hover {
                color: #f1faee;
            }
            .undo-popup {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px;
                background-color: #333;
                color: #fff;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
            }
            .undo-button {
                background-color: #f1faee;
                color: #333;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            .undo-button:hover {
                background-color: #e63946;
                color: #1d3557;
            }
            @media only screen and (max-width: 600px) {
                #bookmarksContainer {
                    width: 90%;
                    margin: 10px auto;
                }
                .bookmarks-title {
                    font-size: 20px;
                }
                .bookmark-link {
                    font-size: 16px;
                }
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

// Fetch titles for each bookmark and update dynamically
for (const page of bookmarkedPages) {
    // Append a loading list item first
    const listItem = $(`<li><a href="${page}" class="bookmark-link">Loading...</a><button class="delete-button-pages">✖</button></li>`);
    bookmarksList.append(listItem);

    // Using async IIFE to handle async operations in the loop
    (async () => {
        try {
            // Get manga IDs associated with this bookmark
            const mangaIds = await GM.getValue(`bookmark_manga_ids_${page}`, []);

            // Determine what to display based on manga IDs
            let displayText;

            if (mangaIds.length > 0) {
                // For single or multiple manga
                const urlObj = new URL(page);
                const pathName = urlObj.pathname;
                const searchParams = urlObj.searchParams.get('q');

                let itemCount = mangaIds.length;
                let itemSuffix = itemCount == 1 ? ' item' : ` items`;
                let itemPlusSuffix = itemCount == 25 ? `+` : ``;

                if (pathName.includes('/tag/')) {
                    // For tag pages, extract the tag name
                    const tagName = pathName.split('/tag/')[1].replace('/', '');
                    displayText = `Tag: ${tagName} (${itemCount}${itemPlusSuffix}${itemSuffix})`;
                } else if (pathName.includes('/artist/')) {
                    // For artist pages, extract the artist name
                    const artistName = pathName.split('/artist/')[1].replace('/', '');
                    displayText = `Artist: ${artistName} (${itemCount}${itemPlusSuffix}${itemSuffix})`;
                } else if (pathName.includes('/character/')) {
                    // For character pages, extract the character name
                    const characterName = pathName.split('/character/')[1].replace('/', '');
                    displayText = `Character: ${characterName} (${itemCount}${itemPlusSuffix}${itemSuffix})`;
                } else if (pathName.includes('/parody/')) {
                    // For parody pages, extract the parody name
                    const parodyName = pathName.split('/parody/')[1].replace('/', '');
                    displayText = `Parody: ${parodyName} (${itemCount}${itemPlusSuffix}${itemSuffix})`;
                } else if (pathName.includes('/group/')) {
                    // For group pages, extract the group name
                    const groupName = pathName.split('/group/')[1].replace('/', '');
                    displayText = `Group: ${groupName} (${itemCount}${itemPlusSuffix}${itemSuffix})`;
                } else if (searchParams) {
                    // For search results
                    displayText = `Search: ${searchParams} (${itemCount}${itemPlusSuffix}${itemSuffix})`;
                } else {
                    // Default display for other pages with manga
                    displayText = `${page} (${itemCount}${itemPlusSuffix}${itemSuffix})`;
                }
            } else {
                // If no manga IDs found, fetch title directly
                displayText = await fetchTitleWithCacheAndRetry(page);
            }

            // Update the list item with the fetched title/display text
            const updatedListItem = $(`<li><a href="${page}" class="bookmark-link">${displayText}</a><button class="delete-button-pages">✖</button></li>`);
            listItem.replaceWith(updatedListItem);

            // Add delete functionality
            updatedListItem.find('.delete-button-pages').click(async function() {
                const updatedBookmarkedPages = bookmarkedPages.filter(p => p !== page);
                await GM.setValue('bookmarkedPages', updatedBookmarkedPages);

                // Get the list of manga IDs for this bookmark
                const bookmarkMangaIds = await GM.getValue(`bookmark_manga_ids_${page}`, []);

                // Delete the bookmark's manga ID list
                await GM.deleteValue(`bookmark_manga_ids_${page}`);

                // For each manga associated with this bookmark
                const allKeys = await GM.listValues();
                const mangaKeys = allKeys.filter(key => key.startsWith('manga_'));

                for (const key of mangaKeys) {
                    const mangaInfo = await GM.getValue(key);

                    // If this manga is associated with the deleted bookmark
                    if (mangaInfo && mangaInfo.bookmarks && mangaInfo.bookmarks.includes(page)) {
                        // Remove this bookmark from the manga's bookmarks list
                        mangaInfo.bookmarks = mangaInfo.bookmarks.filter(b => b !== page);

                        // If this manga is no longer in any bookmarks, delete it entirely
                        if (mangaInfo.bookmarks.length === 0) {
                            await GM.deleteValue(key);
                            console.log(`Deleted orphaned manga: ${key}`);
                        } else {
                            // Otherwise, update the manga info with the bookmark removed
                            await GM.setValue(key, mangaInfo);
                            console.log(`Updated manga ${key}: removed bookmark reference`);
                        }
                    }
                }

                updatedListItem.remove();
                console.log(`Deleted bookmark: ${page} and cleaned up related manga data`);

                const undoPopup = $(`
                    <div class="undo-popup">
                        <span>Bookmark deleted.</span>
                        <button class="undo-button">Undo</button>
                    </div>
                `);
                $('body').append(undoPopup);

                const timeout = setTimeout(() => {
                    undoPopup.remove();
                }, 5000);

                undoPopup.find('.undo-button').click(async function() {
                    clearTimeout(timeout);
                    const restoredBookmarkedPages = [...updatedBookmarkedPages, page];
                    await GM.setValue('bookmarkedPages', restoredBookmarkedPages);
                    undoPopup.remove();
                    $('#bookmarksContainer').remove();
                    displayBookmarkedPages();
                });
            });
        } catch (error) {
            console.error(`Error processing bookmark: ${page}`, error);
            listItem.html(`<a href="${page}" class="bookmark-link">Failed to load</a><button class="delete-button-pages">✖</button>`);
        }
    })();
}
        // Modified version with better cover organization
        for (const manga of bookmarkedMangas) {
            const listItem = $(`<li class="bookmark-item"><a href="${manga.url}" class="bookmark-link">Loading...</a><button class="delete-button">✖</button></li>`);
            mangaBookmarksList.append(listItem);

            (async () => {  // Immediately invoked async function
                const mangaBookMarkingType = await GM.getValue('mangaBookMarkingType', 'cover');
                let title = manga.title;
                let coverImage = manga.coverImageUrl;

                if (!title || !coverImage) {
                    try {
                        const info = await fetchMangaInfoWithCacheAndRetry(manga.url);
                        title = info.title;
                    } catch (error) {
                        console.error(`Error fetching info for: ${manga.url}`, error);
                        listItem.html(`<span class="error-text">Failed to fetch data</span>`);
                        return; // Stop processing this item if fetching fails
                    }
                }

                // Fetch and store tags
                let tags = await GM.getValue(`tags_${manga.url}`, null);
                if (!tags) {
                    try {
                        const response = await fetch(manga.url);
                        const html = await response.text();
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        tags = Array.from(doc.querySelectorAll('#tags .tag')).map(tag => {
                            // Remove popularity numbers and format the tag
                            return tag.textContent.replace(/\d+K?$/, '').trim().replace(/\b\w/g, char => char.toUpperCase());
                        });
                        console.log(`Fetched tags for ${manga.url}:`, tags); // Log the fetched tags
                        await GM.setValue(`tags_${manga.url}`, tags); // Save tags for future use
                    } catch (error) {
                        console.error(`Error fetching tags for: ${manga.url}`, error);
                        tags = []; // Default to empty if fetch fails
                    }
                } else {
                    console.log(`Retrieved cached tags for ${manga.url}:`, tags); // Log cached tags
                }

                let content = "";
                if (mangaBookMarkingType === 'cover') {
                    content = `
                        <div class="cover-container">
                            <img src="${coverImage}" alt="${title}" class="cover-image">
                            <div class="title-overlay">${title}</div>
                        </div>`;
                } else if (mangaBookMarkingType === 'title') {
                    content = `<span class="title-only">${title}</span>`;
                } else if (mangaBookMarkingType === 'both') {
                    content = `
                        <div class="cover-with-title">
                            <img src="${coverImage}" alt="${title}" class="cover-image-small">
                            <span class="title-text">${title}</span>
                        </div>`;
                }

                const updatedListItem = $(`<li class="bookmark-item ${mangaBookMarkingType}-mode"><a href="${manga.url}" class="bookmark-link">${content}</a><button class="delete-button">✖</button></li>`);
                listItem.replaceWith(updatedListItem);

                // Add delete functionality
                updatedListItem.find('.delete-button').click(async function() {
                    const updatedBookmarkedMangas = bookmarkedMangas.filter(m => m.url !== manga.url);
                    await GM.setValue('bookmarkedMangas', updatedBookmarkedMangas);
                    updatedListItem.remove();

                    const undoPopup = $(`
                        <div class="undo-popup">
                            <span>Bookmark deleted.</span>
                            <button class="undo-button">Undo</button>
                        </div>
                    `);
                    $('body').append(undoPopup);

                    const timeout = setTimeout(() => {
                        undoPopup.remove();
                    }, 5000);

                    undoPopup.find('.undo-button').click(async function() {
                        clearTimeout(timeout);
                        const restoredBookmarkedMangas = [...updatedBookmarkedMangas, manga];
                        await GM.setValue('bookmarkedMangas', restoredBookmarkedMangas);
                        undoPopup.remove();
                        $('#bookmarksContainer').remove();
                        displayBookmarkedPages();
                    });
                });
            })(); // Execute the async function immediately
        }

        // Add this CSS to your styles
        const additionalStyles = `
            #mangaBookmarksList {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 15px;
                list-style-type: none;
                padding: 0;
            }

            .bookmark-item {
                position: relative;
            }

            .bookmark-item.cover-mode {
                text-align: center;
            }

            .cover-container {
                position: relative;
                width: 100%;
                height: 0;
                padding-bottom: 140%; /* Aspect ratio for typical manga covers */
                overflow: hidden;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }

            .cover-image {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .cover-container:hover .cover-image {
                transform: scale(1.05);
            }

            .title-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 5px;
                font-size: 12px;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .delete-button {
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0,0,0,0.5);
                color: #ffffff;
                border: none; 
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s ease;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            @media only screen and (max-width: 768px) {
                .delete-button {
                    font-size: 10px;
                }
            }

            .bookmark-item:hover .delete-button {
                opacity: 1;
            }

            .title-only {
                display: block;
                padding: 5px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .cover-with-title {
                display: flex;
                align-items: center;
            }

            .cover-image-small {
                width: 50px;
                height: 70px;
                object-fit: cover;
                margin-right: 10px;
                border-radius: 3px;
            }
            /* Default styles for desktop */
            .bookmarks-grid {
            list-style: none;
            padding: 0;
            max-height: 100%;
            overflow-y: hidden;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* adjust the min and max widths as needed */
            gap: 10px; /* adjust the gap between grid items as needed */
            }

            /* Styles for mobile devices */
            @media only screen and (max-width: 768px) {
            .bookmarks-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); /* adjust the grid item width for mobile */
                gap: 5px; /* adjust the gap between grid items for mobile */
            }
            }
            .title-text {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }

            /* Modified search to work with new layout */
            .bookmark-item.hidden {
                display: none;
            }
            .random-button {
                background-color: #e63946;
                color: #ffffff;
                border: none;
                padding: 5px 10px;
                font-size: 14px;
                cursor: pointer;
                border-radius: 5px;
                transition: background-color 0.2s ease;

            }

            .random-button:hover {
                background-color:rgb(255, 255, 255);
                color: #e63946;
            }

            .random-button:active {
                transform: translateY(2px);
            }

            .random-button i {
                margin-right: 10px;
            }
        `;

        // Add the CSS to the page
        $('<style>').text(additionalStyles).appendTo('head');



        // Modified search functionality to work with the new layout
        searchInput.on('input', filterBookmarks);
        tagSearchInput.on('input', filterBookmarks);

        function filterBookmarks() {
            const searchQuery = searchInput.val().toLowerCase();
            const tagQueries = tagSearchInput.val().toLowerCase().trim().split(/,\s*|\s+/);

            mangaBookmarksList.children('li').each(async function () {
                const $li = $(this);
                const mangaUrl = $li.find('.bookmark-link').attr('href');
                const tags = await GM.getValue(`tags_${mangaUrl}`, []);

                const cleanedTags = tags.map(tag =>
                    tag.replace(/\d+K?$/, '').trim().toLowerCase()
                );

                const textContent = $li.find('.bookmark-link').text().toLowerCase();
                const imageSrc = $li.find('.bookmark-link img').attr('src') || '';

                const searchMatch = textContent.includes(searchQuery) || imageSrc.toLowerCase().includes(searchQuery);
                const tagMatch = tagQueries.every(query => {
                    const queryWords = query.split(/\s+/);
                    return cleanedTags.some(tag =>
                        queryWords.every(word => tag.includes(word))
                    );
                });

                $li.toggleClass('hidden', !(searchMatch && tagMatch));
            });

            $('.bookmarks-list li').each(async function () {
                const $li = $(this);
                const bookmarkUrl = $li.find('.bookmark-link').attr('href');
                let matchFound = false;

                // Get all manga IDs associated with this bookmark
                const mangaIds = await GM.getValue(`bookmark_manga_ids_${bookmarkUrl}`, []);

                if (!mangaIds || mangaIds.length === 0) {
                    // If we don't have any manga IDs for this bookmark, hide it
                    $li.toggleClass('hidden', true);
                    return;
                }

                // Check each manga in this bookmark for matching tags
                for (const mangaId of mangaIds) {
                    const mangaData = await GM.getValue(`manga_${mangaId}`, null);
                    if (!mangaData || !mangaData.tags) continue;

                    const cleanedTags = mangaData.tags.map(tag =>
                        tag.replace(/\d+K?$/, '').trim().toLowerCase()
                    );

                    const searchContent = $li.find('.bookmark-link').text().toLowerCase();
                    const searchImageSrc = $li.find('.bookmark-link img').attr('src') || '';

                    const searchMatch = searchContent.includes(searchQuery) || searchImageSrc.toLowerCase().includes(searchQuery);
                    const tagMatch = tagQueries.every(query => {
                        const queryWords = query.split(/\s+/);
                        return cleanedTags.some(tag =>
                            queryWords.every(word => tag.includes(word))
                        );
                    });

                    if (searchMatch && tagMatch) {
                        matchFound = true;
                        break;
                    }
                }

                $li.toggleClass('hidden', !matchFound);
            });
        }

    } else {
        console.error('Bookmarked pages or mangas is not an array');
    }
}





// Function to fetch manga info (title and cover image) with cache and retry
async function fetchMangaInfoWithCacheAndRetry(manga) {
    const cacheKey = `manga-info-${manga}`;
    const cachedInfo = await GM.getValue(cacheKey);
    if (cachedInfo) {
        return cachedInfo;
    }

    try {
        const response = await fetch(manga);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const title = doc.querySelector('h1.title').textContent;
        const coverImage = doc.querySelector('#cover img').src;
        const info = { title, coverImage };
        await GM.setValue(cacheKey, info);
        return info;
    } catch (error) {
        console.error(`Error fetching manga info for: ${manga}`, error);
        throw error;
    }
}

// Call the function to display bookmarked pages with active loading
displayBookmarkedPages();


}
})();
// ------------------------  *Bookmarks**  ------------------





//------------------------  **Nhentai English Filter**  ----------------------
var pathname = window.location.pathname;
var searchQuery = window.location.search.split('=')[1] || '';
var namespaceQuery = pathname.split('/')[2];
var namespaceSearchLink = '<div class="sort-type"><a href="https://nhentai.net/search/?q=' + namespaceQuery + '+English">English Only</a></div>';
var siteSearchLink = '<div class="sort-type"><a href="https://nhentai.net/search/?q=' + searchQuery + '+English">English Only</a></div>';
var favSearchBtn = '<a class="btn btn-primary" href="https://nhentai.net/favorites/?q=English+' + searchQuery + '"><i class="fa fa-flag"></i> ENG</a>';
var favPageBtn = '<a class="btn btn-primary" href="https://nhentai.net/favorites/?q=English+"><i class="fa fa-flag"></i> ENG</a>';

(async function() {
    const englishFilterEnabled = await GM.getValue('englishFilterEnabled', true);

    if (englishFilterEnabled) {
        // Check if the search query contains 'English' or 'english'
        if (!/English/i.test(searchQuery)) {
            if (pathname.startsWith('/parody/')) { // parody pages
                document.getElementsByClassName('sort')[0].innerHTML += namespaceSearchLink;
            } else if (pathname.startsWith('/favorites/')) { // favorites pages
                if (window.location.search.length) {
                    document.getElementById('favorites-random-button').insertAdjacentHTML('afterend', favSearchBtn);
                } else {
                    document.getElementById('favorites-random-button').insertAdjacentHTML('afterend', favPageBtn);
                }
            } else if (pathname.startsWith('/artist/')) { // artist pages
                document.getElementsByClassName('sort')[0].innerHTML += namespaceSearchLink;
            } else if (pathname.startsWith('/tag/')) { // tag pages
                document.getElementsByClassName('sort')[0].innerHTML += namespaceSearchLink;
            } else if (pathname.startsWith('/group/')) { // group pages
                document.getElementsByClassName('sort')[0].innerHTML += namespaceSearchLink;
            } else if (pathname.startsWith('/category/')) { // category pages
                document.getElementsByClassName('sort')[0].innerHTML += namespaceSearchLink;
            } else if (pathname.startsWith('/character/')) { // character pages
                document.getElementsByClassName('sort')[0].innerHTML += namespaceSearchLink;
            } else if (pathname.startsWith('/search/')) { // search pages
                document.getElementsByClassName('sort')[0].innerHTML += siteSearchLink;
            }
        }
    }
})();
//------------------------  **Nhentai English Filter**  ----------------------




//------------------------  **Nhentai Auto Login**  --------------------------
(async function() {
    const autoLoginEnabled = await GM.getValue('autoLoginEnabled', true);
    const email = await GM.getValue('email');
    const password = await GM.getValue('password');

    // Login page
    if (autoLoginEnabled && window.location.href.includes('/login/?next=/')) {
        if (!email || !password) {
            GM.setValue('email', prompt('Please enter your email:'));
            GM.setValue('password', prompt('Please enter your password:'));
        }
        document.getElementById('id_username_or_email').value = email;
        document.getElementById('id_password').value = password;
        const errorMessage = document.querySelector('#errors');
        if (!errorMessage || !errorMessage.textContent.includes('You need to solve the CAPTCHA.')) {
            document.querySelector('button[type="submit"]').click();
        } else {
            console.log('CAPTCHA detected. Cannot auto-login.');
        }
    }
})();
//------------------------  **Nhentai Auto Login**  --------------------------



//----------------------------**Settings**-----------------------------

    // Function to add the settings button to the menu
    function addSettingsButton() {
        // Create the settings button
        const settingsButtonHtml = `
          <li>
            <a href="/settings/">
              <i class="fa fa-cog"></i>
              Settings
            </a>
          </li>
        `;
        const settingsButton = $(settingsButtonHtml);

        // Append the settings button to the dropdown menu and the left menu
        const dropdownMenu = $('ul.dropdown-menu');
        dropdownMenu.append(settingsButton);

        const menu = $('ul.menu.left');
        menu.append(settingsButton);
    }

    // Call the function to add the settings button
    addSettingsButton();

    // Handle settings page
    if (window.location.href.includes('/settings')) {
        // Remove 404 Not Found elements
        const notFoundHeading = document.querySelector('h1');
        if (notFoundHeading && notFoundHeading.textContent === '404 – Not Found') {
            notFoundHeading.remove();
        }

        const notFoundMessage = document.querySelector('p');
        if (notFoundMessage && notFoundMessage.textContent === "Looks like what you're looking for isn't here.") {
            notFoundMessage.remove();
        }

// Add settings form and random hentai preferences
const settingsHtml = `
<style>
    #content {
        padding: 20px;
        background: #1a1a1a;
        color: #fff;
        border-radius: 5px;
    }

    #settingsForm {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .tooltip {
        display: inline-block;
        position: relative;
        cursor: pointer;
        font-size: 14px;
        background: #444;
        color: #fff;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        text-align: center;
        line-height: 18px;
        font-weight: bold;
    }

    .tooltip:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        left: 50%;
        bottom: 100%;
        transform: translateX(-50%);
        background: #666;
        color: #fff;
        padding: 5px;
        border-radius: 3px;
        white-space: nowrap;
        font-size: 12px;
    }
    #settingsForm label {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    #settingsForm input[type="text"],
    #settingsForm input[type="password"],
    #settingsForm input[type="number"] {
        width: calc(100% - 12px); /* Adjust for padding and borders */
        padding: 5px;
        border-radius: 3px;
        border: 1px solid #333;
        background: #333;
        color: #fff;
    }

    #settingsForm button {
        padding: 10px;
        background: #2a2a2a;
        border: 1px solid #333;
        border-radius: 3px;
        color: #fff;
        cursor: pointer;
    }

    #settingsForm button:hover {
        background: #333;
    }

    #autoLoginCredentials {
        display: block;
        margin-top: 10px;
    }

    #random-settings {
        margin-top: 20px;
    }

    #random-settings label {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    #random-settings input[type="text"],
    #random-settings input[type="number"] {
        width: calc(100% - 12px); /* Adjust for padding and borders */
        padding: 5px;
        border-radius: 3px;
        border: 1px solid #333;
        background: #333;
        color: #fff;
        margin-bottom: 10px; /* Add spacing between fields */
    }

    /* Bookmark Import/Export Buttons */
    .bookmark-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }

    .bookmark-actions button {
        padding: 10px;
        background-color: #007bff;
        border: none;
        color: white;
        cursor: pointer;
    }

    .bookmark-actions button:hover {
        background-color: #0056b3;
    }

    #importBookmarksFile {
        display: none;
    }

    /* Advanced Settings Section */
    #advanced-settings {
        margin-top: 30px;
        border-top: 1px solid #333;
        padding-top: 20px;
    }

    #advanced-settings h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
    }

    /* Tab Arrangement Styles */
    .sortable-list {
        list-style: none;
        padding: 0;
        margin: 10px 0;
        touch-action: pan-y;
    }

    .tab-item {
        display: flex;
        align-items: center;
        padding: 10px;
        margin: 5px 0;
        background: #2a2a2a;
        border: 1px solid #333;
        border-radius: 3px;
        user-select: none;
        transition: background 0.2s, transform 0.2s;
        touch-action: none;
    }

    .handle {
        cursor: grab;
        margin-right: 8px;
        touch-action: none;
    }

    .tab-item.sortable-ghost {
        opacity: 0.5;
    }

    .tab-item.sortable-drag,
    .tab-item.dragging {
        cursor: grabbing !important;
        background: #333;
        transform: scale(1.02);
        z-index: 1000;
    }

    .tab-item:hover {
        background: #333;
    }

    .tab-item .handle:hover {
        opacity: 0.8;
    }
    }

    .tab-item:hover {
        background: #333;
    }

    .tab-item .handle {
        margin-right: 10px;
        color: #666;
    }

    .btn-secondary {
        background: #444;
        color: #fff;
        border: none;
        padding: 8px 15px;
        border-radius: 3px;
        cursor: pointer;
        margin-top: 10px;
    }

    .btn-secondary:hover {
        background: #555;
    }

    #advanced-settings-content {
        display: none;
        margin-top: 15px;
    }

    #storage-data {
        width: 100%;
        height: 200px;
        background: #333;
        color: #fff;
        border: 1px solid #444;
        padding: 10px;
        font-family: monospace;
        margin-bottom: 10px;
        white-space: pre;
        overflow: auto;
    }

    .storage-key-item {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        background: #2a2a2a;
        padding: 5px;
        border-radius: 3px;
    }

    .storage-key {
        flex: 1;
        padding: 5px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .storage-actions {
        display: flex;
        gap: 5px;
    }

    .storage-actions button {
        background: #444;
        border: none;
        color: white;
        padding: 3px 8px;
        border-radius: 2px;
        cursor: pointer;
    }

    .storage-actions button:hover {
        background: #555;
    }

    .action-btn-danger {
        background: #d9534f !important;
    }

    .action-btn-danger:hover {
        background: #c9302c !important;
    }

    #edit-value-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999;
    }

    #edit-value-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #222;
        padding: 20px;
        border-radius: 5px;
        width: 80%;
        max-width: 600px;
    }

    #edit-value-textarea {
        width: 100%;
        height: 200px;
        background: #333;
        color: #fff;
        border: 1px solid #444;
        padding: 10px;
        font-family: monospace;
        margin-bottom: 15px;
    }

    .modal-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    /* Page Management Section */
    #page-management {
        margin-top: 20px;
        border-top: 1px solid #333;
        border-bottom: 1px solid #333;
        padding-top: 20px;
        padding-bottom: 30px;


    }

    #page-management h3 {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .section-header {
        font-weight: bold;
        margin: 10px 0 5px 0;
        color: #ccc;
    }

.expand-icon::after {
 content: "❯"; /* Chevron Right */
 margin-left: 5px;
 font-size: 14px;
 display: inline-block;
 transition: transform 0.2s ease;
}

.expand-icon.expanded::after {
 content: "❯"; /* Keep the same content */
 transform: rotate(90deg); /* Rotate to mimic Chevron Down */
 font-size: 14px;
}

/* Style for the Show Non-English dropdown to match NHentai theme */
#showNonEnglishSelect {
    /* Basic styling */
    padding: 6px 10px;
    margin: 0 5px;
    min-width: 110px;

    /* Colors */
    background-color: #2b2b2b;
    color: #e6e6e6;
    border: 1px solid #3d3d3d;

    /* Typography */
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;

    /* Effects */
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
}

/* Hover state */
#showNonEnglishSelect:hover {
    border-color: #4e4e4e;
    background-color: #323232;
}

/* Focus state */
#showNonEnglishSelect:focus {
    outline: none;
    border-color: #616161;
    box-shadow: 0 0 0 2px rgba(82, 82, 82, 0.35);
}

/* Dropdown options */
#showNonEnglishSelect option {
    padding: 8px 12px;
    background-color: #2b2b2b;
    color: #e6e6e6;
}

/* Tooltip integration */
label:hover .tooltip {
    opacity: 1;
    visibility: visible;
}

/* Online Data Sync Styles */
.sync-section {
    margin: 15px 0;
    padding: 10px;
    border: 1px solid #444;
    border-radius: 5px;
    background: #2a2a2a;
}

.sync-section h4 {
    margin: 0 0 10px 0;
    color: #fff;
    font-size: 14px;
}

.sync-controls {
    margin: 10px 0;
    display: flex;
    gap: 10px;
    align-items: center;
}

.sync-controls button {
    padding: 5px 10px;
    background: #444;
    border: 1px solid #666;
    border-radius: 3px;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
}

.sync-controls button:hover {
    background: #555;
}

.sync-controls button:disabled {
    background: #333;
    color: #666;
    cursor: not-allowed;
}

.sync-status {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 10px;
}

.sync-status.success {
    background: #2d5a2d;
    color: #90ee90;
}

.sync-status.error {
    background: #5a2d2d;
    color: #ff6b6b;
}

.sync-status.loading {
    background: #5a5a2d;
    color: #ffeb3b;
}

.sync-info {
    margin-top: 5px;
    font-size: 11px;
    color: #aaa;
}

#userUUID {
    font-family: monospace;
    letter-spacing: 2px;
    text-align: center;
    width: 80px !important;
}

#edit-uuid, #regenerate-uuid, #browse-users {
    margin-left: 10px;
    padding: 2px 8px;
    font-size: 11px;
}

#edit-uuid {
    background: #444;
    border: 1px solid #666;
}

#edit-uuid:hover {
    background: #555;
}

#uuid-edit-warning {
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid #ff6b6b;
    border-radius: 3px;
    padding: 8px;
}

</style>

<div id="content">
    <h1>Settings</h1>
    <form id="settingsForm">
    <label>
        <input type="checkbox" id="mustAddTagsEnabled">
        Enable Must Add Tags <span class="tooltip" data-tooltip="Enable or disable the 'Must Add Tags' feature.">?</span>
    </label>
    <label>Must Add Tags: <input type="text" id="must-add-tags"> <span class="tooltip" data-tooltip="Tags that must be included in search. Separate with commas.">?</span></label>

        <label>
            Show Non-English:
            <select id="showNonEnglishSelect">
                <option value="show">Show</option>
                <option value="hide">Hide</option>
                <option value="fade">Fade</option>
            </select>
            <span class="tooltip" data-tooltip="Control the visibility of non-English manga.">?</span>
        </label>
        <label>
            <input type="checkbox" id="showPageNumbersEnabled">
            Show Page Numbers <span class="tooltip" data-tooltip="Displays the page count for each manga thumbnail.">?</span>
        </label>
        <label>
            <input type="checkbox" id="offlineFavoritingEnabled">
            Enable Offline Favoriting <span class="tooltip" data-tooltip="Allows favoriting manga even without being logged in.">?</span>
        </label>
         <label>
            <input type="checkbox" id="tooltipsEnabled">
            Enable Tooltips <span class="tooltip" data-tooltip="Enables or disables tooltips.">?</span>
        </label>
        <label>
            <input type="checkbox" id="findSimilarEnabled">
            Enable Find Similar Button <span class="tooltip" data-tooltip="Finds similar manga based on the current one.">?</span>
        </label>
        <div id="find-similar-options" style="display: none;">
            <label>
                <input type="radio" id="open-immediately" name="find-similar-type" value="immediately">
                Open Immediately <span class="tooltip" data-tooltip="Opens the similar manga immediately.">?</span>
            </label>
            <label>
                <input type="radio" id="input-tags" name="find-similar-type" value="input-tags">
                Input Tags <span class="tooltip" data-tooltip="Allows inputting tags to find similar manga.">?</span>
            </label>
        </div>
        <label>
            <input type="checkbox" id="englishFilterEnabled">
            Enable English Filter Button <span class="tooltip" data-tooltip="Filters manga to show only English translations.">?</span>
        </label>
        <label>
            <input type="checkbox" id="autoLoginEnabled">
            Enable Auto Login <span class="tooltip" data-tooltip="Automatically logs in with saved credentials.">?</span>
        </label>
        <div id="autoLoginCredentials">
            <label>
                Email: <input type="text" id="email">
            </label>
            <label>
                Password: <input type="password" id="password">
            </label>
        </div>
        <label>
            <input type="checkbox" id="bookmarkLinkEnabled">
            Enable Bookmark Link <span class="tooltip" data-tooltip="Adds a link to your bookmark in the manga title.">?</span>
        </label>
        <label>
            <input type="checkbox" id="findAltmangaEnabled">
            Enable Find Altmanga Button <span class="tooltip" data-tooltip="Finds alternative sources for the manga.">?</span>
        </label>
        <label>
            <input type="checkbox" id="findAltMangaThumbnailEnabled">
            Enable Find Alt Manga (Thumbnail Version) <span class="tooltip" data-tooltip="Displays alternative manga sources as thumbnails.">?</span>
        </label>
        <div id="find-Alt-Manga-Thumbnail-options" style="display: none;">
            <label>
                <input type="checkbox" id="mangagroupingenabled" name="manga-grouping-type" value="grouping">
                Find Alt Manga Grouping <span class="tooltip" data-tooltip="Groups alternative versions of manga together on the page.">?</span>
            </label>
         </div>
        <label>
            <input type="checkbox" id="openInNewTabEnabled">
            Enable Open in New Tab Button <span class="tooltip" data-tooltip="Opens manga links in a new tab.">?</span>
        </label>
                       <div id="open-in-New-Tab-options" style="display: none;">
            <label>
                <input type="radio" id="open-in-new-tab-background" name="open-in-new-tab" value="background">
                Open in New Tab (Background) <span class="tooltip" data-tooltip="Opens the link in a new tab without focusing on it.">?</span>
            </label>
            <label>
                <input type="radio" id="open-in-new-tab-foreground" name="open-in-new-tab" value="foreground">
                Open in New Tab (Foreground) <span class="tooltip" data-tooltip="Opens the link in a new tab and focuses on it.">?</span>
            </label>
         </div>
        <label>
            <input type="checkbox" id="monthFilterEnabled">
            Enable Month Filter Button <span class="tooltip" data-tooltip="Filters manga by publication month.">?</span>
        </label>
        <label>
            <input type="checkbox" id="mangaBookMarkingButtonEnabled">
            Enable Manga Bookmarking Button <span class="tooltip" data-tooltip="Allows bookmarking manga for quick access.">?</span>
        </label>
        <div id="manga-bookmarking-options" style="display: none;">
            <label>
                <input type="radio" id="manga-bookmarking-cover" name="manga-bookmarking-type" value="cover">
                Show Cover <span class="tooltip" data-tooltip="Displays the cover image for bookmarks.">?</span>
            </label>
            <label>
                <input type="radio" id="manga-bookmarking-title" name="manga-bookmarking-type" value="title">
                Show Title <span class="tooltip" data-tooltip="Displays the title only for bookmarks.">?</span>
            </label>
            <label>
                <input type="radio" id="manga-bookmarking-both" name="manga-bookmarking-type" value="both">
                Show Both <span class="tooltip" data-tooltip="Displays both the cover and title for bookmarks.">?</span>
            </label>

        </div>
        <label>
            <input type="checkbox" id="bookmarksEnabled">
            Enable Bookmarks Button <span class="tooltip" data-tooltip="Enables the bookmarks feature.">?</span>
        </label>
        <div class="bookmark-actions">
            <button type="button" id="exportBookmarks">Export Bookmarks</button>
            <button type="button" id="importBookmarks">Import Bookmarks</button>
            <input type="file" id="importBookmarksFile" accept=".json">
        </div>
        <div>
          <label for="max-manga-per-bookmark-slider">Max Manga per Bookmark:</label>
          <input type="range" id="max-manga-per-bookmark-slider" min="1" max="25" value="5">
          <span id="max-manga-per-bookmark-on-mobile-value">5</span>
          <span class="tooltip" data-tooltip="Sets the maximum number of manga fetched per bookmarked page.">?</span>
        </div>
        

        <!-- Page Management Section -->
        <div id="page-management">
            <h3 class="expand-icon">Page Management <span class="tooltip" data-tooltip="Enable or disable custom pages and features.">?</span></h3>
            <div id="page-management-content">
                <p>Control which custom pages and navigation elements are enabled:</p>

                <div class="section-header">Feature Pages</div>
                <label>
                    <input type="checkbox" id="offlineFavoritesPageEnabled">
                     Enable Offline Favorites Page <span class="tooltip" data-tooltip="Adds a tab to view all your offline favorites.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="nfmPageEnabled">
                    Enable NFM (Nhentai Favorite Manager) Page <span class="tooltip" data-tooltip="Enables the Nhentai Favorite Manager page for favorite management.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="replaceRelatedWithBookmarks">
                    Replace Related Manga with Bookmarks <span class="tooltip" data-tooltip="Replaces the Related Manga section with content from your bookmarks.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="enableRelatedFlipButton">
                    Enable Related Flip Button <span class="tooltip" data-tooltip="Shows a Flip button to toggle between bookmarked and original related manga. Only works when 'Replace Related Manga with Bookmarks' is enabled.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="bookmarksPageEnabled">
                    Enable Bookmarks Page <span class="tooltip" data-tooltip="Enables the dedicated Bookmarks page for managing saved bookmarks.">?</span>
                </label>
            <div id="bookmark-page-options" style="display: none;">
                <label>
                    Bookmark Arrangement Type:
                    <select id="bookmark-arrangement-type">
                        <option value="default">Default (Most Recent)</option>
                        <option value="alphabetical">Alphabetical (A-Z)</option>
                        <option value="reverse-alphabetical">Reverse Alphabetical (Z-A)</option>
                        <option value="most-items">Most Items</option>
                        <option value="least-items">Least Items</option>
                    </select>
                    <span class="tooltip" data-tooltip="Choose how bookmarks are sorted on the bookmarks page.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="enableRandomButton">
                    Enable Random Button <span class="tooltip" data-tooltip="Randomly selects a bookmarked manga for reading.">?</span>
                </label>
                <div id="random-options" style="display: none;">
                    <label>
                        <input type="radio" id="random-open-in-new-tab" name="random-open-type" value="new-tab">
                        Open Random Manga in New Tab <span class="tooltip" data-tooltip="Opens the randomly selected manga in a new tab.">?</span>
                    </label>
                    <label>
                        <input type="radio" id="random-open-in-current-tab" name="random-open-type" value="current-tab">
                        Open Random Manga in Current Tab <span class="tooltip" data-tooltip="Opens the randomly selected manga in the current tab.">?</span>
                    </label>
                </div>
            </div>
                <div class="section-header">Navigation</div>

                <label>
                    <input type="checkbox" id="twitterButtonEnabled">
                    Delete Twitter Button <span class="tooltip" data-tooltip="Deletes the Twitter button.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="profileButtonEnabled">
                    Delete Profile Button <span class="tooltip" data-tooltip="Deletes the Profile button.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="infoButtonEnabled">
                    Delete Info Button <span class="tooltip" data-tooltip="Deletes the Info button.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="logoutButtonEnabled">
                    Delete Logout Button <span class="tooltip" data-tooltip="Deletes the Logout button.">?</span>
             </label>
                <div class="section-header">Tab Arrangement</div>
                <div id="tab-arrangement">
                    <p>Drag and drop tabs to rearrange their order:</p>
                    <ul id="tab-list" class="sortable-list">
                        <li data-tab="random" class="tab-item"><i class="fa fa-bars handle"></i> Random</li>
                        <li data-tab="tags" class="tab-item"><i class="fa fa-bars handle"></i> Tags</li>
                        <li data-tab="artists" class="tab-item"><i class="fa fa-bars handle"></i> Artists</li>
                        <li data-tab="characters" class="tab-item"><i class="fa fa-bars handle"></i> Characters</li>
                        <li data-tab="parodies" class="tab-item"><i class="fa fa-bars handle"></i> Parodies</li>
                        <li data-tab="groups" class="tab-item"><i class="fa fa-bars handle"></i> Groups</li>
                        <li data-tab="info" class="tab-item"><i class="fa fa-bars handle"></i> Info</li>
                        <li data-tab="twitter" class="tab-item"><i class="fa fa-bars handle"></i> Twitter</li>
                        <!-- Offline Favorites tab will be added dynamically if user is not logged in -->
                    </ul>
                    <button type="button" id="resetTabOrder" class="btn-secondary">Reset to Default Order</button>
                </div>

                <div class="section-header">Bookmarks Page Arrangement</div>
                <div id="bookmarks-arrangement">
                    <p>Drag and drop elements to rearrange their order in the bookmarks page:</p>
                    <ul id="bookmarks-list" class="sortable-list">
                        <li data-element="bookmarksTitle" class="tab-item"><i class="fa fa-bars handle"></i> Bookmarked Pages Title</li>
                        <li data-element="searchInput" class="tab-item"><i class="fa fa-bars handle"></i> Search Input</li>
                        <li data-element="tagSearchInput" class="tab-item"><i class="fa fa-bars handle"></i> Tag Search Input</li>
                        <li data-element="bookmarksList" class="tab-item"><i class="fa fa-bars handle"></i> Bookmarks List</li>
                        <li data-element="mangaBookmarksTitle" class="tab-item"><i class="fa fa-bars handle"></i> Manga Bookmarks Title</li>
                        <li data-element="mangaBookmarksList" class="tab-item"><i class="fa fa-bars handle"></i> Manga Bookmarks List</li>
                    </ul>
                    <button type="button" id="resetBookmarksOrder" class="btn-secondary">Reset to Default Order</button>
                </div>
                </label>
        </div>
     </div>

        <div id="random-settings">
            <h3 class="expand-icon">Random Hentai Preferences <span class="tooltip" data-tooltip="Configure preferences for random hentai.">?</span></h3>
            <div id="random-settings-content">
                <label>Language: <input type="text" id="pref-language"> <span class="tooltip" data-tooltip="Preferred language for random hentai.">?</span></label>
                <label>Tags: <input type="text" id="pref-tags"> <span class="tooltip" data-tooltip="Preferred tags for filtering hentai.">?</span></label>
                <label>Blacklisted Tags: <input type="text" id="blacklisted-tags"> <span class="tooltip" data-tooltip="Tags to exclude from search results.">?</span></label>
                <label>Minimum Pages: <input type="number" id="pref-pages-min"> <span class="tooltip" data-tooltip="Minimum number of pages for random hentai.">?</span></label>
                <label>Maximum Pages: <input type="number" id="pref-pages-max"> <span class="tooltip" data-tooltip="Maximum number of pages for random hentai.">?</span></label>
                <label>
                    <input type="checkbox" id="matchAllTags">
                    Match All Tags (unchecked = match any) <span class="tooltip" data-tooltip="If enabled, all tags must match instead of any.">?</span>
                </label>
            </div>
        </div>

        <!-- Separator Line -->
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #444;">

        <!-- Online Data Sync Section -->
        <div id="online-sync-settings">
            <h3 class="expand-icon">Online Data Sync <span class="tooltip" data-tooltip="Sync your userscript data with cloud storage providers">?</span></h3>
            <div id="online-sync-settings-content">
                <p>Sync your bookmarks, favorites, and settings across devices using cloud storage.</p>

                <!-- User UUID -->
                <div class="sync-section">
                    <h4>User Identification</h4>
                    <label>
                        Your UUID: <input type="text" id="userUUID" readonly style="background: #222; color: #ccc;">
                        <button type="button" id="edit-uuid">Edit</button>
                        <button type="button" id="regenerate-uuid">Regenerate</button>
                        <button type="button" id="browse-users">Browse Users</button>
                        <span class="tooltip" data-tooltip="Unique identifier for your data. Keep this safe!">?</span>
                    </label>
                    <div id="uuid-edit-warning" style="display: none; color: #ff6b6b; font-size: 12px; margin-top: 5px;">
                        ⚠️ Warning: Changing your UUID will affect which data you can access. Make sure you have the correct UUID for your data.
                    </div>
                    <div id="available-users" style="display: none; margin-top: 10px; padding: 10px; background: #333; border-radius: 3px;">
                        <h5 style="margin: 0 0 10px 0; color: #fff;">Available Users in Cloud Storage:</h5>
                        <div id="users-list" style="font-family: monospace; font-size: 12px;"></div>
                        <button type="button" id="close-users-list" style="margin-top: 10px; padding: 2px 8px; font-size: 11px;">Close</button>
                    </div>
                </div>

                <!-- Public Section -->
                <div class="sync-section">
                    <h4>Public Sync (Standard Security)</h4>
                    <label>
                        <input type="checkbox" id="publicSyncEnabled">
                        Enable Public Sync <span class="tooltip" data-tooltip="Use predefined JSONStorage.net endpoint with standard security">?</span>
                    </label>
                    <div id="public-sync-options" style="margin-left: 20px; display: none;">
                        <p style="font-size: 12px; color: #aaa;">Uses predefined JSONStorage.net API with standard security level.</p>
                        <div class="sync-controls">
                            <button type="button" id="public-sync-upload">Upload Data</button>
                            <button type="button" id="public-sync-download">Download Data</button>
                            <span id="public-sync-status" class="sync-status"></span>
                        </div>
                        <div class="sync-info">
                            <small>Last sync: <span id="public-last-sync">Never</span></small>
                        </div>
                    </div>
                </div>

                <!-- Private Section -->
                <div class="sync-section">
                    <h4>Private Sync (Enhanced Security)</h4>
                    <label>
                        <input type="checkbox" id="privateSyncEnabled">
                        Enable Private Sync <span class="tooltip" data-tooltip="Use your own JSONStorage.net credentials for enhanced security">?</span>
                    </label>
                    <div id="private-sync-options" style="margin-left: 20px; margin-top: 10px; display: none;">
                        <label>
                            Storage URL: <input type="text" id="privateStorageUrl" placeholder="https://api.jsonstorage.net/v1/json/your-endpoint">
                            <span class="tooltip" data-tooltip="Your custom JSONStorage.net endpoint URL">?</span>
                        </label>
                        <label>
                            API Key: <input type="password" id="privateApiKey" placeholder="Your API key">
                            <span class="tooltip" data-tooltip="Your private JSONStorage.net API key">?</span>
                        </label>
                        <div class="sync-controls">
                            <button type="button" id="private-sync-upload">Upload Data</button>
                            <button type="button" id="private-sync-download">Download Data</button>
                            <span id="private-sync-status" class="sync-status"></span>
                        </div>
                        <div class="sync-info">
                            <small>Last sync: <span id="private-last-sync">Never</span></small>
                        </div>
                    </div>
                </div>

                <!-- Sync Settings -->
                <div class="sync-section">
                    <h4>Sync Options</h4>
                    <label>
                        <input type="checkbox" id="autoSyncEnabled">
                        Enable Auto Sync <span class="tooltip" data-tooltip="Automatically sync data when changes are made">?</span>
                    </label>
                    <label>
                        Sync Interval (minutes): <input type="number" id="syncInterval" min="5" max="1440" value="30">
                        <span class="tooltip" data-tooltip="How often to automatically sync (5-1440 minutes)">?</span>
                    </label>
                    <div id="auto-sync-status" style="font-size: 12px; color: #666; margin-top: 5px;">
                        No automatic syncs yet
                    </div>
                    <button id="trigger-auto-sync" style="margin-top: 10px; padding: 5px 10px; font-size: 12px;">
                        Trigger Sync Now
                    </button>
                </div>
            </div>
        </div>

        <!-- Advanced Storage Section -->
        <div id="advanced-settings">
            <h3 class="expand-icon">Advanced Storage Management <span class="tooltip" data-tooltip="View and modify all data stored in GM.getValue">?</span></h3>
            <div id="advanced-settings-content">
                <p>This section allows you to view and modify all data stored by this userscript.</p>
                <button type="button" id="refresh-storage">Refresh Storage Data</button>
                <div id="storage-keys-list"></div>

                <div id="edit-value-modal">
                    <div id="edit-value-content">
                        <h3>Edit Storage Value</h3>
                        <p id="editing-key-name">Key: </p>
                        <textarea id="edit-value-textarea"></textarea>
                        <div class="modal-buttons">
                            <button type="button" id="cancel-edit">Cancel</button>
                            <button type="button" id="save-edit">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <button type="submit">Save Settings</button>
    </form>
</div>
`;

// Append settings form to the container
$('div.container').append(settingsHtml);






        // Nhentai Plus+.user.js (2441-2516)
        // Load settings
        (async function() {
            const findSimilarEnabled = await GM.getValue('findSimilarEnabled', true);
            const englishFilterEnabled = await GM.getValue('englishFilterEnabled', true);
            const autoLoginEnabled = await GM.getValue('autoLoginEnabled', true);
            const email = await GM.getValue('email', '');
            const password = await GM.getValue('password', '');
            const findAltmangaEnabled = await GM.getValue('findAltmangaEnabled', true);
            const bookmarksEnabled = await GM.getValue('bookmarksEnabled', true);
            const language = await GM.getValue('randomPrefLanguage', '');
            const tags = await GM.getValue('randomPrefTags', []);
            const pagesMin = await GM.getValue('randomPrefPagesMin', '');
            const pagesMax = await GM.getValue('randomPrefPagesMax', '');
            const matchAllTags = await GM.getValue('matchAllTags', true);
            const blacklistedTags = await GM.getValue('blacklistedTags', []);
            const mustAddTagsEnabled = await GM.getValue('mustAddTagsEnabled', false);
            const mustAddTags = (await GM.getValue('mustAddTags', [])).map(tag => tag.toLowerCase());
            const findAltMangaThumbnailEnabled = await GM.getValue('findAltMangaThumbnailEnabled', true);
            const openInNewTabEnabled = await GM.getValue('openInNewTabEnabled', true);
            const mangaBookMarkingButtonEnabled = await GM.getValue('mangaBookMarkingButtonEnabled', true);
            const mangaBookMarkingType = await GM.getValue('mangaBookMarkingType', 'cover');
            const bookmarkArrangementType = await GM.getValue('bookmarkArrangementType', 'default');
            const monthFilterEnabled = await GM.getValue('monthFilterEnabled', true);
            const tooltipsEnabled = await GM.getValue('tooltipsEnabled', true);
            const mangagroupingenabled = await GM.getValue('mangagroupingenabled', true);
            const maxMangaPerBookmark = await GM.getValue('maxMangaPerBookmark', 5);
            const openInNewTabType = await GM.getValue('openInNewTabType', 'background');
            const offlineFavoritingEnabled = await GM.getValue('offlineFavoritingEnabled', true);
            const offlineFavoritesPageEnabled = await GM.getValue('offlineFavoritesPageEnabled', true);
            const nfmPageEnabled = await GM.getValue('nfmPageEnabled', true);

            // Online Data Sync settings
            const publicSyncEnabled = await GM.getValue('publicSyncEnabled', false);
            const privateSyncEnabled = await GM.getValue('privateSyncEnabled', false);
            const privateStorageUrl = await GM.getValue('privateStorageUrl', '');
            const privateApiKey = await GM.getValue('privateApiKey', '');
            const autoSyncEnabled = await GM.getValue('autoSyncEnabled', false);
            const syncInterval = await GM.getValue('syncInterval', 30);
            const userUUID = await syncSystem.getUserUUID();
            const lastSyncUpload = await GM.getValue('lastSyncUpload', null);
            const lastSyncDownload = await GM.getValue('lastSyncDownload', null);
            const bookmarksPageEnabled = await GM.getValue('bookmarksPageEnabled', true);
            const replaceRelatedWithBookmarks = await GM.getValue('replaceRelatedWithBookmarks', true);
            const enableRelatedFlipButton = await GM.getValue('enableRelatedFlipButton', true);
            const twitterButtonEnabled = await GM.getValue('twitterButtonEnabled', true);
            const enableRandomButton = await GM.getValue('enableRandomButton', true);
            const randomOpenType = await GM.getValue('randomOpenType', 'new-tab');
            const profileButtonEnabled = await GM.getValue('profileButtonEnabled', true);
            const infoButtonEnabled = await GM.getValue('infoButtonEnabled', true);
            const logoutButtonEnabled = await GM.getValue('logoutButtonEnabled', true);
            const bookmarkLinkEnabled = await GM.getValue('bookmarkLinkEnabled', true);
            const findSimilarType = await GM.getValue('findSimilarType', 'immediately');
            const showNonEnglish = await GM.getValue('showNonEnglish', 'show');
            const showPageNumbersEnabled = await GM.getValue('showPageNumbersEnabled', true);


            $('#findSimilarEnabled').prop('checked', findSimilarEnabled);
            $('#find-similar-options').toggle(findSimilarEnabled);
            $('#showNonEnglishSelect').val(showNonEnglish);
            $('#showPageNumbersEnabled').prop('checked', showPageNumbersEnabled);

            $('#englishFilterEnabled').prop('checked', englishFilterEnabled);
            $('#autoLoginEnabled').prop('checked', autoLoginEnabled);
            $('#email').val(email);
            $('#password').val(password);
            $('#findAltmangaEnabled').prop('checked', findAltmangaEnabled);
            $('#bookmarksEnabled').prop('checked', bookmarksEnabled);
            $('#pref-language').val(language);
            $('#pref-tags').val(tags.join(', '));
            $('#pref-pages-min').val(pagesMin);
            $('#pref-pages-max').val(pagesMax);
            $('#autoLoginCredentials').toggle(autoLoginEnabled);
            $('#matchAllTags').prop('checked', matchAllTags);
            $('#blacklisted-tags').val(blacklistedTags.join(', '));
            $('#mustAddTagsEnabled').prop('checked', mustAddTagsEnabled);
            $('#must-add-tags').val(mustAddTags.join(', '));
            $('#must-add-tags').prop('disabled', !mustAddTagsEnabled);

            $('#mustAddTagsEnabled').on('change', function() {
                $('#must-add-tags').prop('disabled', !$(this).is(':checked'));
            });
            $('#findAltMangaThumbnailEnabled').prop('checked', findAltMangaThumbnailEnabled);
            $('#openInNewTabEnabled').prop('checked', openInNewTabEnabled);
            $('#mangaBookMarkingButtonEnabled').prop('checked', mangaBookMarkingButtonEnabled);
            $('#monthFilterEnabled').prop('checked', monthFilterEnabled);
            $('#tooltipsEnabled').prop('checked', tooltipsEnabled);
            $('#mangagroupingenabled').prop('checked', mangagroupingenabled);
            $('#max-manga-per-bookmark-slider').val(maxMangaPerBookmark);
            $('#offlineFavoritingEnabled').prop('checked', offlineFavoritingEnabled);
            $('#offlineFavoritesPageEnabled').prop('checked', offlineFavoritesPageEnabled);
            $('#nfmPageEnabled').prop('checked', nfmPageEnabled);
            $('#bookmarksPageEnabled').prop('checked', bookmarksPageEnabled);
            $('#replaceRelatedWithBookmarks').prop('checked', replaceRelatedWithBookmarks);
            $('#enableRelatedFlipButton').prop('checked', enableRelatedFlipButton);
            $('#twitterButtonEnabled').prop('checked', twitterButtonEnabled);
            $('#enableRandomButton').prop('checked', enableRandomButton);
            $('#random-open-in-new-tab').prop('checked', randomOpenType === 'new-tab');
            $('#random-open-in-current-tab').prop('checked', randomOpenType === 'current-tab');
            $('#profileButtonEnabled').prop('checked', profileButtonEnabled);
            $('#infoButtonEnabled').prop('checked', infoButtonEnabled);
            $('#logoutButtonEnabled').prop('checked', logoutButtonEnabled);
            $('#bookmarkLinkEnabled').prop('checked', bookmarkLinkEnabled);
            $('#open-immediately').prop('checked', findSimilarType === 'immediately');
            $('#input-tags').prop('checked', findSimilarType === 'input-tags');

            // Populate sync settings
            $('#publicSyncEnabled').prop('checked', publicSyncEnabled);
            $('#privateSyncEnabled').prop('checked', privateSyncEnabled);
            $('#privateStorageUrl').val(privateStorageUrl);
            $('#privateApiKey').val(privateApiKey);
            $('#autoSyncEnabled').prop('checked', autoSyncEnabled);
            $('#syncInterval').val(syncInterval);
            $('#userUUID').val(userUUID);

            // Update sync status displays
            $('#public-last-sync').text(lastSyncUpload ? new Date(lastSyncUpload).toLocaleString() : 'Never');
            $('#private-last-sync').text(lastSyncDownload ? new Date(lastSyncDownload).toLocaleString() : 'Never');

            // Update autosync status display
            const lastAutoSync = await GM.getValue('lastAutoSync', null);
            $('#auto-sync-status').text(lastAutoSync ? `Last auto sync: ${new Date(lastAutoSync).toLocaleString()}` : 'No automatic syncs yet');

            // Show/hide sync options based on enabled state
            $('#public-sync-options').toggle(publicSyncEnabled);
            $('#private-sync-options').toggle(privateSyncEnabled);

            // Initialize AutoSync Manager
            await autoSyncManager.initialize();

            // Add event handlers for sync functionality
            $('#publicSyncEnabled').on('change', function() {
                $('#public-sync-options').toggle($(this).prop('checked'));
            });

            $('#privateSyncEnabled').on('change', function() {
                $('#private-sync-options').toggle($(this).prop('checked'));
            });

            // Save private storage credentials when they change (even when hidden)
            $('#privateStorageUrl').on('input blur', async function() {
                const url = $(this).val();
                await GM.setValue('privateStorageUrl', url);
            });

            $('#privateApiKey').on('input blur', async function() {
                const apiKey = $(this).val();
                await GM.setValue('privateApiKey', apiKey);
            });

            let originalUUID = null; // Store the original UUID when editing starts
            
            $('#edit-uuid').on('click', async function() {
                const isReadonly = $('#userUUID').prop('readonly');

                if (isReadonly) {
                    // Store the original UUID when editing begins
                    originalUUID = $('#userUUID').val();
                    // Enable editing
                    $('#userUUID').prop('readonly', false).css({
                        'background': '#333',
                        'color': '#fff',
                        'border': '1px solid #666'
                    });
                    $('#edit-uuid').text('Save');
                    $('#uuid-edit-warning').show();
                    $('#regenerate-uuid').prop('disabled', true);
                } else {
                    // Save the edited UUID
                    const newUUID = $('#userUUID').val().trim().toUpperCase();

                    // Validate UUID format (5 alphanumeric characters)
                    if (!/^[A-Z0-9]{5}$/.test(newUUID)) {
                        alert('UUID must be exactly 5 alphanumeric characters (A-Z, 0-9)');
                        $('#userUUID').val(originalUUID);
                        return;
                    }

                    if (newUUID !== originalUUID) {
                        const confirmChange = confirm(
                            `Are you sure you want to change your UUID from "${originalUUID}" to "${newUUID}"?\n\n` +
                            'This will affect which data you can access from cloud storage. ' +
                            'Make sure this is the correct UUID for your data.'
                        );

                        if (!confirmChange) {
                            $('#userUUID').val(originalUUID);
                            return;
                        }

                        await GM.setValue('userUUID', newUUID);
                        // Force update the syncSystem's cached UUID
                        syncSystem.cachedUUID = newUUID;
                        showPopup('UUID updated successfully!');
                    } else {
                        // Even if UUID is the same, ensure it's saved to storage
                        await GM.setValue('userUUID', newUUID);
                        // Force update the syncSystem's cached UUID
                        syncSystem.cachedUUID = newUUID;
                        showPopup('UUID saved successfully!');
                    }

                    // Disable editing
                    $('#userUUID').prop('readonly', true).css({
                        'background': '#222',
                        'color': '#ccc',
                        'border': '1px solid #333'
                    });
                    $('#edit-uuid').text('Edit');
                    $('#uuid-edit-warning').hide();
                    $('#regenerate-uuid').prop('disabled', false);
                }
            });

            $('#regenerate-uuid').on('click', async function() {
                if (confirm('Are you sure you want to regenerate your UUID? This will create a new unique identifier and you may lose access to your existing cloud data.')) {
                    const newUUID = syncSystem.generateUUID();
                    await GM.setValue('userUUID', newUUID);
                    // Force update the syncSystem's cached UUID
                    syncSystem.cachedUUID = newUUID;
                    $('#userUUID').val(newUUID);
                    showPopup('UUID regenerated successfully!');
                }
            });

            $('#browse-users').on('click', async function() {
                try {
                    $('#browse-users').prop('disabled', true).text('Loading...');

                    // Only work with private sync
                    if (!$('#privateSyncEnabled').prop('checked')) {
                        showPopup('Browse Users is only available for Private Sync. Please enable Private Sync first.');
                        return;
                    }

                    const url = $('#privateStorageUrl').val();
                    const apiKey = $('#privateApiKey').val();

                    if (!url || !apiKey) {
                        showPopup('Please enter both Storage URL and API Key for Private Sync to browse users.');
                        return;
                    }

                    let allData = null;
                    try {
                        allData = await syncSystem.providers.jsonstorage.download({ url, apiKey });
                    } catch (error) {
                        showPopup(`Error accessing private storage: ${error.message}`);
                        return;
                    }

                    if (!allData) {
                        showPopup('No data found in private storage.');
                        return;
                    }

                    // Display available users
                    let usersList = '';
                    const currentUUID = $('#userUUID').val();

                    if (allData.users) {
                        // Multi-user format
                        Object.keys(allData.users).forEach(uuid => {
                            const userData = allData.users[uuid];
                            const isCurrent = uuid === currentUUID;
                            const lastSync = new Date(userData.timestamp).toLocaleString();
                            const version = userData.version || 'Unknown';

                            usersList += `
                                <div style="margin: 5px 0; padding: 8px; background: ${isCurrent ? '#2d5a2d' : '#444'}; border-radius: 3px; cursor: pointer;"
                                     onclick="selectUUID('${uuid}')">
                                    <strong>${uuid}</strong> ${isCurrent ? '(Current)' : ''}
                                    <br><small>Version: ${version} | Last sync: ${lastSync}</small>
                                </div>
                            `;
                        });
                    } else if (allData.userUUID) {
                        // Old single-user format
                        const isCurrent = allData.userUUID === currentUUID;
                        const lastSync = new Date(allData.timestamp).toLocaleString();
                        const version = allData.version || 'Unknown';

                        usersList = `
                            <div style="margin: 5px 0; padding: 8px; background: ${isCurrent ? '#2d5a2d' : '#444'}; border-radius: 3px; cursor: pointer;"
                                 onclick="selectUUID('${allData.userUUID}')">
                                <strong>${allData.userUUID}</strong> ${isCurrent ? '(Current)' : ''}
                                <br><small>Version: ${version} | Last sync: ${lastSync}</small>
                            </div>
                        `;
                    }

                    $('#users-list').html(`<p><strong>Source:</strong> Private Sync</p>` + usersList);
                    $('#available-users').show();

                } catch (error) {
                    console.error('Error browsing users:', error);
                    showPopup(`Error browsing users: ${error.message}`);
                } finally {
                    $('#browse-users').prop('disabled', false).text('Browse Users');
                }
            });

            $('#close-users-list').on('click', function() {
                $('#available-users').hide();
            });

            // Global function to select UUID from the users list
            window.selectUUID = async function(uuid) {
                if (confirm(`Switch to UUID "${uuid}"? This will change your current UUID and affect which data you can access.`)) {
                    $('#userUUID').val(uuid);
                    await GM.setValue('userUUID', uuid);
                    // Force update the syncSystem's cached UUID
                    syncSystem.cachedUUID = uuid;
                    $('#available-users').hide();
                    showPopup(`UUID changed to ${uuid}`);
                }
            };

            // Manual autosync trigger
            $('#trigger-auto-sync').on('click', async function() {
                const button = $(this);
                const originalText = button.text();

                try {
                    button.prop('disabled', true).text('Syncing...');
                    await autoSyncManager.performAutoSync();

                    // Update status display
                    const lastAutoSync = await GM.getValue('lastAutoSync', null);
                    $('#auto-sync-status').text(lastAutoSync ? `Last auto sync: ${new Date(lastAutoSync).toLocaleString()}` : 'No automatic syncs yet');

                    showPopup('Manual autosync completed successfully!');
                } catch (error) {
                    console.error('Manual autosync failed:', error);
                    showPopup(`Manual autosync failed: ${error.message}`);
                } finally {
                    button.prop('disabled', false).text(originalText);
                }
            });

            // Public sync handlers
            $('#public-sync-upload').on('click', async function() {
                await handleSyncOperation('upload', 'public');
            });

            $('#public-sync-download').on('click', async function() {
                await handleSyncOperation('download', 'public');
            });

            // Private sync handlers
            $('#private-sync-upload').on('click', async function() {
                await handleSyncOperation('upload', 'private');
            });

            $('#private-sync-download').on('click', async function() {
                await handleSyncOperation('download', 'private');
            });

            // Sync operation handler
            async function handleSyncOperation(operation, syncType) {
                const statusElement = $(`#${syncType}-sync-status`);
                const lastSyncElement = $(`#${syncType}-last-sync`);

                try {
                    // Disable buttons and show loading
                    $(`#${syncType}-sync-upload, #${syncType}-sync-download`).prop('disabled', true);
                    statusElement.removeClass('success error').addClass('loading').text('Processing...');

                    let config;
                    if (syncType === 'public') {
                        config = syncSystem.publicConfig;
                    } else {
                        const url = $('#privateStorageUrl').val();
                        const apiKey = $('#privateApiKey').val();

                        if (!url || !apiKey) {
                            throw new Error('Please enter both Storage URL and API Key for private sync');
                        }

                        config = { url, apiKey };
                    }

                    if (operation === 'upload') {
                        await syncSystem.uploadData('jsonstorage', config);
                        statusElement.removeClass('loading error').addClass('success').text('Upload successful!');
                        lastSyncElement.text(new Date().toLocaleString());
                        showPopup('Data uploaded successfully! Your data has been saved to the cloud.');
                    } else {
                        const result = await syncSystem.downloadData('jsonstorage', config);
                        statusElement.removeClass('loading error').addClass('success').text('Download successful!');
                        lastSyncElement.text(new Date().toLocaleString());

                        let message = `Data downloaded successfully! Applied ${result.appliedCount} settings.`;
                        if (result.allUsers && result.allUsers.length > 1) {
                            message += `\n\nAvailable user UUIDs in cloud storage: ${result.allUsers.join(', ')}`;
                        }

                        showPopup(message);

                        // Refresh the page to apply downloaded settings
                        setTimeout(() => {
                            if (confirm('Settings have been updated. Refresh the page to see changes?')) {
                                location.reload();
                            }
                        }, 2000);
                    }

                } catch (error) {
                    console.error('Sync operation failed:', error);
                    statusElement.removeClass('loading success').addClass('error').text(`Error: ${error.message}`);
                    showPopup(`Sync failed: ${error.message}`);
                } finally {
                    // Re-enable buttons
                    $(`#${syncType}-sync-upload, #${syncType}-sync-download`).prop('disabled', false);

                    // Clear status after 5 seconds
                    setTimeout(() => {
                        statusElement.removeClass('success error loading').text('');
                    }, 5000);
                }
            }





// Nhentai Plus+.user.js (2522-2535)
// Initialize the visibility of the find-similar-options div based on the initial state of the findSimilarEnabled checkbox
$('#find-similar-options').toggle(findSimilarEnabled);

// Add event listener to toggle the find-similar-options div when the findSimilarEnabled checkbox is changed
$('#findSimilarEnabled').on('change', function() {
    const isChecked = $(this).is(':checked');
    $('#find-similar-options').toggle(isChecked);
});

        // Toggle auto login credentials
        $('#autoLoginEnabled').on('change', function() {
            $('#autoLoginCredentials').toggle(this.checked);
        });



            // Add expand/collapse functionality for new page management section
            // Add expand/collapse functionality for new page management section
            const pageManagementExpanded = await GM.getValue('pageManagementExpanded', false);
            $('#page-management-content').toggle(pageManagementExpanded);
            $('#page-management h3').toggleClass('expanded', pageManagementExpanded);
            $('#page-management h3').click(async function() {
                const isExpanded = $(this).hasClass('expanded');
                $(this).toggleClass('expanded', !isExpanded);
                $('#page-management-content').slideToggle();
                await GM.setValue('pageManagementExpanded', !isExpanded);
            });

            // Add expand/collapse functionality for Random Hentai Preferences section
            const randomSettingsExpanded = await GM.getValue('randomSettingsExpanded', false);
            $('#random-settings-content').toggle(randomSettingsExpanded);
            $('#random-settings h3').toggleClass('expanded', randomSettingsExpanded);
            $('#random-settings h3').click(async function() {
                const isExpanded = $(this).hasClass('expanded');
                $(this).toggleClass('expanded', !isExpanded);
                $('#random-settings-content').slideToggle();
                await GM.setValue('randomSettingsExpanded', !isExpanded);
            });

            // Add expand/collapse functionality for Online Data Sync section
            const onlineSyncExpanded = await GM.getValue('onlineSyncExpanded', false);
            $('#online-sync-settings-content').toggle(onlineSyncExpanded);
            $('#online-sync-settings h3').toggleClass('expanded', onlineSyncExpanded);
            $('#online-sync-settings h3').click(async function() {
                const isExpanded = $(this).hasClass('expanded');
                $(this).toggleClass('expanded', !isExpanded);
                $('#online-sync-settings-content').slideToggle();
                await GM.setValue('onlineSyncExpanded', !isExpanded);
            });


                // Show or hide the random options based on the enableRandomButton value
            if (enableRandomButton) {
                $('#random-options').show();
            } else {
                $('#random-options').hide();
            }

            // Add an event listener to the enableRandomButton to show or hide the random options
            $('#enableRandomButton').on('change', function() {
                if ($(this).is(':checked')) {
                    $('#random-options').show();
                } else {
                    $('#random-options').hide();
                }
            });


            $('#max-manga-per-bookmark-slider').on('input', function() {
                const value = parseInt($(this).val());
                $('#max-manga-per-bookmark-on-mobile-value').text(value);
                //GM.setValue('maxMangaPerBookmark', value);
              });

              (async function() {
                const maxMangaPerBookmark = await GM.getValue('maxMangaPerBookmark', 5);
                $('#max-manga-per-bookmark-slider').val(maxMangaPerBookmark);
                $('#max-manga-per-bookmark-on-mobile-value').text(maxMangaPerBookmark);
              })();

            $('.tooltip').toggle(tooltipsEnabled);
            $('#tooltipsEnabled').on('change', function() {
                $('.tooltip').toggle(this.checked);
            });

            if (findAltMangaThumbnailEnabled){
                $('#find-Alt-Manga-Thumbnail-options').show();

            }
            $('#findAltMangaThumbnailEnabled').on('change', function() {
                if ($(this).prop('checked')) {
                    $('#find-Alt-Manga-Thumbnail-options').show();
                } else {
                    $('#find-Alt-Manga-Thumbnail-options').hide();
                }
            });
            if(bookmarksPageEnabled){

                $('#bookmark-page-options').show();
            }

            $('#bookmarksPageEnabled').on('change', function() {
                if ($(this).prop('checked')) {
                    $('#bookmark-page-options').show();
                } else {
                    $('#bookmark-page-options').hide();
                }
            });

            // Show/hide flip button setting based on related bookmarks setting
            if ($('#replaceRelatedWithBookmarks').prop('checked')) {
                $('#enableRelatedFlipButton').closest('label').show();
            } else {
                $('#enableRelatedFlipButton').closest('label').hide();
            }

            // Add event listener to toggle flip button setting visibility 
            $('#replaceRelatedWithBookmarks').on('change', function() {
                if ($(this).prop('checked')) {
                    $('#enableRelatedFlipButton').closest('label').show();
                } else {
                    $('#enableRelatedFlipButton').closest('label').hide();
                }
            });

            if (mangaBookMarkingButtonEnabled) {
                $('#manga-bookmarking-options').show();
            }

            if (mangaBookMarkingType === 'cover') {
                $('#manga-bookmarking-cover').prop('checked', true);
            } else if (mangaBookMarkingType === 'title') {
                $('#manga-bookmarking-title').prop('checked', true);
            } else if (mangaBookMarkingType === 'both') {
                $('#manga-bookmarking-both').prop('checked', true);
            }

            // Initialize bookmark arrangement dropdown
            $('#bookmark-arrangement-type').val(bookmarkArrangementType);

            $('#mangaBookMarkingButtonEnabled').on('change', function() {
                if ($(this).prop('checked')) {
                    $('#manga-bookmarking-options').show();
                } else {
                    $('#manga-bookmarking-options').hide();
                }
            });

            $('#showNonEnglishSelect').on('change', async () => {
                const showNonEnglish = $('#showNonEnglishSelect').val();
                await GM.setValue('showNonEnglish', showNonEnglish);
                applyNonEnglishStyles();
            });

// Check if openInNewTabEnabled is true, if not, hide the options
if (openInNewTabEnabled) {
  $('#open-in-New-Tab-options').show();
}

// Add event listeners to the radio buttons
$('#open-in-new-tab-background').change(function() {
  if (this.checked) {
    GM.setValue('openInNewTabType', 'background');
  }
});

$('#open-in-new-tab-foreground').change(function() {
  if (this.checked) {
    GM.setValue('openInNewTabType', 'foreground');
  }
});

// Initialize the radio buttons based on the stored value
if (openInNewTabType === 'background') {
  $('#open-in-new-tab-background').prop('checked', true);
} else {
  $('#open-in-new-tab-foreground').prop('checked', true);
}

// Update the openInNewTabEnabled value in storage when the checkbox is changed
$('#openInNewTabEnabled').change(function() {
  const openInNewTabEnabled = this.checked;
  GM.setValue('openInNewTabEnabled', openInNewTabEnabled);
  if (!openInNewTabEnabled) {
    GM.setValue('openInNewTabType', null);
  }
  $('#open-in-New-Tab-options').toggle(openInNewTabEnabled);
});
        })();

        // Save settings
        $('#settingsForm').on('submit', async function(event) {
            event.preventDefault();

            const findSimilarEnabled = $('#findSimilarEnabled').prop('checked');
            const englishFilterEnabled = $('#englishFilterEnabled').prop('checked');
            const autoLoginEnabled = $('#autoLoginEnabled').prop('checked');
            const email = $('#email').val();
            const password = $('#password').val();
            const findAltmangaEnabled = $('#findAltmangaEnabled').prop('checked');
            const bookmarksEnabled = $('#bookmarksEnabled').prop('checked');
            const language = $('#pref-language').val();
            let tags = $('#pref-tags').val().split(',').map(tag => tag.trim());
            tags = tags.map(tag => tag.replace(/-/g, ' ')); // Replace hyphens with spaces
            let blacklistedTags = $('#blacklisted-tags').val().split(',').map(tag => tag.trim());
            blacklistedTags = blacklistedTags.map(tag => tag.replace(/-/g, ' ')); // Replace hyphens with spaces
            const mustAddTagsEnabled = $('#mustAddTagsEnabled').is(':checked');
            let mustAddTags = [];
            if (mustAddTagsEnabled) {
                mustAddTags = $('#must-add-tags').val().split(',').map(tag => tag.trim());
                mustAddTags = mustAddTags.map(tag => tag.replace(/-/g, ' ')); // Replace hyphens with spaces
            }
            const pagesMin = $('#pref-pages-min').val();
            const pagesMax = $('#pref-pages-max').val();
            const matchAllTags = $('#matchAllTags').prop('checked');
            const findAltMangaThumbnailEnabled = $('#findAltMangaThumbnailEnabled').prop('checked');
            const openInNewTabEnabled = $('#openInNewTabEnabled').prop('checked');
            const mangaBookMarkingButtonEnabled = $('#mangaBookMarkingButtonEnabled').prop('checked');
            const mangaBookMarkingType = $('input[name="manga-bookmarking-type"]:checked').val();
            const bookmarkArrangementType = $('#bookmark-arrangement-type').val();
            const monthFilterEnabled = $('#monthFilterEnabled').prop('checked');
            const tooltipsEnabled = $('#tooltipsEnabled').prop('checked');
            const mangagroupingenabled = $('#mangagroupingenabled').prop('checked');
            const maxMangaPerBookmark = parseInt($('#max-manga-per-bookmark-slider').val());
            const openInNewTabType = $('input[name="open-in-new-tab"]:checked').val();
            const offlineFavoritingEnabled = $('#offlineFavoritingEnabled').prop('checked');
            const offlineFavoritesPageEnabled = $('#offlineFavoritesPageEnabled').prop('checked');
            const nfmPageEnabled = $('#nfmPageEnabled').prop('checked');
            const bookmarksPageEnabled = $('#bookmarksPageEnabled').prop('checked');
            const replaceRelatedWithBookmarks = $('#replaceRelatedWithBookmarks').prop('checked');
            const enableRelatedFlipButton = $('#enableRelatedFlipButton').prop('checked');
            const twitterButtonEnabled = $('#twitterButtonEnabled').prop('checked');
            const enableRandomButton = $('#enableRandomButton').prop('checked');
            const randomOpenType = $('input[name="random-open-type"]:checked').val();
            const profileButtonEnabled = $('#profileButtonEnabled').prop('checked');
            const infoButtonEnabled = $('#infoButtonEnabled').prop('checked');
            const logoutButtonEnabled = $('#logoutButtonEnabled').prop('checked');
            const bookmarkLinkEnabled = $('#bookmarkLinkEnabled').prop('checked');
            const findSimilarType = $('input[name="find-similar-type"]:checked').val();
            const showNonEnglish = await GM.getValue('showNonEnglish', 'show');
            const showPageNumbersEnabled = $('#showPageNumbersEnabled').prop('checked');

            // Collect sync settings
            const publicSyncEnabledForm = $('#publicSyncEnabled').prop('checked');
            const privateSyncEnabledForm = $('#privateSyncEnabled').prop('checked');
            const privateStorageUrlForm = $('#privateStorageUrl').val();
            const privateApiKeyForm = $('#privateApiKey').val();
            const autoSyncEnabledForm = $('#autoSyncEnabled').prop('checked');
            const syncIntervalForm = parseInt($('#syncInterval').val());








            await GM.setValue('showNonEnglish', showNonEnglish);
            await GM.setValue('showPageNumbersEnabled', showPageNumbersEnabled);
            await GM.setValue('findSimilarEnabled', findSimilarEnabled);
            await GM.setValue('englishFilterEnabled', englishFilterEnabled);
            await GM.setValue('autoLoginEnabled', autoLoginEnabled);
            await GM.setValue('email', email);
            await GM.setValue('password', password);
            await GM.setValue('findAltmangaEnabled', findAltmangaEnabled);
            await GM.setValue('bookmarksEnabled', bookmarksEnabled);
            await GM.setValue('randomPrefLanguage', language);
            await GM.setValue('blacklistedTags', blacklistedTags);
            await GM.setValue('mustAddTagsEnabled', mustAddTagsEnabled);
            await GM.setValue('mustAddTags', mustAddTags);
            await GM.setValue('randomPrefTags', tags);
            await GM.setValue('randomPrefPagesMin', pagesMin);
            await GM.setValue('randomPrefPagesMax', pagesMax);
            await GM.setValue('matchAllTags', matchAllTags);
            await GM.setValue('findAltMangaThumbnailEnabled', findAltMangaThumbnailEnabled);
            await GM.setValue('openInNewTabEnabled', openInNewTabEnabled);
            await GM.setValue('mangaBookMarkingButtonEnabled', mangaBookMarkingButtonEnabled);
            await GM.setValue('mangaBookMarkingType', mangaBookMarkingType);
            await GM.setValue('bookmarkArrangementType', bookmarkArrangementType);
            await GM.setValue('monthFilterEnabled', monthFilterEnabled);
            await GM.setValue('tooltipsEnabled', tooltipsEnabled);
            await GM.setValue('mangagroupingenabled', mangagroupingenabled);
            await GM.setValue('maxMangaPerBookmark', maxMangaPerBookmark);
            await GM.setValue('openInNewTabType', openInNewTabType);
            await GM.setValue('offlineFavoritingEnabled', offlineFavoritingEnabled);
            await GM.setValue('offlineFavoritesPageEnabled', offlineFavoritesPageEnabled);
            await GM.setValue('nfmPageEnabled', nfmPageEnabled);
            await GM.setValue('bookmarksPageEnabled', bookmarksPageEnabled);
            await GM.setValue('replaceRelatedWithBookmarks', replaceRelatedWithBookmarks);
            await GM.setValue('enableRelatedFlipButton', enableRelatedFlipButton);
            await GM.setValue('twitterButtonEnabled', twitterButtonEnabled);
            await GM.setValue('enableRandomButton', enableRandomButton);
            await GM.setValue('randomOpenType', randomOpenType);
            await GM.setValue('profileButtonEnabled', profileButtonEnabled);
            await GM.setValue('infoButtonEnabled', infoButtonEnabled);
            await GM.setValue('logoutButtonEnabled', logoutButtonEnabled);
            await GM.setValue('bookmarkLinkEnabled', bookmarkLinkEnabled);
            await GM.setValue('findSimilarType', findSimilarType);

            // Save sync settings
            await GM.setValue('publicSyncEnabled', publicSyncEnabledForm);
            await GM.setValue('privateSyncEnabled', privateSyncEnabledForm);
            await GM.setValue('privateStorageUrl', privateStorageUrlForm);
            await GM.setValue('privateApiKey', privateApiKeyForm);
            await GM.setValue('autoSyncEnabled', autoSyncEnabledForm);
            await GM.setValue('syncInterval', syncIntervalForm);

            // Update AutoSync Manager with new settings
            await autoSyncManager.updateSettings(autoSyncEnabledForm, syncIntervalForm);









    // Show custom popup instead of alert
    showPopup('Settings saved!');
        });






  // Import Bookmarked Pages
  async function importBookmarkedPages(file) {
    try {
      const reader = new FileReader();
      const fileContent = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });

      const importedBookmarks = JSON.parse(fileContent);
      if (!Array.isArray(importedBookmarks)) {
        throw new Error('Invalid file format');
      }

      const existingBookmarks = await GM.getValue('bookmarkedPages', []);
      const mergedBookmarks = [...new Set([...existingBookmarks, ...importedBookmarks])]; // Merge without duplicates
      await GM.setValue('bookmarkedPages', mergedBookmarks);
      alert('Bookmarks imported successfully!');
    } catch (error) {
      alert(`Failed to import bookmarks: ${error.message}`);
    }
  }


    // Add event listeners to buttons on the settings page
    function setupBookmarkButtons() {
      // Export Button
      document.getElementById('exportBookmarks').addEventListener('click', exportBookmarkedPages);

      // Import Button
      document.getElementById('importBookmarks').addEventListener('click', () => {
        document.getElementById('importBookmarksFile').click();
      });

      // Handle file selection for import
      document.getElementById('importBookmarksFile').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          importBookmarkedPages(file);
        }
      });
    }


    // Call this function after settings form is rendered
    setupBookmarkButtons();

//------------------------------------------------ Advanced Settings Management Functions---------------------------------------------------------

    // Toggle advanced settings section
    const advancedHeader = document.querySelector('#advanced-settings h3');
    const advancedContent = document.getElementById('advanced-settings-content');

    if (!advancedHeader) {
        console.error('Advanced settings header not found');
        return;
    }

    if (!advancedContent) {
        console.error('Advanced settings content not found');
        return;
    }

    console.log('Advanced header found:', advancedHeader);
    console.log('Initial display state:', advancedContent.style.display);

    advancedHeader.addEventListener('click', function() {
        console.log('Header clicked');
        advancedContent.style.display = (advancedContent.style.display === 'none' || advancedContent.style.display === '') ? 'block' : 'none';
        console.log('New display state:', advancedContent.style.display);

        // Toggle the expanded class
        advancedHeader.classList.toggle('expanded', advancedContent.style.display === 'block');
        console.log('Classes after toggle:', advancedHeader.className);

        if (advancedContent.style.display === 'block') {
            refreshStorageData();
        }
    });




    // Refresh storage button
    const refreshBtn = document.getElementById('refresh-storage');
    refreshBtn.addEventListener('click', refreshStorageData);

    // Modal controls
    const editModal = document.getElementById('edit-value-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveEditBtn = document.getElementById('save-edit');

    cancelEditBtn.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    saveEditBtn.addEventListener('click', function() {
        const keyName = document.getElementById('editing-key-name').dataset.key;
        const newValue = document.getElementById('edit-value-textarea').value;

        try {
            // Try to parse the JSON to validate it
            const parsedValue = JSON.parse(newValue);

            // Save the changes to GM storage
            GM.setValue(keyName, parsedValue)
                .then(() => {
                    alert('Value saved successfully!');
                    editModal.style.display = 'none';
                    refreshStorageData();
                })
                .catch(err => {
                    alert('Error saving value: ' + err.message);
                });
        } catch (e) {
            alert('Invalid JSON format. Please check your input.');
        }
    });

// Function to refresh storage data with mobile-friendly layout
function refreshStorageData() {
    const keysList = document.getElementById('storage-keys-list');
    keysList.innerHTML = '<p>Loading storage data...</p>';

    // Use GM.listValues() to get all keys
    GM.listValues()
        .then(keys => {
            if (keys.length === 0) {
                keysList.innerHTML = '<p>No data found in storage.</p>';
                return;
            }

            keysList.innerHTML = '';

            // Sort keys alphabetically for easier navigation
            keys.sort();

            // Process each key
            Promise.all(keys.map(key => {
                return GM.getValue(key)
                    .then(value => {
                        return { key, value };
                    });
            }))
            .then(items => {
                // Create responsive container
                const container = document.createElement('div');
                container.style.width = '100%';

                // Add media query detection
                const isMobile = window.matchMedia("(max-width: 600px)").matches;

                if (isMobile) {
                    // Mobile view: Card-based layout
                    items.forEach(item => {
                        const card = document.createElement('div');
                        card.style.border = '1px solid #444';
                        card.style.borderRadius = '4px';
                        card.style.padding = '10px';
                        card.style.marginBottom = '15px';
                        card.style.backgroundColor = '#2a2a2a';

                        // Key
                        const keyDiv = document.createElement('div');
                        keyDiv.style.fontWeight = 'bold';
                        keyDiv.style.marginBottom = '5px';
                        keyDiv.style.wordBreak = 'break-word';
                        keyDiv.textContent = item.key;
                        card.appendChild(keyDiv);

                        // Type and Size
                        const infoDiv = document.createElement('div');
                        infoDiv.style.display = 'flex';
                        infoDiv.style.justifyContent = 'space-between';
                        infoDiv.style.marginBottom = '10px';
                        infoDiv.style.fontSize = '0.9em';
                        infoDiv.style.color = '#aaa';

                        const typeSpan = document.createElement('span');
                        typeSpan.textContent = `Type: ${getValueType(item.value)}`;

                        const sizeSpan = document.createElement('span');
                        sizeSpan.textContent = `Size: ${getValueSize(item.value)}`;

                        infoDiv.appendChild(typeSpan);
                        infoDiv.appendChild(sizeSpan);
                        card.appendChild(infoDiv);

                        // Actions
                        const actionDiv = document.createElement('div');
                        actionDiv.style.display = 'flex';
                        actionDiv.style.gap = '10px';

                        const viewBtn = document.createElement('button');
                        viewBtn.textContent = 'View/Edit';
                        viewBtn.style.flex = '1';
                        viewBtn.style.padding = '8px';
                        viewBtn.style.backgroundColor = '#444';
                        viewBtn.style.border = 'none';
                        viewBtn.style.borderRadius = '4px';
                        viewBtn.style.color = 'white';
                        viewBtn.style.cursor = 'pointer';

                        viewBtn.addEventListener('click', function() {
                            openEditModal(item.key, item.value);
                        });

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.style.flex = '1';
                        deleteBtn.style.padding = '8px';
                        deleteBtn.style.backgroundColor = '#d9534f';
                        deleteBtn.style.border = 'none';
                        deleteBtn.style.borderRadius = '4px';
                        deleteBtn.style.color = 'white';
                        deleteBtn.style.cursor = 'pointer';

                        deleteBtn.addEventListener('click', function() {
                            if (confirm(`Are you sure you want to delete "${item.key}"?`)) {
                                GM.deleteValue(item.key)
                                    .then(() => {
                                        refreshStorageData();
                                    })
                                    .catch(err => {
                                        alert('Error deleting value: ' + err.message);
                                    });
                            }
                        });

                        actionDiv.appendChild(viewBtn);
                        actionDiv.appendChild(deleteBtn);
                        card.appendChild(actionDiv);

                        container.appendChild(card);
                    });
                } else {
                    // Desktop view: Table layout
                    const table = document.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    table.style.marginTop = '10px';

                    // Create table header
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    ['Key', 'Type', 'Size', 'Actions'].forEach(text => {
                        const th = document.createElement('th');
                        th.textContent = text;
                        th.style.textAlign = 'left';
                        th.style.padding = '8px';
                        th.style.backgroundColor = '#2a2a2a';
                        th.style.borderBottom = '1px solid #444';
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    // Create table body
                    const tbody = document.createElement('tbody');

                    items.forEach(item => {
                        const row = document.createElement('tr');
                        row.style.borderBottom = '1px solid #333';

                        // Key column
                        const keyCell = document.createElement('td');
                        keyCell.textContent = item.key;
                        keyCell.style.padding = '8px';
                        keyCell.style.maxWidth = '200px';
                        keyCell.style.overflow = 'hidden';
                        keyCell.style.textOverflow = 'ellipsis';
                        keyCell.style.whiteSpace = 'nowrap';

                        // Type column
                        const typeCell = document.createElement('td');
                        typeCell.textContent = getValueType(item.value);
                        typeCell.style.padding = '8px';

                        // Size column
                        const sizeCell = document.createElement('td');
                        sizeCell.textContent = getValueSize(item.value);
                        sizeCell.style.padding = '8px';

                        // Actions column
                        const actionsCell = document.createElement('td');
                        actionsCell.style.padding = '8px';

                        const actionWrapper = document.createElement('div');
                        actionWrapper.style.display = 'flex';
                        actionWrapper.style.gap = '5px';

                        const viewBtn = document.createElement('button');
                        viewBtn.textContent = 'View/Edit';
                        viewBtn.style.padding = '3px 8px';
                        viewBtn.style.backgroundColor = '#444';
                        viewBtn.style.border = 'none';
                        viewBtn.style.borderRadius = '2px';
                        viewBtn.style.color = 'white';
                        viewBtn.style.cursor = 'pointer';

                        viewBtn.addEventListener('click', function() {
                            openEditModal(item.key, item.value);
                        });

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.style.padding = '3px 8px';
                        deleteBtn.style.backgroundColor = '#d9534f';
                        deleteBtn.style.border = 'none';
                        deleteBtn.style.borderRadius = '2px';
                        deleteBtn.style.color = 'white';
                        deleteBtn.style.cursor = 'pointer';

                        deleteBtn.addEventListener('click', function() {
                            if (confirm(`Are you sure you want to delete "${item.key}"?`)) {
                                GM.deleteValue(item.key)
                                    .then(() => {
                                        refreshStorageData();
                                    })
                                    .catch(err => {
                                        alert('Error deleting value: ' + err.message);
                                    });
                            }
                        });

                        actionWrapper.appendChild(viewBtn);
                        actionWrapper.appendChild(deleteBtn);
                        actionsCell.appendChild(actionWrapper);

                        // Add all cells to the row
                        row.appendChild(keyCell);
                        row.appendChild(typeCell);
                        row.appendChild(sizeCell);
                        row.appendChild(actionsCell);

                        // Add row to table body
                        tbody.appendChild(row);
                    });

                    table.appendChild(tbody);
                    container.appendChild(table);
                }

                keysList.appendChild(container);

                // Add option to create new key
                const addNewSection = document.createElement('div');
                addNewSection.style.marginTop = '20px';

                const addNewHeading = document.createElement('h4');
                addNewHeading.textContent = 'Add New Storage Key';
                addNewSection.appendChild(addNewHeading);

                const addNewForm = document.createElement('div');
                addNewForm.style.display = 'flex';
                addNewForm.style.gap = '10px';
                addNewForm.style.marginTop = '10px';
                addNewForm.style.flexWrap = 'wrap'; // Allow wrapping on small screens

                const keyInput = document.createElement('input');
                keyInput.type = 'text';
                keyInput.placeholder = 'Key name';
                keyInput.style.flex = '1';
                keyInput.style.padding = '8px';
                keyInput.style.backgroundColor = '#333';
                keyInput.style.border = '1px solid #444';
                keyInput.style.color = '#fff';
                keyInput.style.borderRadius = '4px';
                keyInput.style.minWidth = '120px'; // Ensure minimum usable width

                const valueInput = document.createElement('input');
                valueInput.type = 'text';
                valueInput.placeholder = 'Value (valid JSON)';
                valueInput.style.flex = '2';
                valueInput.style.padding = '8px';
                valueInput.style.backgroundColor = '#333';
                valueInput.style.border = '1px solid #444';
                valueInput.style.color = '#fff';
                valueInput.style.borderRadius = '4px';
                valueInput.style.minWidth = '150px'; // Ensure minimum usable width

                const addBtn = document.createElement('button');
                addBtn.textContent = 'Add';
                addBtn.style.padding = '8px';
                addBtn.style.backgroundColor = '#28a745';
                addBtn.style.border = 'none';
                addBtn.style.borderRadius = '4px';
                addBtn.style.color = 'white';
                addBtn.style.cursor = 'pointer';

                addBtn.addEventListener('click', function() {
                    const key = keyInput.value.trim();
                    const value = valueInput.value.trim();

                    if (!key) {
                        alert('Please enter a key name.');
                        return;
                    }

                    if (!value) {
                        alert('Please enter a value.');
                        return;
                    }

                    try {
                        const parsedValue = JSON.parse(value);

                        GM.setValue(key, parsedValue)
                            .then(() => {
                                alert('New key added successfully!');
                                keyInput.value = '';
                                valueInput.value = '';
                                refreshStorageData();
                            })
                            .catch(err => {
                                alert('Error adding new key: ' + err.message);
                            });
                    } catch (e) {
                        alert('Invalid JSON format. Please check your input.');
                    }
                });

                addNewForm.appendChild(keyInput);
                addNewForm.appendChild(valueInput);
                addNewForm.appendChild(addBtn);

                addNewSection.appendChild(addNewForm);
                keysList.appendChild(addNewSection);

                // Add export/import buttons
                const buttonSection = document.createElement('div');
                buttonSection.style.marginTop = '20px';
                buttonSection.style.display = 'flex';
                buttonSection.style.gap = '10px';
                buttonSection.style.flexWrap = 'wrap'; // Allow buttons to wrap on small screens

                const exportBtn = document.createElement('button');
                exportBtn.textContent = 'Export All Storage Data';
                exportBtn.style.padding = '10px';
                exportBtn.style.backgroundColor = '#007bff';
                exportBtn.style.border = 'none';
                exportBtn.style.borderRadius = '4px';
                exportBtn.style.color = 'white';
                exportBtn.style.cursor = 'pointer';
                exportBtn.style.flex = '1';
                exportBtn.style.minWidth = isMobile ? '100%' : '150px';

                exportBtn.addEventListener('click', function() {
                    const exportData = {};
                    items.forEach(item => {
                        exportData[item.key] = item.value;
                    });

                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

                    const exportLink = document.createElement('a');
                    exportLink.setAttribute('href', dataUri);
                    exportLink.setAttribute('download', 'userscript_storage_backup.json');
                    exportLink.click();
                });

                const importInput = document.createElement('input');
                importInput.type = 'file';
                importInput.accept = '.json';
                importInput.style.display = 'none';
                importInput.id = 'import-storage-file';

                const importBtn = document.createElement('button');
                importBtn.textContent = 'Import Storage Data';
                importBtn.style.padding = '10px';
                importBtn.style.backgroundColor = '#6c757d';
                importBtn.style.border = 'none';
                importBtn.style.borderRadius = '4px';
                importBtn.style.color = 'white';
                importBtn.style.cursor = 'pointer';
                importBtn.style.flex = '1';
                importBtn.style.minWidth = isMobile ? '100%' : '150px';

                importBtn.addEventListener('click', function() {
                    importInput.click();
                });

                importInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const importData = JSON.parse(e.target.result);

                            if (confirm(`This will import ${Object.keys(importData).length} keys. Continue?`)) {
                                // Process each key in the import data
                                const importPromises = Object.entries(importData).map(([key, value]) => {
                                    return GM.setValue(key, value);
                                });

                                Promise.all(importPromises)
                                    .then(() => {
                                        alert('Import completed successfully!');
                                        refreshStorageData();
                                    })
                                    .catch(err => {
                                        alert('Error during import: ' + err.message);
                                    });
                            }
                        } catch (e) {
                            alert('Invalid JSON file. Please check the file format.');
                        }
                    };
                    reader.readAsText(file);
                });

                buttonSection.appendChild(exportBtn);
                buttonSection.appendChild(importBtn);
                buttonSection.appendChild(importInput);
                keysList.appendChild(buttonSection);
            })
            .catch(err => {
                keysList.innerHTML = `<p>Error processing storage data: ${err.message}</p>`;
            });
        })
        .catch(err => {
            keysList.innerHTML = `<p>Error loading storage data: ${err.message}</p>`;
        });
}

    // Function to open the edit modal
    function openEditModal(key, value) {
        const editModal = document.getElementById('edit-value-modal');
        const keyNameElem = document.getElementById('editing-key-name');
        const valueTextarea = document.getElementById('edit-value-textarea');

        keyNameElem.textContent = `Key: ${key}`;
        keyNameElem.dataset.key = key;

        // Format the JSON for better readability
        const formattedValue = JSON.stringify(value, null, 2);
        valueTextarea.value = formattedValue;

        editModal.style.display = 'block';
    }

    // Helper function to get the type of a value
    function getValueType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    // Helper function to get the size of a value
    function getValueSize(value) {
        const json = JSON.stringify(value);
        const bytes = new Blob([json]).size;

        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }



    }

            // Initialize tab arrangement functionality
            initializeTabSorting();
            updateMenuOrder();

            // Initialize Bookmarks Page Arrangement functionality
            initializeBookmarksSorting();

            // Initialize bookmarks page order from storage or use default order
            async function initializeBookmarksOrder() {
                const defaultOrder = ['bookmarksTitle', 'searchInput', 'tagSearchInput', 'bookmarksList', 'mangaBookmarksTitle', 'mangaBookmarksList'];
                const savedOrder = await GM.getValue('bookmarksContainerOrder');
                return savedOrder || defaultOrder;
            }

            // Function to initialize the bookmarks page sorting functionality
            function initializeBookmarksSorting() {
                const bookmarksList = document.getElementById('bookmarks-list');
                if (!bookmarksList) return;

                // Initialize bookmarks list with saved order
                initializeBookmarksOrder().then(bookmarksOrder => {
                    // Reorder the list items according to the saved order
                    const listItems = Array.from(bookmarksList.children);
                    const tempContainer = document.createDocumentFragment();

                    bookmarksOrder.forEach(elementName => {
                        const item = listItems.find(li => li.dataset.element === elementName);
                        if (item) tempContainer.appendChild(item);
                    });

                    // Clear the list and add all items in the new order
                    while (bookmarksList.firstChild) {
                        bookmarksList.removeChild(bookmarksList.firstChild);
                    }

                    bookmarksList.appendChild(tempContainer);
                });

                // Initialize Sortable.js for Bookmarks Page Arrangement
                new Sortable(bookmarksList, {
                    animation: 150,
                    handle: '.handle',
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    forceFallback: true,
                    fallbackTolerance: 1,
                    delayOnTouchOnly: false,
                    delay: 0,
                    touchStartThreshold: 1,
                    preventTextSelection: true,
                    onStart: function(evt) {
                        evt.item.classList.add('dragging');
                        document.body.style.userSelect = 'none';
                        document.body.style.webkitUserSelect = 'none';
                        document.body.style.mozUserSelect = 'none';
                        document.body.style.msUserSelect = 'none';
                    },
                    onEnd: async function(evt) {
                        evt.item.classList.remove('dragging');
                        document.body.style.userSelect = '';
                        document.body.style.webkitUserSelect = '';
                        document.body.style.mozUserSelect = '';
                        document.body.style.msUserSelect = '';
                        const newOrder = Array.from(bookmarksList.children).map(item => item.dataset.element);
                        await GM.setValue('bookmarksContainerOrder', newOrder);
                    }
                });

                // Add mouse event listeners to improve drag handle feedback
                bookmarksList.querySelectorAll('.handle').forEach(handle => {
                    handle.addEventListener('mousedown', () => {
                        handle.style.cursor = 'grabbing';
                    });
                    handle.addEventListener('mouseup', () => {
                        handle.style.cursor = 'grab';
                    });
                });

                // Reset button handler
                document.getElementById('resetBookmarksOrder').addEventListener('click', async function() {
                    const defaultOrder = ['bookmarksTitle', 'searchInput', 'tagSearchInput', 'bookmarksList', 'mangaBookmarksTitle', 'mangaBookmarksList'];
                    await GM.setValue('bookmarksContainerOrder', defaultOrder);

                    showPopup('Bookmarks page order reset!', {timeout: 1000});

                    // Reset visual order in settings
                    const bookmarksList = document.getElementById('bookmarks-list');
                    defaultOrder.forEach(elementName => {
                        const item = bookmarksList.querySelector(`[data-element="${elementName}"]`);
                        if (item) bookmarksList.appendChild(item);
                    });
                });
            }



            // Initialize tab order from storage or use default order
            async function initializeTabOrder() {
                const defaultOrder = ['random', 'tags', 'artists', 'characters', 'parodies', 'groups', 'info', 'twitter', 'bookmarks', 'offline_favorites', 'continue_reading', 'settings'];
                const savedOrder = await GM.getValue('tabOrder');
                return savedOrder || defaultOrder;
            }

            // Function to update the menu based on tab order
            async function updateMenuOrder() {
                const tabOrder = await initializeTabOrder();
                const menu = document.querySelector('ul.menu.left');
                const dropdown = document.querySelector('ul.dropdown-menu');

                if (!menu || !dropdown) return;

                // Get all menu items (both desktop and injected)
                const allMenuItems = Array.from(menu.querySelectorAll('li:not(.dropdown)'));

                // Create a temporary container to hold items during reordering
                const tempContainer = document.createDocumentFragment();

                // Process each tab in the desired order
                for (const tabId of tabOrder) {
                    // Find the menu item for this tab
                    const menuItem = allMenuItems.find(li => {
                        const link = li.querySelector('a');
                        if (!link) return false;

                        const href = link.getAttribute('href');
                        // Special case for Twitter which is an external link
                        if (tabId === 'twitter' && href.includes('twitter.com/nhentaiOfficial')) {
                            return true;
                        }
                        // Special case for Offline Favorites
                        if (tabId === 'offline_favorites' && href.includes('/favorite/')) {
                            return true;
                        }
                        // Regular case for internal links
                        return href.includes(`/${tabId}/`);
                    });

                    // If found, move it to our temporary container
                    if (menuItem) {
                        tempContainer.appendChild(menuItem);
                    }
                }

                // Add the dropdown menu item
                const dropdownItem = menu.querySelector('li.dropdown');
                if (dropdownItem) {
                    tempContainer.appendChild(dropdownItem);
                }

                // Clear the menu and add all items in the new order
                while (menu.firstChild) {
                    menu.removeChild(menu.firstChild);
                }

                menu.appendChild(tempContainer);

                // Now update the dropdown menu
                // Clear the dropdown menu first
                while (dropdown.firstChild) {
                    dropdown.removeChild(dropdown.firstChild);
                }

                // Add items to dropdown in the same order
                for (const tabId of tabOrder) {
                    // Find the corresponding desktop item
                    const desktopItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        if (!link) return false;

                        const href = link.getAttribute('href');
                        // Special case for Twitter which is an external link
                        if (tabId === 'twitter' && href.includes('twitter.com/nhentaiOfficial')) {
                            return true;
                        }
                        // Regular case for internal links
                        return href.includes(`/${tabId}/`);
                    });

                    if (desktopItem) {
                        // Clone the link and create a new dropdown item
                        const link = desktopItem.querySelector('a');
                        if (link) {
                            const dropdownLi = document.createElement('li');
                            dropdownLi.innerHTML = `<a href="${link.getAttribute('href')}">${link.textContent}</a>`;
                            dropdown.appendChild(dropdownLi);
                        }
                    }
                }
            }

            // Helper function to find the reference item for insertion
            function findReferenceItem(menu, tabOrder, currentIndex) {
                // Find the previous item in the order that exists in the menu
                for (let i = currentIndex - 1; i >= 0; i--) {
                    const prevTabId = tabOrder[i];
                    const prevItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        return link && link.getAttribute('href').includes(prevTabId);
                    });
                    if (prevItem) return prevItem;
                }
                return null;
            }

            // Initialize Sortable.js for tab arrangement
            function initializeTabSorting() {
                const tabList = document.getElementById('tab-list');
                if (!tabList) return;

                // Initialize tab list with saved order
                initializeTabOrder().then(tabOrder => {
                    // First, check if we need to create the dynamic tab items
                    const bookmarksExists = tabOrder.includes('bookmarks') && !tabList.querySelector('[data-tab="bookmarks"]');
                    const continueReadingExists = tabOrder.includes('continue_reading') && !tabList.querySelector('[data-tab="continue_reading"]');
                    const settingsExists = tabOrder.includes('settings') && !tabList.querySelector('[data-tab="settings"]');

                    // Check if these items exist in the actual menu before adding them to the sortable list
                    const menu = document.querySelector('ul.menu.left');
                    if (menu) {
                        // Only create bookmarks tab item if it exists in the actual menu and not in the DOM
                        const bookmarksInMenu = Array.from(menu.querySelectorAll('li')).some(li => {
                            const link = li.querySelector('a');
                            return link && link.getAttribute('href').includes('/bookmarks/');
                        });

                        if (bookmarksInMenu && bookmarksExists) {
                            const bookmarksTabItem = document.createElement('li');
                            bookmarksTabItem.className = 'tab-item';
                            bookmarksTabItem.dataset.tab = 'bookmarks';
                            bookmarksTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Bookmarks';
                            tabList.appendChild(bookmarksTabItem);
                        }

                        // Only create continue reading tab item if it exists in the actual menu and not in the DOM
                        const continueReadingInMenu = Array.from(menu.querySelectorAll('li')).some(li => {
                            const link = li.querySelector('a');
                            return link && link.getAttribute('href').includes('/continue_reading/');
                        });

                        if (continueReadingInMenu && continueReadingExists) {
                            const continueReadingTabItem = document.createElement('li');
                            continueReadingTabItem.className = 'tab-item';
                            continueReadingTabItem.dataset.tab = 'continue_reading';
                            continueReadingTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Continue Reading';
                            tabList.appendChild(continueReadingTabItem);
                        }

                        // Only create settings tab item if it exists in the actual menu and not in the DOM
                        const settingsInMenu = Array.from(menu.querySelectorAll('li')).some(li => {
                            const link = li.querySelector('a');
                            return link && link.getAttribute('href').includes('/settings/');
                        });

                        if (settingsInMenu && settingsExists) {
                            const settingsTabItem = document.createElement('li');
                            settingsTabItem.className = 'tab-item';
                            settingsTabItem.dataset.tab = 'settings';
                            settingsTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Settings';
                            tabList.appendChild(settingsTabItem);
                        }

                        // Check if we need to add the offline favorites tab (only if user is not logged in)
                        const isLoggedIn = !document.querySelector('.menu-sign-in');
                        const offlineFavoritesExists = tabOrder.includes('offline_favorites') && !tabList.querySelector('[data-tab="offline_favorites"]');

                        if (offlineFavoritesExists && !isLoggedIn) {
                            const offlineFavoritesTabItem = document.createElement('li');
                            offlineFavoritesTabItem.className = 'tab-item';
                            offlineFavoritesTabItem.dataset.tab = 'offline_favorites';
                            offlineFavoritesTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Offline Favorites';
                            tabList.appendChild(offlineFavoritesTabItem);
                        }
                    }

                    // Now reorder all tabs according to the saved order
                    tabOrder.forEach(tabId => {
                        const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                        if (item) tabList.appendChild(item);
                    });
                });

                // Check for dynamically added menu items and add them to the tab list
                function checkForDynamicItems() {
                    const menu = document.querySelector('ul.menu.left');
                    if (!menu) return;

                    // Check for Bookmarks
                    const bookmarksItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        return link && link.getAttribute('href').includes('/bookmarks/');
                    });

                    if (bookmarksItem && !tabList.querySelector('[data-tab="bookmarks"]')) {
                        const bookmarksTabItem = document.createElement('li');
                        bookmarksTabItem.className = 'tab-item';
                        bookmarksTabItem.dataset.tab = 'bookmarks';
                        bookmarksTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Bookmarks';
                        tabList.appendChild(bookmarksTabItem);

                        // Reapply the saved order after adding a new item
                        initializeTabOrder().then(tabOrder => {
                            tabOrder.forEach(tabId => {
                                const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                                if (item) tabList.appendChild(item);
                            });
                        });
                    }

                    // Check for Continue Reading
                    const continueReadingItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        return link && link.getAttribute('href').includes('/continue_reading/');
                    });

                    if (continueReadingItem && !tabList.querySelector('[data-tab="continue_reading"]')) {
                        const continueReadingTabItem = document.createElement('li');
                        continueReadingTabItem.className = 'tab-item';
                        continueReadingTabItem.dataset.tab = 'continue_reading';
                        continueReadingTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Continue Reading';
                        tabList.appendChild(continueReadingTabItem);

                        // Reapply the saved order after adding a new item
                        initializeTabOrder().then(tabOrder => {
                            tabOrder.forEach(tabId => {
                                const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                                if (item) tabList.appendChild(item);
                            });
                        });
                    }

                    // Check for Info
                    const infoItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        return link && link.getAttribute('href').includes('/info/');
                    });

                    if (infoItem && !tabList.querySelector('[data-tab="info"]')) {
                        const infoTabItem = document.createElement('li');
                        infoTabItem.className = 'tab-item';
                        infoTabItem.dataset.tab = 'info';
                        infoTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Info';
                        tabList.appendChild(infoTabItem);

                        // Reapply the saved order after adding a new item
                        initializeTabOrder().then(tabOrder => {
                            tabOrder.forEach(tabId => {
                                const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                                if (item) tabList.appendChild(item);
                            });
                        });
                    }

                    // Check for Twitter
                    const twitterItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        return link && link.getAttribute('href').includes('twitter.com/nhentaiOfficial');
                    });

                    if (twitterItem && !tabList.querySelector('[data-tab="twitter"]')) {
                        const twitterTabItem = document.createElement('li');
                        twitterTabItem.className = 'tab-item';
                        twitterTabItem.dataset.tab = 'twitter';
                        twitterTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Twitter';
                        tabList.appendChild(twitterTabItem);

                        // Reapply the saved order after adding a new item
                        initializeTabOrder().then(tabOrder => {
                            tabOrder.forEach(tabId => {
                                const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                                if (item) tabList.appendChild(item);
                            });
                        });
                    }

                    // Check for Settings
                    const settingsItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        return link && link.getAttribute('href').includes('/settings/');
                    });

                    if (settingsItem && !tabList.querySelector('[data-tab="settings"]')) {
                        const settingsTabItem = document.createElement('li');
                        settingsTabItem.className = 'tab-item';
                        settingsTabItem.dataset.tab = 'settings';
                        settingsTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Settings';
                        tabList.appendChild(settingsTabItem);

                        // Reapply the saved order after adding a new item
                        initializeTabOrder().then(tabOrder => {
                            tabOrder.forEach(tabId => {
                                const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                                if (item) tabList.appendChild(item);
                            });
                        });
                    }

                    // Check for Offline Favorites
                    const offlineFavoritesItem = Array.from(menu.querySelectorAll('li')).find(li => {
                        const link = li.querySelector('a');
                        return link && link.getAttribute('href').includes('/favorite/');
                    });

                    if (offlineFavoritesItem && !tabList.querySelector('[data-tab="offline_favorites"]')) {
                        // Check if user is logged in
                        const isLoggedIn = !document.querySelector('.menu-sign-in');

                        // Only add the offline favorites tab if the user is not logged in
                        if (!isLoggedIn) {
                            const offlineFavoritesTabItem = document.createElement('li');
                            offlineFavoritesTabItem.className = 'tab-item';
                            offlineFavoritesTabItem.dataset.tab = 'offline_favorites';
                            offlineFavoritesTabItem.innerHTML = '<i class="fa fa-bars handle"></i> Offline Favorites';
                            tabList.appendChild(offlineFavoritesTabItem);

                            // Reapply the saved order after adding a new item
                            initializeTabOrder().then(tabOrder => {
                                tabOrder.forEach(tabId => {
                                    const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                                    if (item) tabList.appendChild(item);
                                });
                            });
                        }
                    }
                }

                // Check for dynamic items initially and then every second
                checkForDynamicItems();
                setInterval(checkForDynamicItems, 1000);


                new Sortable(tabList, {
                    animation: 150,
                    handle: '.handle',
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    forceFallback: true,
                    fallbackTolerance: 1,
                    delayOnTouchOnly: false,
                    delay: 0,
                    touchStartThreshold: 1,
                    preventTextSelection: true,
                    onStart: function(evt) {
                        evt.item.classList.add('dragging');
                        document.body.style.userSelect = 'none';
                        document.body.style.webkitUserSelect = 'none';
                        document.body.style.mozUserSelect = 'none';
                        document.body.style.msUserSelect = 'none';
                    },
                    onEnd: async function(evt) {
                        evt.item.classList.remove('dragging');
                        document.body.style.userSelect = '';
                        document.body.style.webkitUserSelect = '';
                        document.body.style.mozUserSelect = '';
                        document.body.style.msUserSelect = '';
                        const newOrder = Array.from(tabList.children).map(item => item.dataset.tab);
                        await GM.setValue('tabOrder', newOrder);
                        updateMenuOrder();
                    }
                });

                // Add mouse event listeners to improve drag handle feedback
                tabList.querySelectorAll('.handle').forEach(handle => {
                    handle.addEventListener('mousedown', () => {
                        handle.style.cursor = 'grabbing';
                    });
                    handle.addEventListener('mouseup', () => {
                        handle.style.cursor = 'grab';
                    });
                });

                // Reset button handler
                document.getElementById('resetTabOrder').addEventListener('click', async function() {
                    const defaultOrder = ['random', 'tags', 'artists', 'characters', 'parodies', 'groups', 'info', 'twitter', 'bookmarks', 'offline_favorites', 'continue_reading', 'settings'];
                    await GM.setValue('tabOrder', defaultOrder);

                    showPopup('Tab order reset!', {timeout: 1000});

                    // Reset visual order in settings
                    const tabList = document.getElementById('tab-list');
                    defaultOrder.forEach(tabId => {
                        const item = tabList.querySelector(`[data-tab="${tabId}"]`);
                        if (item) tabList.appendChild(item);
                    });

                    updateMenuOrder();
                });
            }

            // Function to check if the menu is in the correct order
            async function isMenuInOrder() {
//                console.log("Checking if menu is in order...");
                const menu = document.querySelector('ul.menu.left');
                if (!menu) return false;

//                console.log("Menu:", menu);
                const tabOrder = await initializeTabOrder(); // Wait for the promise to resolve
//                console.log("Tab order:", tabOrder);

                // Get all menu items except dropdown in their DOM order
                const allMenuItems = Array.from(menu.querySelectorAll('li:not(.dropdown)'));
//                console.log("All menu items:", allMenuItems);

                // Create a map of tab IDs to their desired position
                const tabPositions = {};
                tabOrder.forEach((tabId, index) => {
                    tabPositions[tabId] = index;
                });

                // Extract the tab IDs from the DOM in order
                const currentTabOrder = [];
                for (const menuItem of allMenuItems) {
                    const link = menuItem.querySelector('a');
                    if (link) {
                        const href = link.getAttribute('href');
                        // Special case for Twitter which is an external link
                        if (href.includes('twitter.com/nhentaiOfficial')) {
                            currentTabOrder.push('twitter');
                            continue;
                        }
                        // Special case for Offline Favorites
                        if (href.includes('/favorite/')) {
                            currentTabOrder.push('offline_favorites');
                            continue;
                        }
                        // Extract the tab ID from the href for internal links
                        const match = href.match(/\/([^\/]+)\//);
                        if (match && match[1]) {
                            currentTabOrder.push(match[1]);
                        }
                    }
                }

//                console.log("Current tab order from DOM:", currentTabOrder);
//                console.log("Desired tab order:", tabOrder);

                // Get the tabs that are actually present in the menu
                const presentTabs = tabOrder.filter(tabId => currentTabOrder.includes(tabId));

                // If no tabs from the order are present, consider it in order to avoid constant updates
                if (presentTabs.length === 0) {
                    return true;
                }

                // Check if the offline favorites tab is the only one missing
                const missingTabs = tabOrder.filter(tabId => !currentTabOrder.includes(tabId));
                if (missingTabs.length === 1 && missingTabs[0] === 'offline_favorites') {
                    // If only the offline favorites tab is missing, consider the menu in order
                    return true;
                }

                // Check if there are other important tabs missing
                const importantMissingTabs = missingTabs.filter(tabId =>
                    tabId !== 'offline_favorites' &&
                    tabId !== 'twitter' &&
                    tabId !== 'info'
                );

                if (importantMissingTabs.length > 0) {
                    // If important tabs are missing, the menu is not in order
                    return false;
                }

                // Now check if the relative order is correct for the tabs that exist
                // Skip tabs that don't exist in the current DOM
                let lastFoundIndex = -1;
                for (const tabId of tabOrder) {
                    const currentIndex = currentTabOrder.indexOf(tabId);
                    if (currentIndex !== -1) {
                        // If this tab exists in the DOM, it should come after the last found tab
                        if (currentIndex < lastFoundIndex) {
                            console.log(`Tab ${tabId} is out of order: found at ${currentIndex}, should be after ${lastFoundIndex}`);
                            return false;
                        }
                        lastFoundIndex = currentIndex;
                    }
                }

                // If we get here, all existing tabs are in the correct relative order
//                console.log("Menu is in correct order");
                return true;
            }

        // Call updateMenuOrder only when the menu is not in the correct order
        // Use a longer interval to reduce constant updates
        setInterval(async () => {
            if (!await isMenuInOrder()) {
                updateMenuOrder();
            }
        }, 1000);

//------------------------------------------------ Advanced Settings Management Functions---------------------------------------------------------




function showPopup(message, options = {}) {
    // Default options
    const defaultOptions = {
        timeout: 3000,           // Default timeout of 3 seconds
        width: '250px',          // Default width
        buttons: [],             // Additional buttons besides close
        closeButton: true,       // Show close button
        autoClose: true          // Auto close after timeout
    };

    // Merge default options with provided options
    const settings = { ...defaultOptions, ...options };

    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'popup';

    // Create buttons HTML if provided
    let buttonsHTML = '';
    if (settings.buttons && settings.buttons.length > 0) {
        buttonsHTML = '<div class="popup-buttons">';
        settings.buttons.forEach(button => {
            buttonsHTML += `<button class="popup-btn" data-action="${button.action || ''}">${button.text}</button>`;
        });
        buttonsHTML += '</div>';
    }

    // Create close button HTML if enabled
    const closeButtonHTML = settings.closeButton ?
        '<button class="close-btn">&times;</button>' : '';

    // Populate popup HTML
    popup.innerHTML = `
        <div class="popup-content">
            ${closeButtonHTML}
            <p>${message}</p>
            ${buttonsHTML}
        </div>
    `;
    document.body.appendChild(popup);

    // Add CSS styling for the popup
    const style = document.createElement('style');
    style.textContent = `
        #popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            border-radius: 5px;
            z-index: 9999;
            padding: 15px;
            width: ${settings.width};
            text-align: center;
        }
        .popup-content {
            position: relative;
            padding: 10px;
        }
        .close-btn {
            position: absolute;
            top: 5px;
            right: 10px;
            background: none;
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            transition: color 0.3s, opacity 0.3s;
        }
        .close-btn:hover {
            color: #ff0000;
            opacity: 0.7;
        }
        .popup-buttons {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        .popup-btn {
            background: #333;
            color: #fff;
            border: 1px solid #555;
            border-radius: 3px;
            padding: 5px 10px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .popup-btn:hover {
            background: #444;
        }
    `;
    document.head.appendChild(style);

    // Function to close the popup
    const closePopup = () => {
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
            document.head.removeChild(style);
        }
    };

    // Close button event listener
    if (settings.closeButton) {
        const closeBtn = popup.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closePopup);
        }
    }

    // Add event listeners for custom buttons
    if (settings.buttons && settings.buttons.length > 0) {
        const buttons = popup.querySelectorAll('.popup-btn');
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                // Execute the callback if provided
                if (settings.buttons[index].callback && typeof settings.buttons[index].callback === 'function') {
                    settings.buttons[index].callback(e);
                }

                // Close the popup after button click if closeOnClick is true
                if (settings.buttons[index].closeOnClick !== false) {
                    closePopup();
                }
            });
        });
    }

    // Auto-close the popup after the specified timeout
    let timeoutId;
    if (settings.autoClose && settings.timeout > 0) {
        timeoutId = setTimeout(closePopup, settings.timeout);
    }

    // Return an object with methods to control the popup
    return {
        close: closePopup,
        updateMessage: (newMessage) => {
            const messageElement = popup.querySelector('p');
            if (messageElement) {
                messageElement.innerHTML = newMessage;
            }
        },
        resetTimeout: () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (settings.autoClose && settings.timeout > 0) {
                timeoutId = setTimeout(closePopup, settings.timeout);
            }
        }
    };
}

function exportBookmarkedPages() {
        GM.getValue('bookmarkedPages', []).then(bookmarkedPages => {
            const blob = new Blob([JSON.stringify(bookmarkedPages, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'bookmarked_pages.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }



//----------------------------**Settings**--------------------------------------------





//----------------------------**Random Hentai Preferences**----------------------------
// Intercept random button clicks only if preferences are set
document.addEventListener('click', async function(event) {
    const target = event.target;
    if (target.tagName === 'A' && target.getAttribute('href') === '/random/') {
        event.preventDefault(); // Prevent the default navigation

        // Show the loading popup immediately
        showLoadingPopup();

        // Check if user preferences are set
        const preferencesSet = await arePreferencesSet();

        if (preferencesSet) {
            // Set a flag to stop the search if needed
            window.searchInProgress = true;
            fetchRandomHentai();
        } else {
            // Close the popup and proceed with the default action
            hideLoadingPopup();
            window.location.href = '/random/';
        }
    }
});

async function arePreferencesSet() {
    try {
        const language = await GM.getValue('randomPrefLanguage', '');
        const tags = await GM.getValue('randomPrefTags', []);
        const pagesMin = parseInt(await GM.getValue('randomPrefPagesMin', ''), 10);
        const pagesMax = parseInt(await GM.getValue('randomPrefPagesMax', ''), 10);

        return language || tags.length > 0 || !isNaN(pagesMin) || !isNaN(pagesMax);
    } catch (error) {
        console.error('Error checking preferences:', error);
        return false;
    }
}

function showLoadingPopup() {
    if (window.searchInProgress) {
        showPopup('Already searching for random content!');
        return;
    }

    // Create and display the popup
    const popup = document.createElement('div');
    popup.id = 'loading-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.color = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.zIndex = '9999';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';

    // Popup content with image container and buttons
    popup.innerHTML = `
    <span>Searching for random content...</span>
    <div id="cover-preview-container" style="margin-top: 10px; width: 350px; height: 192px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px;">
        <a id="cover-preview-link" href="#" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-decoration: none;">
            <img id="cover-preview" style="max-width: 100%; max-height: 100%; object-fit: contain; display: none; cursor: pointer;" />
        </a>
    </div>
    <div id="preview-notes" style="margin-top: 10px; color: white; text-align: center;">
        <!-- Notes will be inserted here -->
    </div>
    <div style="margin-top: 20px; display: flex; gap: 15px;">
        <button id="previous-image" class="control-button" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; transition: color 0.3s ease, transform 0.3s ease;">
            <i class="fas fa-arrow-left"></i>
        </button>
        <button id="pause-search" class="control-button" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; transition: color 0.3s ease, transform 0.3s ease;">
            <i class="fas fa-pause"></i>
        </button>
        <button id="next-image" class="control-button" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; transition: color 0.3s ease, transform 0.3s ease;">
            <i class="fas fa-arrow-right"></i>
        </button>
    </div>
    <button class="close" style="margin-top: 20px; background: none; border: none; font-size: 24px; color: white; cursor: pointer;">&times;</button>
`;

    document.body.appendChild(popup);

    // Add event listener to close button
    const closeButton = popup.querySelector('.close');
    closeButton.addEventListener('click', function() {
        hideLoadingPopup();
        window.searchInProgress = false; // Stop the search
    });

    // Add hover effect for the close button
    closeButton.addEventListener('mouseenter', function() {
        closeButton.style.color = 'red';
        closeButton.style.opacity = '0.7';
    });

    closeButton.addEventListener('mouseleave', function() {
        closeButton.style.color = 'white';
        closeButton.style.opacity = '1';
    });

    // Add hover effect for control buttons
    const controlButtons = document.querySelectorAll('.control-button');
    controlButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            button.style.color = '#ddd'; // Light color on hover
            button.style.transform = 'scale(1.1)'; // Slightly enlarge button
        });

        button.addEventListener('mouseleave', function() {
            button.style.color = 'white'; // Original color
            button.style.transform = 'scale(1)'; // Return to original size
        });
    });

    // Add event listeners for control buttons
    document.getElementById('previous-image').addEventListener('click', showPreviousImage);
    document.getElementById('pause-search').addEventListener('click', togglePause);
    document.getElementById('next-image').addEventListener('click', showNextImage);

    // Add click event listener to the preview image to navigate to the content URL
    document.getElementById('cover-preview').addEventListener('click', function() {
        const currentImageIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
        const images = getImagesFromLocalStorage();
        if (images[currentImageIndex] && images[currentImageIndex].url) {
            window.location.href = images[currentImageIndex].url;
        }
    });
}



function hideLoadingPopup() {
    const popup = document.getElementById('loading-popup');
    if (popup) {
        document.body.removeChild(popup);
    }
}

async function fetchRandomHentai() {
    try {
        if (!window.searchInProgress) return; // Stop if search was canceled
        const response = await fetch('https://nhentai.net/random/', { method: 'HEAD' });
        await analyzeURL(response.url);
    } catch (error) {
        console.error('Error fetching random URL:', error);
    }
}

async function analyzeURL(url) {
    try {
        if (!window.searchInProgress) {
            return; // Stop if search was canceled
        }
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const coverImage = doc.querySelector('#cover img.lazyload');
        const coverImageUrl = coverImage ? (coverImage.getAttribute('data-src') || coverImage.src) : null;

        const title = doc.querySelector('#info h1')?.textContent.trim();
        const tags = Array.from(doc.querySelectorAll('#tags .tag')).map(tag => tag.textContent.trim());
        const pages = parseInt(doc.querySelector('#tags .tag-container:nth-last-child(2) .name')?.textContent.trim(), 10);
        const uploadDate = doc.querySelector('#tags .tag-container:last-child time')?.getAttribute('datetime');

        // Extract and handle languages
        let languages = [];
        const tagContainers = doc.querySelectorAll('.tag-container.field-name');
        tagContainers.forEach(container => {
            if (container.textContent.includes('Languages:')) {
                const languageElements = container.querySelectorAll('.tags .tag .name');
                languageElements.forEach(languageElement => {
                    let language = languageElement.textContent.trim().toLowerCase();
                    languages.push(language);
                });
            }
        });

        // Determine which language to display
        let languageDisplay = 'Unknown';

        if (languages.includes('english')) {
            languageDisplay = 'English';
        } else if (languages.includes('translated') && languages.length === 1) {
            languageDisplay = 'English';
        } else if (languages.includes('translated') && languages.length > 1) {
            // Exclude 'translated' and show other language(s)
            const otherLanguages = languages.filter(lang => lang !== 'translated');
            languageDisplay = otherLanguages.length > 0 ? otherLanguages.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(', ') : 'Unknown';
        } else {
            languageDisplay = languages.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(', ');
        }

        if (coverImageUrl) {
            saveImageToLocalStorage(coverImageUrl, url, languageDisplay, pages, title);
            showPreviousImage();
        }

        if (await meetsUserPreferences(tags, pages)) {
            hideLoadingPopup();
            window.location.href = url;
        } else {
            fetchRandomHentai();
        }
    } catch (error) {
        console.error('Error analyzing page:', error);
    }
}

async function meetsUserPreferences(tags, pages) {
    try {
        const preferredLanguage = (await GM.getValue('randomPrefLanguage', '')).toLowerCase();
        const preferredTags = (await GM.getValue('randomPrefTags', [])).map(tag => tag.toLowerCase());
        const blacklistedTags = (await GM.getValue('blacklistedTags', [])).map(tag => tag.toLowerCase()).filter(tag => tag !== '');
        const preferredPagesMin = parseInt(await GM.getValue('randomPrefPagesMin', ''), 10);
        const preferredPagesMax = parseInt(await GM.getValue('randomPrefPagesMax', ''), 10);
        const matchAllTags = await GM.getValue('matchAllTags', true);

        // Strip tag counts and only keep the tag names
        const cleanedTags = tags.map(tag => tag.replace(/\d+K?$/, '').trim().toLowerCase());

        const hasPreferredLanguage = preferredLanguage ? cleanedTags.includes(preferredLanguage) : true;

        let hasPreferredTags;
        if (preferredTags.length > 0) {
            if (matchAllTags) {
                hasPreferredTags = preferredTags.every(tag => cleanedTags.includes(tag));
            } else {
                hasPreferredTags = preferredTags.some(tag => cleanedTags.includes(tag));
            }
        } else {
            hasPreferredTags = true;
        }

        const withinPageRange = (!isNaN(preferredPagesMin) ? pages >= preferredPagesMin : true) &&
                                (!isNaN(preferredPagesMax) ? pages <= preferredPagesMax : true);

        const hasBlacklistedTags = blacklistedTags.some(tag => cleanedTags.includes(tag));

        const meetsPreferences = hasPreferredLanguage && hasPreferredTags && withinPageRange && !hasBlacklistedTags;
        return meetsPreferences;
    } catch (error) {
        console.error('Error checking user preferences:', error);
        return false;
    }
}

function saveImageToLocalStorage(imageUrl, hentaiUrl, language, pages, title) {
    let images = JSON.parse(localStorage.getItem('hentaiImages') || '[]');
    images.unshift({ imageUrl, url: hentaiUrl, language, pages, title }); // Add title to stored data

    if (images.length > 10) {
        images.pop();
    }

    localStorage.setItem('hentaiImages', JSON.stringify(images));
    localStorage.setItem('currentImageIndex', '0');
    updatePreviewImage(imageUrl, language, pages, title);
}


function getImagesFromLocalStorage() {
    return JSON.parse(localStorage.getItem('hentaiImages') || '[]');
}

function showNextImage() {
    const images = getImagesFromLocalStorage();
    if (images.length === 0) return;

    let currentIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    localStorage.setItem('currentImageIndex', currentIndex.toString());

    const currentImage = images[currentIndex];
    updatePreviewImage(currentImage.imageUrl, currentImage.language, currentImage.pages, currentImage.title);
}

function showPreviousImage() {
    const images = getImagesFromLocalStorage();
    if (images.length === 0) return;

    let currentIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
    currentIndex = (currentIndex + 1) % images.length;
    localStorage.setItem('currentImageIndex', currentIndex.toString());

    const currentImage = images[currentIndex];
    updatePreviewImage(currentImage.imageUrl, currentImage.language, currentImage.pages, currentImage.title);
}


function updatePreviewImage(imageUrl, language = '', pages = '', title = '') {
    const coverPreview = document.getElementById('cover-preview');
    const coverPreviewLink = document.getElementById('cover-preview-link');
    const notesContainer = document.getElementById('preview-notes');
    const isPaused = !window.searchInProgress;

    if (coverPreview) {
        coverPreview.src = imageUrl;
        coverPreview.style.display = 'block';
    }

    // Update the link URL
    if (coverPreviewLink) {
        const images = getImagesFromLocalStorage();
        const currentIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
        if (images[currentIndex] && images[currentIndex].url) {
            coverPreviewLink.href = images[currentIndex].url;
        }
    }

    if (notesContainer) {
        notesContainer.innerHTML = `
            ${isPaused ? `<div style="margin-bottom: 5px;"><span style="font-weight: bold;">Title:</span> ${title || 'Title Not Available'}</div>` : ''}
            <div>Language: ${language || 'N/A'}</div>
            <div>Pages: ${pages || 'N/A'}</div>
        `;
    }
}

// Remove the old click event listener from the image and add it to the link instead (Not necessary may remove later)
document.addEventListener('DOMContentLoaded', function() {
    const coverPreviewLink = document.getElementById('cover-preview-link');
    if (coverPreviewLink) {
        coverPreviewLink.addEventListener('click', function(event) {
            event.preventDefault();
            const currentImageIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
            const images = getImagesFromLocalStorage();
            if (images[currentImageIndex] && images[currentImageIndex].url) {
                window.location.href = images[currentImageIndex].url;
            }
        });
    }
});

function togglePause() {
    window.searchInProgress = !window.searchInProgress;
    const pauseButtonIcon = document.querySelector('#pause-search i');
    pauseButtonIcon.className = window.searchInProgress ? 'fas fa-pause' : 'fas fa-play';

    // Update the current image display with the new pause state
    const images = getImagesFromLocalStorage();
    const currentIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
    if (images[currentIndex]) {
        const currentImage = images[currentIndex];
        updatePreviewImage(currentImage.imageUrl, currentImage.language, currentImage.pages, currentImage.title);
    }

    if (window.searchInProgress) {
        fetchRandomHentai();
    }
}

// Initialize the current image index
localStorage.setItem('currentImageIndex', '0');


//----------------------------**Random Hentai Preferences**----------------------------

//---------------------------**Open In New Tab Button**---------------------------------

// Add this code after the existing findVersionButton code in the same section
async function addNewTabButtons() {
    // Check if the feature is enabled
    const openInNewTabEnabled = await GM.getValue('openInNewTabEnabled', true);
    if (!openInNewTabEnabled) return;
    const openInNewTabType = await GM.getValue('openInNewTabType', 'background');
    const baseUrl = 'https://nhentai.net';
    const covers = document.querySelectorAll('.cover');
    covers.forEach(cover => {
        // Check if the button doesn't already exist for this cover
        if (!cover.querySelector('.newTabButton')) {
            const newTabButton = document.createElement('div');
            newTabButton.className = 'newTabButton';
            newTabButton.innerHTML = '<i class="fas fa-external-link-alt"></i>'; // Updated to include icon

            // Add click event listener
            newTabButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent the click from bubbling up to the cover

                // Get the href from the cover
                const mangaUrl = cover.getAttribute('href');
                console.log('Opening manga URL:', mangaUrl); // Debugging log

                if (mangaUrl) {
                    const fullUrl = baseUrl + mangaUrl; // Construct the full URL

                    if (openInNewTabType === 'foreground') {
                        console.log("foreground");
                      window.open(fullUrl, '_blank'); // Open in new tab and focus on it
                    } else {
                        console.log("background");
                      GM.openInTab(fullUrl, { active: false }); // Open in new tab without focusing on it
                    }
                  }else {
                    console.error('No URL found for this cover.'); // Error log if no URL
                }
            });

            cover.appendChild(newTabButton);
        }
    });
}

// Add observer to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            addNewTabButtons();
        }
    });
});

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });

// Initial call to add buttons to existing covers
addNewTabButtons();

//---------------------------**Open In New Tab Button**---------------------------------

//----------------------------**Manga BookMark**---------------------------------



function mangaBookmarking() {
    GM.addStyle(`
        @keyframes bookmark-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(237, 37, 83, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 5px 10px rgba(237, 37, 83, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(237, 37, 83, 0); }
        }

        .bookmark-animation {
          animation: bookmark-pulse 0.6s ease-out;
        }
    `);
// Get the download button
const downloadButton = document.getElementById('download');
if (!downloadButton) {
    console.log('Download button not found.');
    return;
}

// Check if the manga bookmarking button is enabled in settings
async function getMangaBookMarkingButtonEnabled() {
    return await GM.getValue('mangaBookMarkingButtonEnabled', true);
}

getMangaBookMarkingButtonEnabled().then(mangaBookMarkingButtonEnabled => {
    if (!mangaBookMarkingButtonEnabled) return;

    // Get the current URL
    const currentUrl = window.location.href;

    // Check if the current manga is already bookmarked
    async function getBookmarkedMangas() {
        try {
            const bookmarkedMangas = await GM.getValue('bookmarkedMangas', []);
            return bookmarkedMangas;
        } catch (error) {
            console.error('Error checking bookmarks:', error);
            return [];
        }
    }

    getBookmarkedMangas().then(bookmarkedMangas => {
        let bookmarkText = 'Bookmark';
        let bookmarkClass = 'btn-enabled';
        if (bookmarkedMangas.some(manga => manga.url === currentUrl)) {
            bookmarkText = 'Bookmarked';
            bookmarkClass = 'btn-disabled';
        }

        const MangaBookMarkHtml = `
            <a class="btn btn-primary ${bookmarkClass} tooltip bookmark" id="bookmark-button">
                <i class="fas fa-bookmark"></i>
                <span>${bookmarkText}</span>
                <div class="top">Click to save this manga for later<i></i></div>
            </a>
        `;

        // Insert 'Find Similar' button next to the download button
        $(downloadButton).after(MangaBookMarkHtml);

        // Add event listener to the bookmark button
        document.getElementById('bookmark-button').addEventListener('click', async function() {
            // Get the current URL
            const currentUrl = window.location.href;

            // Get the cover image URL
            const coverImageContainer = document.getElementById('cover');
            const coverImage = coverImageContainer.querySelector('img');
            const coverImageUrl = coverImage.dataset.src || coverImage.src;

            try {
                // Get the bookmarked mangas (asynchronously)
                const bookmarkedMangas = await GM.getValue('bookmarkedMangas', []);

                const existingManga = bookmarkedMangas.find(manga => manga.url === currentUrl);
                if (existingManga) {
                    // If already bookmarked, remove it
                    const index = bookmarkedMangas.indexOf(existingManga);
                    bookmarkedMangas.splice(index, 1);
                    this.querySelector('span').textContent = 'Bookmark';
                    this.classList.remove('btn-disabled');
                    this.classList.add('btn-enabled');
                } else {
                    // If not bookmarked, add it
                    bookmarkedMangas.push({
                        url: currentUrl,
                        coverImageUrl: coverImageUrl
                    });
                    this.querySelector('span').textContent = 'Bookmarked';
                    this.classList.remove('btn-enabled');
                    this.classList.add('btn-disabled');
                }

                const isNewlyBookmarked = !existingManga; // True if we just added a bookmark

                // Save the updated list (asynchronously)
                await GM.setValue('bookmarkedMangas', bookmarkedMangas);

                if (isNewlyBookmarked) { // If a new bookmark was added
                    this.classList.add('bookmark-animation');
                    setTimeout(() => {
                        this.classList.remove('bookmark-animation');
                    }, 600); // Animation duration 0.6s
                }

            } catch (error) {
                console.error('Error handling bookmarks:', error);
                // Optionally display an error to the user
                alert('An error occurred while saving your bookmark.');
            }
        });
    });
});
}

mangaBookmarking();


//----------------------------**Manga BookMark**---------------------------------


//---------------------------**Month Filter**------------------------------------

async function addMonthFilter() {
    const monthFilterEnabled = await GM.getValue('monthFilterEnabled', true);
    if (!monthFilterEnabled) return;

    const path = window.location.pathname;

    if (/^\/(search|tag|artist|character|parody)\//.test(path)) {
        const sortTypes = document.getElementsByClassName("sort-type");
        if (sortTypes.length > 1) {

            let baseUrl = window.location.pathname;

            // Remove existing popularity filter from the path if present.
            baseUrl = baseUrl.replace(/\/popular(-\w+)?$/, '');


            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete('sort'); // Remove any sort parameter from the query string
            const remainingParams = urlParams.toString();

            if (remainingParams) {
                baseUrl += '?' + remainingParams;
            }


            const monthFilterHtml = `
                <span class="sort-name">Popular:</span>
                <a href="${baseUrl}${baseUrl.includes('?') ? '&' : '?'}sort=popular-today">today</a>
                <a href="${baseUrl}${baseUrl.includes('?') ? '&' : '?'}sort=popular-week">week</a>
                <a href="${baseUrl}${baseUrl.includes('?') ? '&' : '?'}sort=popular-month">month</a>
                <a href="${baseUrl}${baseUrl.includes('?') ? '&' : '?'}sort=popular">all time</a>
            `;
            sortTypes[1].innerHTML = monthFilterHtml;
        }
    }
}

addMonthFilter();



//--------------------------*Month Filter**----------------------------------------

//--------------------------- **Replace Related Manga with Bookmarks** ---------------------------

// Function to get manga details (cover image and title)
async function getMangaDetails(mangaId) {
    try {
        // First check if we have details cached
        const cachedDetails = await GM.getValue(`manga_details_${mangaId}`, null);
        if (cachedDetails) {
            return cachedDetails;
        }

        // If not cached, fetch it from the page
        const response = await fetch(`https://nhentai.net/g/${mangaId}/`);
        if (!response.ok) {
            console.error(`Failed to fetch manga page for ${mangaId}: ${response.status}`);
            return { coverUrl: null, title: null };
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Get the cover image
        const coverImg = doc.querySelector("#cover > a > img");
        const coverUrl = coverImg ? (coverImg.getAttribute('data-src') || coverImg.getAttribute('src')) : null;

        // Get the manga title
        let title = null;

        // Try to get the title from the span.before element
        const titleSpan = doc.querySelector("#info > h1 > a > u > span.before");
        if (titleSpan) {
            title = titleSpan.textContent.trim();
        }

        // If not found, try the main h1 title
        if (!title) {
            const mainTitle = doc.querySelector("#info > h1");
            if (mainTitle) {
                title = mainTitle.textContent.trim();
            }
        }

        // Extract all tags from the page
        const allTags = Array.from(doc.querySelectorAll('#tags span.name')).map(span =>
            span.textContent.trim().toLowerCase()
        );

        // Determine language from tags
        let language = null;
        if (allTags.includes('english')) {
            language = 'english';
        } else if (allTags.includes('japanese')) {
            language = 'japanese';
        } else if (allTags.includes('chinese')) {
            language = 'chinese';
        }

        // Cache the details
        const details = { coverUrl, title, language };
        await GM.setValue(`manga_details_${mangaId}`, details);

        return details;
    } catch (error) {
        console.error(`Error getting manga details for ${mangaId}:`, error);
        return { coverUrl: null, title: null };
    }
}

// Function to get cover image URL for a manga (for backward compatibility)
async function getMangaCoverImage(mangaId) {
    const details = await getMangaDetails(mangaId);
    return details.coverUrl;
}

// Language flag URLs
const LANGUAGE_FLAGS = {
    english: "https://i.imgur.com/vSnHmmi.gif",
    japanese: "https://i.imgur.com/GlArpuS.gif",
    chinese: "https://i.imgur.com/7B55DYm.gif"
};

// Function to replace the related manga section with bookmarked content
async function replaceRelatedWithBookmarks() {

    // Check if the feature is enabled
    const replaceRelatedWithBookmarks = await GM.getValue('replaceRelatedWithBookmarks', true);
    if (!replaceRelatedWithBookmarks) return;

    // Check if flip button is enabled
    const enableRelatedFlipButton = await GM.getValue('enableRelatedFlipButton', true);

    // Check if we're on a manga page and if the related container exists
    const relatedContainer = document.querySelector("#related-container");
    if (!relatedContainer || !window.location.pathname.includes('/g/')) return;

    // Store original content for flipping back
    const originalContent = relatedContainer.innerHTML;

    // State management for flip functionality (only if flip button is enabled)
    let isShowingBookmarks = true; // Default to showing bookmarks when enabled
    let bookmarkedContent = null;

    // Add a loading indicator
    relatedContainer.innerHTML = `
        <h2>Finding Related Manga from Your Bookmarks...</h2>
        <div class="container" style="text-align: center; padding: 20px;">
            <div class="loading-spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #555; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    // Get the current manga ID
    const currentMangaId = window.location.pathname.match(/\/g\/(\d+)/)?.[1];
    if (!currentMangaId) return;

    // Get the current manga's tags
    const tagsContainer = document.querySelector("#tags");
    if (!tagsContainer) return;

    // Extract all tags from the current manga
    const tagElements = tagsContainer.querySelectorAll('.tag');
    const currentTags = Array.from(tagElements).map(tag => {
        return tag.querySelector('.name')?.textContent.trim().toLowerCase() || '';
    }).filter(tag => tag !== '');

    console.log('Current manga tags:', currentTags);

    // Get all bookmarks
    const bookmarks = await getBookmarksFromStorage();
    if (!bookmarks || bookmarks.length === 0) {
        console.log('No bookmarks found');
        return;
    }

    console.log(`Found ${bookmarks.length} bookmarks`);

    // Filter out the current manga from bookmarks
    const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== currentMangaId);

    // Function to score bookmarks based on tag similarity
    async function scoreBookmark(bookmark) {
        try {
            // Get manga info with tags - only use cached data
            const mangaInfo = await GM.getValue(`manga_${bookmark.id}`, null);
            
            // Try to get additional tags from the URL-based cache
            const mangaUrl = `https://nhentai.net/g/${bookmark.id}/`;
            const additionalTags = await GM.getValue(`tags_${mangaUrl}`, []);
            
            // If no cached info or tags from either source, skip this bookmark
            if ((!mangaInfo || !mangaInfo.tags || mangaInfo.tags.length === 0) && additionalTags.length === 0) {
                return { bookmark, score: 0, tags: [], tagIds: [] };
            }
            
            // Initialize bookmarkTags array
            let bookmarkTags = [];
            
            // Add tags from mangaInfo if available
            if (mangaInfo && mangaInfo.tags && mangaInfo.tags.length > 0) {
                bookmarkTags = mangaInfo.tags.map(tag =>
                    tag.replace(/\d+K?$/, '').trim().toLowerCase()
                );
            }
            
            // Add tags from URL-based cache if available
            if (additionalTags.length > 0) {
                // Clean up additional tags and add them to bookmarkTags
                const cleanedAdditionalTags = additionalTags.map(tag => 
                    typeof tag === 'string' ? tag.replace(/\d+K?$/, '').trim().toLowerCase() : ''
                ).filter(tag => tag !== '');
                
                // Merge tags, avoiding duplicates
                bookmarkTags = [...new Set([...bookmarkTags, ...cleanedAdditionalTags])];
            }
            
            // Get tag IDs if available
            const tagIds = mangaInfo?.tagIds || [];
            
            // Calculate score based on matching tags
            let score = 0;
            const matchingTags = [];
            
            for (const tag of currentTags) {
                if (bookmarkTags.includes(tag)) {
                    score++;
                    matchingTags.push(tag);
                }
            }
            
            // Determine language from tags
            let language = null;
            if (bookmarkTags.includes('english')) {
                language = 'english';
            } else if (bookmarkTags.includes('japanese')) {
                language = 'japanese';
            } else if (bookmarkTags.includes('chinese')) {
                language = 'chinese';
            }
            
            return {
                bookmark,
                score,
                tags: bookmarkTags,
                matchingTags,
                tagIds,
                title: mangaInfo?.title || `Manga ${bookmark.id}`,
                thumbnail: mangaInfo?.thumbnail || null,
                language
            };
        } catch (error) {
            console.error(`Error scoring bookmark ${bookmark.id}:`, error);
            return { bookmark, score: 0, tags: [], tagIds: [] };
        }
    }

    // Process all bookmarks since we're only using cached data
    console.log(`Processing ${filteredBookmarks.length} bookmarks (using cached data only)`);

    // Score bookmarks in batches to avoid freezing the browser
    const BATCH_SIZE = 50; // Larger batch size since we're only using cached data
    const scoredBookmarks = [];

    for (let i = 0; i < filteredBookmarks.length; i += BATCH_SIZE) {
        const batch = filteredBookmarks.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(filteredBookmarks.length/BATCH_SIZE)}`);

        const batchPromises = batch.map(scoreBookmark);
        const batchResults = await Promise.all(batchPromises);
        scoredBookmarks.push(...batchResults);

        // Small delay to keep the UI responsive
        if (i + BATCH_SIZE < filteredBookmarks.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    // Sort by score (highest first)
    scoredBookmarks.sort((a, b) => b.score - a.score);

    // Filter out bookmarks with no matching tags
    const bookmarksWithMatches = scoredBookmarks.filter(item => item.score > 0);

    console.log(`Found ${bookmarksWithMatches.length} bookmarks with matching tags`);

    // If no related bookmarks found with matching tags, restore the original content
    if (bookmarksWithMatches.length === 0) {
        console.log('No related bookmarks found with matching tags');
        relatedContainer.innerHTML = originalContent;
        return;
    }

    // Take top 5 or fewer if less available
    const topBookmarks = bookmarksWithMatches.slice(0, 5);

    console.log('Top related bookmarks:', topBookmarks);

    // Pre-fetch titles and thumbnails for top bookmarks
    await Promise.all(topBookmarks.map(async item => {
        // Get manga details for title and cover
        const details = await getMangaDetails(item.bookmark.id);

        // Update title if needed
        if ((!item.title || item.title === `Manga ${item.bookmark.id}`) && details.title) {
            item.title = details.title;
        }

        // Update thumbnail if needed
        if (!item.thumbnail && details.coverUrl) {
            item.thumbnail = details.coverUrl;
        }
    }));

    // Clear the related container
    relatedContainer.innerHTML = '';

    // Create a header container for the section with flip button
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.justifyContent = 'center';
    headerContainer.style.gap = '10px';
    headerContainer.style.position = 'relative';

    const header = document.createElement('h2');
    header.textContent = 'Related Manga from Your Bookmarks';
    header.style.margin = '0';
    header.style.textAlign = 'center';
    header.style.flex = '1';
    headerContainer.appendChild(header);

    // Only create flip button if the setting is enabled
    let flipButton = null;
    if (enableRelatedFlipButton) {
        // Create flip button
        flipButton = document.createElement('button');
        flipButton.textContent = 'Flip';
        flipButton.style.cssText = `
            background: #ed2553;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
        `;

        // Add hover effect
        flipButton.addEventListener('mouseenter', () => {
            flipButton.style.background = '#d91e47';
        });
        flipButton.addEventListener('mouseleave', () => {
            flipButton.style.background = '#ed2553';
        });

        headerContainer.appendChild(flipButton);
    }

    relatedContainer.appendChild(headerContainer);

    // Create a container for the galleries
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'container';
    relatedContainer.appendChild(galleryContainer);

    // Store the bookmarked content for later use
    const storeBookmarkedContent = () => {
        bookmarkedContent = relatedContainer.innerHTML;
    };

    // Function to toggle between bookmarked and original content
    const toggleContent = () => {
        if (isShowingBookmarks) {
            // Switch to original content
            relatedContainer.innerHTML = originalContent;
            isShowingBookmarks = false;

            // Force load thumbnails in original content with comprehensive loading
            setTimeout(() => {
                const images = relatedContainer.querySelectorAll('img');
                images.forEach((img, index) => {
                    // Store original attributes
                    const dataSrc = img.dataset.src || img.getAttribute('data-src');
                    const originalSrc = img.src;

                    // Function to attempt loading the image
                    const loadImage = (src) => {
                        return new Promise((resolve, reject) => {
                            const testImg = new Image();
                            testImg.onload = () => {
                                img.src = src;
                                img.style.opacity = '1';
                                resolve(src);
                            };
                            testImg.onerror = () => reject(src);
                            testImg.src = src;
                        });
                    };

                    // Try multiple loading strategies
                    const tryLoadImage = async () => {
                        const sources = [];

                        // Add data-src if available
                        if (dataSrc && dataSrc !== originalSrc) {
                            sources.push(dataSrc);
                        }

                        // Add original src if available and different
                        if (originalSrc && !originalSrc.includes('placeholder') && !originalSrc.includes('loading')) {
                            sources.push(originalSrc);
                        }

                        // Try each source
                        for (const src of sources) {
                            try {
                                await loadImage(src);
                                console.log(`Successfully loaded image ${index + 1}:`, src);
                                return;
                            } catch (error) {
                                console.log(`Failed to load image ${index + 1} from:`, src);
                            }
                        }

                        // If all sources fail, try to reconstruct the URL
                        const galleryLink = img.closest('a');
                        if (galleryLink && galleryLink.href) {
                            const mangaId = galleryLink.href.match(/\/g\/(\d+)/)?.[1];
                            if (mangaId) {
                                const reconstructedUrl = `https://t.nhentai.net/galleries/${mangaId}/thumb.jpg`;
                                try {
                                    await loadImage(reconstructedUrl);
                                    console.log(`Successfully loaded reconstructed image ${index + 1}:`, reconstructedUrl);
                                } catch (error) {
                                    console.log(`Failed to load reconstructed image ${index + 1}:`, reconstructedUrl);
                                }
                            }
                        }
                    };

                    // Start loading process
                    tryLoadImage();

                    // Remove lazy loading classes that might prevent loading
                    img.classList.remove('lazyload', 'lazyloading');
                    img.classList.add('lazyloaded');
                });

                // Trigger any lazy loading libraries that might be present
                if (window.lazyLoadInstance) {
                    window.lazyLoadInstance.update();
                }

                // Trigger intersection observer if present
                if (window.IntersectionObserver) {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                if (img.dataset.src && !img.src) {
                                    img.src = img.dataset.src;
                                }
                            }
                        });
                    });

                    images.forEach(img => observer.observe(img));

                    // Disconnect after a short time
                    setTimeout(() => observer.disconnect(), 2000);
                }
            }, 100);

            // Add a flip button to the original content to switch back (only if flip button is enabled)
            const originalHeader = relatedContainer.querySelector('h2');
            if (originalHeader && enableRelatedFlipButton) {
                // Create container for original header with flip button
                const originalHeaderContainer = document.createElement('div');
                originalHeaderContainer.style.display = 'flex';
                originalHeaderContainer.style.alignItems = 'center';
                originalHeaderContainer.style.justifyContent = 'center';
                originalHeaderContainer.style.gap = '10px';
                originalHeaderContainer.style.position = 'relative';

                // Style the original header
                originalHeader.style.margin = '0';
                originalHeader.style.textAlign = 'center';
                originalHeader.style.flex = '1';

                // Create flip button for original content
                const originalFlipButton = document.createElement('button');
                originalFlipButton.textContent = 'Flip';
                originalFlipButton.style.cssText = `
                    background: #ed2553;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: bold;
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                `;

                // Add hover effects
                originalFlipButton.addEventListener('mouseenter', () => {
                    originalFlipButton.style.background = '#d91e47';
                });
                originalFlipButton.addEventListener('mouseleave', () => {
                    originalFlipButton.style.background = '#ed2553';
                });

                // Add click event to flip back
                originalFlipButton.addEventListener('click', toggleContent);

                // Replace the original header with the container
                originalHeader.parentNode.insertBefore(originalHeaderContainer, originalHeader);
                originalHeaderContainer.appendChild(originalHeader);
                originalHeaderContainer.appendChild(originalFlipButton);
            }
        } else {
            // Switch back to bookmarked content
            if (bookmarkedContent) {
                relatedContainer.innerHTML = bookmarkedContent;
                // Re-attach event listener to the new flip button
                const newFlipButton = relatedContainer.querySelector('button');
                if (newFlipButton) {
                    newFlipButton.addEventListener('click', toggleContent);
                    // Re-add hover effects
                    newFlipButton.addEventListener('mouseenter', () => {
                        newFlipButton.style.background = '#d91e47';
                    });
                    newFlipButton.addEventListener('mouseleave', () => {
                        newFlipButton.style.background = '#ed2553';
                    });
                }
                isShowingBookmarks = true;
            }
        }
    };

    // Add click event to flip button (only if it exists)
    if (flipButton) {
        flipButton.addEventListener('click', toggleContent);
    }

    // Add each bookmark to the container
    for (const item of topBookmarks) {
        const { bookmark, score, matchingTags, tagIds, title, thumbnail, language } = item;
        if (score === 0) continue; // Skip bookmarks with no matching tags

        try {
            // Create gallery HTML directly using the format from nhentai
            const tagIdsString = tagIds && tagIds.length > 0 ? tagIds.join(' ') : '';

            // Calculate aspect ratio for padding (default to 141.2% if not available)
            const aspectRatio = 141.2;

            // Get thumbnail URL - use the cover image if available
            let thumbUrl = thumbnail || null;

            // If no thumbnail, try to get it from manga_info
            if (!thumbUrl) {
                const mangaInfo = await GM.getValue(`manga_info_${bookmark.id}`, null);
                if (mangaInfo && mangaInfo.thumbnail) {
                    thumbUrl = mangaInfo.thumbnail;
                }
            }

            // If still no thumbnail, try to get the cover image
            if (!thumbUrl) {
                thumbUrl = await getMangaCoverImage(bookmark.id);
            }

            // If still no thumbnail, use placeholder
            if (!thumbUrl) {
                thumbUrl = 'https://t.nhentai.net/galleries/0/thumb.jpg';
            }

            // Format the title with manga name if available
            let displayTitle = title || `Manga ${bookmark.id}`;

            // Get language flag if available
            let languageFlag = '';
            if (language && LANGUAGE_FLAGS[language]) {
                languageFlag = `<img src="${LANGUAGE_FLAGS[language]}" alt="${language}" style="margin-right: 5px; vertical-align: middle; height: 12px; display: inline-block;">`;
            }

            // Create gallery HTML with centered title
            const galleryHTML = `
                <div class="gallery" data-tags="${tagIdsString}">
                    <a href="/g/${bookmark.id}/" class="cover" style="padding:0 0 ${aspectRatio}% 0">
                        <img class="lazyload" width="250" height="353" data-src="${thumbUrl}" src="${thumbUrl}">
                        <noscript><img src="${thumbUrl}" width="250" height="353" /></noscript>
                        <div class="caption" style="text-align: center;">${languageFlag}${displayTitle}</div>
                    </a>
                </div>
            `;

            // Add to container
            galleryContainer.insertAdjacentHTML('beforeend', galleryHTML);

            // Add matching tags info if available
            if (matchingTags && matchingTags.length > 0) {
                const lastGallery = galleryContainer.lastElementChild;
                const caption = lastGallery.querySelector('.caption');

                const tagsInfo = document.createElement('div');
                tagsInfo.className = 'matching-tags';
                tagsInfo.textContent = `Matching tags: ${matchingTags.join(', ')}`;
                tagsInfo.style.fontSize = '12px';
                tagsInfo.style.color = '#888';
                tagsInfo.style.marginTop = '5px';
                tagsInfo.style.textAlign = 'center';
                caption.appendChild(tagsInfo);
            }
        } catch (error) {
            console.error(`Error creating gallery item for bookmark ${bookmark.id}:`, error);
        }
    }

    // Store the bookmarked content after all galleries are added
    storeBookmarkedContent();
}

// Call the function when the page is loaded
$(document).ready(function() {
    setTimeout(replaceRelatedWithBookmarks, 1000); // Delay to ensure page is fully loaded
});

//---------------------------**BookMark-Random-Button**-----------------------------
async function appendButton() {
    const enableRandomButton = await GM.getValue('enableRandomButton', true);
    if (!enableRandomButton) return;

    // Check if we're on the bookmarks page
    if (window.location.pathname.includes('/bookmarks')) {
        // Pre-fetch the bookmarks outside the observer
        const bookmarks = await getBookmarksFromStorage();


// Create a function to check for the element and append the button
function checkAndAppendButton() {
    const target = document.querySelector("#bookmarksContainer > h2:nth-child(1)");
    if (target) {
        // Append the button
        const button = $('<button class="random-button"><i class="fas fa-random"></i> Random</button>');
        $(target).after(button);
        $(target).css('display', 'inline-block');
        button.css({
            'display': 'inline-block',
            'margin-left': '10px',
            'position': 'relative',
            'top': '-3px'
        });

        button.on('click', async () => {
            if (bookmarks.length > 0) {
                const randomIndex = Math.floor(Math.random() * bookmarks.length);
                const randomBookmark = bookmarks[randomIndex];
                const link = `https://nhentai.net/g/${randomBookmark.id}`;

                // Store bookmark info in localStorage for the next page
                localStorage.setItem('randomMangaSource', JSON.stringify({
                    source: randomBookmark.source,
                    id: randomBookmark.id
                }));

                // Get the openInNewTabType value from storage
                const openInNewTabType = await GM.getValue('openInNewTabType', 'new-tab');
                const enableRandomButton = await GM.getValue('enableRandomButton', true);
                const randomOpenType = await GM.getValue('randomOpenType', 'new-tab');

                // Determine how to open the link based on the openInNewTabType value
                if (enableRandomButton && randomOpenType === 'new-tab') {
                    // Open the link in a new tab
                    window.open(link, '_blank');
                } else if (enableRandomButton && randomOpenType === 'current-tab') {
                    // Open the link in the current tab
                    window.location.href = link;
                } else if (openInNewTabType === 'new-tab') {
                    // Open the link in a new tab
                    window.open(link, '_blank');
                } else if (openInNewTabType === 'current-tab') {
                    // Open the link in the current tab
                    window.location.href = link;
                }
            } else {
                showPopup("No bookmarks found.", {
                    timeout: 3000
                });
            }
        });

        // Clear the interval since we've found the element
        clearInterval(intervalId);
    }
}

// Set an interval to check for the element every second
const intervalId = setInterval(checkAndAppendButton, 1);


    } else {
        // Check if we're on a manga page and show the popup
        checkRandomMangaSource();
    }
}

function checkRandomMangaSource() {
    const randomMangaSource = localStorage.getItem('randomMangaSource');

    if (randomMangaSource) {
        try {
            const { source } = JSON.parse(randomMangaSource);

            let popupText;
            if (source.startsWith('bookmark_manga_ids_')) {
                const link = source.replace('bookmark_manga_ids_', '');
                const maxLength = 40; // maximum length of the link to display
                const displayedLink = link.length > maxLength ? link.substring(0, maxLength) + '...' : link;
                popupText = `Random manga from <a href="${link}" target="_blank" style="word-wrap: break-word; width: 200px; display: inline-block; vertical-align: top;">${displayedLink}</a>`;
            } else {
                popupText = `Random manga from ${source}`;
            }

            // Create popup with options to random again or continue browsing
            showPopup(popupText, {
                autoClose: false,
                width: 250, // adjust the width to fit the link
                buttons: [
                    {
                        text: "<i class='fas fa-check'></i> Continue",
                        callback: () => {
                            // Just close the popup
                        }
                    },
                    {
                        text: "<i class='fas fa-random'></i> Again",
                        callback: async () => {
                            // Get bookmarks and find a new random one directly
                            const bookmarks = await getBookmarksFromStorage();

                            if (bookmarks.length > 0) {
                                const randomIndex = Math.floor(Math.random() * bookmarks.length);
                                const randomBookmark = bookmarks[randomIndex];
                                const link = `https://nhentai.net/g/${randomBookmark.id}`;

                                // Store bookmark info in localStorage for the next page
                                localStorage.setItem('randomMangaSource', JSON.stringify({
                                    source: randomBookmark.source,
                                    id: randomBookmark.id
                                }));

                                // Navigate to the new manga page
                                window.location.href = link;
                            } else {
                                showPopup("No bookmarks found.", {
                                    timeout: 3000
                                });
                            }
                        }
                    }
                ]
            });

            // Clear the localStorage item
            localStorage.removeItem('randomMangaSource');
        } catch (error) {
            console.error('Error parsing random manga source', error);
        }
    }
}
appendButton();



async function getBookmarksFromStorage() {
const bookmarks = [];
const addedIds = new Set();

// Check for bookmarks in the first format (simple array of IDs)
const allKeys = await GM.listValues();
for (const key of allKeys) {
if (key.startsWith("bookmark_manga_ids_")) {
    const ids = await GM.getValue(key);
    if (Array.isArray(ids)) {
        // Add each ID as a bookmark object
        ids.forEach(id => {
            if (!addedIds.has(id)) {
                bookmarks.push({
                    id: id,
                    url: `https://nhentai.net/g/${id}/`,
                    source: key
                });
                addedIds.add(id);
            }
        });
    }
}
}

// Check for bookmarks in the second format (array of objects)
const bookmarkedMangas = await GM.getValue("bookmarkedMangas");
if (Array.isArray(bookmarkedMangas)) {
bookmarkedMangas.forEach(manga => {
    // Extract ID from URL if it exists
    if (manga.url) {
        const match = manga.url.match(/\/g\/(\d+)/);
        if (match && match[1]) {
            const id = match[1];
            // Check if this ID is already in our bookmarks array
            if (!addedIds.has(id)) {
                bookmarks.push({
                    id: id,
                    url: manga.url,
                    cover: manga.cover || null,
                    title: manga.title || null,
                    source: "bookmarkedMangas"
                });
                addedIds.add(id);
            }
        }
    }
});
}

return bookmarks;
}

function getMangaLink(mangaID) {
    return `https://nhentai.net/g/${mangaID}`;
}
//---------------------------**BookMark-Random-Button**-----------------------------

//--------------------------**Offline Favoriting**----------------------------------------------
    // Main function to initialize the script
    async function init() {
        const offlineFavoritingEnabled = await GM.getValue('offlineFavoritingEnabled', true);
        if (!offlineFavoritingEnabled) return;
        console.log("NHentai Favorite Manager initialized");

        // Check if user is logged in
        const isLoggedIn = !document.querySelector('.menu-sign-in');
        console.log("User logged in status:", isLoggedIn);

        // Process stored favorites if user is logged in, regardless of current page
        if (isLoggedIn) {
            const toFavorite = await GM.getValue('toFavorite', []);
            if (Array.isArray(toFavorite) && toFavorite.length > 0) {
                console.log("Found stored favorites to process:", toFavorite);
                await processFavorites(toFavorite);
            }
        }

        // Only proceed with manga-specific features if we're on a manga page
        if (window.location.pathname.includes('/g/')) {
            await handleMangaPage(isLoggedIn);
        }
    }

    // Handle manga page-specific functionality
    async function handleMangaPage(isLoggedIn) {
        // Get the manga ID from the URL
        const mangaId = getMangaIdFromUrl();
        console.log("Current manga ID:", mangaId);

        if (!mangaId) {
            console.log("Could not find manga ID, exiting manga-specific handling");
            return;
        }

        // Get favorite button
        const favoriteBtn = document.querySelector("#info > div")?.firstElementChild;
        // Set up interval to log favorite button every 5 seconds
        /*setInterval(() => {
            console.log("Favorite button:", favoriteBtn);
        }, 5000);*/
        if (!favoriteBtn) {
            console.log("Could not find favorite button, exiting manga-specific handling");
            return;
        }

        // Get stored favorites
        let toFavorite = await GM.getValue('toFavorite', []);
        if (!Array.isArray(toFavorite)) {
            toFavorite = [];
            await GM.setValue('toFavorite', toFavorite);
        }
        console.log("Stored favorites:", toFavorite);

        // Is this manga in our favorites?
        const isFavorited = toFavorite.includes(mangaId);
        console.log("Current manga in stored favorites:", isFavorited);

        // Enable button if disabled
        if (favoriteBtn.classList.contains('btn-disabled') && !isLoggedIn) {
            favoriteBtn.classList.remove('btn-disabled');
            console.log("Favorite button enabled");
        }

        // Update button state if it's in our favorites
        if (isFavorited && !isLoggedIn) {
            updateButtonToFavorited(favoriteBtn);
        }

        // Add click event to favorite button
        favoriteBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log("Favorite button clicked");

            // Get the CURRENT list of favorites (not the one from page load)
            // This ensures we have the most up-to-date list
            let currentFavorites = await GM.getValue('toFavorite', []);
            if (!Array.isArray(currentFavorites)) {
                currentFavorites = [];
            }

            // Check if this manga is CURRENTLY in favorites
            const currentlyFavorited = currentFavorites.includes(mangaId);
            console.log("Manga currently in favorites:", currentlyFavorited);

            if (isLoggedIn) {
                // Send favorite request directly to API
                try {
                   
                } catch (error) {
                    console.error("Failed to favorite manga:", error);

                    // Show error popup
                    showPopup("Failed to favorite manga: " + error.message, {
                        timeout: 4000,
                        width: '300px'
                    });
                }
            } else {
                // Toggle in stored favorites
                if (currentlyFavorited) {
                    // Remove from favorites
                    const index = currentFavorites.indexOf(mangaId);
                    currentFavorites.splice(index, 1);
                    updateButtonToUnfavorited(favoriteBtn);
                //    showPopup("Removed from offline favorites", {
                //        timeout: 2000,
                //        width: '300px'
                //    });
                    console.log("Removed manga from stored favorites:", mangaId);
                } else {
                    // Add to favorites
                    currentFavorites.push(mangaId);
                    updateButtonToFavorited(favoriteBtn);
                //    showPopup("Added to offline favorites", {
                //        timeout: 2000,
                //        width: '300px'
                //    });
                    console.log("Added manga to stored favorites:", mangaId);
                }

                await GM.setValue('toFavorite', currentFavorites);
                console.log("Updated stored favorites:", currentFavorites);
            }
        });
    }

    // Helper function to get manga ID from URL
    function getMangaIdFromUrl() {
        const urlPath = window.location.pathname;
        const match = urlPath.match(/\/g\/(\d+)/);
        return match ? match[1] : null;
    }

    // Extract CSRF token from page
    function getCsrfToken() {
        // Try to get from app initialization
        const scriptText = document.body.innerHTML;
        const tokenMatch = scriptText.match(/csrf_token:\s*"([^"]+)"/);
        if (tokenMatch && tokenMatch[1]) {
            console.log("Found CSRF token from script:", tokenMatch[1]);
            return tokenMatch[1];
        }

        // Try alternative method - look for form inputs
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfInput) {
            console.log("Found CSRF token from input:", csrfInput.value);
            return csrfInput.value;
        }

        console.log("Could not find CSRF token");
        return null;
    }

// Nhentai Plus+.user.js (4405-4427)
function updateButtonToFavorited(button) {
    button.classList.add('favorited');

    const icon = button.querySelector('i');
    const text = button.querySelector('span');

    if (icon) icon.className = 'far fa-heart'; // Solid (filled) heart
    if (text) {
        const countSpan = text.querySelector('span.nobold');
        text.innerText = 'Unfavorite ';
        if (countSpan) {
            text.appendChild(countSpan);
        }
    }

    console.log("Button updated to favorited state");
}

function updateButtonToUnfavorited(button) {
    button.classList.remove('favorited');

    const icon = button.querySelector('i');
    const text = button.querySelector('span');

    if (icon) icon.className = 'fas fa-heart'; // Regular (outline) heart
    if (text) {
        const countSpan = text.querySelector('span.nobold');
        text.innerText = 'Favorite ';
        if (countSpan) {
            text.appendChild(countSpan);
        }
    }

    console.log("Button updated to unfavorited state");
}


// Modified sendFavoriteRequest function with improved CSRF token handling
async function sendFavoriteRequest(mangaId) {
    const isIOSDevice = await GM.getValue('isIOSDevice', false);
    if (isIOSDevice) {
        // For iOS, we'll use a more compatible method
        return new Promise((resolve, reject) => {
            console.log("Using iOS-compatible favoriting method for manga:", mangaId);

            // Get CSRF token using improved method
            const csrfToken = getCsrfToken();
            if (!csrfToken) {
                console.error("Could not find CSRF token for request");
                reject(new Error("Missing CSRF token"));
                return;
            }

            // Create a temporary form to submit
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `https://nhentai.net/api/gallery/${mangaId}/favorite`;
            form.style.display = 'none';

            // Add CSRF token to form
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add a hidden iframe to target the form
            const iframe = document.createElement('iframe');
            iframe.name = 'favorite_frame';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Set up form target and add to document
            form.target = 'favorite_frame';
            document.body.appendChild(form);

            // Set up response handling
            let timeoutId;

            iframe.onload = () => {
                clearTimeout(timeoutId);
                try {
                    // Check if favoriting was successful
                    if (iframe.contentDocument.body.textContent.includes('success')) {
                        console.log("Successfully favorited manga:", mangaId);
                        resolve({ status: 200 });
                    } else {
                        console.error("Failed to favorite manga:", mangaId);
                        reject(new Error("Failed to favorite manga"));
                    }
                } catch (e) {
                    // If we can't access iframe content due to CORS, assume success
                    console.log("Could not access iframe content, assuming success");
                    resolve({ status: 200 });
                }

                // Clean up
                setTimeout(() => {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                }, 100);
            };

            // Set timeout in case of no response
            timeoutId = setTimeout(() => {
                console.error("Favorite request timed out for manga:", mangaId);
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                reject(new Error("Request timed out"));
            }, 10000);

            // Submit the form
            form.submit();
        });
    }else{
    return new Promise((resolve, reject) => {
        console.log("Sending favorite request for manga:", mangaId);

        // Get CSRF token - trying multiple methods
        let csrfToken = getCsrfToken();
        if (!csrfToken) {
            console.error("Could not find CSRF token for request");
            reject(new Error("Missing CSRF token"));
            return;
        }

        // Use fetch API instead of GM.xmlHttpRequest for iOS compatibility
        // Note: This requires Tampermonkey to grant fetch permissions
        fetch(`https://nhentai.net/api/gallery/${mangaId}/favorite`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": csrfToken,
                "Referer": "https://nhentai.net/g/" + mangaId + "/",
                "User-Agent": navigator.userAgent
            },
            body: `csrf_token=${encodeURIComponent(csrfToken)}`,
            credentials: "include", // Important for sending cookies properly
            mode: "cors"
        })
        .then(response => {
            console.log("Favorite request response for manga " + mangaId + ":", response.status);
            if (response.status === 200) {
                resolve(response);
            } else {
                console.error("Favorite request failed for manga " + mangaId + ":", response.status);
                reject(new Error(`Request failed with status ${response.status}`));
            }
        })
        .catch(error => {
            console.error("Favorite request error for manga " + mangaId + ":", error);
            reject(error);
        });
    });
}
}

// Improved CSRF token extraction function
function getCsrfToken() {
    // Try to get from script tag with the most up-to-date token
    const scriptTags = document.querySelectorAll('script:not([src])');
    for (const script of scriptTags) {
        const tokenMatch = script.textContent.match(/csrf_token:\s*"([^"]+)"/);
        if (tokenMatch && tokenMatch[1]) {
            console.log("Found CSRF token from inline script:", tokenMatch[1]);
            return tokenMatch[1];
        }
    }

    // Try to get from window._n_app object which should have the most recent token
    if (window._n_app && window._n_app.csrf_token) {
        console.log("Found CSRF token from window._n_app:", window._n_app.csrf_token);
        return window._n_app.csrf_token;
    }

    // Try getting from page HTML (your original method)
    const scriptText = document.body.innerHTML;
    const tokenMatch = scriptText.match(/csrf_token:\s*"([^"]+)"/);
    if (tokenMatch && tokenMatch[1]) {
        console.log("Found CSRF token from page HTML:", tokenMatch[1]);
        return tokenMatch[1];
    }

    // Try alternative method - look for form inputs
    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfInput) {
        console.log("Found CSRF token from input:", csrfInput.value);
        return csrfInput.value;
    }

    console.log("Could not find CSRF token");
    return null;
}

// Add this function to check if cookies are properly enabled and set
function verifyCookies() {
    return new Promise((resolve, reject) => {
        // Try setting a test cookie
        document.cookie = "test_cookie=1; path=/;";

        // Check if the cookie was set
        if (document.cookie.indexOf("test_cookie=1") === -1) {
            console.error("Cookies appear to be disabled or restricted");
            reject(new Error("Cookies appear to be disabled or restricted"));
            return;
        }

        // Verify session cookies by making a simple request
        fetch("https://nhentai.net/", {
            method: "GET",
            credentials: "include"
        })
        .then(response => {
            if (response.ok) {
                // Check if we're actually logged in by looking for specific elements in the response
                return response.text().then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");

                    // If the menu-sign-in element is present, we're not properly logged in
                    const signInElement = doc.querySelector('.menu-sign-in');
                    if (signInElement) {
                        console.error("Session cookies not working correctly - not logged in");
                        reject(new Error("Session cookies not working correctly - not logged in"));
                    } else {
                        console.log("Cookies and session verified successfully");
                        resolve(true);
                    }
                });
            } else {
                console.error("Failed to verify session");
                reject(new Error("Failed to verify session"));
            }
        })
        .catch(error => {
            console.error("Error verifying cookies:", error);
            reject(error);
        });
    });
}

// Modify the processFavorites function to check cookies first
async function processFavorites(favorites) {
    if (window.location.href.startsWith("https://nhentai.net/login/")) {
        return;
    }

    console.log("Processing stored favorites:", favorites);

    // Verify cookies before proceeding
    try {
        await verifyCookies();
    } catch (error) {
        console.error("Cookie verification failed:", error);
        showPopup(`Cannot process favorites: ${error.message}. Try logging in again.`, {
            timeout: 5000,
            width: '300px'
        });
        return;
    }

        // Create and show a popup with progress information
        const progressPopup = showPopup(`Processing favorites: 0/${favorites.length}`, {
            autoClose: false,
            width: '300px',
            buttons: [
                {
                    text: "Cancel",
                    callback: () => {
                        // User canceled processing
                        processingCanceled = true;
                    }
                }
            ]
        });

        const successfulOnes = [];
        const failedOnes = [];
        let processingCanceled = false;

        for (let i = 0; i < favorites.length; i++) {
            if (processingCanceled) {
                progressPopup.updateMessage(`Processing canceled. Completed: ${successfulOnes.length}/${favorites.length}`);
                break;
            }

            const mangaId = favorites[i];

            // Update progress in popup
            progressPopup.updateMessage(`Processing favorites: ${i+1}/${favorites.length}`);

            try {
                await sendFavoriteRequest(mangaId);
                console.log("Successfully favorited manga:", mangaId);
                successfulOnes.push(mangaId);
            } catch (error) {
                console.error("Error favoriting manga:", mangaId, error);
                failedOnes.push(mangaId);
            }

            // Small delay to avoid hammering the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Keep only the failed ones in storage
        if (failedOnes.length > 0) {
            await GM.setValue('toFavorite', failedOnes);
            console.log("Updated stored favorites with failed ones:", failedOnes);
        } else {
            // Clear stored favorites after processing
            await GM.setValue('toFavorite', []);
            console.log("Cleared stored favorites");
        }

        // Update final result in popup
        progressPopup.updateMessage(`Completed: ${successfulOnes.length} successful, ${failedOnes.length} failed`);

        // Close the popup
        progressPopup.close();

        // Show a summary popup that auto-closes
        showPopup(`Completed: ${successfulOnes.length} successful, ${failedOnes.length} failed`, {
            timeout: 5000,
            width: '300px',
            buttons: [
                {
                    text: "OK",
                    callback: () => {}
                }
            ]
        });
    }

init();
//--------------------------**Offline Favoriting**----------------------------------------------


//-----------------------------------------------------NFM-Debugging------------------------------------------------------------------

// Add this function to create a settings menu
async function createSettingsMenu() {

    const nfmPageEnabled = await GM.getValue('nfmPageEnabled', true);
    if (!nfmPageEnabled) return;

    // Create settings button
    const nav = document.querySelector('nav .menu.left');
    if (!nav) return;

    const settingsLi = document.createElement('li');
    settingsLi.className = 'desktop';
    const settingsLink = document.createElement('a');
    settingsLink.href = '#';
    settingsLink.innerHTML = '<i class="fas fa-cog" style="color:pink;"></i> NFM';
    settingsLi.appendChild(settingsLink);
    nav.appendChild(settingsLi);

    // Create settings popup
    settingsLink.addEventListener('click', async (e) => {
        e.preventDefault();

        const offlineFavoritingEnabled = await GM.getValue('offlineFavoritingEnabled', true);
        const toFavorite = await GM.getValue('toFavorite', []);
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        const content = `
            <div style="padding: 1rem;">
                <h3>NHentai Favorite Manager Settings</h3>
                <div style="margin-bottom: 1rem;">
                    <label>
                        <input type="checkbox" id="nfm-offline-favoriting" ${offlineFavoritingEnabled ? 'checked' : ''}>
                        Enable offline favoriting
                    </label>
                </div>
                <div style="margin-bottom: 1rem;">
                    <p>Pending favorites: ${toFavorite.length}</p>
                    <button id="nfm-clear-favorites" class="btn btn-secondary">Clear Pending Favorites</button>
                    <button id="nfm-process-favorites" class="btn btn-primary">Process Now</button>
                </div>
                <div style="margin-bottom: 1rem;">
                    <h4>Debug Info</h4>
                    <p>iOS Device: ${isIOSDevice ? 'Yes' : 'No'}</p>
                    <p>Logged In: ${!document.querySelector('.menu-sign-in') ? 'Yes' : 'No'}</p>
                    <p>Cookies Enabled: ${navigator.cookieEnabled ? 'Yes' : 'No'}</p>
                    <button id="nfm-test-request" class="btn btn-secondary">Test API Request</button>
                </div>
            </div>
        `;

        const popup = showPopup(content, {
            autoClose: false,
            width: '400px',
            buttons: [
                {
                    text: "Close",
                    callback: () => {}
                }
            ]
        });

        // Add event listeners
        document.getElementById('nfm-offline-favoriting').addEventListener('change', async (e) => {
            await GM.setValue('offlineFavoritingEnabled', e.target.checked);
            console.log("Offline favoriting enabled:", e.target.checked);
        });

        document.getElementById('nfm-clear-favorites').addEventListener('click', async () => {
            await GM.setValue('toFavorite', []);
            console.log("Cleared pending favorites");
            popup.updateMessage('Pending favorites cleared!');
            setTimeout(() => popup.close(), 1500);
        });

        document.getElementById('nfm-process-favorites').addEventListener('click', async () => {
            popup.close();
            const toFavorite = await GM.getValue('toFavorite', []);
            if (toFavorite.length > 0) {
                await processFavorites(toFavorite);
            } else {
                showPopup("No pending favorites to process.", {
                    timeout: 2000,
                    width: '300px'
                });
            }
        });

        document.getElementById('nfm-test-request').addEventListener('click', async () => {
            console.log("Testing API request...");
            try {
                await verifyCookies();
                showPopup("Cookie test successful!", {
                    timeout: 2000,
                    width: '300px'
                });
            } catch (error) {
                showPopup(`Cookie test failed: ${error.message}`, {
                    timeout: 4000,
                    width: '300px'
                });
            }
        });
    });
}

// Add this to your init function
createSettingsMenu();

//-----------------------------------------------------NFM-Debugging------------------------------------------------------------------

//-------------------------------------------------**Delete-Twitter-Button**-----------------------------------------------
async function deleteTwitterButton() {
    const twitterButtonEnabled = await GM.getValue('twitterButtonEnabled', true);
    if (!twitterButtonEnabled) return;

    $('a[href="https://twitter.com/nhentaiOfficial"]').remove();
}

deleteTwitterButton();

//-------------------------------------------------**Delete-Twitter-Button**-----------------------------------------------

//-------------------------------------------------**Delete-Info-Button**-----------------------------------------------
async function deleteInfoButton() {
    const infoButtonEnabled = await GM.getValue('infoButtonEnabled', true);
    if (!infoButtonEnabled) return;

    $("a[href='/info/']").remove();
  }

  //Call the function to execute
  deleteInfoButton();
//-------------------------------------------------**Delete-Info-Button**-----------------------------------------------

//-------------------------------------------------**Delete-Profile-Button**-----------------------------------------------


async  function deleteProfileButton() {
    const profileButtonEnabled = await GM.getValue('profileButtonEnabled', true);
    if (!profileButtonEnabled) return;

    $("li a[href^='/users/']").remove();
  }

  //Call the function to execute.
  deleteProfileButton();

  //-------------------------------------------------**Delete-Profile-Button**-----------------------------------------------

//-------------------------------------------------**Delete-Logout-Button**-----------------------------------------------

async  function deleteLogoutButton() {
    const logoutButtonEnabled = await GM.getValue('logoutButtonEnabled', true);
    if (!logoutButtonEnabled) return;

    $("li a[href='/logout/?next=/settings/']").parent().remove();
  }

  deleteLogoutButton();

//-------------------------------------------------**Delete-Logout-Button**-----------------------------------------------


//-------------------------------------------------**BookMark-Link**---------------------------------------------------------
async function createBookmarkLink() {
    const bookmarkLinkEnabled = await GM.getValue('bookmarkLinkEnabled', true);
    if (!bookmarkLinkEnabled) return;


    // Extract current manga ID from URL
    const currentMangaId = window.location.pathname.split('/')[2];

    // Get all GM keys
    const allKeys = await GM.listValues();

    // Filter bookmark keys and check for current ID
    let bookmarkUrl = null;
    for (const key of allKeys) {
        if (key.startsWith('bookmark_manga_ids_')) {
            const mangaIds = await GM.getValue(key, []);
            if (mangaIds.includes(currentMangaId)) {
                // Extract original bookmark URL from key
                bookmarkUrl = key.replace('bookmark_manga_ids_', '');
                break;
            }
        }
    }

    // Update title if bookmark found
    if (bookmarkUrl) {
        const $title = $('h1.title');
        const linkHtml = `<a href="${bookmarkUrl}" class="bookmark-link" style="color: inherit; text-decoration: none;"><u>${$title.html()}</u></a>`;
        $title.html(linkHtml).css('cursor', 'pointer');
    }
}
createBookmarkLink();

//-------------------------------------------------**BookMark-Link**---------------------------------------------------------

//-------------------------------------------------**Offline-Favorites-Page**---------------------------------------------------------
// Function to handle the offline favorites page
async function handleOfflineFavoritesPage() {
    // Check if we're on the favorites page
    if (window.location.pathname !== '/favorite/' && window.location.pathname !== '/favorite') {
        return;
    }

    // Check if the feature is enabled
    const offlineFavoritesPageEnabled = await GM.getValue('offlineFavoritesPageEnabled', true);
    if (!offlineFavoritesPageEnabled) {
        return;
    }

    // Remove any 404 elements
    const notFoundHeading = document.querySelector('h1');
    if (notFoundHeading?.textContent === '404 – Not Found') {
        notFoundHeading.remove();
    }

    const notFoundMessage = document.querySelector('p');
    if (notFoundMessage?.textContent === "Looks like what you're looking for isn't here.") {
        notFoundMessage.remove();
    }

    // Get offline favorites
    const offlineFavorites = await GM.getValue('toFavorite', []);

    // Create container for favorites
    const container = document.createElement('div');
    container.className = 'container';
    container.id = 'offline-favorites-container';

    // Create heading
    const heading = document.createElement('h1');
    heading.textContent = 'Offline Favorites';
    container.appendChild(heading);

    // Create description
    const description = document.createElement('p');
    description.textContent = 'These are manga you have favorited while offline. They will be synced to your account when you log in.';
    container.appendChild(description);

    // Create sort controls
    const sortControls = document.createElement('div');
    sortControls.className = 'sort-controls';
    sortControls.innerHTML = `
        <label>
            Sort by:
            <select id="sort-favorites">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
            </select>
        </label>
    `;
    container.appendChild(sortControls);

    // Create gallery container
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'gallery-container';
    container.appendChild(galleryContainer);

    // Add container to page
    document.getElementById('content').appendChild(container);

    // Add CSS styles
     // Add CSS styles
     GM.addStyle(`
        #offline-favorites-container {
            padding: 20px 0;
            max-width: 1200px;
            margin: 0 auto;
        }

        #offline-favorites-container h1 {
            margin-bottom: 10px;
            color: #ed2553;
            font-size: 2em;
        }

        #offline-favorites-container p {
            margin-bottom: 20px;
            color: #888;
            font-size: 1em;
        }

        .sort-controls {
            margin-bottom: 20px;
        }

        .sort-controls select {
            background-color: #252525;
            color: #f1f1f1;
            border: 1px solid #3d3d3d;
            padding: 8px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
        }

        .sort-controls select:hover {
            background-color: #3d3d3d;
        }

        .gallery-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 25px;
            padding: 0 10px;
        }

        .favorite-item {
            position: relative;
            border-radius: 3px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            transition: all 0.3s ease;
            background: #252525;
        }

        .favorite-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(237, 37, 83, 0.2);
        }

        .favorite-item img {
            width: 100%;
            height: auto;
            display: block;
            aspect-ratio: 3/4;
            object-fit: cover;
        }

        .favorite-item .title {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
            color: #ffffff;
            padding: 15px 10px;
            font-size: 14px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .favorite-item .remove-btn {
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0,0,0,0.5);
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 14px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s ease;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
        }

        @media (max-width: 768px) {
            .favorite-item .remove-btn {
                width: 12px;
                height: 12px;
                font-size: 12px;
            }
        }

        .favorite-item:hover .remove-btn {
            opacity: 1;
        }

        .favorite-item .remove-btn:hover {
            background: #ed2553;
            transform: scale(1.1);
        }

        .no-favorites {
            grid-column: 1 / -1;
            text-align: center;
            padding: 80px 0;
            color: #888;
            font-size: 1.2em;
            background: #252525;
            border-radius: 5px;
            margin: 20px 0;
        }

        @media (max-width: 768px) {
            .gallery-container {
                grid-template-columns: repeat(auto-fill, minmax(115px, .5fr));
                gap: 15px;
            }

            #offline-favorites-container h1 {
                font-size: 1.5em;
                text-align: center;
            }
        }
    `);

    // Function to render favorites
    async function renderFavorites(favorites, sortOrder = 'newest') {
        galleryContainer.innerHTML = '';

        if (favorites.length === 0) {
            const noFavorites = document.createElement('div');
            noFavorites.className = 'no-favorites';
            noFavorites.textContent = 'No offline favorites found. Add some by clicking the heart icon on manga pages.';
            galleryContainer.appendChild(noFavorites);
            return;
        }

        // Sort favorites if needed
        let sortedFavorites = [...favorites];
        if (sortOrder === 'newest') {
            sortedFavorites.reverse();
        }

        // Create a fragment to improve performance
        const fragment = document.createDocumentFragment();

        // Process each favorite
        for (const mangaId of sortedFavorites) {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';
            favoriteItem.dataset.id = mangaId;

            // Create link to manga
            const link = document.createElement('a');
            link.href = `https://nhentai.net/g/${mangaId}/`;

            // Create thumbnail image (placeholder initially)
            const img = document.createElement('img');
            img.src = 'https://i.nhentai.net/galleries/0/placeholder.jpg'; // Placeholder
            img.alt = `Manga ${mangaId}`;
            link.appendChild(img);

            // Create title element (will be updated with actual title)
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = `Loading...`;
            link.appendChild(title);

            // Create remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '✖';
            removeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Show confirmation popup before deleting
                showPopup('Are you sure you want to remove this from favorites?', {
                    autoClose: false,
                    width: '300px',
                    buttons: [
                        {
                            text: "Cancel",
                            callback: () => {
                                // Do nothing, just close the popup
                            }
                        },
                        {
                            text: "Remove",
                            callback: async () => {
                                // Store the manga ID for potential undo
                                const deletedMangaId = mangaId;
                                let deletedMangaInfo = null;

                                try {
                                    // Try to get manga info for the undo popup
                                    deletedMangaInfo = await GM.getValue(`manga_info_${mangaId}`, null);
                                } catch (error) {
                                    console.error("Error getting manga info for undo:", error);
                                }

                                // Remove from favorites
                                const updatedFavorites = sortedFavorites.filter(id => id !== mangaId);
                                await GM.setValue('toFavorite', updatedFavorites);

                                // Remove from display
                                favoriteItem.remove();

                                // Update display if no favorites left
                                if (updatedFavorites.length === 0) {
                                    renderFavorites(updatedFavorites, sortOrder);
                                }

                                // Show confirmation with undo button
                                showPopup(
                                    `Removed from favorites${deletedMangaInfo?.title ? ': ' + deletedMangaInfo.title : ''}`,
                                    {
                                        timeout: 5000,
                                        width: '300px',
                                        buttons: [
                                            {
                                                text: "Undo",
                                                callback: async () => {
                                                    // Get current favorites
                                                    const currentFavorites = await GM.getValue('toFavorite', []);

                                                    // Add the manga back if it's not already there
                                                    if (!currentFavorites.includes(deletedMangaId)) {
                                                        currentFavorites.push(deletedMangaId);
                                                        await GM.setValue('toFavorite', currentFavorites);

                                                        // Refresh the display to show the restored item
                                                        renderFavorites(currentFavorites, sortOrder);

                                                        // Show confirmation
                                                        showPopup('Favorite restored', { timeout: 2000 });
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                );
                            }
                        }
                    ]
                });
            });

            favoriteItem.appendChild(link);
            favoriteItem.appendChild(removeBtn);
            fragment.appendChild(favoriteItem);

            // Fetch manga info asynchronously
            fetchMangaInfo(mangaId).then(info => {
                if (info) {
                    // Update thumbnail
                    if (info.thumbnail) {
                        img.src = info.thumbnail;
                    }

                    // Update title
                    if (info.title) {
                        title.textContent = info.title;
                    }
                }
            }).catch(error => {
                console.error(`Error fetching info for manga ${mangaId}:`, error);
            });
        }

        galleryContainer.appendChild(fragment);
    }

    // Function to fetch manga info
    async function fetchMangaInfo(mangaId) {
        try {
            // Try to get from cache first
            const cachedInfo = await GM.getValue(`manga_info_${mangaId}`, null);
            if (cachedInfo) {
                return cachedInfo;
            }

            // Fetch from API
            const response = await fetch(`https://nhentai.net/g/${mangaId}/`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract title
            let title = '';
            const titleElement = doc.querySelector('.title');
            if (titleElement) {
                const prettyElement = titleElement.querySelector('.pretty');
                title = prettyElement ? prettyElement.textContent : titleElement.textContent;
            }

            // Extract thumbnail
            let thumbnail = '';
            const coverImg = doc.querySelector('#cover img');
            if (coverImg) {
                thumbnail = coverImg.getAttribute('data-src') || coverImg.getAttribute('src');
            }

            // Create info object
            const info = { title, thumbnail };

            // Cache the info
            await GM.setValue(`manga_info_${mangaId}`, info);

            return info;
        } catch (error) {
            console.error(`Error fetching manga info for ${mangaId}:`, error);
            return null;
        }
    }

    // Initialize with current favorites
    renderFavorites(offlineFavorites);

    // Add event listener for sort control
    document.getElementById('sort-favorites').addEventListener('change', function() {
        renderFavorites(offlineFavorites, this.value);
    });
}

// Call the function to handle the favorites page
handleOfflineFavoritesPage();

//-------------------------------------------------**Offline-Favorites-Page**---------------------------------------------------------


//-------------------------------------------------**Non-English-Manga**--------------------------------------------------------

async function applyNonEnglishStyles() {
    // Remove existing styles
    $('style[data-non-english]').remove();

    const showNonEnglish = await GM.getValue('showNonEnglish', 'show');
    let style = '';
    if (showNonEnglish === 'hide') {
        style = `.gallery:not([data-tags~='12227']) { display: none; }`;
    } else if (showNonEnglish === 'fade') {
        const nonEnglishFadeOpacity = 0.5; // Or get this from settings
        style = `.gallery:not([data-tags~='12227']) > .cover > img, .gallery:not([data-tags~='12227']) > .cover > .caption { opacity: ${nonEnglishFadeOpacity}; }`;
    }
    if (style) {
        const newStyle = document.createElement('style');
        newStyle.dataset.nonEnglish = true;
        newStyle.innerHTML = style;
        document.head.appendChild(newStyle);
    }
}

applyNonEnglishStyles(); // Apply styles on initial load


//-------------------------------------------------**Non-English-Manga**--------------------------------------------------------

// -----------------------------------------------**Thumbnail-Page-Numbers**--------------------------------------------------------

// Function to add page numbers to manga thumbnails
async function addPageNumbersToThumbnails() {
    // Check if the feature is enabled
    const showPageNumbersEnabled = await GM.getValue('showPageNumbersEnabled', true);
    if (!showPageNumbersEnabled) return;

    // Add CSS for page number display
    const pageNumberCSS = `
        .page-number-display {
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10;
            background-color: rgba(0,0,0,.4);
            opacity: 1;
        }
    `;
    GM.addStyle(pageNumberCSS);

    // Function to extract page count from a manga page
    async function getPageCount(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Look for the page count in the tags section
            const pageElement = doc.querySelector('#tags .tag-container:nth-last-child(2) .name');
            if (pageElement) {
                const pageCount = parseInt(pageElement.textContent.trim(), 10);
                if (!isNaN(pageCount)) {
                    return pageCount;
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching page count:', error);
            return null;
        }
    }

    // Function to add page number display to a gallery item
    async function addPageNumberToGallery(galleryItem) {
        // Check if this gallery already has a page number display
        if (galleryItem.querySelector('.page-number-display')) {
            return;
        }

        // Get the manga URL
        const coverLink = galleryItem.querySelector('.cover');
        if (!coverLink) return;

        const mangaUrl = coverLink.getAttribute('href');
        if (!mangaUrl) return;

        const fullUrl = `https://nhentai.net${mangaUrl}`;

        // Try to get page count
        const pageCount = await getPageCount(fullUrl);
        if (pageCount) {
            // Create and add the page number display
            const pageNumberDisplay = document.createElement('div');
            pageNumberDisplay.className = 'page-number-display';
            pageNumberDisplay.textContent = `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`;

            // Add to the cover element
            coverLink.style.position = 'relative';
            coverLink.appendChild(pageNumberDisplay);
        }
    }

    // Process all gallery items on the page
    function processGalleryItems() {
        const galleryItems = document.querySelectorAll('.gallery');
        galleryItems.forEach(galleryItem => {
            addPageNumberToGallery(galleryItem);
        });
    }

    // Initial processing
    processGalleryItems();

    // Set up a MutationObserver to handle dynamically added content
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    // Check if the added node is a gallery or contains galleries
                    if (node.classList && node.classList.contains('gallery')) {
                        addPageNumberToGallery(node);
                    } else if (node.querySelectorAll) {
                        const galleries = node.querySelectorAll('.gallery');
                        galleries.forEach(gallery => {
                            addPageNumberToGallery(gallery);
                        });
                    }
                });
            }
        });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
}

// Call the function to add page numbers to thumbnails
addPageNumbersToThumbnails();

// -----------------------------------------------**Thumbnail-Page-Numbers**--------------------------------------------------------

// -----------------------------------------------**Background Max Manga Sync**--------------------------------------------------------
// Wait for the HTML document to be fully loaded
setTimeout(async function() {
    // Function to fetch and process bookmarked pages
    async function processBookmarkedPages(isBackgroundProcess = false) {
      // Get all bookmarked pages from storage
      const bookmarkedPages = await GM.getValue('bookmarkedPages', []);
      
      // Get the max manga per bookmark from the slider
      const maxMangaPerBookmark = await GM.getValue('maxMangaPerBookmark', 5);
      
      // Get the last processing timestamp to avoid processing too frequently
      const lastProcessTime = await GM.getValue('lastBookmarkProcessTime', 0);
      const now = new Date().getTime();
      
      // If this is a background process, only run if it's been at least 1 hour since last run
      if (isBackgroundProcess && (now - lastProcessTime < 3600000)) {
        console.log('Background processing skipped - last run was less than 1 hour ago');
        return;
      }
      
      // Always get bookmarks from storage, but also check DOM if we're on the bookmarks page
      let bookmarkLinks = [];
      
      // First, always use the stored bookmarked pages as the primary source
      bookmarkLinks = bookmarkedPages.map(url => ({ href: url }));
      
      // If we're on the bookmarks page, also check the DOM for any new bookmarks
      if (!isBackgroundProcess && window.location.href.includes('/bookmarks')) {
        const domBookmarkLinks = document.querySelectorAll('.bookmarks-list .bookmark-link');
        console.log('Found bookmark links in DOM:', domBookmarkLinks.length);
        
        // Convert DOM collection to array and add any links not already in our list
        Array.from(domBookmarkLinks).forEach(link => {
          if (link.href && !bookmarkLinks.some(existing => existing.href === link.href)) {
            bookmarkLinks.push(link);
          }
        });
      }
      
      console.log('Processing bookmarks:', bookmarkLinks.length);

      console.log('Max manga per bookmark setting:', maxMangaPerBookmark);

      if (bookmarkLinks.length === 0) {
        console.log('No bookmark links found');
        return;
      }

      // Log the fetched bookmarked URLs
      console.log('Processing bookmarked URLs:');
      
      // Store the current time as the last processing time
      // await GM.setValue('lastBookmarkProcessTime', now);
      
      // Track rate limit status
      let isRateLimited = false;
      let rateLimitResetTime = 0;
      
      // Request each bookmark URL and extract manga URLs
      for (const link of bookmarkLinks) {
        if (!link.href) {
          console.log('Bookmark link has no href attribute, skipping');
          continue;
        }
        
        // If we're rate limited and the reset time hasn't passed, skip processing
        if (isRateLimited && now < rateLimitResetTime) {
          console.log(`Skipping processing due to rate limit. Will reset at ${new Date(rateLimitResetTime).toLocaleTimeString()}`);
          continue;
        }

        // Check if bookmark has existing cache
        const existingCache = await GM.getValue(`bookmark_manga_ids_${link.href}`);
        if (existingCache && !isBackgroundProcess) {
          console.log(`Skipping bookmark ${link.href} as it has existing cache`);
          continue;
        }

        console.log(`Processing bookmark: ${link.href}`);

        try {
          // Fetch the bookmark page with retry logic
          const bookmarkResponse = await fetchWithRetry(link.href);
          
          // Check for rate limiting headers
          const rateLimitRemaining = bookmarkResponse.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = bookmarkResponse.headers.get('X-RateLimit-Reset');
          
          if (rateLimitRemaining === '0' && rateLimitReset) {
            isRateLimited = true;
            rateLimitResetTime = parseInt(rateLimitReset) * 1000; // Convert to milliseconds
            console.log(`Rate limit reached. Will reset at ${new Date(rateLimitResetTime).toLocaleTimeString()}`);
          }
          
          const html = await bookmarkResponse.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');

          // Extract all manga URLs from the page (main gallery thumbnails)
          const mangaLinks = doc.querySelectorAll('.gallery a.cover');
          const allMangaUrls = Array.from(mangaLinks).map(link => {
            return {
              url: 'https://nhentai.net' + link.getAttribute('href'),
              id: link.getAttribute('href').split('/g/')[1].replace('/', '')
            };
          });

          // Store the complete list of manga IDs for this bookmark
          await GM.setValue(`bookmark_manga_ids_${link.href}`, allMangaUrls.map(item => item.id));

          // Apply limit if maxMangaPerBookmark is valid
          const limitToApply = (!isNaN(maxMangaPerBookmark) && maxMangaPerBookmark > 0)
            ? maxMangaPerBookmark
            : allMangaUrls.length;

          // Slice the array to the appropriate length
          const mangaToProcess = allMangaUrls.slice(0, limitToApply);

          // Log the fetched manga URLs from each bookmark with limit info
          console.log(`Found ${allMangaUrls.length} manga in bookmark, processing ${mangaToProcess.length} (limit: ${limitToApply})`);

          // Fetch and process tags for each manga URL (limited by maxMangaPerBookmark)
          for (const manga of mangaToProcess) {
            // Check if we've hit a rate limit during processing
            if (isRateLimited && now < rateLimitResetTime) {
              console.log(`Pausing manga processing due to rate limit. Will resume later.`);
              break;
            }
            
            const mangaId = manga.id;
            const mangaUrl = manga.url;

            // Use a simpler cache key that only depends on the manga ID
            let mangaInfo = await GM.getValue(`manga_${mangaId}`, null);

            // Track when this manga was last seen
            const currentTime = new Date().getTime();

            if (!mangaInfo) {
              console.log(`Fetching new manga info for ID: ${mangaId}, URL: ${mangaUrl}`);
              try {
                // Fetch the manga page with retry logic
                const mangaResponse = await fetchWithRetry(mangaUrl);
                
                // Check for rate limiting headers
                const mangaRateLimitRemaining = mangaResponse.headers.get('X-RateLimit-Remaining');
                const mangaRateLimitReset = mangaResponse.headers.get('X-RateLimit-Reset');
                
                if (mangaRateLimitRemaining === '0' && mangaRateLimitReset) {
                  isRateLimited = true;
                  rateLimitResetTime = parseInt(mangaRateLimitReset) * 1000; // Convert to milliseconds
                  console.log(`Rate limit reached during manga fetch. Will reset at ${new Date(rateLimitResetTime).toLocaleTimeString()}`);
                }
                
                const html = await mangaResponse.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const tagsList = doc.querySelectorAll('#tags .tag');
                
                // Get the title
                const titleElement = doc.querySelector('h1.title');
                const title = titleElement ? titleElement.textContent.trim() : null;

                if (tagsList.length > 0) {
                  const tags = Array.from(tagsList).map(tag => tag.textContent.trim());
                  console.log(`Fetched tags for ${mangaUrl}:`, tags);
                  mangaInfo = {
                    id: mangaId,
                    url: mangaUrl,
                    title: title,
                    tags: tags,
                    lastSeen: currentTime,
                    bookmarks: [link.href] // Track which bookmarks this manga appears in
                  };
                } else {
                  console.log(`No tags found for ${mangaUrl}`);
                  mangaInfo = {
                    id: mangaId,
                    url: mangaUrl,
                    title: title,
                    tags: [],
                    lastSeen: currentTime,
                    bookmarks: [link.href]
                  };
                }
                await GM.setValue(`manga_${mangaId}`, mangaInfo);
              } catch (error) {
                console.error(`Error fetching tags for: ${mangaUrl}`, error);
                mangaInfo = {
                  id: mangaId,
                  url: mangaUrl,
                  tags: [],
                  lastSeen: currentTime,
                  bookmarks: [link.href]
                };
                await GM.setValue(`manga_${mangaId}`, mangaInfo);
                
                // Check if the error was due to rate limiting
                if (error.message && error.message.includes('429')) {
                  isRateLimited = true;
                  rateLimitResetTime = currentTime + 300000; // Wait 5 minutes by default
                  console.log(`Rate limit detected from error. Pausing for 5 minutes.`);
                }
              }
            } else {
              // Update the existing manga info with the current timestamp
              // and add this bookmark if not already present
              if (!mangaInfo.bookmarks.includes(link.href)) {
                mangaInfo.bookmarks.push(link.href);
              }
              mangaInfo.lastSeen = currentTime;
              await GM.setValue(`manga_${mangaId}`, mangaInfo);
              console.log(`Updated existing manga cache for ${mangaId}`);
            }
            
            // Add a small delay between manga requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error processing bookmark: ${link.href}`, error);
          
          // Check if the error was due to rate limiting
          if (error.message && error.message.includes('429')) {
            isRateLimited = true;
            rateLimitResetTime = now + 300000; // Wait 5 minutes by default
            console.log(`Rate limit detected from error. Pausing for 5 minutes.`);
          }
        }
        
        // Add a delay between bookmark processing to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Optional: clean up old cached manga data that hasn't been seen in a while
      await cleanupOldCacheData(30); // Clean data older than 30 days

      console.log('Bookmark processing completed');

      // Store the current time as the last processing time AFTER processing is complete
      // Use current time instead of the 'now' variable from the beginning of the function
      await GM.setValue('lastBookmarkProcessTime', new Date().getTime());
    }

    // Helper function to clean up old cache data
    async function cleanupOldCacheData(daysOld) {
      try {
        const allKeys = await GM.listValues();
        const mangaKeys = allKeys.filter(key => key.startsWith('manga_'));
        const now = new Date().getTime();
        const cutoffTime = now - (daysOld * 24 * 60 * 60 * 1000); // Convert days to milliseconds

        let removedCount = 0;

        for (const key of mangaKeys) {
          const mangaInfo = await GM.getValue(key);

          // If there's no lastSeen or if it's older than the cutoff, remove it
          if (!mangaInfo || !mangaInfo.lastSeen || mangaInfo.lastSeen < cutoffTime) {
            await GM.deleteValue(key);
            removedCount++;
          }
        }

        if (removedCount > 0) {
          console.log(`Cleaned up ${removedCount} old manga entries from cache`);
        }
      } catch (error) {
        console.error('Error cleaning up old cache data:', error);
      }
    }

    // Helper function to fetch with retry logic for 429 errors
    async function fetchWithRetry(url, maxRetries = 10, initialDelay = 2000) {
      let retries = 0;
      let delay = initialDelay;

      while (retries < maxRetries) {
        try {
          const response = await fetch(url);

          // If we got a 429 Too Many Requests, retry after a delay
          if (response.status === 429) {
            retries++;
            console.log(`Rate limited (429) on ${url}. Retry ${retries}/${maxRetries} after ${delay}ms delay.`);
            
            // Check for Retry-After header
            const retryAfter = response.headers.get('Retry-After');
            if (retryAfter) {
              // Retry-After is in seconds, convert to milliseconds
              delay = parseInt(retryAfter) * 1000;
              console.log(`Server specified Retry-After: ${retryAfter} seconds`);
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
            // Increase delay for subsequent retries (exponential backoff)
            delay = Math.min(delay * 1.5, 30000); // Cap at 30 seconds
          } else {
            // For any other status, return the response
            return response;
          }
        } catch (error) {
          retries++;
          console.error(`Fetch error for ${url}. Retry ${retries}/${maxRetries}.`, error);
          if (retries >= maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
          // Increase delay for subsequent retries
          delay = Math.min(delay * 1.5, 30000);
        }
      }

      throw new Error(`Failed to fetch ${url} after ${maxRetries} retries.`);
    }

    // Helper function to update manga cache when limit changes
    async function updateMangaCache() {
      const maxMangaPerBookmark = await GM.getValue('maxMangaPerBookmark', 5);
      const allKeys = await GM.listValues();
      const mangaKeys = allKeys.filter(key => key.startsWith('manga_'));

      for (const key of mangaKeys) {
        const mangaInfo = await GM.getValue(key);

        if (mangaInfo) {
          const newLimit = maxMangaPerBookmark;
          const existingLimit = mangaInfo.limit;

          if (newLimit !== existingLimit) {
            console.log(`Updating manga cache for ${mangaInfo.id} with new limit ${newLimit}`);
            mangaInfo.limit = newLimit;
            await GM.setValue(key, mangaInfo);
          }
        }
      }
    }

    // Set up periodic background processing
    function setupBackgroundProcessing() {
      // Process bookmarks in the background every hour
      setInterval(async () => {
        console.log('Starting background bookmark processing...');
        await processBookmarkedPages(true);
      }, 3600000); // 1 hour in milliseconds
      
      // Also run once at startup after a short delay
      setTimeout(async () => {
        console.log('Running initial background bookmark processing...');
        await processBookmarkedPages(true);
      }, 30000); // 30 seconds after page load
    }

    // Process bookmarks on any page, but with different behavior
     // If we're on the bookmarks page, process immediately with DOM integration
     // Otherwise, process in background mode after a short delay
     if (window.location.href.includes('/bookmarks')) {
       processBookmarkedPages(false); // Process with DOM integration
     } else {
       // On other pages, process in background mode after a short delay
       setTimeout(() => {
         processBookmarkedPages(true); // Process in background mode
       }, 5000); // 5 second delay to not interfere with page loading
     }

     // Set up background processing regardless of current page
     setupBackgroundProcessing();

    // Update manga cache when limit changes
    updateMangaCache();
}, 2000);

//-----------------------------------------------**Background Max Manga Sync**--------------------------------------------------------

// -----------------------------------------------**Must-Add-Tags**-----------------------------------------------------------------------


// Function to update the must-add tags list
// Intercept both XHR and form submissions
// Ensure this is defined globally or within a scope accessible to both handlers
const originalOpen = XMLHttpRequest.prototype.open;

// Handle form submissions
document.querySelector('form.search').addEventListener('submit', async function(e) {
    e.preventDefault();
    const searchInput = this.querySelector('input[name="q"]');
    let query = searchInput.value; // Get the raw query string
    // Always split the query into an array of tags
    let queryArray = query.split(/\s+/).filter(tag => tag.length > 0).map(tag => tag.toLowerCase());
    const mustAddTagsEnabled = await GM.getValue('mustAddTagsEnabled', false);
const mustAddTags = (await GM.getValue('mustAddTags', [])).map(tag => tag.toLowerCase());
if (mustAddTagsEnabled) {
        queryArray = [...new Set([...queryArray, ...mustAddTags])];
    }
    query = queryArray.join(' ');
    window.location.href = `/search/?q=${encodeURIComponent(query)}`;
});



// Modify XHR requests
XMLHttpRequest.prototype.open = function(method, url) {
    // Store the original arguments and context for later use
    const xhr = this;
    const args = arguments;
    
    if (typeof url === 'string' && url.includes('/search/')) {
        try {
            const urlObj = new URL(url, window.location.origin);
            let query = urlObj.searchParams.get('q') || '';
            let queryArray = query.split(/\s+/).filter(tag => tag.length > 0).map(tag => tag.toLowerCase());
            
            // Fetch mustAddTags asynchronously for XHR as well
            GM.getValue('mustAddTagsEnabled', false).then(mustAddTagsEnabled => {
                if (mustAddTagsEnabled) {
                    GM.getValue('mustAddTags', []).then(mustAddTagsRaw => {
                        const mustAddTags = mustAddTagsRaw.map(tag => tag.toLowerCase());
                        try {
                            queryArray = [...new Set([...queryArray, ...mustAddTags])];
                            query = queryArray.join(' ');
                            
                            urlObj.searchParams.set('q', query);
                            // Re-open the request with the modified URL
                            return originalOpen.apply(xhr, [method, urlObj.toString(), ...Array.prototype.slice.call(args, 2)]);
                        } catch (error) {
                            console.error('Error in XHR open override (mustAddTags):', error);
                            // Fall back to original URL if there's an error
                            return originalOpen.apply(xhr, args);
                        }
                    }).catch(error => {
                        console.error('Error getting mustAddTags:', error);
                        return originalOpen.apply(xhr, args);
                    });
                } else {
                    return originalOpen.apply(xhr, args);
                }
            }).catch(error => {
                console.error('Error getting mustAddTagsEnabled:', error);
                return originalOpen.apply(xhr, args);
            });
        } catch (error) {
            console.error('Error in XHR open override:', error);
            return originalOpen.apply(xhr, args);
        }
    } else {
        return originalOpen.apply(xhr, args);
    }
};



// -----------------------------------------------**AutoSync Initialization**-----------------------------------------------------------------------

// AutoSync initialization moved to be within scope of autoSyncManager definition

// -----------------------------------------------**Must-Add-Tags**-----------------------------------------------------------------------


// -----------------------------------------------**Manga-Sync**-----------------------------------------------------------------------


// Online Data Sync Implementation
class OnlineDataSync {
    constructor() {
        this.providers = {
            jsonstorage: new JSONStorageProvider()
        };
        this.publicConfig = {
            url: 'https://api.jsonstorage.net/v1/json/d206ce58-9543-48db-a5e4-997cfc745ef3/6629f339-5696-4b2e-b63d-b5d092dc46f6',
            apiKey: '2f9e71c8-be66-4623-a2cc-a6f05e958563'
        };
    }

    // Generate 5-character alphanumeric UUID
    generateUUID() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Get or create user UUID
    async getUserUUID() {
        // Check if we have a cached UUID first
        if (this.cachedUUID) {
            return this.cachedUUID;
        }

        let uuid = await GM.getValue('userUUID');
        if (!uuid) {
            uuid = this.generateUUID();
            await GM.setValue('userUUID', uuid);
        }

        // Cache the UUID for future use
        this.cachedUUID = uuid;
        return uuid;
    }

    // Collect all syncable data
    async collectSyncData() {
        const allKeys = await GM.listValues();
        const syncData = {
            version: CURRENT_VERSION,
            timestamp: new Date().toISOString(),
            userUUID: await this.getUserUUID(),
            data: {}
        };

        // Define which keys to sync
        const syncableKeys = [
            'bookmarkedPages', 'offlineFavorites', 'mustAddTags', 'mustAddTagsEnabled',
            'randomPrefLanguage', 'randomPrefTags', 'randomPrefPagesMin', 'randomPrefPagesMax',
            'blacklistedTags', 'findSimilarEnabled', 'bookmarksEnabled', 'maxTagsToSelect',
            'showNonEnglish', 'showPageNumbersEnabled', 'maxMangaPerBookmark'
        ];

        for (const key of syncableKeys) {
            if (allKeys.includes(key)) {
                syncData.data[key] = await GM.getValue(key);
            }
        }

        return syncData;
    }

    // Apply synced data
    async applySyncData(syncData) {
        if (!syncData || !syncData.data) {
            throw new Error('Invalid sync data format');
        }

        const currentUUID = await this.getUserUUID();
        if (syncData.userUUID && syncData.userUUID !== currentUUID) {
            const confirmMerge = confirm(
                `This data belongs to a different user (${syncData.userUUID}). ` +
                `Your UUID is ${currentUUID}. Do you want to merge this data anyway?`
            );
            if (!confirmMerge) {
                throw new Error('User cancelled data merge');
            }
        }

        let appliedCount = 0;
        for (const [key, value] of Object.entries(syncData.data)) {
            await GM.setValue(key, value);
            appliedCount++;
        }

        await GM.setValue('lastSyncDownload', new Date().toISOString());
        return appliedCount;
    }

    // Upload data using specified provider (supports multiple users)
    async uploadData(providerType, config) {
        const provider = this.providers[providerType];
        if (!provider) {
            throw new Error(`Unknown provider: ${providerType}`);
        }

        const userSyncData = await this.collectSyncData();
        const userUUID = userSyncData.userUUID;

        // Download existing data to merge with current user's data
        let existingData = {};
        try {
            existingData = await provider.download(config);
        } catch (error) {
            // If download fails (e.g., no data exists yet), start with empty object
            console.log('No existing data found, creating new storage');
        }

        // Ensure existingData has the correct structure for multiple users
        if (!existingData.users) {
            existingData = {
              //  version: CURRENT_VERSION,
                //lastUpdated: new Date().toISOString(),
                users: {}
            };
        }

        // Add/update current user's data
        existingData.users[userUUID] = userSyncData;
       // existingData.lastUpdated = new Date().toISOString();
        // existingData.version = CURRENT_VERSION;

        await provider.upload(config, existingData);
        await GM.setValue('lastSyncUpload', new Date().toISOString());
        return userSyncData;
    }

    // Download data using specified provider (supports multiple users)
    async downloadData(providerType, config) {
        const provider = this.providers[providerType];
        if (!provider) {
            throw new Error(`Unknown provider: ${providerType}`);
        }

        const allData = await provider.download(config);
        const userUUID = await this.getUserUUID();

        // Handle both old single-user format and new multi-user format
        let userSyncData;
        if (allData.users && allData.users[userUUID]) {
            // New multi-user format
            userSyncData = allData.users[userUUID];
        } else if (allData.userUUID === userUUID) {
            // Old single-user format
            userSyncData = allData;
        } else if (allData.users) {
            // Multi-user format but user not found
            const availableUsers = Object.keys(allData.users);
            throw new Error(`No data found for UUID ${userUUID}. Available UUIDs: ${availableUsers.join(', ')}`);
        } else {
            // Single-user format but different user
            throw new Error(`Data belongs to UUID ${allData.userUUID}, but your UUID is ${userUUID}`);
        }

        const appliedCount = await this.applySyncData(userSyncData);
        return { syncData: userSyncData, appliedCount, allUsers: allData.users ? Object.keys(allData.users) : [allData.userUUID] };
    }

    // Get available users from cloud storage without downloading data
    async getAvailableUsers(providerType, config) {
        const provider = this.providers[providerType];
        if (!provider) {
            throw new Error(`Unknown provider: ${providerType}`);
        }

        const allData = await provider.download(config);

        if (allData.users) {
            // Multi-user format
            return Object.keys(allData.users).map(uuid => ({
                uuid,
                version: allData.users[uuid].version || 'Unknown',
                timestamp: allData.users[uuid].timestamp,
                dataCount: Object.keys(allData.users[uuid].data || {}).length
            }));
        } else if (allData.userUUID) {
            // Old single-user format
            return [{
                uuid: allData.userUUID,
                version: allData.version || 'Unknown',
                timestamp: allData.timestamp,
                dataCount: Object.keys(allData.data || {}).length
            }];
        }

        return [];
    }
}

// JSONStorage.net provider implementation
class JSONStorageProvider {
    async upload(config, data) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'PUT',
                url: `${config.url}?apiKey=${config.apiKey}`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data),
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject(new Error(`Upload failed: ${response.status} ${response.statusText}`));
                    }
                },
                onerror: function(error) {
                    reject(new Error(`Network error: ${error}`));
                }
            });
        });
    }

    async download(config) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'GET',
                url: `${config.url}?apiKey=${config.apiKey}`,
                headers: {
                    'Accept': 'application/json'
                },
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject(new Error(`Download failed: ${response.status} ${response.statusText}`));
                    }
                },
                onerror: function(error) {
                    reject(new Error(`Network error: ${error}`));
                }
            });
        });
    }
}

// AutoSync Manager Class
// Handles automatic syncing of user data at specified intervals
// Features:
// - Configurable sync intervals (5-1440 minutes)
// - Automatic retry with exponential backoff on errors
// - Support for both public and private sync endpoints
// - Manual trigger capability
// - Data change detection for immediate sync
class AutoSyncManager {
    constructor(syncSystem) {
        this.syncSystem = syncSystem;
        this.intervalId = null;
        this.isEnabled = false;
        this.intervalMinutes = 30;
        this.lastSyncAttempt = null;
        this.consecutiveErrors = 0;
        this.maxRetries = 3;
    }

    // Initialize autosync based on current settings
    async initialize() {
        const autoSyncEnabled = await GM.getValue('autoSyncEnabled', false);
        const syncInterval = await GM.getValue('syncInterval', 30);

        this.isEnabled = autoSyncEnabled;
        this.intervalMinutes = syncInterval;

        if (this.isEnabled) {
            this.start();
            console.log(`AutoSync initialized: enabled=${this.isEnabled}, interval=${this.intervalMinutes} minutes`);
        } else {
            console.log('AutoSync disabled');
        }
    }

    // Start the autosync timer
    start() {
        this.stop(); // Clear any existing timer

        if (!this.isEnabled) {
            console.log('AutoSync not enabled, skipping start');
            return;
        }

        console.log(`AutoSync started with ${this.intervalMinutes} minute interval`);

        // Check if sync is needed on script load
        this.checkAndPerformSync();
    }

    // Stop the autosync timer
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('AutoSync stopped');
        }
    }

    // Check if sync is needed based on time elapsed since last sync
    async checkAndPerformSync() {
        if (!this.isEnabled) {
            return;
        }

        const lastAutoSync = await GM.getValue('lastAutoSync', null);
        const now = new Date().getTime();
        const intervalMs = this.intervalMinutes * 60 * 1000; // Convert minutes to milliseconds

        // If no previous sync or enough time has passed, perform sync
        if (!lastAutoSync || (now - new Date(lastAutoSync).getTime()) >= intervalMs) {
            console.log('AutoSync: Time interval reached, performing sync...');
            await this.performAutoSync();
        } else {
            const timeUntilNextSync = intervalMs - (now - new Date(lastAutoSync).getTime());
            const minutesUntilNext = Math.round(timeUntilNextSync / 60000);
            console.log(`AutoSync: Next sync in approximately ${minutesUntilNext} minutes`);
        }
    }

    // Update settings and restart if needed
    async updateSettings(enabled, intervalMinutes) {
        const wasEnabled = this.isEnabled;
        const oldInterval = this.intervalMinutes;

        this.isEnabled = enabled;
        this.intervalMinutes = intervalMinutes;

        // Restart if settings changed
        if (enabled && (!wasEnabled || oldInterval !== intervalMinutes)) {
            this.start();
        } else if (!enabled && wasEnabled) {
            this.stop();
        }

        console.log(`AutoSync settings updated: enabled=${enabled}, interval=${intervalMinutes} minutes`);
    }

    // Perform the actual sync operation
    async performAutoSync() {
        if (!this.isEnabled) {
            return;
        }

        this.lastSyncAttempt = new Date().toISOString();
        console.log('AutoSync: Starting automatic sync...');

        try {
            // Determine which sync method to use based on user preferences
            const publicSyncEnabled = await GM.getValue('publicSyncEnabled', false);
            const privateSyncEnabled = await GM.getValue('privateSyncEnabled', false);

            let syncPerformed = false;

            // Try private sync first if enabled
            if (privateSyncEnabled) {
                const privateStorageUrl = await GM.getValue('privateStorageUrl', '');
                const privateApiKey = await GM.getValue('privateApiKey', '');

                if (privateStorageUrl && privateApiKey) {
                    await this.syncSystem.uploadData('jsonstorage', {
                        url: privateStorageUrl,
                        apiKey: privateApiKey
                    });
                    console.log('AutoSync: Private sync completed successfully');
                    syncPerformed = true;
                }
            }

            // Fall back to public sync if private sync wasn't performed and public is enabled
            if (!syncPerformed && publicSyncEnabled) {
                await this.syncSystem.uploadData('jsonstorage', this.syncSystem.publicConfig);
                console.log('AutoSync: Public sync completed successfully');
                syncPerformed = true;
            }

            if (syncPerformed) {
                this.consecutiveErrors = 0; // Reset error counter on success
                await GM.setValue('lastAutoSync', new Date().toISOString());
            } else {
                console.log('AutoSync: No sync method enabled, skipping');
            }

        } catch (error) {
            this.consecutiveErrors++;
            console.error(`AutoSync error (attempt ${this.consecutiveErrors}):`, error);

            // If we've had too many consecutive errors, temporarily disable autosync
            if (this.consecutiveErrors >= this.maxRetries) {
                console.warn(`AutoSync: Too many consecutive errors (${this.consecutiveErrors}), temporarily disabling for this session`);
                this.stop();

                // Show a notification to the user if they're on the page
                if (typeof showPopup === 'function') {
                    showPopup(`AutoSync temporarily disabled due to repeated errors: ${error.message}`, {
                        timeout: 10000
                    });
                }
            }
        }
    }

    // Get status information
    async getStatus() {
        const lastAutoSync = await GM.getValue('lastAutoSync', null);
        return {
            enabled: this.isEnabled,
            intervalMinutes: this.intervalMinutes,
            lastSyncAttempt: this.lastSyncAttempt,
            lastSuccessfulSync: lastAutoSync,
            consecutiveErrors: this.consecutiveErrors,
            isRunning: this.intervalId !== null
        };
    }

    // Trigger immediate sync if autosync is enabled and data has changed
    async triggerDataChangeSync(changedKey) {
        if (!this.isEnabled) {
            return;
        }

        // Define which keys should trigger immediate sync
        const syncableKeys = [
            'bookmarkedPages', 'offlineFavorites', 'mustAddTags', 'mustAddTagsEnabled',
            'randomPrefLanguage', 'randomPrefTags', 'randomPrefPagesMin', 'randomPrefPagesMax',
            'blacklistedTags', 'findSimilarEnabled', 'bookmarksEnabled', 'maxTagsToSelect',
            'showNonEnglish', 'showPageNumbersEnabled', 'maxMangaPerBookmark'
        ];

        if (syncableKeys.includes(changedKey)) {
            console.log(`AutoSync: Data change detected for ${changedKey}, triggering immediate sync`);

            // Debounce rapid changes - only sync if last sync was more than 30 seconds ago
            const lastSync = await GM.getValue('lastAutoSync', null);
            const now = new Date().getTime();
            const thirtySecondsAgo = now - 30000;

            if (!lastSync || new Date(lastSync).getTime() < thirtySecondsAgo) {
                console.log('AutoSync: Performing immediate sync due to data change');
                await this.performAutoSync();
            } else {
                console.log('AutoSync: Skipping immediate sync due to recent sync activity');
            }
        }
    }
}

// Initialize sync system
const syncSystem = new OnlineDataSync();
const autoSyncManager = new AutoSyncManager(syncSystem);

// Helper function to save data and trigger autosync
async function setValueWithAutoSync(key, value) {
    await GM.setValue(key, value);
    await autoSyncManager.triggerDataChangeSync(key);
}

// Initialize AutoSync on page load
$(document).ready(async function() {
    // Wait a bit for the page to fully load before initializing autosync
    setTimeout(async () => {
        try {
            await autoSyncManager.initialize();
            console.log('AutoSync initialized on page load');
        } catch (error) {
            console.error('Failed to initialize AutoSync on page load:', error);
        }
    }, 3000); // 3 second delay to ensure everything is loaded
});

//----------------------------------------------------------**Manga-Sync**--------------------------------------------------------------------