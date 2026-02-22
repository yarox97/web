<template>
  <div class="page-container">
    <div v-if="activeMenuContractId" class="menu-backdrop" @click="closeContractMenu"></div>

    <div v-if="loading" class="state-box"><Spinner></Spinner></div>
    <div v-else-if="error" class="state-box error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="goBack">Return</button>
    </div>

    <div v-else class="content-animate">
      
      <div class="nav-header">
        <button class="btn-back" @click="goToClubs"><span class="icon">←</span> Back to Clubs</button>
        <div class="actions-group" v-if="canEdit">
          <template v-if="!isEditing">
            <button class="btn-primary" @click="startEdit">✎ Edit Club</button>
          </template>
          <template v-else>
            <button class="btn-secondary" @click="cancelEdit" :disabled="isSaving">Cancel</button>
            <button class="btn-primary" @click="saveClub" :disabled="isSaving">{{ isSaving ? 'Saving...' : 'Save Changes' }}</button>
          </template>
        </div>
      </div>

      <div class="card header-card">
        <div class="cover-image" :style="coverStyle"></div>
        <div class="header-content">
          <div class="avatar-container">
            <img :src="clubAvatar" alt="Club Logo" class="avatar-img" @error="onAvatarError" />
          </div>
          <div class="title-container">
            <template v-if="isEditing">
               <input v-model="editForm.name" class="edit-input title-input" placeholder="Club Name" />
            </template>
            <template v-else>
               <h1 class="club-title">{{ club.name }}</h1>
               <div class="badges-row">
                 <span class="since-badge" v-if="club.createdAt">Est. {{ new Date(club.createdAt).getFullYear() }}</span>
                 <span v-if="myClubRole" class="role-badge-header">{{ myClubRole }}</span>
               </div>
            </template>
          </div>
        </div>
      </div>

      <div class="tabs-bar">
        <button class="tab-btn" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
        <button v-if="canViewMembers" class="tab-btn" :class="{ active: activeTab === 'members' }" @click="activeTab = 'members'">Members</button>
        <button v-if="canViewRequests" class="tab-btn" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
          Join Requests
          <span v-if="requests.some(r => r.status === 'Pending')" class="badge-dot"></span>
        </button>
        <button v-if="canViewContracts" class="tab-btn" :class="{ active: activeTab === 'contracts' }" @click="activeTab = 'contracts'">Contracts</button>
        
        <button v-if="canViewMembers" class="tab-btn" @click="goToClubTasks" title="Go to Club Tasks">
          Tasks <span class="external-icon">↗</span>
        </button>
      </div>

      <div v-if="activeTab === 'overview'" class="tab-content">
        <div class="grid-layout" :class="{ 'full-width': !volleyboxWidgetSrc || isEditing }">
          <div class="left-column">
            <div v-if="club.joinCode && !isEditing" class="card invite-card">
              <div class="invite-header"><span class="card-label">Internal Access</span></div>
              <div class="code-box" @click="copyCode" title="Click to copy">
                <div class="code-label">INVITE CODE</div>
                <div class="code-value">{{ club.joinCode }}</div>
                <div class="copy-icon">📋</div>
              </div>
            </div>

            <div v-if="isEditing" class="card edit-card">
              <h3 class="section-title">Club Settings</h3>
              <div class="form-group"><label>Avatar URL</label><input v-model="editForm.avatarURL" class="edit-input" /></div>
              <div class="form-group"><label>Background URL</label><input v-model="editForm.backGroundURL" class="edit-input" /></div>
              <div class="form-group"><label>Volleybox Profile URL</label><input v-model="editForm.volleyBoxUrl" class="edit-input" /></div>
            </div>

            <div class="card info-card">
              <h3 class="section-title">About the Club</h3>
              <template v-if="isEditing">
                <textarea v-model="editForm.description" class="edit-textarea" rows="8"></textarea>
              </template>
              <template v-else>
                <div v-if="club.description" class="club-desc">{{ club.description }}</div>
                <div v-else class="club-desc placeholder-text">
                    <p>Welcome to <strong>{{ club.name }}</strong>!</p>
                    <p>This club is part of our volleyball community. Stay tuned for updates and team announcements.</p>
                </div>
                <div class="club-highlights">
                    <h4 class="highlights-title">Club Highlights</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-icon">📅</span>
                            <div class="stat-text">
                                <span class="stat-label">Founded</span>
                                <span class="stat-value">{{ formatDate(club.createdAt) }}</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">🔐</span>
                            <div class="stat-text">
                                <span class="stat-label">Status</span>
                                <span class="stat-value">{{ club.joinCode ? 'Invite Only' : 'Open' }}</span>
                            </div>
                        </div>
                        </div>
                </div>
              </template>
            </div>
          </div>
          <div class="right-column" v-if="volleyboxWidgetSrc && !isEditing">
            <div class="card vb-card widget-card">
              <div class="vb-header"><span class="vb-logo">🏐</span><span class="vb-title">Next Match</span></div>
              <div class="widget-wrapper"><iframe :src="volleyboxWidgetSrc" frameborder="0" scrolling="no" class="match-widget-iframe"></iframe></div>
              <div class="vb-footer"><small>Powered by Volleybox</small></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'members'" class="tab-content">
        <div v-if="loadingMembers" class="state-box"><Spinner /></div>
        <div v-else-if="members.length === 0" class="state-box">
          <div class="empty-icon">👥</div>
          <p>No members found.</p>
        </div>
        <div v-else class="members-list">
             <div 
                v-for="member in sortedMembers" 
                :key="member.userId" 
                class="card member-card" 
                :class="{ 'editing-mode': member.isEditing, 'kick-mode': member.kickConfirm }"
             >
                <div class="member-main-content clickable-area" @click="goToProfile(member.userName)">
                    <div class="req-avatar compact-avatar">
                        <img 
                            :src="member.avatarUrl || getAvatar(member.userName)" 
                            alt="User" 
                            @error="(e) => handleImageError(e, member.userName)"
                        />
                    </div>
                    <div class="req-info">
                        <h4 class="req-fullname">
                            {{ member.fullName || member.userName }}
                            <span v-if="authStore.user?.id === member.userId" class="me-badge">(You)</span>
                        </h4>
                        <div class="req-meta-row">
                             <span class="req-username">@{{ member.userName }}</span>
                             <span class="dot-separator">•</span>
                             <span class="req-date">Joined {{ formatDate(member.joinDate) }}</span>
                        </div>
                    </div>
                </div>
                
                <div class="member-actions">
                      <template v-if="member.kickConfirm">
                         <div class="kick-confirmation-box">
                            <span class="danger-text">Kick user?</span>
                            <button class="btn-confirm-kick" @click.stop="confirmKick(member)">Yes</button>
                            <button class="btn-cancel-kick" @click.stop="cancelKick(member)">Cancel</button>
                         </div>
                      </template>
                      <template v-else-if="member.isEditing">
                          <div class="edit-role-container" @click.stop>
                              <select v-model="member.tempRole" class="role-select-styled">
                                 <option v-for="role in getAllowedRoles()" :key="role" :value="role">{{ role }}</option>
                              </select>
                              <button class="btn-icon-action save" @click.stop="saveMemberRole(member)" title="Save">✓</button>
                              <button class="btn-icon-action cancel" @click.stop="cancelMemberEdit(member)" title="Cancel">✕</button>
                          </div>
                      </template>
                      <template v-else>
                          <span class="role-badge" :class="getRoleBadgeClass(member.role)">{{ member.role }}</span>
                          <div v-if="canManageMember(member)" class="manage-buttons">
                              <button class="action-trigger edit-trigger" @click.stop="startMemberEdit(member)" title="Change Role">✎</button>
                              <button class="action-trigger kick-trigger" @click.stop="askToKick(member)" title="Kick User">✕</button>
                          </div>
                      </template>
                </div>
             </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'requests'" class="tab-content">
        <div class="filter-pills">
           <button v-for="filter in ['Pending', 'Approved', 'Rejected', 'All']" :key="filter"
             class="pill" :class="{ active: requestFilter === filter }" @click="requestFilter = filter">
             {{ filter }}
           </button>
        </div>
        <div v-if="loadingRequests" class="state-box"><Spinner /></div>
        <div v-else-if="filteredRequests.length === 0" class="state-box">
          <div class="empty-icon">📭</div>
          <p>No {{ requestFilter !== 'All' ? requestFilter.toLowerCase() : '' }} requests found.</p>
        </div>
        <div v-else class="requests-grid">
          <div v-for="req in filteredRequests" :key="req.id" class="card request-card clickable-card" @click="goToProfile(req.userName)">
             <div class="req-avatar">
                <img :src="req.userAvatar || getAvatar(req.userName)" alt="User" @error="(e) => handleImageError(e, req.userName)" />
             </div>
             <div class="req-info">
                <h4 class="req-fullname">
                  {{ req.firstName }} {{ req.lastName }}
                  <span v-if="!req.firstName && !req.lastName">{{ req.userName }}</span>
                </h4>
                <div class="req-username">@{{ req.userName }}</div>
                <div v-if="req.email" class="req-email">✉️ {{ req.email }}</div>
                <div class="req-meta">📅 {{ formatDate(req.createdAt) }}</div>
             </div>
             <div class="req-actions">
                <template v-if="req.status === 'Pending'">
                  <div class="role-selector" @click.stop>
                      <select v-model="req.selectedRole" class="role-select">
                          <option v-for="role in getAllowedRoles()" :key="role" :value="role">{{ role }}</option>
                      </select>
                  </div>
                  <div class="action-buttons-row">
                      <button class="btn-action approve" @click.stop="handleRequest(req, 'Approve')">Approve</button>
                      <button class="btn-action reject" @click.stop="handleRequest(req, 'Reject')">Reject</button>
                  </div>
                </template>
                <template v-else>
                   <span class="status-badge" :class="getStatusClass(req.status)">{{ req.status }}</span>
                </template>
             </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'contracts'" class="tab-content">
         <div class="actions-header" v-if="canCreateContract">
             <button class="btn-primary" @click="openCreateContractModal">+ Create Contract</button>
         </div>

         <div v-if="loadingContracts" class="state-box"><Spinner /></div>
         <div v-else-if="contracts.length === 0" class="state-box">
            <div class="empty-icon">📄</div>
            <p>No contracts found.</p>
         </div>
         
         <div v-else>
            <div class="contracts-grid">
                <div v-for="contract in contracts" :key="contract.id" class="card contract-card clickable-card" @click="goToContractDetails(contract.id)">
                    
                    <div class="card-menu" v-if="canEdit">
                        <button class="menu-btn" @click.stop="toggleContractMenu(contract.id)">⋮</button>
                        <div v-if="activeMenuContractId === contract.id" class="menu-dropdown">
                            <button class="menu-item menu-item-danger" @click.stop="terminateContract(contract)">
                                Terminate Contract
                            </button>
                        </div>
                    </div>

                    <div class="contract-header">
                        <div class="req-avatar compact-avatar">
                            <img :src="getAvatar(contract.memberName)" alt="User" />
                        </div>
                        <div class="req-info">
                            <h4 class="req-fullname">{{ contract.memberName }} {{ contract.memberSurname }}</h4>
                            <span class="status-badge" :class="contract.isActive ? 'status-approved' : 'status-rejected'">
                                {{ contract.isActive ? 'Active' : 'Expired' }}
                            </span>
                        </div>
                    </div>
                    <div class="contract-details">
                        <div class="detail-row">
                            <span class="detail-label">Period</span>
                            <span class="detail-value">{{ formatDate(contract.startDate) }} - {{ formatDate(contract.endDate) }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Salary</span>
                            <span class="detail-value highlight-value">{{ formatCurrency(contract.salary, contract.currency) }} / mo</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pagination-controls" v-if="contractTotal > contractPageSize">
                <button class="btn-secondary pagination-btn" :disabled="contractPage === 1 || loadingContracts" @click="changeContractPage('prev')">Previous</button>
                <span class="page-info">Page {{ contractPage }}</span>
                <button class="btn-secondary pagination-btn" :disabled="(contractPage * contractPageSize) >= contractTotal || loadingContracts" @click="changeContractPage('next')">Next</button>
            </div>
         </div>
      </div>

    </div>

    <div v-if="showContractModal" class="modal-overlay" @click.self="closeContractModal">
        <div class="modal-card">
            <div class="modal-header">
                <h3>Create New Contract</h3>
                <button class="close-btn" @click="closeContractModal">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Member</label>
                    <select v-model="createContractForm.memberId" class="edit-input">
                        <option value="" disabled>Select a member...</option>
                        <option v-for="m in eligibleForContract" :key="m.userId" :value="m.userId">
                            {{ m.fullName }} (@{{ m.userName }})
                        </option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Monthly Salary</label>
                    <div class="input-group">
                        <input type="number" v-model="createContractForm.monthlySalary" class="edit-input" placeholder="0.00" min="0" step="0.01">
                        <select v-model="createContractForm.currency" class="edit-input currency-select">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="PLN">PLN</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="date" v-model="createContractForm.beginsFrom" class="edit-input">
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="date" v-model="createContractForm.endsBy" class="edit-input">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" @click="closeContractModal" :disabled="isCreatingContract">Cancel</button>
                <button class="btn-primary" @click="submitContract" :disabled="isCreatingContract">
                    {{ isCreatingContract ? 'Creating...' : 'Create Contract' }}
                </button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils/dateFormater'
import { getAvatar } from '@/utils/getAvatar'
import Spinner from '@/components/shared/Spinner.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const club = ref(null)
const loading = ref(true)
const error = ref(null)
const clubId = route.params.id

// --- Role Hierarchy Configuration ---
const availableRoles = ['President', 'Coach', 'Staff', 'Player']

const roleWeights = {
    'Creator': 100,
    'President': 90,
    'Coach': 50,
    'Staff': 40,
    'Player': 10,
    'Member': 0
}

// --- State ---
const activeTab = ref('overview')
const isEditing = ref(false)
const editForm = ref({})
const isSaving = ref(false)
const imageLoadError = ref(false)

// Requests State
const requests = ref([])
const loadingRequests = ref(false)
const requestFilter = ref('Pending')
const requestsLoaded = ref(false)

// Members State
const members = ref([])
const loadingMembers = ref(false)
const membersLoaded = ref(false)

// --- Contracts State ---
const contracts = ref([])
const loadingContracts = ref(false)
const contractsLoaded = ref(false)
const contractPage = ref(1)
const contractPageSize = 10
const contractTotal = ref(0)
const activeMenuContractId = ref(null)

// Create Contract State
const showContractModal = ref(false)
const isCreatingContract = ref(false)
const createContractForm = ref({
    memberId: '',
    monthlySalary: null,
    currency: 'USD',
    beginsFrom: '',
    endsBy: ''
})

// --- Permissions ---
const myClubRole = computed(() => {
  const user = authStore.user;
  if (!user || !user.clubDtos) return null;
  const myMembership = user.clubDtos.find(c => String(c.clubId) === String(clubId));
  return myMembership ? myMembership.role : null;
});

const canEdit = computed(() => ['President', 'Creator'].includes(myClubRole.value));
const canViewMembers = computed(() => !!myClubRole.value);
const canViewRequests = computed(() => ['President', 'Creator', 'Coach'].includes(myClubRole.value));
const canViewContracts = computed(() => ['President', 'Creator'].includes(myClubRole.value));
const canCreateContract = computed(() => ['President', 'Creator'].includes(myClubRole.value));

// Helper: Get weight of a role string
const getRoleWeight = (roleName) => {
    return roleWeights[roleName] || 0;
}

// --- SORTED MEMBERS LOGIC ---
const sortedMembers = computed(() => {
  return [...members.value].sort((a, b) => {
    const myId = authStore.user?.id;
    if (a.userId === myId) return -1;
    if (b.userId === myId) return 1;
    const weightA = getRoleWeight(a.role);
    const weightB = getRoleWeight(b.role);
    if (weightB !== weightA) return weightB - weightA;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });
});

// Filter members eligible for contract (exclude self)
const eligibleForContract = computed(() => {
    return sortedMembers.value.filter(m => m.userId !== authStore.user?.id);
})

// Helper: Return roles that I am allowed to assign
const getAllowedRoles = () => {
    const myWeight = getRoleWeight(myClubRole.value);
    return availableRoles.filter(r => getRoleWeight(r) < myWeight);
}

// --- API: Club Details ---
const fetchClub = async () => {
  loading.value = true
  try {
    const response = await api.get(`/api/club/${clubId}`)
    club.value = response.data
    imageLoadError.value = false 
  } catch (err) {
    console.error(err)
    error.value = "Failed to load club details."
  } finally {
    loading.value = false
  }
}

const startEdit = () => {
  editForm.value = {
    name: club.value.name,
    description: club.value.description,
    avatarURL: club.value.avatarURL,
    backGroundURL: club.value.backGroundURL,
    volleyBoxUrl: club.value.volleyBoxUrl || club.value.VolleyBoxUrl
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {}
  imageLoadError.value = false
}

const saveClub = async () => {
  isSaving.value = true
  try {
    await api.put(`/api/club/${clubId}`, editForm.value, {
        headers: { 'Content-Type': 'application/json' }
    })
    club.value = { ...club.value, ...editForm.value }
    isEditing.value = false
    imageLoadError.value = false
    await authStore.checkAuth(true)
  } catch (e) {
    console.error("Update failed", e)
    alert("Failed to update club details")
  } finally {
    isSaving.value = false
  }
}

// --- API: Members Logic ---
const fetchMembers = async (force = false) => {
  if (!canViewMembers.value) return
  if (membersLoaded.value && !force) return 

  loadingMembers.value = true
  try {
    const response = await api.get(`/api/${clubId}/members`)
    members.value = response.data.map(m => {
        const u = m.user || m.User || m; 
        return {
            userId: m.userId || m.UserId || u.id || u.Id,
            userName: m.userName || m.UserName || u.userName || u.UserName || 'Unknown',
            fullName: `${m.userFirstName || m.UserFirstName || u.firstName || u.FirstName || ''} ${m.userSurname || m.UserSurname || u.lastName || u.LastName || ''}`.trim(),
            avatarUrl: m.avatarUrl || m.AvatarUrl || u.avatarUrl || u.AvatarUrl,
            role: m.role || m.Role || 'Member',
            joinDate: m.joinDate || m.JoinDate || m.createdAt,
            isEditing: false, 
            kickConfirm: false,
            tempRole: m.role || m.Role || 'Member'
        };
    })
    membersLoaded.value = true
  } catch (e) {
    console.error("Failed to fetch members", e)
  } finally {
    loadingMembers.value = false
  }
}

const fetchRequests = async (force = false) => {
  if (!canViewRequests.value) return
  if (requestsLoaded.value && !force) return

  loadingRequests.value = true
  try {
    const response = await api.get(`/api/joinClubRequests/${clubId}`)
    requests.value = response.data.map(req => {
        const user = req.requestor || req.Requestor || req.user || req.User || {}; 
        return {
            id: req.JoinClubRequestId || req.joinClubRequestId || req.id, 
            userName: user.UserName || user.userName || 'Unknown',
            firstName: user.FirstName || user.firstName || '',
            lastName: user.LastName || user.lastName || '',
            email: user.Email || user.email || '',
            userAvatar: user.AvatarUrl || user.avatarUrl, 
            status: req.joinClubRequestStatus || req.status || 'Pending',
            createdAt: req.createdAt,
            selectedRole: 'Player' 
        }
    })
    requestsLoaded.value = true
  } catch (e) {
    console.error("Failed to fetch requests", e)
  } finally {
    loadingRequests.value = false
  }
}

// --- API: Contracts Logic ---
const fetchContracts = async (force = false) => {
    if (!canViewContracts.value) return;
    if (contractsLoaded.value && !force) return;

    loadingContracts.value = true;
    try {
        const response = await api.get(`/api/contracts/club/${clubId}/contracts`, {
            params: {
                pageNumber: contractPage.value,
                pageSize: contractPageSize
            }
        });
        
        if (response.data && response.data.items) {
            contracts.value = response.data.items.map(c => ({
                id: c.id || c.Id,
                memberId: c.memberId || c.MemberId,
                memberName: c.memberName || c.MemberName,
                memberSurname: c.memberSurname || c.MemberSurname,
                startDate: c.startDate || c.StartDate,
                endDate: c.endDate || c.EndDate,
                isActive: c.isActive || c.IsActive,
                salary: c.salary || c.Salary,
                currency: c.currency || c.Currency
            }));
            contractTotal.value = response.data.totalCount || 0;
            contractsLoaded.value = true;
        }
    } catch (e) {
        console.error("Failed to fetch contracts", e);
    } finally {
        loadingContracts.value = false;
    }
}

const changeContractPage = (direction) => {
    if (direction === 'next') contractPage.value++;
    else if (direction === 'prev' && contractPage.value > 1) contractPage.value--;
    fetchContracts(true);
}

// --- Contract Actions ---
const toggleContractMenu = (id) => {
    if (activeMenuContractId.value === id) {
        activeMenuContractId.value = null;
    } else {
        activeMenuContractId.value = id;
    }
}

const closeContractMenu = () => {
    activeMenuContractId.value = null;
}

const terminateContract = async (contract) => {
    if(!confirm(`Are you sure you want to terminate the contract for ${contract.memberName} ${contract.memberSurname}? This cannot be undone.`)) {
        return;
    }

    try {
        await api.put(`/api/contracts/${contract.id}/end`); 
        alert("Contract terminated.");
        closeContractMenu();
        await fetchContracts(true);
    } catch (e) {
        console.error(e);
        alert("Failed to terminate contract.");
    }
}

// --- Contract Creation Logic ---
const openCreateContractModal = async () => {
    if (!membersLoaded.value) {
        await fetchMembers(true);
    }
    createContractForm.value = {
        memberId: '',
        monthlySalary: null,
        currency: 'USD',
        beginsFrom: new Date().toISOString().split('T')[0],
        endsBy: ''
    }
    showContractModal.value = true;
}

const closeContractModal = () => {
    showContractModal.value = false;
}

const submitContract = async () => {
    if(!createContractForm.value.memberId || !createContractForm.value.monthlySalary || !createContractForm.value.beginsFrom || !createContractForm.value.endsBy) {
        alert("Please fill in all fields");
        return;
    }
    if(createContractForm.value.monthlySalary < 0) {
        alert("Salary cannot be negative");
        return;
    }

    isCreatingContract.value = true;
    try {
        const payload = {
            memberId: createContractForm.value.memberId,
            clubId: clubId,
            monthlySalary: parseFloat(createContractForm.value.monthlySalary),
            currency: createContractForm.value.currency,
            beginsFrom: new Date(createContractForm.value.beginsFrom).toISOString(),
            endsBy: new Date(createContractForm.value.endsBy).toISOString(),
            responserId: authStore.user?.id
        };

        await api.post('/api/contracts/assign-contract', payload);
        
        await fetchContracts(true);
        closeContractModal();
        alert("Contract created successfully!");
    } catch (e) {
        console.error("Failed to create contract", e);
        if(e.response && e.response.data && e.response.data.message) {
            alert("Error: " + e.response.data.message);
        } else {
            alert("Failed to create contract.");
        }
    } finally {
        isCreatingContract.value = false;
    }
}

const handleImageError = (event, userName) => {
    event.target.src = getAvatar(userName || 'User');
}

// --- Member Actions ---
const startMemberEdit = (member) => {
    member.kickConfirm = false;
    member.tempRole = member.role;
    member.isEditing = true;
}

const cancelMemberEdit = (member) => {
    member.isEditing = false;
    member.tempRole = member.role;
}

const saveMemberRole = async (member) => {
    if (member.tempRole === member.role) {
        member.isEditing = false;
        return;
    }
    if (getRoleWeight(member.tempRole) >= getRoleWeight(myClubRole.value)) {
        alert("You cannot assign a role equal to or higher than your own.");
        return;
    }

    try {
        await api.put(
            `/api/${clubId}/members/${member.userId}/change-role`, 
            JSON.stringify(member.tempRole), 
            { headers: { 'Content-Type': 'application/json' } }
        );
        member.role = member.tempRole;
        member.isEditing = false;
    } catch (e) {
        console.error("Failed to update role", e);
        alert("Failed to update role.");
    }
}

const askToKick = (member) => {
    member.isEditing = false;
    member.kickConfirm = true;
}

const cancelKick = (member) => {
    member.kickConfirm = false;
}

const confirmKick = async (member) => {
    try {
        await api.delete(`/api/${clubId}/members/${member.userId}`);
        members.value = members.value.filter(m => m.userId !== member.userId);
    } catch (e) {
        console.error("Failed to kick member", e);
        alert("Failed to kick member.");
        member.kickConfirm = false;
    }
}

const canManageMember = (member) => {
    if (!canEdit.value) return false;
    if (authStore.user?.id === member.userId) return false;
    const myWeight = getRoleWeight(myClubRole.value);
    const targetWeight = getRoleWeight(member.role);
    if (targetWeight >= myWeight) return false;
    return true;
}

const filteredRequests = computed(() => {
    if (requestFilter.value === 'All') return requests.value
    return requests.value.filter(r => r.status === requestFilter.value)
})

const handleRequest = async (requestItem, action) => {
    let requestBody = null;
    if (action === 'Approve') {
        if (!requestItem.selectedRole) {
            alert("Please select a role.");
            return;
        }
        requestBody = { role: requestItem.selectedRole };
    } else {
        if (!confirm(`Are you sure you want to REJECT this request?`)) return;
    }

    try {
        await api.put(
            `/api/joinClubRequests/${clubId}/requests/${requestItem.id}/${action.toLowerCase()}`, 
            requestBody
        )
        const reqIndex = requests.value.findIndex(r => r.id === requestItem.id)
        if (reqIndex !== -1) {
            requests.value[reqIndex].status = action === 'Approve' ? 'Approved' : 'Rejected'
        }
        if (action === 'Approve' && activeTab.value === 'members') fetchMembers(true);
        if (action === 'Approve' && activeTab.value !== 'members') membersLoaded.value = false;
    } catch (e) {
        console.error(e);
        alert(`Failed to ${action} request.`);
    }
}

const getStatusClass = (status) => {
    if (status === 'Pending') return 'status-pending'
    if (status === 'Approved') return 'status-approved'
    if (status === 'Rejected') return 'status-rejected'
    return ''
}

const getRoleBadgeClass = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'president' || r === 'creator') return 'role-admin';
    if (r === 'coach') return 'role-coach';
    if (r === 'staff') return 'role-staff';
    return 'role-player';
}

