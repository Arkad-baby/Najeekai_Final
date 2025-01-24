class ProposalManager {
  constructor() {
      this.init();
  }

  init() {
      this.elements = {
          container: document.getElementById('proposalsContent'),
          loading: document.getElementById('proposalsLoading'),
          alert: document.getElementById('proposalAlert')
      };
      this.userData = JSON.parse(localStorage.getItem('userData'));
      this.setupListeners();
      this.loadProposals();
  }

  setupListeners() {
      if (this.elements.container) {
          this.elements.container.addEventListener('click', (e) => {
              const btn = e.target.closest('.action-btn');
              if (btn) {
                  const action = btn.dataset.action;
                  const id = btn.dataset.id;
                  if (action && id) {
                      this.handleAction(id, action);
                  }
              }
          });
      }
  }

  async loadProposals() {
      if (!this.elements.container) return;
      
      this.showLoading(true);
      
      try {
          const endpoint = `http://localhost/Najeekai/api/proposal.php?${
              this.userData.userType === 'customer' ? 'customerId' : 'freelancerId'
          }=${this.userData.id}`;
          
          const response = await fetch(endpoint);
          const result = await response.json();
          
          if (result.status === "success") {
              this.renderProposals(result.data);
          } else {
              throw new Error(result.message);
          }
      } catch (error) {
          console.error('Error loading proposals:', error);
          this.renderError();
      } finally {
          this.showLoading(false);
      }
  }

  renderProposals(proposals) {
      if (!proposals?.length) {
          this.renderEmpty();
          return;
      }

      this.elements.container.innerHTML = proposals.map(proposal => 
          this.userData.userType === 'customer' 
              ? this.generateCustomerProposalCard(proposal)
              : this.generateFreelancerProposalCard(proposal)
      ).join('');
  }

  generateCustomerProposalCard(proposal) {
      const skills = JSON.parse(proposal.post.requiredSkills || '[]');
      
      return `
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div class="p-6 border-b border-gray-200">
                  <div class="flex justify-between items-start">
                      <div class="flex-1">
                          <h3 class="text-xl font-semibold text-gray-900">${proposal.post.caption}</h3>
                          <p class="text-gray-600 mt-2">${proposal.post.description}</p>
                          
                          <div class="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-500">
                              <div class="flex items-center gap-2">
                                  <i class="fas fa-map-marker-alt w-4"></i>
                                  <span>${proposal.post.location}</span>
                              </div>
                              <div class="flex items-center gap-2">
                                  <i class="fas fa-dollar-sign w-4"></i>
                                  <span>${proposal.post.rate}/hr</span>
                              </div>
                              <div class="flex items-center gap-2">
                                  <i class="fas fa-clock w-4"></i>
                                  <span>${proposal.post.estimatedTime} hours</span>
                              </div>
                          </div>

                          <div class="flex gap-2 mt-4">
                              ${skills.map(skill => `
                                  <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                      ${skill}
                                  </span>
                              `).join('')}
                          </div>
                      </div>
                  </div>
              </div>

              <div class="p-6">
                  <div class="flex justify-between items-start">
                      <div class="flex-1">
                          <div class="flex items-center gap-4 mb-4">
                              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <i class="fas fa-user-circle text-blue-500 text-2xl"></i>
                              </div>
                              <div>
                                  <h4 class="text-lg font-semibold">
                                      ${proposal.freelancer.firstName} ${proposal.freelancer.lastName}
                                  </h4>
                                  <p class="text-gray-500">${proposal.freelancer.email}</p>
                                  <p class="text-gray-500">${proposal.freelancer.phoneNumber}</p>
                              </div>
                          </div>
                      </div>

                      <div class="flex flex-col items-end gap-4">
                          <span class="px-4 py-2 rounded-full text-sm font-medium ${this.getStatusClasses(proposal)}">
                              ${this.getStatusText(proposal)}
                          </span>
                          
                          ${!proposal.isApproved && !proposal.isCancelled ? `
                              <div class="flex gap-2">
                                  <button data-action="approve" data-id="${proposal.id}"
                                      class="action-btn inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                      <i class="fas fa-check mr-2"></i>
                                      Approve
                                  </button>
                                  <button data-action="reject" data-id="${proposal.id}"
                                      class="action-btn inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                      <i class="fas fa-times mr-2"></i>
                                      Reject
                                  </button>
                              </div>
                          ` : ''}
                      </div>
                  </div>
              </div>
          </div>
      `;
  }

  generateFreelancerProposalCard(proposal) {
      const skills = JSON.parse(proposal.post.requiredSkills || '[]');
      
      return `
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div class="p-6 border-b border-gray-200">
                  <div class="flex justify-between items-start">
                      <div class="flex-1">
                          <h3 class="text-xl font-semibold text-gray-900">${proposal.post.caption}</h3>
                          <p class="text-gray-600 mt-2">${proposal.post.description}</p>
                          
                          <div class="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-500">
                              <div class="flex items-center gap-2">
                                  <i class="fas fa-map-marker-alt w-4"></i>
                                  <span>${proposal.post.location}</span>
                              </div>
                              <div class="flex items-center gap-2">
                                  <i class="fas fa-dollar-sign w-4"></i>
                                  <span>${proposal.post.rate}/hr</span>
                              </div>
                              <div class="flex items-center gap-2">
                                  <i class="fas fa-clock w-4"></i>
                                  <span>${proposal.post.estimatedTime} hours</span>
                              </div>
                          </div>

                          <div class="flex gap-2 mt-4">
                              ${skills.map(skill => `
                                  <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                      ${skill}
                                  </span>
                              `).join('')}
                          </div>
                      </div>
                  </div>
              </div>

              <div class="p-6">
                  <div class="flex justify-between items-start">
                      ${proposal.customer ? `
                          <div class="flex-1">
                              <div class="flex items-center gap-4 mb-4">
                                  <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                      <i class="fas fa-user-circle text-blue-500 text-2xl"></i>
                                  </div>
                                  <div>
                                      <h4 class="text-lg font-semibold">Customer Details</h4>
                                      <p class="text-gray-500">${proposal.customer.email}</p>
                                      <p class="text-gray-500">${proposal.customer.phoneNumber}</p>
                                  </div>
                              </div>
                          </div>
                      ` : ''}
                      
                      <div class="flex flex-col items-end gap-4">
                          <span class="px-4 py-2 rounded-full text-sm font-medium ${this.getStatusClasses(proposal)}">
                              ${this.getStatusText(proposal)}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      `;
  }

  getStatusClasses(proposal) {
      if (proposal.isApproved) return 'bg-green-100 text-green-800 border border-green-200';
      if (proposal.isCancelled) return 'bg-red-100 text-red-800 border border-red-200';
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  }

  getStatusText(proposal) {
      if (proposal.isApproved) return 'Approved';
      if (proposal.isCancelled) return 'Rejected';
      return 'Pending';
  }

  async handleAction(proposalId, action) {
      try {
          const response = await fetch(
              `http://localhost/Najeekai/api/proposal.php?proposalId=${proposalId}&action=${action}`,
              { method: 'GET' }
          );
          
          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          
          const result = await response.json();
          
          if (result.status === "success") {
              this.showAlert(`Proposal ${action}ed successfully`, 'success');
              await this.loadProposals();
          } else {
              throw new Error(result.message || 'Operation failed');
          }
      } catch (error) {
          console.error('Action error:', error);
          this.showAlert(`Failed to ${action} proposal`, 'error');
      }
  }

  showAlert(message, type) {
      if (!this.elements.alert) return;
      
      this.elements.alert.className = `mb-4 p-4 rounded-md ${
          type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`;
      this.elements.alert.textContent = message;
      this.elements.alert.classList.remove('hidden');
      setTimeout(() => this.elements.alert.classList.add('hidden'), 3000);
  }

  showLoading(show) {
      if (this.elements.loading) {
          this.elements.loading.classList.toggle('hidden', !show);
      }
  }

  renderEmpty() {
      if (this.elements.container) {
          this.elements.container.innerHTML = `
              <div class="text-center py-12 bg-white rounded-lg border">
                  <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">No Proposals Found</h3>
                  <p class="text-gray-500">There are currently no proposals to display.</p>
              </div>
          `;
      }
  }

  renderError() {
      if (this.elements.container) {
          this.elements.container.innerHTML = `
              <div class="text-center py-12 bg-white rounded-lg border">
                  <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Proposals</h3>
                  <p class="text-gray-500">Please try again later.</p>
              </div>
          `;
      }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProposalManager();
});