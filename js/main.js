import { getGitHubUser, getGitHubRepositories } from "./api.js";

let currentPage = 1;
let currentUsername = "";
let isLoadingPage = false;
const perPage = 10;
let currentSort = "updated";
let currentTotalPages = 0;
let currentRepositories = [];
let searchRequestId = 0;

const searchForm = document.getElementById("search-form");
const usernameInput = document.getElementById("username");
const errorMessage = document.getElementById("error-message");
const userProfile = document.getElementById("user-profile");
const repositoryArea = document.querySelector(".repository-area");
const repositoryList = document.getElementById("repository-list");
const loadingMessage = document.getElementById("loading-message");
const pagination = document.getElementById("pagination");
const sortSelect = document.getElementById("sort-repositories");
const filterLanguage = document.getElementById("filter-language");

function renderRepositories(repositories) {
    repositoryList.replaceChildren();

    if (repositories.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-message";

        if (filterLanguage.value === "all") {
            emptyMessage.textContent = "No repositories found on this page.";
        } else {
            emptyMessage.textContent =
                `No ${filterLanguage.value} repositories found on this page.`;
        }

        repositoryList.append(emptyMessage);
        return;
    }

    repositories.forEach((repo) => {
        const card = document.createElement("div");
        card.className = "repository-card";

        const repoName = document.createElement("h3");
        repoName.textContent = repo.name;

        const repoDescription = document.createElement("p");
        repoDescription.textContent =
            repo.description || "No description available.";

        const repoLanguage = document.createElement("p");
        repoLanguage.textContent =
            `Language: ${repo.language || "Not specified"}`;

        const repoStars = document.createElement("p");
        repoStars.textContent = `Stars: ${repo.stargazers_count}`;

        const repoLink = document.createElement("a");
        repoLink.href = repo.html_url;
        repoLink.textContent = "View Repository";
        repoLink.target = "_blank";
        repoLink.rel = "noopener noreferrer";

        card.append(
            repoName,
            repoDescription,
            repoLanguage,
            repoStars,
            repoLink
        );

        repositoryList.append(card);
    });
}

function displayRepositories() {
    let repositories = [...currentRepositories];

    if (filterLanguage.value !== "all") {
        repositories = repositories.filter((repo) => {
            return repo.language === filterLanguage.value;
        });
    }

    if (sortSelect.value === "stars") {
        repositories.sort((a, b) => {
            return b.stargazers_count - a.stargazers_count;
        });
    }

    renderRepositories(repositories);
}

async function loadRepositoryPage(page, totalPages) {
    if (isLoadingPage) {
        return;
    }

    isLoadingPage = true;
    const requestId = searchRequestId;
    const username = currentUsername;

    sortSelect.disabled = true;
    filterLanguage.disabled = true;

    loadingMessage.hidden = false;
    errorMessage.hidden = true;

    renderPagination(totalPages);

    try {
        const repositories = await getGitHubRepositories(
            username,
            page,
            perPage,
            currentSort
        );

        if (requestId !== searchRequestId) {
            return;
        }
        currentRepositories = repositories;
        currentPage = page;

        displayRepositories();

    } catch (error) {

        if (requestId !== searchRequestId) {
            return;
        }

        console.error("Error:", error.message);

        errorMessage.textContent = error.message;
        errorMessage.hidden = false;

    } finally {
        isLoadingPage = false;

        if (requestId === searchRequestId) {
            sortSelect.disabled = false;
            filterLanguage.disabled = false;
            loadingMessage.hidden = true;
            renderPagination(totalPages);
        }
    }
}

