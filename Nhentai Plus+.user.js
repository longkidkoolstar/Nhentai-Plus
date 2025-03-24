// ==UserScript==
// @name         Nhentai Plus+
// @namespace    github.com/longkidkoolstar
// @version      7.2
// @description  Enhances the functionality of Nhentai website.
// @author       longkidkoolstar
// @match        https://nhentai.net/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
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


//----------------------- **Fix Menu OverFlow**----------------------------------

// Nhentai Plus+.user.js
$(document).ready(function() {
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
        const cleanedTitleText = titleText.replace(/[\[\]\(\)\d\-]|Ch\.|ch\.|Vol\.|vol\.|[\u3002\uFF01-\uFF5E\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, '').trim();

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

        function AddAltVersionsToThis(target) {
            let place = target;
            let title = place.parent().find(".cover:visible > .caption").text();
            $.get(BuildUrl(title), function(data) {
                let found = $(data).find(".container > .gallery");
                if (!found || found.length <= 0) {
                    alert("error reading data");
                    return;
                }
                place.parent().find(".cover").remove();
                try {
                    for (let i = 0; i < found.length; i++) {
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

                        let thumbnailReplacement;
                        if (!!$(found[i]).find(".cover > img").attr("data-src")) {
                            thumbnailReplacement = $(found[i]).find(".cover > img").attr("data-src").replace(/\/\/.+?\.nhentai/g, "//i.nhentai").replace("thumb.jpg", "1.jpg").replace("thumb.png", "1.png");
                        } else {
                            thumbnailReplacement = $(found[i]).find(".cover > img").attr("src").replace(/\/\/.+?\.nhentai/g, "//i.nhentai").replace("thumb.jpg", "1.jpg").replace("thumb.png", "1.png");
                        }

                        $(found[i]).find(".cover > img").attr("src", thumbnailReplacement);
                        place.parent().append($(found[i]).find(".cover"));
                    }
                } catch (er) {
                    alert("error modifying data: " + er);
                    return;
                }
                place.parent().find(".cover:not(:first)").css("display", "none");
                place.parent().find(".versionPrevButton, .versionNextButton, .numOfVersions").show(200);
                place.parent().find(".numOfVersions").text("1/" + (found.length));
                place.hide(200);
            }).fail(function(e) {
                alert("error getting data: " + e);
            });
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
}

addBookmarkButton(); // Call the function to add the bookmark button


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
    const bookmarkedPages = await GM.getValue('bookmarkedPages', []);
    const bookmarkedMangas = await GM.getValue('bookmarkedMangas', []);

    if (Array.isArray(bookmarkedPages) && Array.isArray(bookmarkedMangas)) {
        const bookmarksContainer = $('<div id="bookmarksContainer" class="container">');
        const bookmarksTitle = $('<h2 class="bookmarks-title">Bookmarked Pages</h2>');
        const bookmarksList = $('<ul class="bookmarks-list">');
        const searchInput = $('<input type="text" id="searchBookmarks" placeholder="Search bookmarks..." class="search-input">');
        const mangaBookmarksTitle = $('<h2 class="bookmarks-title">Bookmarked Mangas</h2>');
        const mangaBookmarksList = $('<ul class="bookmarks-grid">');
        const tagSearchInput = $('<input type="text" id="searchMangaTags" placeholder="Search manga tags..." class="search-input">');

        bookmarksContainer.append(bookmarksTitle);
        bookmarksContainer.append(searchInput);
        bookmarksContainer.append(tagSearchInput); // Append the new search input
        bookmarksContainer.append(bookmarksList);
        bookmarksContainer.append(mangaBookmarksTitle);
        bookmarksContainer.append(mangaBookmarksList);
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
                color: white;
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

// Wait for the HTML document to be fully loaded
setTimeout(async function() {
    // Function to fetch and process bookmarked pages
    async function processBookmarkedPages() {
      // Select all .bookmark-link elements from the .bookmarks-list
      const bookmarkLinks = document.querySelectorAll('.bookmarks-list .bookmark-link');
      
      // Get the max manga per bookmark from the slider
      const maxMangaPerBookmark = await GM.getValue('maxMangaPerBookmark', 5);
      
      console.log('Found bookmark links:', bookmarkLinks.length);
      console.log('Max manga per bookmark setting:', maxMangaPerBookmark);

      if (bookmarkLinks.length === 0) {
        console.log('No bookmark links found');
        return;
      }

      // Log the fetched bookmarked URLs
      console.log('Processing bookmarked URLs:');
      
      // Request each bookmark URL and extract manga URLs
      for (const link of bookmarkLinks) {
        if (!link.href) {
          console.log('Bookmark link has no href attribute, skipping');
          continue;
        }
        
        // Check if bookmark has existing cache
        const existingCache = await GM.getValue(`bookmark_manga_ids_${link.href}`);
        if (existingCache) {
          console.log(`Skipping bookmark ${link.href} as it has existing cache`);
          continue;
        }
        
        console.log(`Processing bookmark: ${link.href}`);
        
        try {
          // Fetch the bookmark page with retry logic
          const bookmarkResponse = await fetchWithRetry(link.href);
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
            const mangaId = manga.id;
            const mangaUrl = manga.url;
            
            // Use a simpler cache key that only depends on the manga ID
            let mangaInfo = await GM.getValue(`manga_${mangaId}`, null);
            
            // Track when this manga was last seen
            const now = new Date().getTime();
            
            if (!mangaInfo) {
              console.log(`Fetching new manga info for ID: ${mangaId}, URL: ${mangaUrl}`);
              try {
                // Fetch the manga page with retry logic
                const mangaResponse = await fetchWithRetry(mangaUrl);
                const html = await mangaResponse.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const tagsList = doc.querySelectorAll('#tags .tag');
                
                if (tagsList.length > 0) {
                  const tags = Array.from(tagsList).map(tag => tag.textContent.trim());
                  console.log(`Fetched tags for ${mangaUrl}:`, tags);
                  mangaInfo = {
                    id: mangaId,
                    url: mangaUrl,
                    tags: tags,
                    lastSeen: now,
                    bookmarks: [link.href] // Track which bookmarks this manga appears in
                  };
                } else {
                  console.log(`No tags found for ${mangaUrl}`);
                  mangaInfo = {
                    id: mangaId,
                    url: mangaUrl,
                    tags: [],
                    lastSeen: now,
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
                  lastSeen: now,
                  bookmarks: [link.href]
                };
                await GM.setValue(`manga_${mangaId}`, mangaInfo);
              }
            } else {
              // Update the existing manga info with the current timestamp
              // and add this bookmark if not already present
              if (!mangaInfo.bookmarks.includes(link.href)) {
                mangaInfo.bookmarks.push(link.href);
              }
              mangaInfo.lastSeen = now;
              await GM.setValue(`manga_${mangaId}`, mangaInfo);
              console.log(`Updated existing manga cache for ${mangaId}`);
            }
          }
        } catch (error) {
          console.error(`Error processing bookmark: ${link.href}`, error);
        }
      }
      
      // Optional: clean up old cached manga data that hasn't been seen in a while
      await cleanupOldCacheData(30); // Clean data older than 30 days
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
    async function fetchWithRetry(url, maxRetries = 10, delay = 2000) {
      let retries = 0;
      
      while (retries < maxRetries) {
        try {
          const response = await fetch(url);
          
          // If we got a 429 Too Many Requests, retry after a delay
          if (response.status === 429) {
            retries++;
            console.log(`Rate limited (429) on ${url}. Retry ${retries}/${maxRetries} after ${delay}ms delay.`);
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

    // Call the function to process bookmarked pages
    processBookmarkedPages();
    
    // Update manga cache when limit changes
    updateMangaCache();
}, 2000);



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

</style>

<div id="content">
    <h1>Settings</h1>
    <form id="settingsForm">
        <label>
            <input type="checkbox" id="offlineFavoritingEnabled">
            Enable Offline Favoriting <span class="tooltip" data-tooltip="Allows favoriting manga even without being logged in.">?</span>
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
        <label>
            <input type="checkbox" id="bookmarkLinkEnabled">
            Enable Bookmark Link <span class="tooltip" data-tooltip="Adds a link to your bookmark in the manga title.">?</span>
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
          <span class="tooltip" data-tooltip="Sets the maximum number of manga to display per bookmark.">?</span>
        </div>

        <!-- Page Management Section -->
        <div id="page-management">
            <h3 class="expand-icon">Page Management <span class="tooltip" data-tooltip="Enable or disable custom pages and features.">?</span></h3>
            <div id="page-management-content">
                <p>Control which custom pages and navigation elements are enabled:</p>
                
                <div class="section-header">Feature Pages</div>
                <label>
                    <input type="checkbox" id="nfmPageEnabled">
                    Enable NFM (Nhentai Favorite Manager) Page <span class="tooltip" data-tooltip="Enables the Nhentai Favorite Manager page for favorite management.">?</span>
                </label>
                <label>
                    <input type="checkbox" id="bookmarksPageEnabled">
                    Enable Bookmarks Page <span class="tooltip" data-tooltip="Enables the dedicated Bookmarks page for managing saved bookmarks.">?</span>
                </label>
            <div id="bookmark-page-options" style="display: none;">
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
        </div>
     </div>

        <div id="random-settings">
            <h3>Random Hentai Preferences</h3>
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
        <label>
            <input type="checkbox" id="tooltipsEnabled">
            Enable Tooltips <span class="tooltip" data-tooltip="Enables or disables tooltips.">?</span>
        </label>
        
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
            const findAltMangaThumbnailEnabled = await GM.getValue('findAltMangaThumbnailEnabled', true);
            const openInNewTabEnabled = await GM.getValue('openInNewTabEnabled', true); 
            const mangaBookMarkingButtonEnabled = await GM.getValue('mangaBookMarkingButtonEnabled', true);
            const mangaBookMarkingType = await GM.getValue('mangaBookMarkingType', 'cover');
            const monthFilterEnabled = await GM.getValue('monthFilterEnabled', true);
            const tooltipsEnabled = await GM.getValue('tooltipsEnabled', true);
            const mangagroupingenabled = await GM.getValue('mangagroupingenabled', true);
            const maxMangaPerBookmark = await GM.getValue('maxMangaPerBookmark', 5);
            const openInNewTabType = await GM.getValue('openInNewTabType', 'background');
            const offlineFavoritingEnabled = await GM.getValue('offlineFavoritingEnabled', true);
            const nfmPageEnabled = await GM.getValue('nfmPageEnabled', true);
            const bookmarksPageEnabled = await GM.getValue('bookmarksPageEnabled', true);
            const twitterButtonEnabled = await GM.getValue('twitterButtonEnabled', true);
            const enableRandomButton = await GM.getValue('enableRandomButton', true);
            const randomOpenType = await GM.getValue('randomOpenType', 'new-tab');
            const profileButtonEnabled = await GM.getValue('profileButtonEnabled', true);
            const infoButtonEnabled = await GM.getValue('infoButtonEnabled', true);
            const logoutButtonEnabled = await GM.getValue('logoutButtonEnabled', true);
            const bookmarkLinkEnabled = await GM.getValue('bookmarkLinkEnabled', true);
            const findSimilarType = await GM.getValue('findSimilarType', 'immediately');

            $('#findSimilarEnabled').prop('checked', findSimilarEnabled);
            $('#find-similar-options').toggle(findSimilarEnabled);

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
            $('#findAltMangaThumbnailEnabled').prop('checked', findAltMangaThumbnailEnabled);
            $('#openInNewTabEnabled').prop('checked', openInNewTabEnabled);
            $('#mangaBookMarkingButtonEnabled').prop('checked', mangaBookMarkingButtonEnabled);
            $('#monthFilterEnabled').prop('checked', monthFilterEnabled);
            $('#tooltipsEnabled').prop('checked', tooltipsEnabled);
            $('#mangagroupingenabled').prop('checked', mangagroupingenabled);
            $('#max-manga-per-bookmark-slider').val(maxMangaPerBookmark);
            $('#offlineFavoritingEnabled').prop('checked', offlineFavoritingEnabled);
            $('#nfmPageEnabled').prop('checked', nfmPageEnabled);
            $('#bookmarksPageEnabled').prop('checked', bookmarksPageEnabled);
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





// Nhentai Plus+.user.js (2522-2535)
// Initialize the visibility of the find-similar-options div based on the initial state of the findSimilarEnabled checkbox
$('#find-similar-options').toggle(findSimilarEnabled);

// Add event listener to toggle the find-similar-options div when the findSimilarEnabled checkbox is changed
$('#findSimilarEnabled').on('change', function() {
    const isChecked = $(this).is(':checked');
    $('#find-similar-options').toggle(isChecked);
});

        $('#page-management-content').hide();
            
            // Add expand/collapse functionality for new page management section
            $('#page-management h3').click(function() {
                $(this).toggleClass('expanded');
                $('#page-management-content').slideToggle();
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

            $('#mangaBookMarkingButtonEnabled').on('change', function() {
                if ($(this).prop('checked')) {
                    $('#manga-bookmarking-options').show();
                } else {
                    $('#manga-bookmarking-options').hide();
                }
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
            const pagesMin = $('#pref-pages-min').val();
            const pagesMax = $('#pref-pages-max').val();
            const matchAllTags = $('#matchAllTags').prop('checked');
            const findAltMangaThumbnailEnabled = $('#findAltMangaThumbnailEnabled').prop('checked');
            const openInNewTabEnabled = $('#openInNewTabEnabled').prop('checked'); 
            const mangaBookMarkingButtonEnabled = $('#mangaBookMarkingButtonEnabled').prop('checked');
            const mangaBookMarkingType = $('input[name="manga-bookmarking-type"]:checked').val();
            const monthFilterEnabled = $('#monthFilterEnabled').prop('checked');
            const tooltipsEnabled = $('#tooltipsEnabled').prop('checked');
            const mangagroupingenabled = $('#mangagroupingenabled').prop('checked');
            const maxMangaPerBookmark = parseInt($('#max-manga-per-bookmark-slider').val());
            const openInNewTabType = $('input[name="open-in-new-tab"]:checked').val();
            const offlineFavoritingEnabled = $('#offlineFavoritingEnabled').prop('checked');
            const nfmPageEnabled = $('#nfmPageEnabled').prop('checked');
            const bookmarksPageEnabled = $('#bookmarksPageEnabled').prop('checked');
            const twitterButtonEnabled = $('#twitterButtonEnabled').prop('checked');
            const enableRandomButton = $('#enableRandomButton').prop('checked');
            const randomOpenType = $('input[name="random-open-type"]:checked').val();
            const profileButtonEnabled = $('#profileButtonEnabled').prop('checked');
            const infoButtonEnabled = $('#infoButtonEnabled').prop('checked');
            const logoutButtonEnabled = $('#logoutButtonEnabled').prop('checked');
            const bookmarkLinkEnabled = $('#bookmarkLinkEnabled').prop('checked');
            const findSimilarType = $('input[name="find-similar-type"]:checked').val();








            await GM.setValue('findSimilarEnabled', findSimilarEnabled);
            await GM.setValue('englishFilterEnabled', englishFilterEnabled);
            await GM.setValue('autoLoginEnabled', autoLoginEnabled);
            await GM.setValue('email', email);
            await GM.setValue('password', password);
            await GM.setValue('findAltmangaEnabled', findAltmangaEnabled);
            await GM.setValue('bookmarksEnabled', bookmarksEnabled);
            await GM.setValue('randomPrefLanguage', language);
            await GM.setValue('blacklistedTags', blacklistedTags);
            await GM.setValue('randomPrefTags', tags);
            await GM.setValue('randomPrefPagesMin', pagesMin);
            await GM.setValue('randomPrefPagesMax', pagesMax);
            await GM.setValue('matchAllTags', matchAllTags);
            await GM.setValue('findAltMangaThumbnailEnabled', findAltMangaThumbnailEnabled);
            await GM.setValue('openInNewTabEnabled', openInNewTabEnabled); 
            await GM.setValue('mangaBookMarkingButtonEnabled', mangaBookMarkingButtonEnabled);
            await GM.setValue('mangaBookMarkingType', mangaBookMarkingType);
            await GM.setValue('monthFilterEnabled', monthFilterEnabled);
            await GM.setValue('tooltipsEnabled', tooltipsEnabled);
            await GM.setValue('mangagroupingenabled', mangagroupingenabled);
            await GM.setValue('maxMangaPerBookmark', maxMangaPerBookmark);
            await GM.setValue('openInNewTabType', openInNewTabType);
            await GM.setValue('offlineFavoritingEnabled', offlineFavoritingEnabled);
            await GM.setValue('nfmPageEnabled', nfmPageEnabled);
            await GM.setValue('bookmarksPageEnabled', bookmarksPageEnabled);
            await GM.setValue('twitterButtonEnabled', twitterButtonEnabled);
            await GM.setValue('enableRandomButton', enableRandomButton);
            await GM.setValue('randomOpenType', randomOpenType);
            await GM.setValue('profileButtonEnabled', profileButtonEnabled);
            await GM.setValue('infoButtonEnabled', infoButtonEnabled);
            await GM.setValue('logoutButtonEnabled', logoutButtonEnabled);
            await GM.setValue('bookmarkLinkEnabled', bookmarkLinkEnabled);
            await GM.setValue('findSimilarType', findSimilarType);





            



    // Show custom popup instead of alert
    showPopup('Settings saved!');
        });

        // Toggle auto login credentials
        $('#autoLoginEnabled').on('change', function() {
            $('#autoLoginCredentials').toggle(this.checked);
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

                // Save the updated list (asynchronously)
                await GM.setValue('bookmarkedMangas', bookmarkedMangas);

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
                <a href="${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}popular-today">today</a>
                <a href="${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}popular-week">week</a>
                <a href="${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}popular-month">month</a>
                <a href="${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}popular">all time</a>
            `;
            sortTypes[1].innerHTML = monthFilterHtml;
        }
    }
}

addMonthFilter();



//--------------------------*Month Filter**----------------------------------------

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
            const { source, id } = JSON.parse(randomMangaSource);
            
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
        const favoriteBtn = document.querySelector('.btn.btn-primary[class*="tooltip"]');
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
                    await sendFavoriteRequest(mangaId);
                    console.log("Successfully favorited manga:", mangaId);
                    
                    // Remove from stored favorites if present
                    const index = currentFavorites.indexOf(mangaId);
                    if (index > -1) {
                        currentFavorites.splice(index, 1);
                        await GM.setValue('toFavorite', currentFavorites);
                        console.log("Removed manga from stored favorites:", mangaId);
                        console.log("Updated stored favorites:", currentFavorites);
                    }
                    
                    // Show success popup
                    showPopup("Successfully favorited manga!", {
                        timeout: 2000,
                        width: '300px'
                    });
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
        
        // Add a "Done" button to close the popup
        const content = progressPopup.close();
        
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
