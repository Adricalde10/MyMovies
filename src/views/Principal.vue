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
// Importem components d'Ionic per a construir la UI de la pàgina
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

// Importem icones d'Ionicons i utilitats de Vue i Vue Router
import { filmOutline, personOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import supabase from '@/supabaseClient';

// Obtenim el userId de la query de la ruta actual
const route = useRoute();
const userId = route.query.userId as string | undefined;

const router = useRouter();

// Control del text del cercador
const searchText = ref('');

// Estats reactius per a les obres, càrrega i errors
const plays = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Estat per saber si l'usuari és admin
const isAdmin = ref(false);

// Funció per navegar a la pàgina d'informació d'una obra
const goToPlayInfo = (movie: any) => {
  const query: any = { id: movie.id_play };

  // Afegim userId a la query si existeix per mantenir context
  if (userId) {
    query.userId = userId;
  }

  router.push({
    path: '/infoPlay',
    query,
  });
};

// Funció per carregar dades de l'usuari i saber si és admin
const loadUserData = async () => {
  if (!userId) return; // Si no hi ha userId, no fem res
  try {
    // Consulta a la taula 'usuarios' per obtenir la propietat is_admin
    const { data, error } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (data) {
      // Assignem el valor a la variable reactiva
      isAdmin.value = data.is_admin || false;
    }
  } catch (error) {
    // En cas d'error mostrem per consola
    console.error('Error al cargar datos usuario:', error);
  }
};

// Funció per carregar totes les obres des de Supabase
const loadPlays = async () => {
  try {
    // Consulta a la taula 'play' ordenada per id_play ascendent
    const { data, error } = await supabase
      .from('play')
      .select('*')
      .order('id_play', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      // Si no hi ha dades o la taula està buida, establim un missatge d'error
      errorMessage.value = 'La tabla está vacía o no tienes permiso de lectura.';
    } else {
      // Assignem les dades a la llista reactiva d'obres
      plays.value = data;
    }
  } catch (error: any) {
    // En cas d'error general, actualitzem el missatge
    errorMessage.value = 'No se pudo cargar las obras.';
  } finally {
    // Sempre desactivem el loader al finalitzar
    isLoading.value = false;
  }
};

// Quan el component es monta, carreguem dades d'usuari i obres
onMounted(async () => {
  await loadUserData();
  await loadPlays();
});

// Computed per filtrar les obres segons el text del cercador
const filteredMovies = computed(() => {
  const query = searchText.value.toLowerCase();
  return plays.value.filter((movie) => {
    // Retornem true si algun dels camps coincideix amb la cerca (sense majúscules)
    return (
      movie.title?.toLowerCase().includes(query) ||
      movie.characters?.toLowerCase().includes(query) ||
      movie.creator?.toLowerCase().includes(query)
    );
  });
});

// Variables per paginació
const currentPage = ref(1);

// Computed per determinar quantes pel·lícules mostrar per pàgina segons l'ample de pantalla
const moviesPerPage = computed(() => {
  const width = window.innerWidth;
  if (width < 600) {
    return 3; // 1 columna en pantalles molt petites
  } else if (width < 960) {
    return 2; // 2 columnes en pantalles petites
  } else {
    return 6; // 3 columnes en pantalles mitjanes i grans
  }
});

// Computed per calcular el total de pàgines en base a les pel·lícules filtrades i pel·lícules per pàgina
const totalPages = computed(() => Math.ceil(filteredMovies.value.length / moviesPerPage.value));

// Computed per obtenir les pel·lícules que s'han de mostrar en la pàgina actual
const currentMovies = computed(() => {
  const start = (currentPage.value - 1) * moviesPerPage.value;
  const end = start + moviesPerPage.value;
  return filteredMovies.value.slice(start, end);
});

// Computed que divideix les pel·lícules actuals en "chunks" o blocs per mostrar a la UI (pot ser útil per files i columnes)
const movieChunks = computed(() => {
  const chunks = [];
  for (let i = 0; i < currentMovies.value.length; i += moviesPerPage.value) {
    chunks.push(currentMovies.value.slice(i, i + moviesPerPage.value));
  }
  return chunks;
});

// Funció per passar a la pàgina anterior, si no estem a la primera
const goToPreviousPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

// Funció per passar a la pàgina següent, si no estem a l'última
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
