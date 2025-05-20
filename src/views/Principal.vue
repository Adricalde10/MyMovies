<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonButtons,
  IonFooter,
  IonSpinner
} from '@ionic/vue';

import { filmOutline, personOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import supabase from '@/supabaseClient';

// Usuario desde query
const route = useRoute();
const userId = route.query.userId as string | undefined;

const router = useRouter();

//const { dataCurrentUSer: { user } } = await supabase.auth.getUser();

// Buscador
const searchText = ref('');

// Estado
const plays = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Estado admin
const isAdmin = ref(false);

const goToPlayInfo = (movie: any) => {
  router.push({
    path: '/infoPlay',
    query: { id: movie.id_play , userId: userId, }, // Passa l'ID de l'obra com a query parameter
  });
};
// Carga datos usuario para saber si es admin
const loadUserData = async () => {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (data) {
      isAdmin.value = data.is_admin || false;
    }
  } catch (error) {
    console.error('Error al cargar datos usuario:', error);
  }
};

// Carga de datos desde Supabase
const loadPlays = async () => {
  try {
    const { data, error } = await supabase
      .from('play')
      .select('*')
      .order('id_play', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      errorMessage.value = 'La tabla está vacía o no tienes permiso de lectura.';
    } else {
      plays.value = data;
    }
  } catch (error: any) {
    errorMessage.value = 'No se pudo cargar las obras.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadUserData();
  await loadPlays();
});

// Búsqueda
const filteredMovies = computed(() => {
  const query = searchText.value.toLowerCase();
  return plays.value.filter((movie) => {
    return (
      movie.title?.toLowerCase().includes(query) ||
      movie.characters?.toLowerCase().includes(query) ||
      movie.creator?.toLowerCase().includes(query)
    );
  });
});

// Paginación
const currentPage = ref(1);
const moviesPerPage = 6; // 3x3 grid
const totalPages = computed(() => Math.ceil(filteredMovies.value.length / moviesPerPage));

const currentMovies = computed(() => {
  const start = (currentPage.value - 1) * moviesPerPage;
  const end = start + moviesPerPage;
  return filteredMovies.value.slice(start, end);
});

const movieChunks = computed(() => {
  const chunks = [];
  for (let i = 0; i < currentMovies.value.length; i += 3) {
    chunks.push(currentMovies.value.slice(i, i + 3));
  }
  return chunks;
});

const goToPreviousPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
</script>

<template>
  <ion-page>
    <!-- HEADER -->
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="text-green-400 flex items-center space-x-2">
          <ion-icon :icon="filmOutline"></ion-icon>
          <span>Butaca1</span>
        </ion-title>

        <ion-buttons slot="end" class="space-x-2">
          <template v-if="userId">
            <ion-button :href="`/InfoFavourites?userId=${userId}`">
              <span class="text-white text-sm">Favorits</span>
            </ion-button>
            <ion-button v-if="isAdmin" :href="`/ManageContent?userId=${userId}`">
              <span class="text-white text-sm">Gestionar continguts</span>
            </ion-button>
          </template>
        </ion-buttons>

        <div class="px-4 pt-4">
          <ion-searchbar
            v-model="searchText"
            placeholder="Buscar obres o dramaturgs"
            mode="ios"
            color="light"
            class="searchbar-small"
          />
        </div>

        <ion-buttons slot="end">
          <template v-if="userId">
            <ion-button :href="`/infoUser?userId=${userId}`">
              <ion-icon :icon="personOutline" />
            </ion-button>
          </template>
          <template v-else>
            <ion-button href="/login">
              <span class="text-white text-sm">Iniciar Sesión </span>
            </ion-button>
            <ion-button href="/Register">
              <span class="text-white text-sm">Registro</span>
            </ion-button>
          </template>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- CONTENIDO -->
    <ion-content fullscreen class="ion-padding bg-gray-50 text-gray-900">
      <div v-if="isLoading" class="ion-text-center">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else>
        <h2 class="text-2xl font-bold mb-4">Descubreix Teatres</h2>

        <ion-grid>
          <template v-for="(chunk, rowIndex) in movieChunks" :key="rowIndex">
            <ion-row>
              <ion-col
                v-for="(movie, movieIndex) in chunk"
                :key="movieIndex"
                size="4"
              >
                <ion-card class="rounded-lg overflow-hidden shadow-md" @click="goToPlayInfo(movie)">
  <img :src="movie.page" :alt="movie.title" class="movie-image" />
  <ion-card-header>
    <ion-card-title class="text-sm font-bold">
      {{ movie.title }}
    </ion-card-title>
    <ion-card-subtitle class="text-xs text-gray-600">
      {{ movie.year }}
    </ion-card-subtitle>
  </ion-card-header>
</ion-card>
              </ion-col>
            </ion-row>
          </template>
        </ion-grid>

        <!-- PAGINACIÓN -->
        <ion-footer class="ion-no-border">
          <ion-toolbar color="dark">
            <ion-buttons slot="start">
              <ion-button :disabled="currentPage === 1" @click="goToPreviousPage">
                Anterior
              </ion-button>
            </ion-buttons>

            <ion-title>{{ currentPage }} / {{ totalPages }}</ion-title>

            <ion-buttons slot="end">
              <ion-button :disabled="currentPage === totalPages" @click="goToNextPage">
                Seguent
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-footer>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.movie-image {
  width: 100%;
  height: 500px;
  object-fit: cover;
}

.searchbar-small {
  max-width: 500px;
  width: 100%;
  margin-left: auto;
  margin-right: 1rem;
}
</style>
