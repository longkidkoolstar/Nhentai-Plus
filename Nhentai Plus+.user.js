// ==UserScript==
// @name         Nhentai Plus+
// @namespace    github.com/longkidkoolstar
// @version      1.0
// @description  Enhances the functionality of Nhentai website.
// @author       longkidkoolstar
// @match        https://nhentai.net/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @icon         https://i.imgur.com/1lihxY2.png
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
        </a>
    `;
    const findSimilarButton = $(findSimilarButtonHtml);

    // Insert 'Find Similar' button next to the download button
    $(downloadButton).after(findSimilarButton);

    // Handle click event for 'Find Similar' button
    findSimilarButton.click(async function() {
        const tagsContainer = $('div.tag-container.field-name:contains("Tags:")');
        if (!tagsContainer.length) {
            console.log('Tags container not found.');
            return;
        }

        // Find all tag links within the container
        const tagLinks = tagsContainer.find('a.tag');

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
    } else {
        // Lock the tag
        lockedTags.push(tagName);
        $(this).html('<i class="fas fa-minus"></i>'); // Change icon to minus
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

//------------------------  **Nhentai English Filter**  ----------------------  
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

//----------------------------**Settings**-----------------------------

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

    // Append the settings button to the dropdown menu
    const dropdownMenu = $('ul.dropdown-menu');
    dropdownMenu.append(settingsButton);

    // Append the settings button to the menu
    const menu = $('ul.menu.left');
    menu.append(settingsButton);
}

// Call the function to add the settings button
addSettingsButton();

// To delete the error thing on the webpage since nhentai.net/settings isn't supported by the website
if (window.location.href.includes('/settings')) {

    // Remove the <h1>404 – Not Found</h1> element
    const notFoundHeading = document.querySelector('h1');
    if (notFoundHeading && notFoundHeading.textContent === '404 – Not Found') {
        notFoundHeading.remove();
    }

    // Remove the <p>Looks like what you're looking for isn't here.</p> element
    const notFoundMessage = document.querySelector('p');
    if (notFoundMessage && notFoundMessage.textContent === "Looks like what you're looking for isn't here.") {
        notFoundMessage.remove();
    }


    // Add settings form
    const settingsHtml = `
        <div id="content">
            <h1>Settings</h1>
            <form id="settingsForm">
                <label>
                    <input type="checkbox" id="findSimilarEnabled">
                    Enable Find Similar Button
                </label><br>
                <label>
                    <input type="checkbox" id="englishFilterEnabled">
                    Enable English Filter Button
                </label><br>
                <label>
                    <input type="checkbox" id="autoLoginEnabled">
                    Enable Auto Login
                </label><br>
                <div id="autoLoginCredentials">
                    <label>
                        Email: <input type="text" id="email">
                    </label><br>
                    <label>
                        Password: <input type="password" id="password">
                    </label><br>
                </div>
                <button type="submit">Save Settings</button>
            </form>
        </div>
    `;
    $('div.container').append(settingsHtml);

    // Load settings
    (async function() {
        const findSimilarEnabled = await GM.getValue('findSimilarEnabled', true);
        const englishFilterEnabled = await GM.getValue('englishFilterEnabled', true);
        const autoLoginEnabled = await GM.getValue('autoLoginEnabled', true);
        const email = await GM.getValue('email', '');
        const password = await GM.getValue('password', '');

        $('#findSimilarEnabled').prop('checked', findSimilarEnabled);
        $('#englishFilterEnabled').prop('checked', englishFilterEnabled);
        $('#autoLoginEnabled').prop('checked', autoLoginEnabled);
        $('#email').val(email);
        $('#password').val(password);
        $('#autoLoginCredentials').toggle(autoLoginEnabled);
    })();

    // Save settings
    $('#settingsForm').on('submit', async function(event) {
        event.preventDefault();

        const findSimilarEnabled = $('#findSimilarEnabled').prop('checked');
        const englishFilterEnabled = $('#englishFilterEnabled').prop('checked');
        const autoLoginEnabled = $('#autoLoginEnabled').prop('checked');
        const email = $('#email').val();
        const password = $('#password').val();

        await GM.setValue('findSimilarEnabled', findSimilarEnabled);
        await GM.setValue('englishFilterEnabled', englishFilterEnabled);
        await GM.setValue('autoLoginEnabled', autoLoginEnabled);
        await GM.setValue('email', email);
        await GM.setValue('password', password);

        alert('Settings saved!');
    });

    // Toggle auto login credentials
    $('#autoLoginEnabled').on('change', function() {
        $('#autoLoginCredentials').toggle(this.checked);
    });
}
//----------------------------**Settings**-----------------------------