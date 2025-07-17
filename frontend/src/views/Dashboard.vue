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
const pagesPerView = 1;

// Text-to-speech functionality
const isSpeaking = ref(false);
const resumeWarning = ref("");
let currentUtterance: SpeechSynthesisUtterance | null = null;
const speechSynthesis = window.speechSynthesis;
const selectedVoice = ref<string>("");
const voices = ref<SpeechSynthesisVoice[]>([]);

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
  const text = getPages(viewingStorybook.value)[currentPage.value];
  if (!text) return;
  currentUtterance = new window.SpeechSynthesisUtterance(text);
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
  if (currentPage.value < pages.length - 1) {
    currentPage.value += 1;
  }
};
const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value -= 1;
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
</script>

<template>
  <div class="min-h-screen bg-primary-50 font-sans">
    <!-- Navigation -->
    <nav class="bg-white shadow-md border-b-4 border-primary-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <div class="flex items-center">
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

    <!-- Tabs -->
    <div class="max-w-3xl mx-auto mt-10 animate-fade-in">
      <div class="flex border-b-4 border-primary-300 mb-8">
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
    </div>

    <!-- Storybook Viewer Modal -->
    <div v-if="showViewer" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative flex flex-col items-center border-4 border-primary-300 animate-pop-in">
        <button @click="closeViewer" class="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 text-4xl font-bold leading-none">&times;</button>
        <div v-if="viewingStorybook?.image_url" class="mb-6 flex justify-center">
          <img :src="API_BASE_URL + viewingStorybook.image_url" alt="Storybook Cover Image" class="max-h-64 rounded-xl shadow-lg border-4 border-white" />
        </div>
        <div class="text-4xl font-bold text-primary-800 mb-4 text-center">{{ viewingStorybook?.title || viewingStorybook?.prompt || 'Untitled Story Scroll' }}</div>
        <div class="min-h-[180px] w-full flex flex-col items-center justify-center storybook-page-container">
          <div v-if="getPages(viewingStorybook)[currentPage]">
            <div v-if="viewingStorybook.images && viewingStorybook.images[currentPage]" class="mb-4 flex justify-center">
              <img :src="API_BASE_URL + viewingStorybook.images[currentPage]" alt="Page Illustration" class="max-h-60 rounded-lg shadow-md border-2 border-primary-100" />
            </div>
            <div class="text-center text-neutral-800 text-xl mb-4 leading-relaxed">{{ getPages(viewingStorybook)[currentPage] }}</div>
            <div class="w-full flex justify-center mb-4">
              <select v-model="selectedVoice" class="input-field text-center max-w-xs">
                <option v-for="voice in curatedVoices" :key="voice.name" :value="voice.name">
                  {{ voice.label }} ({{ voice.region }})
                </option>
              </select>
            </div>
            <div class="flex gap-4 justify-center mt-4">
              <button @click="playSpeech" :disabled="isSpeaking" class="btn-primary px-6 py-2 text-lg disabled:opacity-50">Play Story</button>
              <button @click="stopSpeech" :disabled="!isSpeaking" class="btn-secondary px-6 py-2 text-lg disabled:opacity-50">Stop Story</button>
            </div>
            <div v-if="resumeWarning" class="text-red-500 text-sm mt-2 text-center font-semibold">{{ resumeWarning }}</div>
          </div>
        </div>
        <div class="flex justify-between items-center w-full mt-6">
          <button @click="prevPage" :disabled="currentPage === 0" class="btn-secondary px-6 py-2 text-lg disabled:opacity-50">Previous Page</button>
          <span class="text-lg font-semibold text-neutral-600">Page {{ currentPage + 1 }} / {{ getPages(viewingStorybook).length || 1 }}</span>
          <button @click="nextPage" :disabled="currentPage >= (getPages(viewingStorybook).length - 1)" class="btn-secondary px-6 py-2 text-lg disabled:opacity-50">Next Page</button>
        </div>
      </div>
    </div>
  </div>
</template>
