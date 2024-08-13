// ==UserScript==
// @name         Nhentai Plus+
// @namespace    github.com/longkidkoolstar
// @version      4.2
// @description  Enhances the functionality of Nhentai website.
// @author       longkidkoolstar
// @match        https://nhentai.net/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @icon         https://i.imgur.com/4zMY2VD.png
// @license      MIT
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// ==/UserScript==

//------------------------  **Nhentai Related Manga Button**  ------------------

// Initialize maxTagsToSelect from localStorage or default to 5
let maxTagsToSelect = localStorage.getItem('maxTagsToSelect') || 5;
maxTagsToSelect = parseInt(maxTagsToSelect); // Ensure it's parsed as an integer

// Array to store locked tags
const lockedTags = [];

// Function to create and insert 'Find Similar' button
async function createFindSimilarButton() {
    const findSimilarEnabled = await GM.getValue('findSimilarEnabled', true);
    if (!findSimilarEnabled) return;

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
    $(downloadButton).after(findSimilarButton);

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
function createSlider() {
    const sliderHtml = `
        <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <input type="range" min="1" max="10" value="${maxTagsToSelect}" id="tagSlider">
            <label for="tagSlider">Max Tags to Select: <span id="tagSliderValue">${maxTagsToSelect}</span></label>
        </div>
    `;
    $(document.body).append(sliderHtml);

    // Retrieve saved maxTagsToSelect value from localStorage (if available)
    const savedMaxTags = localStorage.getItem('maxTagsToSelect');
    if (savedMaxTags) {
        maxTagsToSelect = parseInt(savedMaxTags);
        $('#tagSlider').val(maxTagsToSelect);
        $('#tagSliderValue').text(maxTagsToSelect);
    }

    // Update maxTagsToSelect based on slider value and save to localStorage
    $('#tagSlider').on('input', function() {
        maxTagsToSelect = parseInt($(this).val());
        $('#tagSliderValue').text(maxTagsToSelect);

        // Store the updated maxTagsToSelect value in localStorage
        localStorage.setItem('maxTagsToSelect', maxTagsToSelect);
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


const flagEn = "https://i.imgur.com/vSnHmmi.gif";
const flagJp = "https://i.imgur.com/GlArpuS.gif";
const flagCh = "https://i.imgur.com/7B55DYm.gif";
const non_english_fade_opacity = 0.3;  // Default value, adjust as necessary
const partially_fade_all_non_english = true;  // Default value, adjust as necessary
const mark_as_read_system_enabled = true;  // Default value, adjust as necessary
const marked_as_read_fade_opacity = 0.3;  // Default value, adjust as necessary
const auto_group_on_page_comics = true;  // Default value, adjust as necessary
const version_grouping_filter_brackets = false;  // Default value, adjust as necessary

// Initialize MARArray from local storage or as an empty array
let MARArray = [];
GM.getValue("MARArray", "[]").then((value) => {
    if (typeof value === 'string') {
        MARArray = JSON.parse(value);
    }

    // Add necessary styles
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
    `);

    function IncludesAll(string, search) {
        string = CleanupSearchString(string);
        search = CleanupSearchString(search);
        if (string.length == 0 || search.length == 0)
            return false;

        let searches = search.split(" ");
        for (let i = 0; i < searches.length; i++)
            if (!!searches[i] && searches[i].length > 0 && !string.includes(searches[i]))
                return false;
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
                    if (partially_fade_all_non_english)
                        $(found[i]).find(".cover > img, .cover > .caption").css("opacity", non_english_fade_opacity);

                    if ($(found[i]).attr("data-tags").includes("12227")) //en
                    {
                        $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagEn + `">`);
                        $(found[i]).find(".cover > img, .cover > .caption").css("opacity", "1");
                    } else {
                        if ($(found[i]).attr("data-tags").includes("6346")) //jp
                            $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagJp + `">`);
                        else if ($(found[i]).attr("data-tags").includes("29963")) //ch
                            $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagCh + `">`);

                        if (!partially_fade_all_non_english)
                            $(found[i]).find(".cover > img, .cover > .caption").css("opacity", "1");
                    }

                    if (mark_as_read_system_enabled) {
                        let MARArraySelector = MARArray.join("'], .cover[href='");
                        $(found[i]).find(".cover[href='" + MARArraySelector + "']").append("<div class='readTag'>READ</div>");
                        let readTag = $(found[i]).find(".readTag");
                        if (!!readTag && readTag.length > 0)
                            readTag.parent().parent().find(".cover > img, .cover > .caption").css("opacity", marked_as_read_fade_opacity);
                    }

                    let thumbnailReplacement;
                    if (!!$(found[i]).find(".cover > img").attr("data-src"))
                        thumbnailReplacement = $(found[i]).find(".cover > img").attr("data-src").replace(/\/\/.+?\.nhentai/g, "//i.nhentai").replace("thumb.jpg", "1.jpg").replace("thumb.png", "1.png");
                    else
                        thumbnailReplacement = $(found[i]).find(".cover > img").attr("src").replace(/\/\/.+?\.nhentai/g, "//i.nhentai").replace("thumb.jpg", "1.jpg").replace("thumb.png", "1.png");

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
        if (version_grouping_filter_brackets)
            title = title.replace(/\(.*?\)/g, "");
        return title.trim();
    }

    function BuildUrl(title) {
        let url = CleanupSearchString(title);

        url = url.trim();
        url = url.replace(/(^|\s){1}[^\w\s\d]{1}(\s|$){1}/g, " "); //remove all instances of a lone symbol character
        url = url.replace(/\s+/g, '" "'); //wrap all terms with ""
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
        if (!title || title.length <= 0)
            return;
        let found = $(".container > .gallery:not(.ignoreThis)");
        let numOfValid = 0;
        for (let i = 0; i < found.length; i++) {
            let cap = $(found[i]).find(".caption");
            if (cap.length == 1) {
                if (IncludesAll(cap.text(), title)) {
                    if (partially_fade_all_non_english)
                        $(found[i]).find(".cover > img, .cover > .caption").css("opacity", non_english_fade_opacity);

                    if ($(found[i]).attr("data-tags").includes("12227")) {
                        $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagEn + `">`);
                        $(found[i]).find(".cover > img, .cover > .caption").css("opacity", "1");
                    } else {
                        if ($(found[i]).attr("data-tags").includes("6346"))
                            $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagJp + `">`);
                        else if ($(found[i]).attr("data-tags").includes("29963"))
                            $(found[i]).find(".caption").append(`<img class="overlayFlag" src="` + flagCh + `">`);

                        if (!partially_fade_all_non_english)
                            $(found[i]).find(".cover > img, .cover > .caption").css("opacity", "1");
                    }

                    if (mark_as_read_system_enabled) {
                        let MARArraySelector = MARArray.join("'], .cover[href='");
                        $(found[i]).find(".cover[href='" + MARArraySelector + "']").append("<div class='readTag'>READ</div>");
                        let readTag = $(found[i]).find(".readTag");
                        if (!!readTag && readTag.length > 0)
                            readTag.parent().parent().find(".cover > img, .cover > .caption").css("opacity", marked_as_read_fade_opacity);
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
                    for (let j = 0; j < cap.length; j++)
                        place.append($(cap[j]).parent());
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

        if (auto_group_on_page_comics)
            GroupAltVersionsOnPage();

        $(".versionPrevButton").click(function(e) {
            e.preventDefault();
            let toHide = $(this).parent().find(".cover").filter(":visible");
            let toShow = toHide.prev();
            if (!toShow || toShow.length <= 0)
                return;
            if (!toShow.is(".cover"))
                toShow = toHide.prevUntil(".cover", ":last").prev();
            if (!toShow || toShow.length <= 0)
                return;
            toHide.hide(100);
            toShow.show(100);
            let n = $(this).parent().find(".numOfVersions");
            n.text((Number(n.text().split("/")[0]) - 1) + "/" + n.text().split("/")[1]);
        });
        $(".versionNextButton").click(function(e) {
            e.preventDefault();
            let toHide = $(this).parent().find(".cover").filter(":visible");
            let toShow = toHide.next();
            if (!toShow || toShow.length <= 0)
                return;
            if (!toShow.is(".cover"))
                toShow = toHide.nextUntil(".cover", ":last").next();
            if (!toShow || toShow.length <= 0)
                return;
            toHide.hide(100);
            toShow.show(100);
            let n = $(this).parent().find(".numOfVersions");
            n.text((Number(n.text().split("/")[0]) + 1) + "/" + n.text().split("/")[1]);
        });
    }
});









//------------------------  **Find Alternative Manga Button(Thumbnail Version)**  ------------------

// ------------------------  *Bookmarks**  ------------------

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

    // Bookmark button HTML
    const bookmarkButtonHtml = `
        <a class="btn btn-primary bookmark-btn" style="margin-left: 10px;">
            <i class="fa ${isBookmarked ? 'fa-bookmark' : 'fa-bookmark-o'}"></i>
        </a>
    `;
    const bookmarkButton = $(bookmarkButtonHtml);

    // Append the bookmark button as a child of the h1 element
    document.querySelector("#content > h1").append(bookmarkButton[0]);

    // Handle click event for the bookmark button
    bookmarkButton.click(async function() {
        const bookmarkedPages = await GM.getValue('bookmarkedPages', []);
        const currentPage = window.location.href;
        const isBookmarked = bookmarkedPages.includes(currentPage);

        if (isBookmarked) {
            // Remove the bookmark
            const updatedBookmarkedPages = bookmarkedPages.filter(page => page !== currentPage);
            await GM.setValue('bookmarkedPages', updatedBookmarkedPages);
            $(this).find('i').removeClass('fa-bookmark').addClass('fa-bookmark-o');
        } else {
            // Add the bookmark
            bookmarkedPages.push(currentPage);
            await GM.setValue('bookmarkedPages', bookmarkedPages);
            $(this).find('i').removeClass('fa-bookmark-o').addClass('fa-bookmark');
        }
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

        bookmarksContainer.append(bookmarksTitle);
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
            .bookmarks-list {
                list-style: none;
                padding: 0;
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
            const listItem = $(`<li><a href="${page}" class="bookmark-link">Loading...</a></li>`);
            bookmarksList.append(listItem);

            fetchTitleWithCacheAndRetry(page).then(title => {
                // Update the list item with the fetched title
                const updatedListItem = $(`<li><a href="${page}" class="bookmark-link">${title}</a></li>`);
                listItem.replaceWith(updatedListItem);
            }).catch(error => {
                console.error(`Error fetching title for: ${page}`, error);
                listItem.text("Failed to fetch title");
            });
        }

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

(function() {
    'use strict';

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
            
            #loading-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 20px;
                background-color: rgba(0, 0, 0, 0.8);
                color: #fff;
                border-radius: 5px;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            #loading-popup button.close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: #fff;
                font-size: 20px;
                cursor: pointer;
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
                        <input type="checkbox" id="bookmarksEnabled">
                        Enable Bookmarks Button
                    </label>
                    <div id="random-settings">
                        <h3>Random Hentai Preferences</h3>
                        <label>Language: <input type="text" id="pref-language"></label>
                        <label>Tags: <input type="text" id="pref-tags"></label>
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
        $('div.container').append(settingsHtml);
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
                    z-index: 1000;
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
            const pagesMin = $('#pref-pages-min').val();
            const pagesMax = $('#pref-pages-max').val();
            const matchAllTags = $('#matchAllTags').prop('checked');

            await GM.setValue('findSimilarEnabled', findSimilarEnabled);
            await GM.setValue('englishFilterEnabled', englishFilterEnabled);
            await GM.setValue('autoLoginEnabled', autoLoginEnabled);
            await GM.setValue('email', email);
            await GM.setValue('password', password);
            await GM.setValue('findAltmangaEnabled', findAltmangaEnabled);
            await GM.setValue('bookmarksEnabled', bookmarksEnabled);
            await GM.setValue('randomPrefLanguage', language);
            await GM.setValue('randomPrefTags', tags);
            await GM.setValue('randomPrefPagesMin', pagesMin);
            await GM.setValue('randomPrefPagesMax', pagesMax);
            await GM.setValue('matchAllTags', matchAllTags);

    // Show custom popup instead of alert
    showPopup('Settings saved!');
        });

        // Toggle auto login credentials
        $('#autoLoginEnabled').on('change', function() {
            $('#autoLoginCredentials').toggle(this.checked);
        });
    }
//----------------------------**Settings**--------------------------------------------





//----------------------------**Random Hentai Preferences with Image Storage and Links**----------------------------
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
            <img id="cover-preview" style="max-width: 100%; max-height: 100%; object-fit: contain; display: none; cursor: pointer;" />
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

        // Corrected selector for the cover image
        const coverImage = doc.querySelector('#cover img.lazyload');
        const coverImageUrl = coverImage ? (coverImage.getAttribute('data-src') || coverImage.src) : null;

        if (coverImageUrl) {
            saveImageToLocalStorage(coverImageUrl, url);
            showNextImage(); // Automatically show the next image if not paused
        }

        // Extract title, tags, pages, and upload date
        const title = doc.querySelector('#info h1')?.textContent.trim();
        const tags = Array.from(doc.querySelectorAll('#tags .tag')).map(tag => tag.textContent.trim());
        const pages = parseInt(doc.querySelector('#tags .tag-container:nth-last-child(2) .name')?.textContent.trim(), 10);
        const uploadDate = doc.querySelector('#tags .tag-container:last-child time')?.getAttribute('datetime');

        console.log('Title:', title);
        console.log('Tags:', tags);
        console.log('Pages:', pages);
        console.log('Upload Date:', uploadDate);

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

        return hasPreferredLanguage && hasPreferredTags && withinPageRange;
    } catch (error) {
        console.error('Error checking user preferences:', error);
        return false;
    }
}

function saveImageToLocalStorage(imageUrl, hentaiUrl) {
    let images = JSON.parse(localStorage.getItem('hentaiImages') || '[]');
    images.push({ imageUrl, url: hentaiUrl });

    if (images.length > 5) {
        images.shift(); // Remove the oldest image if more than 5 images are stored
    }

    localStorage.setItem('hentaiImages', JSON.stringify(images));
}

function getImagesFromLocalStorage() {
    return JSON.parse(localStorage.getItem('hentaiImages') || '[]');
}

function showNextImage() {
    const images = getImagesFromLocalStorage();
    if (images.length === 0) return;

    let currentIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
    currentIndex = (currentIndex + 1) % images.length; // Move to the next image
    localStorage.setItem('currentImageIndex', currentIndex.toString());

    updatePreviewImage(images[currentIndex].imageUrl);
}

function showPreviousImage() {
    const images = getImagesFromLocalStorage();
    if (images.length === 0) return;

    let currentIndex = parseInt(localStorage.getItem('currentImageIndex') || '0', 10);
    currentIndex = (currentIndex - 1 + images.length) % images.length; // Move to the previous image
    localStorage.setItem('currentImageIndex', currentIndex.toString());

    updatePreviewImage(images[currentIndex].imageUrl);
}

function updatePreviewImage(imageUrl) {
    const coverPreview = document.getElementById('cover-preview');
    if (coverPreview) {
        coverPreview.src = imageUrl;
        coverPreview.style.display = 'block'; // Show the image
    }
}

function togglePause() {
    window.searchInProgress = !window.searchInProgress;
    const pauseButtonIcon = document.querySelector('#pause-search i');
    pauseButtonIcon.className = window.searchInProgress ? 'fas fa-pause' : 'fas fa-play';

    if (window.searchInProgress) {
        fetchRandomHentai();
    }
}

// Preload FontAwesome icons
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
document.head.appendChild(link);

// Initialize the current image index
localStorage.setItem('currentImageIndex', '0');

})();
//----------------------------**Random Hentai Preferences with Image Storage**----------------------------
