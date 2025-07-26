<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth } from "../composables/useAuth";
import { useRouter } from "vue-router";

const { user, signOut, checkSubscriptionStatus } = useAuth();
const router = useRouter();

const title = ref("");
const prompt = ref("");
const image = ref<File | null>(null);
const isLoading = ref(false);
const error = ref("");
const generatedStorybook = ref<any | null>(null);
const storybooks = ref<any[]>([]);
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// State to manage active tab in the main content area
const activeTab = ref<'generate' | 'mybooks' | 'newFeature'>("generate");
// State to manage sidebar visibility
const isSidebarOpen = ref(false);

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
    formData.append("title", title.value);
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
      console.log("[generateStorybook] Storybook generation failed:", data);
      throw new Error(data.error || "Failed storybook");
    }
    const data = await res.json();
    console.log("[generateStorybook] Storybook generated:", data);
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
const pagesPerView = 1;

// Text-to-speech functionality
const isSpeaking = ref(false);
const resumeWarning = ref("");
let currentUtterance: SpeechSynthesisUtterance | null = null;
const speechSynthesis = window.speechSynthesis;
const selectedVoice = ref<string>("");
const voices = ref<SpeechSynthesisVoice[]>([]);
const selectedPageMode = ref<'both' | 'left' | 'right'>('both');

const curatedVoiceList = [
  { name: 'Google US English', label: 'Google US English', region: 'USA' },
  { name: 'Microsoft Aria Online (Natural) - English (United States)', label: 'Microsoft Aria (Natural)', region: 'USA' },
  { name: 'Microsoft Guy Online (Natural) - English (United States)', label: 'Microsoft Guy (Natural)', region: 'USA' },
  { name: 'Google UK English Female', label: 'Google UK English Female', region: 'Britain' },
  { name: 'Google UK English Male', label: 'Google UK English Male', region: 'Britain' },
  { name: 'Samantha', label: 'Samantha', region: 'USA' },
  { name: 'Daniel', label: 'Daniel', region: 'Britain' },
];

const curatedVoices = ref<{ name: string; label: string; region: string; voice: SpeechSynthesisVoice }[]>([]);

function loadVoices() {
  const allVoices = speechSynthesis.getVoices();
  // Only keep curated voices if available
  curatedVoices.value = curatedVoiceList
    .map(cv => {
      const match = allVoices.find(v => v.name === cv.name);
      return match ? { ...cv, voice: match } : null;
    })
    .filter(Boolean) as { name: string; label: string; region: string; voice: SpeechSynthesisVoice }[];
  // Default to first available curated voice
  if (!selectedVoice.value && curatedVoices.value.length) {
    selectedVoice.value = curatedVoices.value[0].name;
  }
}

if (typeof window !== 'undefined' && speechSynthesis) {
  loadVoices();
  if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function playSpeech() {
  stopSpeech();
  
  let textToRead = "";
  
  if (currentPage.value === 0) {
    // On cover page, read the title
    textToRead = viewingStorybook.value?.title || viewingStorybook.value?.prompt || 'Magical Story';
  } else {
    // On story pages, read based on selected mode
    const pages = getPages(viewingStorybook.value);
    const leftPageIndex = currentPage.value - 1;
    const rightPageIndex = currentPage.value;
    
    if (selectedPageMode.value === 'both' || selectedPageMode.value === 'left') {
      if (pages[leftPageIndex]) {
        textToRead += pages[leftPageIndex];
      }
    }
    
    if (selectedPageMode.value === 'both' || selectedPageMode.value === 'right') {
      if (pages[rightPageIndex]) {
        if (textToRead) textToRead += " ";
        textToRead += pages[rightPageIndex];
      }
    }
  }
  
  if (!textToRead) return;
  
  currentUtterance = new window.SpeechSynthesisUtterance(textToRead);
  // Set selected curated voice
  const voiceObj = curatedVoices.value.find(v => v.name === selectedVoice.value);
  if (voiceObj) currentUtterance.voice = voiceObj.voice;
  isSpeaking.value = true;
  currentUtterance.onend = () => {
    isSpeaking.value = false;
  };
  currentUtterance.onerror = () => {
    isSpeaking.value = false;
  };
  speechSynthesis.speak(currentUtterance);
}

function stopSpeech() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  isSpeaking.value = false;
}

