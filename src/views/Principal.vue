<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="text-green-400 flex items-center space-x-2">
          <ion-icon :icon="filmOutline"></ion-icon>
          <span>MyMovies</span>
        </ion-title>

        <!-- Buscador -->
      <!-- CONTENEDOR DEL BUSCADOR + RESULTADOS -->
      <div class="px-4 pt-4">
        <!-- BUSCADOR -->
        <ion-searchbar
          v-model="searchText"
          placeholder="Buscar Teatres o actors..."
          mode="ios"
          color="light"
          class="searchbar-small"
        ></ion-searchbar>

        <!-- RESULTADOS DE ACTORES -->
        <div
          v-if="filteredActors.length"
          class="mt-4 px-4 py-3 bg-white rounded-xl shadow-md border border-gray-100"
        >
          <h3 class="text-sm font-semibold mb-2 text-gray-700 uppercase tracking-wide">
            Actores encontrados
          </h3>
          <div class="flex space-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
            <div
              v-for="(actor, index) in filteredActors"
              :key="index"
              class="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg shadow-sm border border-gray-200 min-w-[140px]"
            >
              <img
                :src="actor.image"
                :alt="actor.name"
                class="rounded-full object-cover"
                style="width: 36px; height: 36px;"
              />
              <span class="text-xs text-gray-800 font-medium truncate">{{ actor.name }}</span>
            </div>
          </div>
        </div>
      </div>

        <ion-buttons slot="end">
          <!-- Botón de registro utilizando el href -->
          <ion-button href="/register">
            <h2>Register</h2>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>


    <ion-content fullscreen class="ion-padding bg-gray-50 text-gray-900">
      <h2 class="text-2xl font-bold mb-4">Descubreix Teatres</h2>

      <ion-grid>
        <template v-for="(chunk, rowIndex) in movieChunks" :key="rowIndex">
          <ion-row>
            <!-- 3 películas -->
            <ion-col
              v-for="(movie, movieIndex) in chunk"
              :key="movieIndex"
              size="3"
            >
              <ion-card class="rounded-lg overflow-hidden shadow-md">
                <img :src="movie.image" :alt="movie.title" class="movie-image" />
                <ion-card-header>
                  <ion-card-title class="text-sm font-bold">
                    {{ movie.title }}  <!-- Aquí el título que viene de la base de datos -->
                  </ion-card-title>
                  <ion-card-subtitle class="text-xs text-gray-600">
                    {{ movie.year }} • ⭐ {{ movie.rating }}
                  </ion-card-subtitle>
                </ion-card-header>
              </ion-card>
            </ion-col>

            <!-- 4ta columna con actores (solo en la primera fila) -->
            <ion-col size="3">
              <ion-card
                v-if="rowIndex === 0"
                class="rounded-lg shadow-md p-4 h-full"
              >
              
                <h3 class="font-bold text-xl mb-2">Actors</h3>
                <ion-list>
                  <ion-item
                    v-for="(actor, actorIndex) in uniqueActors"
                    :key="actorIndex"
                    class="text-sm text-gray-700"
                  >
                    <ion-avatar slot="start">
                      <img :src="actor.image" :alt="actor.name" class="actor-image" />
                    </ion-avatar>
                    <ion-label>{{ actor.name }}</ion-label>
                  </ion-item>
                  
                </ion-list>
                
              </ion-card>
            </ion-col>
          </ion-row>
        </template>
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
              Siguiente
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-footer>

      </ion-grid>
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
  IonList,
  IonItem,
  IonAvatar,
  IonLabel
} from '@ionic/vue';

import { filmOutline, personOutline } from 'ionicons/icons';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router'; // Importamos useRouter para la navegación

const searchText = ref('');

