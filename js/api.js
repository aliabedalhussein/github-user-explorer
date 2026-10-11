export async function getGitHubUser(username){
    let response;

    try {
        response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}`
        );
    } catch (error) {
        throw new Error(
            "Unable to connect to GitHub. Please check your internet connection."
        );
    }

    if (response.status === 404) {
        throw new Error("GitHub user not found.");
    }

    if (
        response.status === 429 ||
        (response.status === 403 &&
            response.headers.get("X-RateLimit-Remaining") === "0")
    ) {
        throw new Error(
            "GitHub API rate limit reached. Please try again later."
        );
    }

    if(!response.ok){
        throw new Error(`GitHub request failed: ${response.status}`);
    }

    const user = await response.json();
    
    return user;
} 


export async function getGitHubRepositories(username, page = 1, perPage = 10, sort = "updated") {
    let response;

    try {
        response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}/repos?page=${page}&per_page=${perPage}&sort=${sort}`
        );
    } catch (error) {
        throw new Error(
            "Unable to load repositories. Please check your internet connection."
        );
    }

    if (
        response.status === 429 ||
        (response.status === 403 &&
            response.headers.get("X-RateLimit-Remaining") === "0")
    ) {
        throw new Error(
            "GitHub API rate limit reached. Please try again later."
        );
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.status}`);
    }

    const repositories = await response.json();

    return repositories;
}