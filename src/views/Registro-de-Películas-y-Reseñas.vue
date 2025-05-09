<template>
  <ion-page>
    <!-- Encabezado -->
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="text-green-400 flex items-center space-x-2">
          <ion-icon :icon="filmOutline"></ion-icon>
          <span>Letterboxd</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <!-- Contenido -->
    <ion-content fullscreen class="ion-padding bg-gray-50 text-gray-900">
      <ion-searchbar
        placeholder="Buscar películas..."
        mode="ios"
        color="light"
        class="mb-4"
      ></ion-searchbar>

      <h2 class="text-2xl font-bold mb-4">Descubre Películas</h2>

      <ion-grid>
        <ion-row>
          <ion-col
            size="6"
            size-md="4"
            size-lg="3"
            v-for="(movie, index) in movies"
            :key="index"
          >
            <ion-card class="rounded-lg overflow-hidden shadow-md">
              <img :src="movie.image" :alt="movie.title" />
              <ion-card-header>
                <ion-card-title class="text-sm font-bold">
                  {{ movie.title }}
                </ion-card-title>
                <ion-card-subtitle class="text-xs text-gray-600">
                  {{ movie.year }} • ⭐ {{ movie.rating }}
                </ion-card-subtitle>
              </ion-card-header>
            </ion-card>
          </ion-col>
        </ion-row>
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
  IonIcon
} from '@ionic/vue';

import { filmOutline } from 'ionicons/icons';
import { ref } from 'vue';

const movies = ref([
  {
    title: 'El Padrino',
    year: '1972',
    rating: '4.5',
    image: 'https://readdy.ai/api/search-image?query=The%20Godfather%20movie%20poster...'
  },
  {
    title: 'Pulp Fiction',
    year: '1994',
    rating: '4.3',
    image: 'https://readdy.ai/api/search-image?query=Pulp%20Fiction%20movie%20poster...'
  },
  {
    title: 'Parásitos',
    year: '2019',
    rating: '4.6',
    image: 'https://readdy.ai/api/search-image?query=Parasite%20movie%20poster...'
  }
]);
</script>

<style scoped>
/* Puedes usar Tailwind si lo tienes habilitado, o usar Ionic classes */
</style>