const movies = ref([
  {
    title: 'Romeo i Julieta',
    year: '2024',
    rating: '7.6',
    image: 'https://preview.redd.it/keaxfxiu5ble1.jpeg?width=1080&crop=smart&auto=webp&s=aabf0c8e61e5d3219615f23a88e1e05739c1367e',
    actors: ['Tom Holland', 'Hayden Christensen', 'Natalie Portman']
  },
  {
    title: 'Como entrenar a tu Dragon',
    year: '2025',
    rating: '4.3',
    image: 'https://hips.hearstapps.com/hmg-prod/images/digital-hdg-crt-1sheet-crn-payoffonesheet-siz-947x1500-cta-release-date-cou-es-spanish-des-67b712c5c49f5.jpg?resize=980:*',
    actors: ['Jay Baruchel', 'Nico Parker', 'Craig Ferguson']
  },
  {
    title: 'Creedme',
    year: '2019',
    rating: '7.4',
    image: 'https://images.justwatch.com/poster/270028059/s718/creedme.jpg',
    actors: ['rayna vallandingham', 'Edie Falco', 'Aidan Gillen']
  },
  {
    title: 'The last of us',
    year: '2019',
    rating: '7.4',
    image: 'https://m.media-amazon.com/images/M/MV5BYWI3ODJlMzktY2U5NC00ZjdlLWE1MGItNWQxZDk3NWNjN2RhXkEyXkFqcGc@._V1_.jpg',
    actors: ['Nico Parker', 'Edie Falco', 'Aidan Gillen']
  },
  {
    title: 'Iron Man',
    year: '2008',
    rating: '7.9',
    image: 'https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_FMjpg_UX1000_.jpg',
    actors: ['Robert Downey Jr.', 'Gwyneth Paltrow']
  },
  {
    title: 'Vinagre de Manzana',
    year: '2025',
    rating: '7.9',
    image: 'https://m.media-amazon.com/images/M/MV5BODVhYTMwMzQtODA2Zi00MTEwLTgyYWItZmM0OTJiMjczNWVmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    actors: ['', 'Gwyneth Paltrow']
  }
]);

// Imágenes de actores
const actorData = ref([
  { name: 'Tom Holland', image: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Tom_Holland_by_Gage_Skidmore.jpg' },
  { name: 'Hayden Christensen', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hayden-cfda2010-0004%281%29_%28cropped%29.jpg/800px-Hayden-cfda2010-0004%281%29_%28cropped%29.jpg' },
  { name: 'Natalie Portman', image: 'https://media.revistavanityfair.es/photos/6142d705676699d3bfcd1462/master/w_1600%2Cc_limit/255279.jpg' },
  { name: 'Jay Baruchel', image: 'https://www.lavanguardia.com/peliculas-series/images/profile/1982/4/w300/1GYJeQzPcY9Pfmc3FFsBwClkCv7.jpg' },
  { name: 'Gerard Butler', image: 'http://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Gerard_Butler_%2829681162176%29.jpg/640px-Gerard_Butler_%2829681162176%29.jpg' },
  { name: 'Nico Parker', image: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Nico_Parker%2C_MovieZine_interview_%28cropped%29.png' },
  { name: 'rayna vallandingham', image: 'https://m.media-amazon.com/images/M/MV5BNTA4ODc4NWQtM2FkYS00YjYwLTgxMjQtYWE4ODliY2MxMzNkXkEyXkFqcGc@._V1_.jpg' },
  { name: 'Robert Downey Jr.', image: 'https://m.media-amazon.com/images/M/MV5BNzg1MTUyNDYxOF5BMl5BanBnXkFtZTgwNTQ4MTE2MjE@._V1_FMjpg_UX1000_.jpg' },
]);

// Películas filtradas por búsqueda
const filteredMovies = computed(() => {
  const query = searchText.value.toLowerCase();
  return movies.value.filter((movie) => {
    const titleMatch = movie.title.toLowerCase().includes(query);
    const actorMatch = movie.actors.some(actor =>
      actor.toLowerCase().includes(query)
    );
    return titleMatch || actorMatch;
  });
});
//FiltrarActores
const filteredActors = computed(() => {
  const query = searchText.value.toLowerCase();
  if (!query) return [];

  return actorData.value.filter(actor =>
    actor.name.toLowerCase().includes(query)
  );
});


// Agrupamos películas de a 3
const movieChunks = computed(() => {
  const chunks = [];
  for (let i = 0; i < filteredMovies.value.length; i += 3) {
    chunks.push(filteredMovies.value.slice(i, i + 3));
  }
  return chunks;
});

// Actores únicos con imágenes
const uniqueActors = computed(() => {
  const allActorNames = movies.value.flatMap(m => m.actors);
  const uniqueNames = Array.from(new Set(allActorNames));
  return uniqueNames
    .map(name => actorData.value.find(actor => actor.name === name))
    .filter(Boolean);
});
// Paginación
const currentPage = ref(1);
const moviesPerPage = 3;
const totalPages = computed(() => Math.ceil(filteredMovies.value.length / moviesPerPage));

// Películas de la página actual
const currentMovies = computed(() => {
  const start = (currentPage.value - 1) * moviesPerPage;
  const end = start + moviesPerPage;
  return filteredMovies.value.slice(start, end);
});

// Ir a la página anterior
const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Ir a la siguiente página
const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};
const goToRegister = () => {
  router.push('/register'); // Redirige a la página de registro
};


</script>

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

.actor-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
}

</style>