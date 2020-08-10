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

//  Event listeners
   
  $loginForm.on("submit", submitLoginForm);
  $createAccountForm.on("submit", submitCreateAccountForm);
  $navLogin.on("click", loginToRenderStory);
  $navLogOut.on("click", logoutToRefreshPage);
  $navUserProfile.on('click',showUserProfile);
  $("#nav-all").on("click", showStoryfromLogo);
  $submitForm.on('submit', submitStory);
  $('#show-submit').on('click', showNavForAddStory);
  $('#show-favorite').on('click', showFavNav);
  $('#show-my-stories').on('click', showMyStoryNav);
  $ownStories.on('click','.trash-can',deleteOwnStories);
  $('.articles-container').on('click', '.star', addStarToStory);

// functions

  async function submitLoginForm(evt){
      evt.preventDefault();
      const username = $("#login-username").val();
      const password = $("#login-password").val();
      const userInstance = await User.login(username, password);
      currentUser = userInstance;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
    };

  //a function to generate profile for eachuser instance

  function generateProfile(){
    $navUserProfile.text(`${currentUser.username}`);
    $('#profile-name').text(`Name: ${currentUser.name}`);
    $('#profile-username').text(`Username:${currentUser.username}`);
    $('#profile-account-date').text(`Account Created: ${currentUser.createdAt.slice(0,9)}`);
  }

  async function submitCreateAccountForm(evt) {
    evt.preventDefault(); 
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  };
  
  function loginToRenderStory() {
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  };

  function logoutToRefreshPage() {
    localStorage.clear();
    location.reload();
  };

 function showUserProfile(){
   hideElements();
   $userProfile.show();
 };

  async function checkIfLoggedIn() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      generateProfile();
      showNavForLoggedInUser();
    }
  }

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
    generateProfile();
  }
  
  async function showStoryfromLogo() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  };

  async function submitStory(e){
    e.preventDefault();
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
//   const $li = $(`
//     <li id="${storyObj.storylist}" class="{storyObj.storylist}">
//   <span class="star">
//     <i class="far fa-star"></i>
//   </span>
//   <a class="article-link" href="${url}" target = "a_blank"><strong>${title}</strong></a>
//   <small class="article-hostname ${hostName}">(${hostName})</small>
//   <small class="article-author">by ${author}</small>
//   <small class="aritcle-username">${username}</small> 
// </li>
//   `);
  // $allStoriesList.prepend($li);
  generateStoryHTML();
  $submitForm.slideUp('slow');
  $submitForm.trigger('reset');
  
  };
 
function showNavForAddStory(){
  if (currentUser) {
    hideElements();
    $allStoriesList.show();
    $submitForm.slideToggle();

  }
};

function showFavNav(){
  hideElements();
  if (currentUser) {
    generateFaves();
    $favoritedStories.show();
  }
};

function showMyStoryNav(){
  hideElements();
  if (currentUser) {
    $userProfile.hide();
    generateMyStories();
    $ownStories.show();
  }
};

//a function to generate my stories
function generateMyStories(){
  $ownStories.empty();
  if (currentUser.ownStories.length === 0){
    $ownStories.append('<h5>No stories added by user yet!</h5>');
  } else {
    for (let story of currentUser.ownStories){
      isFavorite(currentUser, storyId)
  let ownStoryHTML = generateStoryHTML(story, true, true);
  $ownStories.append(ownStoryHTML);
}};
  $ownStories.show();

};

 async function deleteOwnStories(e){
   const $closestLi = $(e.target).closest('li');
   const storyId = $closestLi.attr('id');
   await storyList.removeStory(currentUser, storyId);
   await generateStories();
   hideElements();
   $allStoriesList.show();
 };

async function addStarToStory(e){
  if(currentUser) {
    const $tgt = $(e.target);
    const $closestLi = $tgt.closest('li');
    const storyId = $closestLi.attr('id');

    if($tgt.hasClass('fas')){
      await currentUser.removeFavorite(storyId);
      $tgt.closest('i').toggleClass('fas far');
    } else {
      await currentUser.addFavorite(storyId);
      $tgt.closest('i').toggleClass('fas far');
    }
    }
};

//a function to generate favorite stories to favorited story list
function generateFaves(){
  $favoritedStories.empty();
  if (currentUser.favorites.length === 0){
    $ownStories.append('<h5>No favorites added yet!</h5>')
  } else {
    for (let story of currentUser.favorites)
 {
  let favoriteHTML = generateStoryHTML(story,false);
  $favoritedStories.append(favoriteHTML);
 }};
};

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
  };

  /**
   * A function to render HTML for an individual Story instance
   */
  // let story = {};
  // generateStoryHTML(story, true, true);

  function generateStoryHTML(story, isOwnStory, isFavorite) {
    let hostName = getHostName(story.url);
    let startType = isFavorite ? 'fas': 'far';

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
  };

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
  };
});