const goToProfile = (userName) => {
    if (!userName) return; 
    router.push({ name: 'UserProfile', params: { username: userName } })
}

const goToContractDetails = (contractId) => {
    router.push({ name: 'ContractDetails', params: { id: contractId } })
}

const goToClubTasks = () => {
    router.push({ 
      name: 'Tasks', 
      query: { 
        mode: 'club', 
        clubId: clubId 
      } 
    })
}

const formatCurrency = (amount, currency) => {
    if(amount == null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

const clubAvatar = computed(() => {
    if (isEditing.value && editForm.value.avatarURL) return editForm.value.avatarURL;
    if (imageLoadError.value) return getAvatar(club.value?.name || 'Club');
    if (club.value?.avatarURL) return club.value.avatarURL;
    return getAvatar(club.value?.name || 'Club');
})

const onAvatarError = () => { imageLoadError.value = true; }

const coverStyle = computed(() => {
    const url = isEditing.value ? editForm.value.backGroundURL : club.value?.backGroundURL
    if (url) {
        return { backgroundImage: `url(${url})` }
    }
    return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
})

const volleyboxWidgetSrc = computed(() => {
    const id = club.value?.volleyBoxUrl || club.value?.VolleyBoxUrl;
    if (!id) return null;
    return `https://volleybox.net/widget/soonest_match/${id}`;
})

const copyCode = () => {
    if(club.value?.joinCode) {
        navigator.clipboard.writeText(club.value.joinCode)
        alert('Invite code copied to clipboard!')
    }
}

const goBack = () => router.back()

const goToClubs = () => router.push({ name: 'clubs' })

// --- TAB SYNCHRONIZATION LOGIC ---
const checkTabParam = () => {
    const tabParam = route.query.tab
    if (tabParam && ['overview', 'members', 'requests', 'contracts'].includes(tabParam)) {
        activeTab.value = tabParam
    }
}

watch(activeTab, (newTab) => {
    if (newTab === 'requests') fetchRequests()
    if (newTab === 'members') fetchMembers()
    if (newTab === 'contracts') fetchContracts()
})

watch(() => route.query.tab, (newTab) => {
    if (newTab && ['overview', 'members', 'requests', 'contracts'].includes(newTab)) {
        activeTab.value = newTab
    }
})

onMounted(async () => {
    await fetchClub()
    checkTabParam()
    if (activeTab.value === 'members') fetchMembers()
    if (activeTab.value === 'requests') fetchRequests()
    if (activeTab.value === 'contracts') fetchContracts()
})
</script>

<style scoped>
/* Page & Basics */
.page-container { width: 100%; max-width: 2200px; margin: 0 auto; box-sizing: border-box; padding: 20px; font-family: 'Segoe UI', sans-serif; color: #1f2937; }
.content-animate { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Menu Backdrop */
.menu-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 90; background: transparent; }

/* Nav */
.nav-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
.btn-back { background: white; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 8px; color: #4b5563; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-back:hover { background: #f9fafb; color: #111827; }
.actions-group { display: flex; gap: 10px; }
.btn-primary { background: #0ea5e9; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-secondary { background: white; border: 1px solid #d1d5db; color: #4b5563; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }

/* Cards & Header */
.card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; margin-bottom: 6px; }
.header-card { position: relative; }
.cover-image { height: 250px; width: 100%; background-size: cover; background-position: center; }
.header-content { padding: 0 30px 20px; position: relative; display: flex; flex-direction: column; align-items: flex-start; }
.avatar-container { margin-top: -60px; padding: 4px; background: white; border-radius: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 120px; height: 120px; display: flex; justify-content: center; align-items: center; }
.avatar-img { width: 100%; height: 100%; border-radius: 20px; object-fit: cover; background-color: #f3f4f6; }
.title-container { margin-top: 15px; width: 100%; }
.club-title { margin: 0; font-size: 2.2rem; font-weight: 800; line-height: 1.2; word-break: break-word; }
.badges-row { margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap; }
.since-badge { background: #f3f4f6; color: #6b7280; font-size: 0.85rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.role-badge-header { background: #e0f2fe; color: #0284c7; font-size: 0.85rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

/* Tabs */
.tabs-bar { display: flex; gap: 20px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; overflow-x: auto; }
.tab-btn { background: none; border: none; padding: 10px 5px; font-size: 1rem; white-space: nowrap; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; position: relative; }
.tab-btn.active { color: #0ea5e9; border-bottom-color: #0ea5e9; }
.badge-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; position: absolute; top: 8px; right: -5px; }

.external-icon {
  font-size: 0.85rem;
  margin-left: 2px;
  opacity: 0.7;
}

/* Layouts */
.grid-layout { display: grid; grid-template-columns: 1fr 350px; gap: 24px; transition: all 0.3s ease; }
.grid-layout.full-width { grid-template-columns: 1fr; }

.left-column, .right-column { display: flex; flex-direction: column; }
.info-card { flex: 1; padding: 25px; }
.club-desc { white-space: pre-line; word-break: break-word; font-size: 1rem; line-height: 1.6; color: #4b5563; }
.placeholder-text { font-style: italic; color: #6b7280; }

.club-highlights { margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
.highlights-title { font-size: 1rem; color: #374151; margin: 0 0 15px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.stats-grid { display: flex; gap: 30px; flex-wrap: wrap; }
.stat-item { display: flex; align-items: center; gap: 10px; }
.stat-icon { font-size: 1.5rem; background: #f3f4f6; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
.stat-text { display: flex; flex-direction: column; }
.stat-label { font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase; }
.stat-value { font-size: 0.95rem; font-weight: 600; color: #111827; }

.edit-card { padding: 25px; border-left: 4px solid #0ea5e9; }
.section-title { font-size: 1.2rem; margin: 0 0 15px 0; color: #374151; }
.meta-row { margin-top: 20px; padding-top: 15px; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 0.9rem; }
.invite-card { background: linear-gradient(to right, #eff6ff, #ffffff); border-color: #bfdbfe; padding: 20px; }
.code-box { margin-top: 10px; background: white; border: 2px dashed #93c5fd; border-radius: 12px; padding: 15px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; flex-wrap: wrap; gap: 10px; }
.code-value { font-size: 1.5rem; font-weight: 800; color: #1e40af; font-family: monospace; word-break: break-all; }
.form-group label { font-size: 0.9rem; font-weight: 600; display: block; margin-bottom: 5px; }
.edit-input, .edit-textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; font-family: inherit; font-size: 1rem; }
.title-input { font-size: 1.8rem; font-weight: 700; margin-bottom: 10px; }

/* Members List */
.members-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.member-card { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; gap: 15px; transition: all 0.2s ease; border: 1px solid transparent; }
.member-card:hover { border-color: #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.member-card.editing-mode { background-color: #f0f9ff; border-color: #bae6fd; }
.member-card.kick-mode { background-color: #fef2f2; border-color: #fecaca; }
.member-main-content { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; }
.compact-avatar img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
.req-fullname { font-size: 1rem; margin: 0; line-height: 1.2; }
.req-meta-row { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #6b7280; margin-top: 2px; }
.dot-separator { font-size: 0.6rem; opacity: 0.5; }
.me-badge { font-size: 0.75rem; color: #6b7280; font-weight: normal; background: #f3f4f6; padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
.member-actions { display: flex; align-items: center; justify-content: flex-end; min-width: 180px; }

/* Manage Buttons (ALWAYS VISIBLE & COLORED) */
.manage-buttons { display: flex; gap: 6px; margin-left: 12px; }
.action-trigger { background: transparent; border: none; cursor: pointer; font-size: 1.1rem; padding: 6px; border-radius: 6px; transition: background 0.2s, color 0.2s; line-height: 1; color: #64748b; background-color: #f1f5f9; }
.action-trigger:hover { color: #334155; background-color: #e2e8f0; }
.edit-trigger { color: #0284c7; background-color: #e0f2fe; }
.edit-trigger:hover { background-color: #bae6fd; }
.kick-trigger { color: #dc2626; background-color: #fee2e2; }
.kick-trigger:hover { background-color: #fecaca; }

/* Edit & Actions */
.edit-role-container { display: flex; align-items: center; gap: 8px; animation: fadeIn 0.2s; }
.role-select-styled { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; background: white; outline: none; color: #334155; cursor: pointer; }
.role-select-styled:focus { border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1); }
.btn-icon-action { width: 30px; height: 30px; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; color: white; transition: transform 0.1s; }
.btn-icon-action:active { transform: scale(0.95); }
.save { background-color: #22c55e; } .save:hover { background-color: #16a34a; }
.cancel { background-color: #94a3b8; } .cancel:hover { background-color: #64748b; }
.kick-confirmation-box { display: flex; align-items: center; gap: 10px; animation: slideInRight 0.2s; }
@keyframes slideInRight { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
.danger-text { color: #dc2626; font-weight: 600; font-size: 0.9rem; margin-right: 5px; }
.btn-confirm-kick { background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-confirm-kick:hover { background: #b91c1c; }
.btn-cancel-kick { background: white; border: 1px solid #d1d5db; color: #4b5563; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
.btn-cancel-kick:hover { background: #f3f4f6; }

/* Requests Grid */
.filter-pills { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; }
.pill { padding: 6px 16px; border-radius: 20px; border: 1px solid #e5e7eb; background: white; color: #6b7280; cursor: pointer; font-size: 0.9rem; white-space: nowrap; }
.pill.active { background: #0ea5e9; color: white; border-color: #0ea5e9; }
.requests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 15px; }
.request-card { display: flex; align-items: center; padding: 15px; gap: 15px; }
.req-avatar img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
.req-info { flex: 1; min-width: 0; }
.req-email { font-size: 0.85rem; color: #4b5563; word-break: break-all; }
.req-meta { font-size: 0.85rem; color: #9ca3af; margin-top: 4px; }
.req-actions { display: flex; flex-direction: column; justify-content: center; align-items: flex-end; gap: 8px; min-width: 130px; }
.role-selector { width: 100%; }
.role-select { width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; color: #374151; background-color: #fff; cursor: pointer; }
.role-select:focus { outline: none; border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1); }
.action-buttons-row { display: flex; gap: 8px; width: 100%; }

/* Widget */
.vb-card { height: 100%; padding: 0; display: flex; flex-direction: column; border-top: 4px solid #ef4444; }
.vb-header, .vb-footer { padding: 10px 20px; }
.widget-wrapper { background: white; flex: 1; position: relative; min-height: 250px; }
.match-widget-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

/* Contracts */
.contracts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 15px; }
.contract-card { display: flex; flex-direction: column; padding: 15px; gap: 15px; position: relative; }
.contract-header { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }
.contract-details { display: flex; flex-direction: column; gap: 8px; }
.detail-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: #4b5563; }
.detail-label { font-weight: 500; color: #6b7280; }
.detail-value { font-weight: 600; color: #1f2937; }
.highlight-value { color: #0ea5e9; font-weight: 700; }
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 25px; }
.pagination-btn { padding: 6px 14px; font-size: 0.9rem; }
.page-info { font-weight: 600; color: #6b7280; }
.actions-header { margin-bottom: 15px; display: flex; justify-content: flex-end; }

/* Contract Menu */
.card-menu { position: absolute; top: 10px; right: 10px; z-index: 100; }
.menu-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #9ca3af; padding: 0 5px; line-height: 1; border-radius: 4px; }
.menu-btn:hover { background-color: #f3f4f6; color: #374151; }
.menu-dropdown { position: absolute; top: 100%; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 160px; overflow: hidden; animation: fadeIn 0.1s; }
.menu-item { display: block; width: 100%; text-align: left; padding: 10px 15px; background: none; border: none; font-size: 0.9rem; cursor: pointer; color: #374151; }
.menu-item:hover { background-color: #f9fafb; }
.menu-item-danger { color: #dc2626; }
.menu-item-danger:hover { background-color: #fef2f2; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s; }
.modal-card { background: white; padding: 25px; border-radius: 12px; width: 500px; max-width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideUp 0.3s; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }
.modal-header h3 { margin: 0; font-size: 1.25rem; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; }
.modal-body { display: flex; flex-direction: column; gap: 15px; }
.input-group { display: flex; gap: 10px; }
.currency-select { width: 100px; }
.form-row { display: flex; gap: 15px; }
.form-row .form-group { flex: 1; }
.modal-footer { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }


/* States */
.state-box { padding: 60px; text-align: center; color: #9ca3af; background: white; border-radius: 16px; border: 1px dashed #e5e7eb; margin: 40px; }
.clickable-card { cursor: pointer; transition: transform 0.2s; }
.clickable-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); border-color: #93c5fd; }
.btn-action { flex: 1; padding: 8px 0; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; font-size: 0.85rem; text-align: center; }
.approve { background: #dcfce7; color: #166534; } .approve:hover { background-color: #b0dfc0;}
.reject { background: #fee2e2; color: #991b1b; } .reject:hover { background-color: #ddafaf;}
.status-badge { font-size: 0.8rem; padding: 4px 10px; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
.status-pending { background: #fff7ed; color: #c2410c; }
.status-approved { background: #f0fdf4; color: #15803d; }
.status-rejected { background: #fef2f2; color: #b91c1c; }
.role-badge { font-size: 0.8rem; padding: 4px 10px; border-radius: 6px; font-weight: 600; text-transform: capitalize; border: 1px solid transparent; }
.role-admin { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }
.role-coach { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.role-staff { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.role-player { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }

@media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } .requests-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .page-container { padding: 15px; } .nav-header { flex-direction: column; align-items: stretch; gap: 10px; } .actions-group { width: 100%; justify-content: space-between; } .btn-primary, .btn-secondary, .btn-back { width: 100%; justify-content: center; } .cover-image { height: 180px; } .avatar-container { margin-top: -50px; width: 100px; height: 100px; } .club-title { font-size: 1.8rem; } .header-content { padding: 0 20px 20px; align-items: center; text-align: center; } .title-container { text-align: center; } .badges-row { justify-content: center; } .member-card { flex-direction: column; align-items: stretch; gap: 10px; } .member-actions { justify-content: space-between; width: 100%; min-width: 0; } .manage-buttons { margin-left: auto; } .req-actions { flex-direction: column; margin-top: 15px; width: 100%; align-items: stretch; } .request-card { flex-direction: column; align-items: flex-start; } .req-avatar { margin-bottom: 10px; } .req-info { width: 100%; } .contracts-grid { grid-template-columns: 1fr; } }
</style>