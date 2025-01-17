// profile.js
class ProfileManager {
  constructor() {
    this.profileForm = document.getElementById("profileForm");
    this.submitAlert = document.getElementById("submitAlert");
    this.userType = JSON.parse(localStorage.getItem("userData")).userType;
    this.userData = null;

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadUserProfile();
      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to initialize profile:", error);
      this.showAlert("Failed to load profile data", "error");
    }
  }

  async loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    let apiUrl = "";
    if (userData.userType === "customer") {
      apiUrl = `http://localhost/Najeekai/api/customer.php?id=${userData.id}`;
    } else if (userType === "freelancer") {
      apiUrl = `http://localhost/Najeekai/api/freelancer.php?id=${userData.id}`;
    }

    try {
      const response = await AuthHandler.makeAuthenticatedRequest(apiUrl, {
        method: "GET",
        headers: {
          // 'Content-Type': 'application/json',
          // authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const result = await response.json();
      this.userData = result.data;
      this.populateProfileData();
      this.updateHeaderInfo();
    } catch (error) {
      console.error("Error loading profile:", error);
      throw error;
    }
  }

  populateProfileData() {
    if (!this.userData) return;

    // Update form fields
    const fields = [
      "firstName",
      "lastName",
      "middleName",
      "username",
      "email",
      "phoneNumber",
    ];
    fields.forEach((field) => {
      const input = this.profileForm.querySelector(`[name="${field}"]`);
      if (input) {
        input.value = this.userData[field] || "";
        // Make username and email readonly as they shouldn't be changed
        if (field === "username" || field === "email") {
          input.readOnly = true;
          input.classList.add("bg-gray-100");
        }
      }
    });
  }

  updateHeaderInfo() {
    if (!this.userData) return;

    // Update profile header information
    const nameElement = document.querySelector(".text-white .text-3xl");
    const usernameElement = document.querySelector(".text-white .text-lg");

    if (nameElement) {
      nameElement.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
    }
    if (usernameElement) {
      usernameElement.textContent = `@${this.userData.username}`;
    }
  }

  setupEventListeners() {
    this.profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleProfileUpdate(e);
    });

    // Handle logout
    const logoutButton = document.querySelector(
      "button i.fa-sign-out-alt"
    ).parentElement;
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        AuthHandler.clearAuth();
      });
    }
  }

  async handleProfileUpdate(event) {
    const formData = new FormData(event.target);
    const profileData = Object.fromEntries(formData);

    // Add the user ID to the update data
    profileData.id = this.userData.id;

    try {
      const response = await AuthHandler.makeAuthenticatedRequest(
        "http://localhost/Najeekai/api/customer.php",
        {
          method: "PUT",
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const result = await response.json();
      this.showAlert("Profile updated successfully", "success");

      // Reload the profile data to show updated information
      await this.loadUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      this.showAlert(error.message || "Failed to update profile", "error");
    }
  }

  showAlert(message, type = "success") {
    this.submitAlert.className =
      "rounded-md p-4 mb-4 " +
      (type === "success"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700");
    this.submitAlert.textContent = message;
    this.submitAlert.classList.remove("hidden");

    // Hide alert after 5 seconds
    setTimeout(() => {
      this.submitAlert.classList.add("hidden");
    }, 5000);
  }
}

// Initialize profile manager when document is ready
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});

// Search functionality
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchDropdown");
  let debounceTimer;

  // Get user type from localStorage
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

  // Handle search
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
});

document.addEventListener("DOMContentLoaded", function () {
  const userType = JSON.parse(localStorage.getItem("userData")).userType;
  if (userType === "freelancer") {
    const postTab = document.getElementById("postTab");
    postTab.classList.add("hidden");
  }

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Function to switch tabs
  function switchTab(tabId) {
    // Remove active classes from all buttons
    tabButtons.forEach((btn) => {
      btn.classList.remove("text-blue-600", "border-b-2", "border-blue-600");
      btn.classList.add("text-gray-500");
    });

    // Add active classes to the selected button
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add("text-blue-600", "border-b-2", "border-blue-600");
      activeButton.classList.remove("text-gray-500");
    }

    // Hide all tab contents
    tabContents.forEach((content) => {
      content.classList.add("hidden");
    });

    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.classList.remove("hidden");
    }
  }

  // Handle click events on tab buttons
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      // Update URL hash without triggering scroll
      history.pushState(null, null, `#${tabId}`);
      switchTab(tabId);
    });
  });

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

document.addEventListener("DOMContentLoaded", function () {
  // Function to get initials from name
  function getInitials(firstName = "", lastName = "") {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}`;
  }

  // Function to generate a consistent color based on name
  function generateColorFromName(name) {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500'
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  try {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const { firstName = "", lastName = "" } = userData;
    const initials = getInitials(firstName, lastName);
    const colorClass = generateColorFromName(firstName + lastName);

    // Get the avatar container
    const avatarContainer = document.querySelector('.relative.group');
    if (avatarContainer) {
      // Replace the content with initials avatar
      avatarContainer.innerHTML = `
        <div class="w-32 h-32 rounded-full border-4 border-white overflow-hidden ${colorClass} flex items-center justify-center">
          <span class="text-white text-4xl font-bold">${initials}</span>
        </div>
      `;

      // Update profile name as well
      const nameElement = document.querySelector('.text-3xl.font-bold');
      const usernameElement = document.querySelector('.text-lg.opacity-90');
      if (nameElement && firstName && lastName) {
        nameElement.textContent = `${firstName} ${lastName}`;
      }
      if (usernameElement && userData.username) {
        usernameElement.textContent = `@${userData.username}`;
      }
    }
  } catch (error) {
    console.error("Error setting up profile avatar:", error);
  }
});