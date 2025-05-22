<template>
  <!-- Menú lateral para móviles -->
  <ion-menu content-id="main-content" side="start" menu-id="main-menu">
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>Menú</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-if="realUserId" :router-link="`/InfoFavourites?userId=${realUserId}`">Favorits</ion-item>
        <ion-item v-if="realUserId && isAdmin" :router-link="`/ManageContent?userId=${realUserId}`">Gestionar Continguts</ion-item>
        <ion-item v-if="realUserId" :router-link="`/infoUser?userId=${realUserId}`">Perfil</ion-item>
        <ion-item v-if="!realUserId" router-link="/login">Iniciar Sessió</ion-item>
        <ion-item v-if="!realUserId" router-link="/Register">Registre</ion-item>
      </ion-list>
    </ion-content>
  </ion-menu>

  <ion-page id="main-content">
    <ion-header translucent>
      <ion-toolbar color="dark" class="toolbar-layout">
        <ion-buttons slot="start" class="menu-button-mobile">
          <ion-menu-button />
        </ion-buttons>

        <ion-title class="title-aligned flex items-center space-x-2 text-green-400">
          <ion-icon :icon="filmOutline" class="icon-film"></ion-icon>
          <span>Butaca1</span>
        </ion-title>

        <ion-buttons slot="end" class="buttons-desktop buttons-right">
          <template v-if="realUserId">
            <ion-button :href="`/InfoFavourites?userId=${realUserId}`" size="small">
              <span class="text-white text-sm">Favorits</span>
            </ion-button>
            <ion-button v-if="isAdmin" :href="`/ManageContent?userId=${realUserId}`" size="small">
              <span class="text-white text-sm">Gestionar continguts</span>
            </ion-button>
          </template>
          <template v-else>
            <ion-button href="/login" size="small">
              <span class="text-white text-sm">Iniciar Sessió</span>
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

        <ion-buttons slot="end" class="user-icon-button" v-if="realUserId">
          <ion-button :href="`/infoUser?userId=${realUserId}`" size="small">
            <ion-icon :icon="personOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <div class="ion-safe-area-top"></div>

    <ion-content fullscreen class="ion-padding bg-gray-50 text-gray-900">
      <div v-if="isLoading" class="ion-text-center">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else class="custom-top-spacing">
        <h2 class="title-section">Descobreix Teatres</h2>

        <ion-grid>
          <ion-row>
            <ion-col
              v-for="(movie, movieIndex) in currentMovies"
              :key="movieIndex"
              :size-xs="12"
              :size-sm="6"
              :size-md="4"
            >
              <ion-card class="movie-card" @click="goToPlayInfo(movie)">
                <img :src="movie.page" :alt="movie.title" class="movie-image" />
                <ion-card-header>
                  <ion-card-title class="movie-title">{{ movie.title }}</ion-card-title>
                  <ion-card-subtitle class="movie-subtitle">{{ movie.year }}</ion-card-subtitle>
                </ion-card-header>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-button :disabled="currentPage === 1" @click="goToPreviousPage">Anterior</ion-button>
        </ion-buttons>

        <ion-title>{{ currentPage }} / {{ totalPages }}</ion-title>

        <ion-buttons slot="end">
          <ion-button :disabled="currentPage === totalPages" @click="goToNextPage">Seguent</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
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
  IonSpinner,
  IonMenu,
  IonMenuButton,
  IonList,
  IonItem,
} from '@ionic/vue';

import { filmOutline, personOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import supabase from '@/supabaseClient';

const route = useRoute();
const router = useRouter();

const rawUserId = route.query.userId as string | undefined;
const realUserId = ref<string | null>(
  rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined' ? rawUserId : null
);

const searchText = ref('');
const plays = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const isAdmin = ref(false);

const goToPlayInfo = (movie: any) => {
  router.push({
    path: '/infoPlay',
    query: { id: movie.id_play, userId: realUserId.value },
  });
};

const loadUserData = async () => {
  if (!realUserId.value) {
    isAdmin.value = false;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('user_id', realUserId.value)
      .single();

    if (error) throw error;
    if (data) isAdmin.value = data.is_admin || false;
  } catch (error) {
    console.error('Error al cargar datos usuario:', error);
    isAdmin.value = false;
  }
};

const loadPlays = async () => {
  try {
    const { data, error } = await supabase.from('play').select('*').order('id_play', { ascending: true });

    if (error) throw error;
    plays.value = data || [];
    if (!data || data.length === 0) {
      errorMessage.value = 'La tabla está vacía o no tienes permiso de lectura.';
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

const currentPage = ref(1);
const moviesPerPage = computed(() => {
  const width = window.innerWidth;
  if (width < 600) return 3;
  else if (width < 960) return 2;
  return 6;
});
const totalPages = computed(() => Math.ceil(filteredMovies.value.length / moviesPerPage.value));

const currentMovies = computed(() => {
  const start = (currentPage.value - 1) * moviesPerPage.value;
  const end = start + moviesPerPage.value;
  return filteredMovies.value.slice(start, end);
});

const goToPreviousPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
</script>

<style scoped>
/* Layout toolbar */
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

/* Botones y menú */
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

/* Icono película tamaño */
.icon-film {
  width: 20px;
  height: 20px;
  margin-right: 6px;
}

/* Menú hamburguesa (solo móvil) */
.menu-button-mobile {
  display: flex;
  align-items: center;
}

/* Botones escritorio (ocultos por defecto) */
.buttons-desktop {
  display: none;
  align-items: center;
}

/* Media query para pantallas >= 768px */
@media (min-width: 768px) {
  .buttons-desktop {
    display: flex;
  }
  .menu-button-mobile {
    display: none;
  }
}

/* Estilos para imágenes y cards */
.movie-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.movie-card {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.movie-title {
  font-size: 1rem;
  font-weight: 700;
}

.movie-subtitle {
  font-size: 0.75rem;
  color: #4a5568;
}

.title-section {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.custom-top-spacing {
  margin-top: 150px; /* Puedes ajustar este valor para más o menos espacio */
}

/* Responsive images height */
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

.bg-gray-50 {
  background-color: #f9fafb;
}

.text-gray-900 {
  color: #111827;
}

.text-white {
  color: white;
}

.text-sm {
  font-size: 0.875rem;
}

.user-icon-button {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.user-icon-button ion-icon {
  width: 24px;
  height: 24px;
  color: white;
}

@media (min-width: 768px) {
  .user-icon-button ion-icon {
    width: 28px;
    height: 28px;
  }
}

/* Footer fijo al fondo */
#main-content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

ion-content {
  flex-grow: 1;
  --padding-top: 0;
}
</style>
