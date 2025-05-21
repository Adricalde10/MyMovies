<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark" class="toolbar-layout">
        <ion-title class="title-aligned flex items-center space-x-2 text-green-400">
          <ion-icon :icon="filmOutline" class="w-5 h-5"></ion-icon>
          <span>Butaca1</span>
        </ion-title>

        <ion-buttons slot="end" class="buttons-right">
          <template v-if="userId">
            <ion-button :href="`/InfoFavourites?userId=${userId}`" size="small">
              <span class="text-white text-sm">Favorits</span>
            </ion-button>
            <ion-button v-if="isAdmin" :href="`/ManageContent?userId=${userId}`" size="small">
              <span class="text-white text-sm">Gestionar continguts</span>
            </ion-button>
          </template>
          <template v-else>
            <ion-button href="/login" size="small">
              <span class="text-white text-sm">Iniciar Sessió </span>
            </ion-button>
            <ion-button href="/Register" size="small">
              <span class="text-white text-sm">Registre</span>
            </ion-button>
          </template>
        </ion-buttons>

        <div class="searchbar-container">
          <ion-searchbar
            v-model="searchText"
            placeholder="Buscar obres o dramaturgs"
            mode="ios"
            color="light"
            class="searchbar-centered"
          />
        </div>

        <ion-buttons slot="end" v-if="userId">
          <ion-button :href="`/infoUser?userId=${userId}`" size="small">
            <ion-icon :icon="personOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding bg-gray-50 text-gray-900">
      <div v-if="isLoading" class="ion-text-center">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else>
        <h2 class="text-2xl font-bold mb-4">Descobreix Teatres</h2>

        <ion-grid>
          <ion-row>
            <ion-col
              v-for="(movie, movieIndex) in currentMovies"
              :key="movieIndex"
              :size-xs="12"
              :size-sm="6"
              :size-md="4"
            >
              <ion-card class="rounded-lg overflow-hidden shadow-md" @click="goToPlayInfo(movie)">
                <img :src="movie.page" :alt="movie.title" class="movie-image" />
                <ion-card-header>
                  <ion-card-title class="text-sm font-bold">{{ movie.title }}</ion-card-title>
                  <ion-card-subtitle class="text-xs text-gray-600">{{ movie.year }}</ion-card-subtitle>
                </ion-card-header>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

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
import { useRoute, useRouter } from 'vue-router';
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
    query: { id: movie.id_play, userId: userId }, // Passa l'ID de l'obra com a query parameter
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
const moviesPerPage = computed(() => {
  const width = window.innerWidth;
  if (width < 600) {
    return 1; // 1 columna en pantalles molt petites
  } else if (width < 960) {
    return 2; // 2 columnes en pantalles petites
  } else {
    return 6; // 3 columnes en pantalles mitjanes i grans
  }
});
const totalPages = computed(() => Math.ceil(filteredMovies.value.length / moviesPerPage.value));

const currentMovies = computed(() => {
  const start = (currentPage.value - 1) * moviesPerPage.value;
  const end = start + moviesPerPage.value;
  return filteredMovies.value.slice(start, end);
});

const movieChunks = computed(() => {
  const chunks = [];
  for (let i = 0; i < currentMovies.value.length; i += moviesPerPage.value) {
    chunks.push(currentMovies.value.slice(i, i + moviesPerPage.value));
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

<style scoped>
.movie-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.searchbar-small {
  max-width: 500px;
  width: 100%;
  margin-left: auto;
  margin-right: 1rem;
}

.searchbar-centered {
  max-width: 100%;
  margin: 0 auto;
}

.toolbar-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-wrap: wrap;
}

.toolbar-layout > * {
  margin: 4px 0;
}

.searchbar-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

.buttons-right {
  display: flex;
  align-items: center;
}

.buttons-right ion-button {
  margin-left: 4px;
}

.title-aligned {
  flex-grow: 0;
}

/* Ajusta la mida de la imatge en pantalles més petites */
@media (max-width: 600px) {
  .movie-image {
    height: 300px;
  }
}

@media (max-width: 400px) {
  .movie-image {
    height: 200px;
  }
}
</style>
