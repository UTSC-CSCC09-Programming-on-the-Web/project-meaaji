<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth } from "../composables/useAuth";
import { useRouter } from "vue-router";

const { user, signOut, checkSubscriptionStatus } = useAuth();
const router = useRouter();

const prompt = ref("");
const image = ref<File | null>(null);
const isLoading = ref(false);
const error = ref("");
const generatedStorybook = ref<any | null>(null);
const storybooks = ref<any[]>([]);
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const activeTab = ref<'generate' | 'mybooks'>("generate");

const fetchStorybooks = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_BASE_URL}/api/storybooks`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      storybooks.value = data.storybooks;
    }
  } catch (e) {
    // ignore
  }
};

onMounted(async () => {
  const status = await checkSubscriptionStatus();
  if (!status?.hasActiveSubscription) {
    router.push("/subscribe");
    return;
  }
  await fetchStorybooks();
});

const handleFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    image.value = files[0];
  }
};

const generateStorybook = async () => {
  error.value = "";
  generatedStorybook.value = null;
  isLoading.value = true;
  try {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("prompt", prompt.value);
    if (image.value) formData.append("image", image.value);
    const res = await fetch(`${API_BASE_URL}/api/storybooks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to generate storybook");
    }
    const data = await res.json();
    generatedStorybook.value = data.storybook;
    await fetchStorybooks();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
};

// Storybook Viewer Modal Logic
const showViewer = ref(false);
const viewingStorybook = ref<any | null>(null);
const currentPage = ref(0);
const pagesPerView = 2;

const openViewer = (sb: any) => {
  viewingStorybook.value = sb;
  currentPage.value = 0;
  showViewer.value = true;
};
const closeViewer = () => {
  showViewer.value = false;
  viewingStorybook.value = null;
  currentPage.value = 0;
};
const nextPage = () => {
  const pages = getPages(viewingStorybook.value);
  if (currentPage.value < pages.length - pagesPerView) {
    currentPage.value += pagesPerView;
  }
};
const prevPage = () => {
  if (currentPage.value >= pagesPerView) {
    currentPage.value -= pagesPerView;
  }
};