// Stop speech when changing page or closing viewer
watch(currentPage, () => stopSpeech());
watch(showViewer, (val) => { if (!val) stopSpeech(); });

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
  if (currentPage.value === 0) {
    currentPage.value = 1;
  } else if (currentPage.value + 1 < pages.length) {
    currentPage.value += 2; // Skip by 2 for double-page spread
  }
};
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 2; // Go back by 2 for double-page spread
  } else if (currentPage.value === 1) {
    currentPage.value = 0; // Go back to cover
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
// Get pages from storybook, with fallback for legacy data
const getPages = (sb: any) => {
  if (!sb.pages || sb.pages.length === 0) return [];

  // If pages is already an array, return it
  if (Array.isArray(sb.pages)) {
    return sb.pages;
  }

  // Fallback: if pages is a string, split by sentences
  if (typeof sb.pages === 'string') {
    const sentences = sb.pages.match(/[^.!?]+[.!?]+/g) || [sb.pages];
    return sentences.map((s: string) => s.trim()).filter(Boolean);
  }

  return [];
};

// Function to toggle sidebar visibility
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Close sidebar when activeTab changes
watch(activeTab, () => {
  isSidebarOpen.value = false;
});
</script>

<template>
  <div class="min-h-screen bg-primary-50 font-sans">
    <!-- Sidebar Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
      @click="toggleSidebar"
    ></div>

    <!-- Sidebar -->
    <div
      :class="{ 'translate-x-0': isSidebarOpen, '-translate-x-full': !isSidebarOpen }"
      class="fixed inset-y-0 left-0 w-64 bg-primary-700 text-white p-6 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col rounded-r-2xl"
    >
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-3xl font-bold text-white">Menu</h2>
        <button @click="toggleSidebar" class="text-white hover:text-primary-200 focus:outline-none text-4xl leading-none">
          &times;
        </button>
      </div>
      <nav class="flex-1 space-y-4">
        <button
          @click="activeTab = 'generate'"
          :class="{ 'bg-primary-600 text-white shadow-lg': activeTab === 'generate', 'text-primary-100 hover:bg-primary-600 hover:text-white': activeTab !== 'generate' }"
          class="w-full text-left px-4 py-3 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center gap-3"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-3.31 0-6 2.69-6 6 0 2.45 1.76 4.47 4.08 4.92L12 22l1.92-9.08C16.24 12.47 18 10.45 18 8c0-3.31-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
          Create Tale
        </button>
        <button
          @click="activeTab = 'mybooks'"
          :class="{ 'bg-primary-600 text-white shadow-lg': activeTab === 'mybooks', 'text-primary-100 hover:bg-primary-600 hover:text-white': activeTab !== 'mybooks' }"
          class="w-full text-left px-4 py-3 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center gap-3"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v2H9V4zm4 0h2v2h-2V4zM9 8h2v2H9V8zm4 0h2v2h-2V8zM9 12h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/></svg>
          My Story Scrolls
        </button>
        <button
          @click="activeTab = 'newFeature'"
          :class="{ 'bg-primary-600 text-white shadow-lg': activeTab === 'newFeature', 'text-primary-100 hover:bg-primary-600 hover:text-white': activeTab !== 'newFeature' }"
          class="w-full text-left px-4 py-3 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center gap-3"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          New Magic!
        </button>
      </nav>
      <div class="mt-8">
        <button @click="signOut" class="w-full text-left px-4 py-3 rounded-xl font-semibold text-lg text-primary-100 hover:bg-primary-600 hover:text-white transition-colors duration-200 flex items-center gap-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          Fly Away!
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div :class="{ 'ml-64': isSidebarOpen }" class="transition-all duration-300 ease-in-out">
      <!-- Navigation -->
      <nav class="bg-white shadow-md border-b-4 border-primary-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-20">
            <div class="flex items-center">
              <!-- Hamburger menu icon, visible only on Dashboard and New Feature page -->
              <button
                v-if="activeTab === 'generate' || activeTab === 'mybooks' || activeTab === 'newFeature'"
                @click="toggleSidebar"
                class="mr-4 text-primary-600 hover:text-primary-800 focus:outline-none transition-colors duration-200 animate-wiggle"
              >
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>

              <div class="h-12 w-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg animate-pop-in">
                <!-- Friendly app icon -->
                <svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c-3.31 0-6 2.69-6 6 0 2.45 1.76 4.47 4.08 4.92L12 22l1.92-9.08C16.24 12.47 18 10.45 18 8c0-3.31-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                </svg>
              </div>
              <span class="ml-3 text-3xl font-bold text-primary-700">Draw2Play!</span>
              <span class="ml-4 px-3 py-1 text-sm font-bold bg-accent-200 text-accent-800 rounded-full shadow-sm animate-wiggle">
                Magic Pass Active!
              </span>
            </div>
            <div class="flex items-center space-x-4">
              <div v-if="user" class="flex items-center space-x-3">
                <img :src="user.picture" :alt="user.name" class="h-10 w-10 rounded-full border-2 border-primary-300 shadow-md" />
                <span class="text-lg font-semibold text-neutral-700">{{ user.name }}</span>
              </div>
              <button @click="signOut" class="text-base text-neutral-600 hover:text-primary-700 transition-colors font-semibold">Fly Away!</button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main content area based on activeTab -->
      <div class="max-w-3xl mx-auto mt-10 animate-fade-in">
        <!-- Conditional rendering for the tab navigation -->
        <div v-if="activeTab === 'generate' || activeTab === 'mybooks'" class="flex border-b-4 border-primary-300 mb-8">
          <button
            class="flex-1 px-6 py-4 font-bold text-xl rounded-t-xl transition-all duration-300 ease-in-out focus:outline-none"
            :class="activeTab === 'generate' ? 'bg-white text-primary-700 border-x-2 border-t-2 border-primary-300 -mb-1 shadow-lg' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'"
            @click="activeTab = 'generate'"
          >
            Create a New Tale
          </button>
          <button
            class="flex-1 ml-2 px-6 py-4 font-bold text-xl rounded-t-xl transition-all duration-300 ease-in-out focus:outline-none"
            :class="activeTab === 'mybooks' ? 'bg-white text-primary-700 border-x-2 border-t-2 border-primary-300 -mb-1 shadow-lg' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'"
            @click="activeTab = 'mybooks'"
          >
            My Story Scrolls
          </button>
        </div>

        <!-- Tab 1: Generator -->
        <div v-if="activeTab === 'generate'">
          <div class="card p-10 flex flex-col items-center space-y-8 w-full animate-slide-up">
            <div class="text-4xl font-bold text-primary-800 mb-4 text-center">Let's Craft a Story!</div>
            <div class="w-full flex flex-col space-y-6">
              <input
                v-model="title"
                type="text"
                placeholder="Story Title (e.g. The Brave Little Fox)"
                class="input-field"
                :disabled="isLoading"
                maxlength="100"
                required
              />
              <input
                v-model="prompt"
                type="text"
                placeholder="What magical adventure should we create today?"
                class="input-field"
                :disabled="isLoading"
              />
              <label class="block">
                <span class="sr-only">Choose a picture</span>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFileChange"
                  class="block w-full text-sm text-neutral-500
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-secondary-200 file:text-secondary-800
                    hover:file:bg-secondary-300
                    transition-colors duration-200 ease-in-out
                    cursor-pointer"
                  :disabled="isLoading"
                />
              </label>

              <button
                @click="generateStorybook"
                :disabled="isLoading || !prompt"
                class="btn-primary w-full py-4 text-2xl font-bold flex items-center justify-center"
              >
                <span v-if="isLoading" class="loading-spinner mr-3"></span>
                <span>{{ isLoading ? 'Spinning a Yarn...' : 'Make My Story!' }}</span>
              </button>
              <div v-if="error" class="text-red-500 text-sm text-center font-semibold">{{ error }}</div>
            </div>

            <!-- Generated Storybook Preview -->
            <div v-if="generatedStorybook" class="w-full mt-8 bg-primary-50 rounded-2xl shadow-inner p-8 border-2 border-primary-200 animate-pop-in">
              <div class="text-3xl font-bold text-primary-700 mb-4 text-center">{{ generatedStorybook.title || 'Your Brand New Story!' }}</div>
              <div v-if="generatedStorybook.image_url" class="mb-6 flex justify-center">
                <img :src="API_BASE_URL + generatedStorybook.image_url" alt="Storybook Cover Image" class="max-h-64 rounded-xl shadow-lg border-4 border-white transform hover:scale-105 transition-transform duration-300" />
              </div>
              <ol class="list-decimal pl-8 space-y-4">
                <li v-for="(page, idx) in getPages(generatedStorybook)" :key="idx" class="text-neutral-800 text-lg leading-relaxed bg-white p-4 rounded-lg shadow-sm border border-neutral-100 animate-slide-up">
                  <div v-if="generatedStorybook.images && generatedStorybook.images[idx]" class="mb-3 flex justify-center">
                    <img :src="API_BASE_URL + generatedStorybook.images[idx]" alt="Page Illustration" class="max-h-48 rounded-lg shadow-md border-2 border-neutral-100" />
                  </div>
                  {{ page }}
                </li>
              </ol>
            </div>
          </div>
        </div>

        <!-- Tab 2: My Storybooks -->
        <div v-if="activeTab === 'mybooks'">
          <div class="card p-10 flex flex-col items-center space-y-8 w-full animate-slide-up">
            <div class="flex w-full justify-between items-center mb-4">
              <div class="text-3xl font-bold text-primary-800">My Magical Library</div>
              <button v-if="storybooks.length" @click="deleteAllStorybooks" class="btn-danger px-5 py-2 text-base font-semibold">Clear All Scrolls</button>
            </div>
            <div v-if="!storybooks.length" class="text-neutral-500 text-lg font-semibold">No story scrolls here yet. Let's make some!</div>
            <div v-else class="w-full space-y-4">
              <div v-for="sb in storybooks" :key="sb.id" class="flex items-center justify-between bg-secondary-50 rounded-xl p-5 shadow-md border border-secondary-200 transform hover:scale-[1.01] transition-transform duration-200">
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-xl truncate max-w-xs text-primary-700">
                    {{ sb.title || sb.prompt || 'Untitled Story Scroll' }}
                  </div>
                  <div class="text-sm text-neutral-500 truncate max-w-xs mt-1">{{ getPages(sb)[0] }}</div>
                </div>
                <div class="flex items-center space-x-3">
                  <button @click="openViewer(sb)" class="btn-primary px-5 py-2 text-base font-semibold">Read Aloud</button>
                  <button @click="deleteStorybook(sb.id)" class="btn-danger px-5 py-2 text-base font-semibold">Tear Up</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: New Feature Page (Blank for now) -->
        <div v-if="activeTab === 'newFeature'">
          <div class="card p-10 flex flex-col items-center justify-center space-y-8 w-full animate-slide-up min-h-[400px]">
            <div class="text-4xl font-bold text-primary-800 mb-4 text-center">A New Magic Realm!</div>
            <p class="text-xl text-neutral-600 text-center">This page is ready for new adventures to be built!</p>
            <img src="https://placehold.co/300x200/ADD8E6/000000?text=Coming+Soon!" alt="Coming Soon Placeholder" class="rounded-xl shadow-lg border-4 border-white animate-pulse-grow" />
          </div>
        </div>
      </div>

      <!-- Enhanced Storybook Viewer Modal -->
      <div v-if="showViewer" class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 backdrop-blur-sm p-4 animate-fade-in">
        <!-- Magical floating particles background -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div v-for="i in 20" :key="i" 
               class="absolute animate-float-slow bg-white rounded-full opacity-20"
               :style="{
                 left: Math.random() * 100 + '%',
                 top: Math.random() * 100 + '%',
                 width: (Math.random() * 8 + 4) + 'px',
                 height: (Math.random() * 8 + 4) + 'px',
                 animationDelay: Math.random() * 3 + 's',
                 animationDuration: (Math.random() * 4 + 6) + 's'
               }">
          </div>
        </div>
        
        <!-- Main Storybook Container -->
        <div class="relative max-w-6xl w-full h-[90vh] flex items-center justify-center">
          <!-- Close Button -->
          <button 
            @click="closeViewer" 
            class="absolute top-4 right-4 z-10 w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all duration-300 text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110"
          >
            ×
          </button>

          <!-- Book Container -->
          <div class="book-container relative">
            <!-- Book Spine/Shadow -->
            <div class="absolute -inset-2 bg-gradient-to-r from-amber-800 to-amber-600 rounded-2xl transform rotate-1 opacity-60"></div>
            
            <!-- Main Book -->
            <div class="book relative bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-2xl border-8 border-amber-200 overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
              
              <!-- Book Cover (shown on first page) -->
              <div v-if="currentPage === 0" class="book-page cover-page">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 opacity-90"></div>
                <div class="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
                  <!-- Cover Image -->
                  <div v-if="viewingStorybook?.image_url" class="mb-8 relative">
                    <div class="absolute -inset-4 bg-white bg-opacity-50 rounded-3xl blur-xl"></div>
                    <img 
                      :src="API_BASE_URL + viewingStorybook.image_url" 
                      alt="Storybook Cover" 
                      class="relative max-h-64 w-auto rounded-2xl shadow-2xl border-4 border-white transform hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  
                  <!-- Title -->
                  <h1 class="text-5xl font-bold text-white mb-4 drop-shadow-lg leading-tight">
                    {{ viewingStorybook?.title || viewingStorybook?.prompt || 'Magical Story' }}
                  </h1>
                  
                  <!-- Subtitle -->
                  <p class="text-xl text-white opacity-90 mb-8 drop-shadow-md">A Draw2Play Adventure</p>
                  
                  <!-- Start Reading Button -->
                  <button 
                    @click="nextPage"
                    class="px-8 py-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-purple-700 font-bold text-xl rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-4 border-purple-200"
                  >
                    Start Reading! 📖
                  </button>
                </div>
              </div>

              <!-- Story Pages -->
              <div v-else class="book-page story-page">
                <div class="h-full flex">
                  <!-- Left Page (even pages) -->
                  <div class="page-half left-page">
                    <div class="page-content">
                      <!-- Page Image -->
                      <div v-if="viewingStorybook.images && viewingStorybook.images[currentPage - 1]" class="page-image-container mb-6">
                        <img 
                          :src="API_BASE_URL + viewingStorybook.images[currentPage - 1]" 
                          alt="Story Illustration" 
                          class="page-illustration"
                        />
                      </div>
                      
                      <!-- Page Text -->
                      <div class="page-text">
                        {{ getPages(viewingStorybook)[currentPage - 1] }}
                      </div>
                      
                      <!-- Page Number -->
                      <div class="page-number left">{{ currentPage }}</div>
                    </div>
                  </div>

                  <!-- Book Spine -->
                  <div class="book-spine"></div>

                  <!-- Right Page (odd pages) -->
                  <div class="page-half right-page">
                    <div class="page-content" v-if="currentPage < getPages(viewingStorybook).length">
                      <!-- Page Image -->
                      <div v-if="viewingStorybook.images && viewingStorybook.images[currentPage]" class="page-image-container mb-6">
                        <img 
                          :src="API_BASE_URL + viewingStorybook.images[currentPage]" 
                          alt="Story Illustration" 
                          class="page-illustration"
                        />
                      </div>
                      
                      <!-- Page Text -->
                      <div class="page-text">
                        {{ getPages(viewingStorybook)[currentPage] }}
                      </div>
                      
                      <!-- Page Number -->
                      <div class="page-number right">{{ currentPage + 1 }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Controls -->
          <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
            <!-- Previous Page -->
            <button 
              @click="prevPage" 
              :disabled="currentPage === 0"
              class="nav-button prev-button"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === 0 }"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span class="ml-2">Previous</span>
            </button>

            <!-- Audio Controls -->
            <div class="flex items-center space-x-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-6 py-3">
              <!-- Voice Selection -->
              <select v-model="selectedVoice" class="bg-transparent text-white text-sm font-semibold focus:outline-none border-r border-white border-opacity-30 pr-3">
                <option v-for="voice in curatedVoices" :key="voice.name" :value="voice.name" class="text-gray-800">
                  {{ voice.label }}
                </option>
              </select>
              
              <!-- Page Mode Selection (only show on story pages) -->
              <select v-if="currentPage > 0" v-model="selectedPageMode" class="bg-transparent text-white text-sm font-semibold focus:outline-none border-r border-white border-opacity-30 pr-3">
                <option value="both" class="text-gray-800">Both Pages</option>
                <option value="left" class="text-gray-800">Left Page</option>
                <option value="right" class="text-gray-800">Right Page</option>
              </select>
              
              <!-- Play/Stop Buttons -->
              <button 
                @click="playSpeech" 
                :disabled="isSpeaking"
                class="audio-button play-button"
                :class="{ 'opacity-50': isSpeaking }"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              
              <button 
                @click="stopSpeech" 
                :disabled="!isSpeaking"
                class="audio-button stop-button"
                :class="{ 'opacity-50': !isSpeaking }"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              </button>
            </div>

            <!-- Next Page -->
            <button 
              @click="nextPage" 
              :disabled="currentPage === 0 ? false : currentPage + 1 >= getPages(viewingStorybook).length"
              class="nav-button next-button"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === 0 ? false : currentPage + 1 >= getPages(viewingStorybook).length }"
            >
              <span class="mr-2">Next</span>
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>

          <!-- Page Progress Indicator -->
          <div class="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-6 py-2">
            <div class="text-white text-sm font-semibold">
              Page {{ currentPage }} of {{ getPages(viewingStorybook).length || 1 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Book Container Styles */
.book-container {
  perspective: 1000px;
}

.book {
  width: 800px;
  height: 600px;
  max-width: 90vw;
  max-height: 70vh;
  transform-style: preserve-3d;
}

.book-page {
  width: 100%;
  height: 100%;
  position: relative;
}

.cover-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-page {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  padding: 0;
}

.page-half {
  width: 50%;
  height: 100%;
  position: relative;
}

.left-page {
  border-right: 1px solid #d97706;
}

.right-page {
  border-left: 1px solid #d97706;
}

.book-spine {
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, #92400e, #d97706, #92400e);
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  z-index: 10;
}

.page-content {
  padding: 40px 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-image-container {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-illustration {
  max-height: 200px;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid white;
  object-fit: cover;
}

.page-text {
  flex: 1;
  font-size: 18px;
  line-height: 1.8;
  color: #374151;
  text-align: justify;
  font-weight: 500;
  display: flex;
  align-items: center;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.page-number {
  position: absolute;
  bottom: 20px;
  font-size: 14px;
  font-weight: bold;
  color: #92400e;
}

.page-number.left {
  left: 30px;
}

.page-number.right {
  right: 30px;
}

/* Navigation Buttons */
.nav-button {
  @apply flex items-center px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-opacity-30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105;
}

.audio-button {
  @apply w-10 h-10 bg-white bg-opacity-30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-opacity-40 transition-all duration-300 transform hover:scale-110;
}

/* Animations */
@keyframes float-slow {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-float-slow {
  animation: float-slow 6s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

/* Responsive Design */
@media (max-width: 768px) {
  .book {
    width: 95vw;
    height: 70vh;
  }
  
  .page-content {
    padding: 20px 15px;
  }
  
  .page-text {
    font-size: 16px;
  }
  
  .page-illustration {
    max-height: 150px;
  }
  
  .nav-button {
    @apply px-4 py-2 text-sm;
  }
}

@media (max-width: 480px) {
  .book {
    height: 60vh;
  }
  
  .page-text {
    font-size: 14px;
    line-height: 1.6;
  }
  
  .page-illustration {
    max-height: 120px;
  }
}
</style>