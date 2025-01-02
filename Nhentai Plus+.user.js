// ==UserScript==
// @name         Nhentai Plus+
// @namespace    github.com/longkidkoolstar
// @version      5.0
// @description  Enhances the functionality of Nhentai website.
// @author       longkidkoolstar
// @match        https://nhentai.net/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @icon         https://i.imgur.com/4zMY2VD.png
// @license      MIT
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @grant        GM.deleteValue
// @grant        GM.openInTab
// ==/UserScript==

//------------------------  **Nhentai Related Manga Button**  ------------------


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

        const searchInput = $('input[name="q"]');
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

console.log('Script setup complete.');

// Function to shuffle an array (Fisher-Yates shuffle algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


//------------------------  **Nhentai Related Manga Button**  ------------------

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

        // Extract the text content
        const titleText = titleElement.text();

        // Remove text inside square brackets [] and parentheses ()
        const cleanedTitleText = titleText.replace(/\[.*?\]|\(.*?\)|\d+/g, '').trim();

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

        function GroupAltVersionsOnPage() {
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
            bookmarkIcon.addClass('far').removeClass('fas');
        } else {
            // Add the bookmark
            bookmarkedPages.push(currentPage);
            await GM.setValue('bookmarkedPages', bookmarkedPages);
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






function addBookmarkButton() {
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
    const cachedTitle = await GM.getValue(url);
    if (cachedTitle) {
        return cachedTitle;
    }

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

            // Cache the title
            await GM.setValue(url, title);

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

    if (Array.isArray(bookmarkedPages)) {
        const bookmarksContainer = $('<div id="bookmarksContainer" class="container">');
        const bookmarksTitle = $('<h2 class="bookmarks-title">Bookmarked Pages</h2>');
        const bookmarksList = $('<ul class="bookmarks-list">');
        const searchInput = $('<input type="text" id="searchBookmarks" placeholder="Search bookmarks..." class="search-input">');

        bookmarksContainer.append(bookmarksTitle);
        bookmarksContainer.append(searchInput);
        bookmarksContainer.append(bookmarksList);
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
            .delete-button {
                position: relative;
                top: -32px;
                float: right;
                background: none;
                border: none;
                color: #e63946;
                cursor: pointer;
                font-size: 14px;
            }
            .delete-button:hover {
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
            const listItem = $(`<li><a href="${page}" class="bookmark-link">Loading...</a><button class="delete-button">✖</button></li>`);
            bookmarksList.append(listItem);

            fetchTitleWithCacheAndRetry(page).then(title => {
                // Update the list item with the fetched title
                const updatedListItem = $(`<li><a href="${page}" class="bookmark-link">${title}</a><button class="delete-button">✖</button></li>`);
                listItem.replaceWith(updatedListItem);

                // Add delete functionality
                updatedListItem.find('.delete-button').click(async function() {
                    const updatedBookmarkedPages = bookmarkedPages.filter(p => p !== page);
                    await GM.setValue('bookmarkedPages', updatedBookmarkedPages);
                    await GM.deleteValue(page); // Remove the title from GM storage
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
                        const restoredBookmarkedPages = [...updatedBookmarkedPages, page];
                        await GM.setValue('bookmarkedPages', restoredBookmarkedPages);
                        await fetchTitleWithCacheAndRetry(page); // Re-fetch and store the title
                        undoPopup.remove();
                        $('#bookmarksContainer').remove();
                        displayBookmarkedPages();
                    });
                });
            }).catch(error => {
                console.error(`Error fetching title for: ${page}`, error);
                listItem.text("Failed to fetch title");
            });
        }

        // Implement search functionality
        searchInput.on('input', function() {
            const query = $(this).val().toLowerCase();
            bookmarksList.children('li').each(function() {
                const title = $(this).find('.bookmark-link').text().toLowerCase();
                $(this).toggle(title.includes(query));
            });
        });
    } else {
        console.error('Bookmarked pages is not an array');
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
        if (!/English/.test(searchQuery)) {
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
       </style>
       
       <div id="content">
           <h1>Settings</h1>
           <form id="settingsForm">
               <label>
                   <input type="checkbox" id="findSimilarEnabled">
                   Enable Find Similar Button
               </label>
               <label>
                   <input type="checkbox" id="englishFilterEnabled">
                   Enable English Filter Button
               </label>
               <label>
                   <input type="checkbox" id="autoLoginEnabled">
                   Enable Auto Login
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
                   Enable Find Altmanga Button
               </label>
               <label>
                   <input type="checkbox" id="findAltMangaThumbnailEnabled">
                   Enable Find Alt Manga (Thumbnail Version)
               </label>
       
               <!-- Add the new checkbox here -->
               <label>
                   <input type="checkbox" id="openInNewTabEnabled">
                   Enable Open in New Tab Button
               </label>
       
               <!-- Bookmark Section -->
               <label>
                   <input type="checkbox" id="bookmarksEnabled">
                   Enable Bookmarks Button
               </label>
               <div class="bookmark-actions">
                   <button type="button" id="exportBookmarks">Export Bookmarks</button>
                   <button type="button" id="importBookmarks">Import Bookmarks</button>
                   <input type="file" id="importBookmarksFile" accept=".json">
               </div>
       
               <div id="random-settings">
                   <h3>Random Hentai Preferences</h3>
                   <label>Language: <input type="text" id="pref-language"></label>
                   <label>Tags: <input type="text" id="pref-tags"></label>
                   <label>Blacklisted Tags: <input type="text" id="blacklisted-tags"></label>
                   <label>Minimum Pages: <input type="number" id="pref-pages-min"></label>
                   <label>Maximum Pages: <input type="number" id="pref-pages-max"></label>
                   <label>
                       <input type="checkbox" id="matchAllTags">
                       Match All Tags (unchecked = match any)
                   </label>
               </div>
       
               <button type="submit">Save Settings</button>
           </form>
       </div>
       `;
       
       // Append settings form to the container
       $('div.container').append(settingsHtml);
        

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
            const openInNewTabEnabled = await GM.getValue('openInNewTabEnabled', true); // Add this line

            $('#findSimilarEnabled').prop('checked', findSimilarEnabled);
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

    }

    function showPopup(message) {
        const popup = document.createElement('div');
        popup.id = 'popup';
        popup.innerHTML = `
            <div class="popup-content">
                <button class="close-btn">&times;</button>
                <p>${message}</p>
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
                width: 250px; /* Make the popup smaller */
                text-align: center;
            }
            .popup-content {
                position: relative;
                padding: 10px; /* Adjust padding for a smaller popup */
            }
            .close-btn {
                position: absolute;
                top: 5px; /* Position closer to the top */
                right: 10px; /* Position closer to the right */
                background: none;
                border: none;
                color: #fff;
                font-size: 18px; /* Adjust font size for a smaller popup */
                cursor: pointer;
                transition: color 0.3s, opacity 0.3s;
            }
            .close-btn:hover {
                color: #ff0000;
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    
        // Close the popup when the close button is clicked
        document.querySelector('.close-btn').addEventListener('click', function() {
            document.body.removeChild(popup);
            document.head.removeChild(style); // Remove the styling
        });
    
    

// Optionally remove the popup after a few seconds
setTimeout(() => {
    if (document.body.contains(popup)) {
        document.body.removeChild(popup);
        document.head.removeChild(style); // Remove the styling
    }
}, 3000); // Adjust the time as needed
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
        if (!window.searchInProgress) return; // Stop if search was canceled
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
            showPreviousImage(); // Automatically show the next image if not paused. Says the showPreviousImage because I flipped the way images are saved in local storage so I had to flip everything
        }

        if (await meetsUserPreferences(tags, pages)) {
            hideLoadingPopup();
            window.location.href = url;
        } else {
            console.log('Does not meet user preferences, fetching another random hentai.');
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
        const blacklistedTags = (await GM.getValue('blacklistedTags', [])).map(tag => tag.toLowerCase());
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

        return hasPreferredLanguage && hasPreferredTags && withinPageRange && !hasBlacklistedTags;
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
                    GM.openInTab(fullUrl, { active: true }); // Open in new tab using GM_openInTab
                } else {
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