const deleteStorybook = async (id: number) => {
  const token = localStorage.getItem("auth_token");
  await fetch(`${API_BASE_URL}/api/storybooks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  await fetchStorybooks();
};
const deleteAllStorybooks = async () => {
  const token = localStorage.getItem("auth_token");
  await fetch(`${API_BASE_URL}/api/storybooks`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  await fetchStorybooks();
};
// Fallback: split story into pages by every 2 sentences if only one page
const getPages = (sb: any) => {
  if (!sb.pages || sb.pages.length === 0) return [];
  if (sb.pages.length === 1) {
    // Split by every 2 sentences
    const sentences = sb.pages[0].match(/[^.!?]+[.!?]+/g) || [sb.pages[0]];
    const pages = [];
    for (let i = 0; i < sentences.length; i += 2) {
      pages.push(sentences.slice(i, i + 2).join(" ").trim());
    }
    return pages;
  }
  return sb.pages;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span class="ml-2 text-xl font-semibold text-gray-900">Draw2Play</span>
            <span class="ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active Subscription
            </span>
          </div>
          <div class="flex items-center space-x-4">
            <div v-if="user" class="flex items-center space-x-3">
              <img :src="user.picture" :alt="user.name" class="h-8 w-8 rounded-full" />
              <span class="text-sm font-medium text-gray-700">{{ user.name }}</span>
            </div>
            <button @click="signOut" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign out</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Tabs -->
    <div class="max-w-2xl mx-auto mt-8">
      <div class="flex border-b mb-6">
        <button
          class="px-4 py-2 font-semibold focus:outline-none"
          :class="activeTab === 'generate' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-500'"
          @click="activeTab = 'generate'"
        >
          Generate Storybook
        </button>
        <button
          class="ml-4 px-4 py-2 font-semibold focus:outline-none"
          :class="activeTab === 'mybooks' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-500'"
          @click="activeTab = 'mybooks'"
        >
          My Storybooks
        </button>
      </div>

      <!-- Tab 1: Generator -->
      <div v-if="activeTab === 'generate'">
        <div class="card p-8 flex flex-col items-center space-y-6 w-full">
          <div class="text-3xl font-bold text-gray-900 mb-2">Create a Storybook</div>
          <div class="w-full flex flex-col space-y-4">
            <input
              v-model="prompt"
              type="text"
              placeholder="Enter your story prompt..."
              class="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              :disabled="isLoading"
            />
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="w-full"
              :disabled="isLoading"
            />
            <button
              @click="generateStorybook"
              :disabled="isLoading || !prompt"
              class="btn-primary w-full py-3 text-lg font-semibold flex items-center justify-center"
            >
              <span v-if="isLoading" class="animate-spin mr-2 h-5 w-5 border-2 border-t-2 border-gray-200 border-t-primary-600 rounded-full"></span>
              <span>{{ isLoading ? 'Generating...' : 'Generate Storybook' }}</span>
            </button>
            <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
          </div>

          <!-- Generated Storybook -->
          <div v-if="generatedStorybook" class="w-full mt-8 bg-white rounded shadow p-6">
            <div class="text-xl font-bold mb-2">Your Storybook</div>
            <div v-if="generatedStorybook.image_url" class="mb-4 flex justify-center">
              <img :src="API_BASE_URL + generatedStorybook.image_url" alt="Storybook Image" class="max-h-48 rounded" />
            </div>
            <ol class="list-decimal pl-6 space-y-2">
              <li v-for="(page, idx) in getPages(generatedStorybook)" :key="idx" class="text-gray-800">
                <div v-if="generatedStorybook.images && generatedStorybook.images[idx]">
                  <img :src="API_BASE_URL + generatedStorybook.images[idx]" alt="Page Image" class="max-h-48 rounded mb-2" />
                </div>
                {{ page }}
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Tab 2: My Storybooks -->
      <div v-if="activeTab === 'mybooks'">
        <div class="card p-8 flex flex-col items-center space-y-6 w-full">
          <div class="flex w-full justify-between items-center mb-2">
            <div class="text-2xl font-bold text-gray-900">My Storybooks</div>
            <button v-if="storybooks.length" @click="deleteAllStorybooks" class="btn-secondary px-4 py-2 text-sm font-semibold">Delete All</button>
          </div>
          <div v-if="!storybooks.length" class="text-gray-500">No storybooks yet.</div>
          <div v-else class="w-full space-y-4">
            <div v-for="sb in storybooks" :key="sb.id" class="flex items-center justify-between bg-gray-100 rounded p-4">
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-lg truncate max-w-xs">
                  {{ sb.title || sb.prompt || 'Untitled Storybook' }}
                </div>
                <div class="text-xs text-gray-500 truncate max-w-xs mt-1">{{ getPages(sb)[0] }}</div>
              </div>
              <div class="flex items-center space-x-2">
                <button @click="openViewer(sb)" class="btn-primary px-4 py-2 text-sm font-semibold">View</button>
                <button @click="deleteStorybook(sb.id)" class="btn-danger px-4 py-2 text-sm font-semibold">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Storybook Viewer Modal -->
    <div v-if="showViewer" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative flex flex-col items-center">
        <button @click="closeViewer" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
        <div v-if="viewingStorybook?.image_url" class="mb-4 flex justify-center">
          <img :src="API_BASE_URL + viewingStorybook.image_url" alt="Storybook Image" class="max-h-48 rounded" />
        </div>
        <div class="text-xl font-bold mb-2 text-center">{{ viewingStorybook?.title || viewingStorybook?.prompt || 'Untitled Storybook' }}</div>
        <div class="min-h-[120px] w-full flex flex-col items-center justify-center">
          <div
            v-for="(page, idx) in getPages(viewingStorybook).slice(currentPage, currentPage + pagesPerView)"
            :key="currentPage + idx"
          >
            <div v-if="viewingStorybook.images && viewingStorybook.images[currentPage + idx]">
              <img :src="API_BASE_URL + viewingStorybook.images[currentPage + idx]" alt="Page Image" class="max-h-48 rounded mb-2 mx-auto" />
            </div>
            {{ page }}
          </div>
        </div>
        <div class="flex justify-between items-center w-full mt-4">
          <button @click="prevPage" :disabled="currentPage === 0" class="btn-secondary px-4 py-2 rounded disabled:opacity-50">Previous</button>
          <span class="text-sm text-gray-500">Page {{ Math.floor(currentPage / pagesPerView) + 1 }} / {{ Math.ceil((getPages(viewingStorybook).length || 1) / pagesPerView) }}</span>
          <button @click="nextPage" :disabled="currentPage + pagesPerView >= (getPages(viewingStorybook).length || 0)" class="btn-secondary px-4 py-2 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>
