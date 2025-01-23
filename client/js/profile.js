class ProfileManager {
  constructor() {
    this.profileForm = document.getElementById("profileForm");
    this.submitAlert = document.getElementById("submitAlert");
    this.proposalsContent = document.getElementById("proposalsContent");
    this.proposalsLoading = document.getElementById("proposalsLoading");
    this.userType = JSON.parse(localStorage.getItem("userData")).userType;
    this.userData = null;

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadUserProfile();
      this.setupEventListeners();
      this.setupTabSwitching();
    } catch (error) {
      console.error("Failed to initialize profile:", error);
      this.showAlert("Failed to load profile data", "error");
    }
  }

  async loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) throw new Error("User data not found in local storage.");

    let apiUrl = "";
    if (userData.userType === "customer") {
      apiUrl = `http://localhost/Najeekai/api/customer.php?id=${userData.id}`;
    } else if (userData.userType === "freelancer") {
      apiUrl = `http://localhost/Najeekai/api/freelancer.php?id=${userData.id}`;
    }

    try {
      const response = await AuthHandler.makeAuthenticatedRequest(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
        if (field === "username" || field === "email") {
          input.readOnly = true;
          input.classList.add("bg-gray-100");
        }
      }
    });
  }

  updateHeaderInfo() {
    if (!this.userData) return;

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
      await this.handleProfileUpdate();
    });

    const logoutButton = document.querySelector(
      "button i.fa-sign-out-alt"
    )?.parentElement;

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        AuthHandler.clearAuth();
        window.location.href = "login.html";
      });
    }

    const newPostBtn = document.getElementById("newPostBtn");
    const postForm = document.getElementById("postForm");
    const cancelPostBtn = document.getElementById("cancelPost");

    if (newPostBtn && postForm && cancelPostBtn) {
      newPostBtn.addEventListener("click", () => {
        postForm.classList.remove("hidden");
      });

      cancelPostBtn.addEventListener("click", () => {
        postForm.classList.add("hidden");
      });
    }
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active classes from all buttons
        tabButtons.forEach((btn) => {
          btn.classList.remove(
            "text-blue-600",
            "border-b-2",
            "border-blue-600"
          );
          btn.classList.add("text-gray-500");
        });

        // Add active classes to clicked button
        button.classList.add("text-blue-600", "border-b-2", "border-blue-600");
        button.classList.remove("text-gray-500");

        // Hide all tab contents
        tabContents.forEach((content) => {
          content.classList.add("hidden");
        });

        // Show selected tab content
        const tabId = button.getAttribute("data-tab");

        const TabContent = document.getElementById(tabId);
        if (TabContent) {
          TabContent.classList.remove("hidden");
          if (tabId === "proposal") {
            loadProposals();
          }
        }
      });
    });

    if (this.userType === "freelancer") {
      const postTab = document.getElementById("postTab");
      if (postTab) postTab.classList.add("hidden");
    }
  }

  async handleProfileUpdate() {
    const formData = new FormData(this.profileForm);
    const updatedData = {};

    formData.forEach((value, key) => {
      updatedData[key] = value;
    });

    const apiUrl =
      this.userType === "customer"
        ? `http://localhost/Najeekai/api/customer.php`
        : `http://localhost/Najeekai/api/freelancer.php`;

    try {
      const response = await AuthHandler.makeAuthenticatedRequest(apiUrl, {
        method: "POST",
        body: JSON.stringify(updatedData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        this.showAlert("Profile updated successfully", "success");
        await this.loadUserProfile();
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      this.showAlert("Failed to update profile", "error");
    }
  }
}

// Initialize the ProfileManager when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});

async function loadProposals() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const proposalsContent = document.getElementById("proposalsContent");
  const loadingElement = document.getElementById("proposalsLoading");

  if (!proposalsContent) {
    console.error("proposalsContent element not found");
    return;
  }

  loadingElement.classList.remove("hidden");
  proposalsContent.innerHTML = "";

  if (!userData) {
    proposalsContent.innerHTML = `
      <p class="text-center text-gray-500 py-8">Please login to view proposals</p>`;
    loadingElement.classList.add("hidden");
    return;
  }

  try {
    const endpoint =
      userData.userType === "freelancer"
        ? `http://localhost/Najeekai/api/proposal.php?freelancerId=${userData.id}`
        : `http://localhost/Najeekai/api/post.php?customerId=${userData.id}`;

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const result = await response.json();

    loadingElement.classList.add("hidden");

    if (!result.data || result.data.length === 0) {
      proposalsContent.innerHTML = `
        <p class="text-center text-gray-500 py-8">No proposals found</p>`;
      return;
    }

    // Render proposals/posts
    const proposalCards = await Promise.all(
      result.data.map((item) => generateProposalCard(item, userData.userType))
    );
    console.log("propoasl", proposalCards);
    proposalsContent.innerHTML = proposalCards.join("");
  } catch (error) {
    console.error("Error loading proposal:", error);
    proposalsContent.innerHTML = `
      <p class="text-red-500 text-center py-8">Failed to load proposals. Please try again later.</p>`;
    loadingElement.classList.add("hidden");
  }
}

// Helper to fetch post or freelancer data
async function fetchAdditionalData(type, id) {
  const url =
    type === "post"
      ? `http://localhost/Najeekai/api/post.php?id=${id}`
      : `http://localhost/Najeekai/api/proposal.php?freelancerId=${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return null;
  }
}

async function generateProposalCard(item, userType) {
  let post, proposal;

  if (userType === "freelancer") {
    proposal = item;
    post = await fetchAdditionalData("post", proposal?.postId);
  } else {
    post = item; // Show the first proposal
  }

  // Ensure proposal and post are defined before trying to use them
  if (!post) {
    return `<div class="text-center text-red-500 py-8">Post data is missing.</div>`;
  }

  const showCustomerInfo = proposal?.isApproved && userType === "freelancer";
  const showFreelancerInfo = userType === "customer";

  return `
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 space-y-4">
      <div class="flex justify-between items-start">
        <div class="space-y-3 flex-1">
          <div>
            <h3 class="text-xl font-semibold text-gray-900">${
              post?.caption || "N/A"
            }</h3>
            <p class="text-gray-600 mt-1">${
              post?.description || "No description available"
            }</p>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex items-center text-gray-600">
              <span>Posted: ${formatDate(post?.postedAt)}</span>
            </div>
            <div class="flex items-center text-gray-600">
              <span>${post?.location || "Unknown Location"}</span>
            </div>
            <div class="flex items-center text-gray-600">
              <span>Rate: $${post?.rate || "N/A"}/hr</span>
            </div>
            <div class="flex items-center text-gray-600">
              <span>Est. Time: ${post?.estimatedTime || "N/A"} hours</span>
            </div>
          </div>
        </div>
        <span class="px-4 py-2 rounded-full text-sm font-medium ${
          proposal?.isApproved
            ? "bg-green-100 text-green-800 border border-green-200"
            : proposal?.isCancelled
            ? "bg-red-100 text-red-800 border border-red-200"
            : "bg-yellow-100 text-yellow-800 border border-yellow-200"
        }">
          ${
            proposal?.isApproved
              ? "Approved"
              : proposal?.isCancelled
              ? "Rejected"
              : "Pending"
          }
        </span>
      </div>

      ${
        showFreelancerInfo &&
        item.proposals?.map((item) => {
          console.log(item);
          return generateFreelancerDetails(
            item.freelancer,
            userType,
            proposal?.isApproved,
            item.id
          );
        })
      }

      ${
        showCustomerInfo
          ? `
          <div class="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h4 class="text-lg font-medium text-gray-900 mb-3">Customer Details</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Name</p>
                <p class="text-sm font-medium">${
                  proposal?.customer.firstName
                } ${proposal?.customer.middleName || ""} ${
              proposal?.customer.lastName
            }</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Email</p>
                <p class="text-sm font-medium">${proposal?.customer.email}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Phone</p>
                <p class="text-sm font-medium">${
                  proposal?.customer.phoneNumber
                }</p>
              </div>
            </div>
          </div>`
          : ""
      }
    </div>`;
}

// Function to handle approve button click
async function approveProposal(proposalId) {
  try {
    const response = await fetch(
      `http://localhost/Najeekai/api/proposal.php?action=approve&id=${proposalId}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const result = await response.json();
    if (result.success) {
      alert("Proposal approved successfully!");
      loadProposals(); // Reload proposals after approval
    } else {
      alert("Failed to approve proposal. Please try again.");
    }
  } catch (error) {
    console.error("Error approving proposal:", error);
    alert("An error occurred. Please try again.");
  }
}

