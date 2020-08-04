$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $favoritedStories = $("#favorited-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $userProfile = $('#user-profile');
  const $navUserProfile = $('#nav-user-profile');
  const $navWelcome = $('#nav-welcome');

  let storyList = null;
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault();
    const username = $("#login-username").val();
    const password = $("#login-password").val();
    const userInstance = await User.login(username, password);
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

 $navUserProfile.on('click',function(){
   hideElements();
   $userProfile.show();
 })

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

   //an event handler for Navigation to Homepage
  
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  //an event handler to submit form to add a story
  $submitForm.on('submit', async function(e){
    e.preventDefault();
    //grab all info from the form
    const author = $('#author').val();
    const title = $('#title').val();
    const url = $('#url').val();
    const username = currentUser.username;
    const hostName = getHostName(url);

    const storyObj = await storyList.addStory(currentUser, {
      author,
      title,
      url,
      username,
    });
    //generate li for every new story;
    const $li = $(`
    <li id="${storyObj.storylist}" class="{storyObj.storylist}">
  <span class="star">
    <i class="far fa-star"></i>
  </span>
  <a class="article-link" href="${url}" target = "a_blank"><strong>${title}</strong></a>
  <small class="article-hostname ${hostName}">(${hostName})</small>
  <small class="article-author">by ${author}</small>
  <small class="aritcle-username">${username}</small> 
</li>
  `);
  $allStoriesList.prepend($li);
  //hide form and reset it
  $submitForm.slideUp('slow');
  $submitForm.trigger('reset');

  });
  //event handler for nav add story
$('#show-submit').on('click', function(){
  if (currentUser) {
    hideElements();
    $allStoriesList.show();
    $submitForm.slideToggle();

  }
});
//event handler for nav favorite
$('body').on('click', '#show-favorite',function(){
  hideElements();
  if (currentUser) {
    generateFaves();
    $favoritedStories.show();
  }
});
//event handler for nav my stories
$('body').on('click', '#show-my-stories',function(){
  hideElements();
  if (currentUser) {
    $userProfile.hide();
    generateMyStories();
    $ownStories.show();
  }
});

//a function to generate my stories
function generateMyStories(){
  $ownStories.empty();
  if (currentUser.ownStories.length === 0){
    $ownStories.append('<h5>No stories added by user yet!</h5>');
  } else {
    for (let story of currentUser.ownStories){
  let ownStoryHTML = generateStoryHTML(story, true);
  $ownStories.append(ownStoryHTML);
}};
  $ownStories.show();

}

//event handler to delete own stories
 $ownStories.on('click','.trash-can',async function(e){
   const $closestLi = $(e.target).closest('li');
   const storyId = $closestLi.attr('id');
   await storyList.removeStory(currentUser, storyId);
   await generateStories();
   hideElements();
   $allStoriesList.show();
 })
//event handler for adding stars to favorites
$('.articles-container').on('click', '.star', async function(e){
  if(currentUser) {
    const $tgt = $(e.target);
    const $closestLi = $tgt.closest('li');
    const storyId = $closestLi.attr('id');

    if($tgt.hasClass('fas')){
      await currentUser.removeFavorite(storyId);
      $tgt.closest('i').toggleClass('fas far');
    } else {
      await currentUser.addFavorite(storyId);
      $tgt.closest('i').toggle('fas far');
    }
    }
});

//a function to generate favorite stories to favorited story list
function generateFaves(){
  $favoritedStories.empty();
  if (currentUser.favorites.length === 0){
    $ownStories.append('<h5>No favorites added yet!</h5>')
  } else {
    for (let story of currentUser.favorites)
 {
  let favoriteHTML = generateStoryHTML(story,false, true);
  $favoritedStories.append(favoriteHTML);
 }};
}

//a function to generate stories to story list
  async function generateStories() {
    // get an instance of StoryList
    storyList = await StoryList.getStories();
    // update our global variable
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, isOwnStory) {
    let hostName = getHostName(story.url);
    let startType = isFavorite(story) ? 'fas': 'far';

    const trashCanIcon = isOwnStory ? `<span class = "trash-can">
    <i class="fas fa-trash-alt"></i>
    </span>`:
    '';
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">${trashCanIcon}
        <span class = "star">
          <i class="${startType} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

//a function to sort out favorite stories with their storyIds
  function isFavorite(story){
    let favStoryIds = new Set();
    if (currentUser) {
      favStoryIds = new Set(currentUser.favorites.map((obj) => obj.storyId));
    }
    return favStoryIds.has(story.storyId);
  }

  /* a function to hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $favoritedStories,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile,
    ];
    elementsArr.forEach($elem => $elem.hide());
  }
//a function to display nav to login user
  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $userProfile.hide();
    $navWelcome.show();
    $('.main-nav-links,#user-profile').toggleClass('hidden');
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