function renderPagination(totalPages) {
    pagination.replaceChildren();

    const previousButton = document.createElement("button");
    previousButton.textContent = "Previous";
    previousButton.type = "button";
    previousButton.disabled = currentPage === 1 || isLoadingPage;

    previousButton.addEventListener("click", () => {
        if (currentPage > 1) {
            loadRepositoryPage(currentPage - 1, totalPages);
        }
    });

    const pageNumber = document.createElement("span");
    pageNumber.textContent = `Page ${currentPage} / ${totalPages}`;

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.type = "button";
    nextButton.disabled = currentPage === totalPages || isLoadingPage;

    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            loadRepositoryPage(currentPage + 1, totalPages);
        }
    });

    pagination.append(previousButton, pageNumber, nextButton);
    pagination.hidden = totalPages <= 1;
}

sortSelect.addEventListener("change", () => {
    if (sortSelect.value === "updated") {
        currentSort = "updated";

        if (currentUsername) {
            loadRepositoryPage(currentPage, currentTotalPages);
        }

    } else if (sortSelect.value === "name") {
        currentSort = "full_name";

        if (currentUsername) {
            loadRepositoryPage(currentPage, currentTotalPages);
        }

    } else if (sortSelect.value === "stars") {
        if (currentUsername) {
            displayRepositories();
        }
    }
});

filterLanguage.addEventListener("change", () => {
    if (currentUsername) {
        displayRepositories();
    }
});

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const requestId = ++searchRequestId;
    const username = usernameInput.value.trim();

    errorMessage.hidden = true;
    repositoryArea.hidden = true;
    userProfile.hidden = true;
    loadingMessage.hidden = false;

    currentPage = 1;
    currentUsername = "";
    currentTotalPages = 0;
    currentRepositories = [];

    pagination.hidden = true;
    sortSelect.disabled = true;
    filterLanguage.disabled = true;

    try {
        const user = await getGitHubUser(username);

        if (requestId !== searchRequestId) {
            return;
        }

        const repositories = await getGitHubRepositories(
            username,
            currentPage,
            perPage,
            currentSort
        );

        if (requestId !== searchRequestId) {
            return;
        }

        currentRepositories = repositories;
        currentUsername = user.login;

        userProfile.replaceChildren();

        const nameHeading = document.createElement("h2");
        nameHeading.textContent = user.name || user.login;

        const usernameText = document.createElement("p");
        usernameText.textContent = `@${user.login}`;

        const avatar = document.createElement("img");
        avatar.src = user.avatar_url;
        avatar.alt = `${user.login}'s GitHub avatar`;

        const bioText = document.createElement("p");
        bioText.textContent = user.bio || "No biography available.";

        const stats = document.createElement("div");
        stats.className = "profile-stats";

        const followersText = document.createElement("p");
        followersText.textContent = `Followers: ${user.followers}`;

        const followingText = document.createElement("p");
        followingText.textContent = `Following: ${user.following}`;

        const repoText = document.createElement("p");
        repoText.textContent = `Public Repositories: ${user.public_repos}`;

        stats.append(
            followersText,
            followingText,
            repoText
        );

        const locationText = document.createElement("p");
        locationText.textContent =
            `Location: ${user.location || "Not provided"}`;

        const companyText = document.createElement("p");
        companyText.textContent =
            `Company: ${user.company || "Not provided"}`;

        const profileLink = document.createElement("a");
        profileLink.href = user.html_url;
        profileLink.textContent = "View GitHub Profile";
        profileLink.target = "_blank";
        profileLink.rel = "noopener noreferrer";

        userProfile.append(
            avatar,
            nameHeading,
            usernameText,
            bioText,
            stats,
            locationText,
            companyText,
            profileLink
        );

        displayRepositories();

        repositoryArea.hidden = false;
        userProfile.hidden = false;

        const totalPages = Math.ceil(user.public_repos / perPage);
        currentTotalPages = totalPages;

        renderPagination(totalPages);

    } catch (error) {

        if (requestId !== searchRequestId) {
            return;
        }
        console.error("Error:", error.message);

        errorMessage.textContent = error.message;
        errorMessage.hidden = false;

    } finally {
        if (requestId === searchRequestId) {
            loadingMessage.hidden = true;
            sortSelect.disabled = false;
            filterLanguage.disabled = false;
        }
    }
});