// Function to handle reject button click
async function rejectProposal(proposalId) {
  try {
    const response = await fetch(
      `http://localhost/Najeekai/api/proposal.php?action=reject&id=${proposalId}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const result = await response.json();
    if (result.success) {
      alert("Proposal rejected successfully!");
      loadProposals(); // Reload proposals after rejection
    } else {
      alert("Failed to reject proposal. Please try again.");
    }
  } catch (error) {
    console.error("Error rejecting proposal:", error);
    alert("An error occurred. Please try again.");
  }
}

// Generate HTML for freelancer details
function generateFreelancerDetails(
  freelancer,
  userType,
  isApproved,
  proposalId
) {
  return `
    <div class="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
      <h4 class="text-lg font-medium text-gray-900 mb-3">Freelancer Details</h4>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-500">Name</p>
          <p class="text-sm font-medium">${freelancer.firstName} ${
    freelancer.middleName || ""
  } ${freelancer.lastName}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Username</p>
          <p class="text-sm font-medium">${freelancer.username}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Email</p>
          <p class="text-sm font-medium">${freelancer.email}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Phone</p>
          <p class="text-sm font-medium">${freelancer.phoneNumber}</p>
        </div>
      </div>
            ${
              !isApproved && userType === "customer"
                ? ` <div class="mt-4 flex justify-end gap-4"> 
        <button class="bg-green-500 text-white py-2 px-4 rounded" onclick="approveProposal(${proposalId})">Approve</button>
        <button class="bg-red-500 text-white py-2 px-4 rounded" onclick="rejectProposal(${proposalId})">Reject</button>
      </div> `
                : ""
            }
    </div>`;
}

// Helper to format date
function formatDate(dateString) {
  if (!dateString) return "Unknown Date";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
