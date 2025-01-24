// Search functionality
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    console.log("Search input:", searchInput);
    const searchResults = document.getElementById("searchDropdown");
    let debounceTimer;
  
    function getUserType() {
      try {
        const userData = localStorage.getItem("userData");
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.userType;
        }
      } catch (error) {
        console.error("Error getting user type:", error);
      }
      return null;
    }
  
    // Update placeholder based on user type
    function updatePlaceholder() {
      const userType = getUserType();
      searchInput.placeholder =
        userType === "customer"
          ? "Search for skilled professionals..."
          : "Search for available jobs...";
    }
  
    // Create freelancer result card
    function createFreelancerCard(freelancer) {
      return `
        <a href="view-profile.html?id=${freelancer.id}">
            <div class="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200">
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <i class="fas fa-user-circle text-gray-400 text-3xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-medium text-gray-900">${
                          freelancer.firstName + " " + freelancer.lastName
                        }</h3>
                        <p class="text-sm text-gray-500">${freelancer.skills}</p>
                        <div class="mt-1 flex items-center text-sm text-gray-500">
                            <i class="fas fa-star text-yellow-400 mr-1"></i>
                            <span>${freelancer.rate || "4.5"}</span>
                            <span class="mx-2">•</span>
                            <i class="fas fa-map-marker-alt mr-1"></i>
                            <span>${freelancer.address}</span>
                        </div>
                    </div>
                </div>
            </div>
            </a>
        `;
    }
  
    // Create post result card
    function createPostCard(post) {
      return `
      <a href="view-post.html?id=${post.id}">
            <div class="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">${post.caption}</h3>
                <p class="mt-1 text-sm text-gray-500 line-clamp-2">${post.description}</p>
                <div class="mt-2 flex items-center text-sm text-gray-500">
                    <i class="fas fa-coins mr-1"></i>
                    <span class="mr-4">$${post.rate}/hr</span>
                    <i class="fas fa-clock mr-1"></i>
                    <span class="mr-4">${post.estimatedTime} hours</span>
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    <span>${post.location}</span>
                </div>
                <div class="mt-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${post.requiredSkills}
                    </span>
                </div>
            </div>
            </a>
        `;
    }
  
    // Show loading state
    function showLoading() {
      searchResults.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Searching...
            </div>
        `;
      searchResults.classList.remove("hidden");
    }
  
    // Show no results state
    function showNoResults(searchTerm) {
      searchResults.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                No results found for "${searchTerm}"
            </div>
        `;
      searchResults.classList.remove("hidden");
    }
  
    async function handleSearch() {
      const searchTerm = searchInput.value.trim();
      const userType = getUserType();
  
      showLoading();
  
      try {
        console.log(userType);
        const endpoint =
          userType === "customer"
            ? `http://localhost/Najeekai/api/freelancer.php?skill=${searchTerm}`
            : `http://localhost/Najeekai/api/post.php?term=${searchTerm}`;
  
        const response = await fetch(endpoint);
        const data = await response.json();
  
        if (data.status === "success" && data.data.length > 0) {
          const resultsHTML = data.data
            .map((item) =>
              userType === "customer"
                ? createFreelancerCard(item)
                : createPostCard(item)
            )
            .join("");
          searchResults.innerHTML = resultsHTML;
          searchResults.classList.remove("hidden");
        } else {
          showNoResults(searchTerm);
        }
      } catch (error) {
        console.error("Search error:", error);
        searchResults.innerHTML = `
                <div class="p-4 text-center text-red-500">
                    An error occurred while searching. Please try again.
                </div>
            `;
        searchResults.classList.remove("hidden");
      }
    }
    const searchTerm = searchInput.value.trim();
    // Event listeners
    searchInput.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleSearch, 500);
    });
  
    searchInput.addEventListener("keypress", function () {
      if (event.key === "Enter") {
        window.location.href = `search-results.html?q=${encodeURIComponent(
          searchTerm
        )}`;
      }
    });
  
    // Close search results when clicking outside
    document.addEventListener("click", function (event) {
      if (
        !searchInput.contains(event.target) &&
        !searchResults.contains(event.target)
      ) {
        searchResults.classList.add("hidden");
      }
    });
  
    // Initial placeholder update
    updatePlaceholder();
  
    // Handle URL hash changes
    function handleHashChange() {
      const hash = window.location.hash.slice(1) || "general"; // Default to 'general' if no hash
      switchTab(hash);
    }
  
    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
  
    // Handle initial page load
    handleHashChange();
  });