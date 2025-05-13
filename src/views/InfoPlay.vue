<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="text-green-400 flex items-center space-x-2">
          <ion-icon :icon="filmOutline" />
          <span>Butaca 1</span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon :icon="personOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding bg-gray-100 text-gray-900">

      <!-- Targeta de l'obra -->
      <ion-card class="rounded-lg overflow-hidden shadow-xl bg-white mb-6">
        <img :src="play.image" :alt="play.title" class="movie-image rounded-t-lg"/>
        <ion-card-header class="p-4">
          <ion-card-title class="text-3xl font-bold text-gray-900">{{ play.title }}</ion-card-title>
          <ion-card-subtitle class="text-gray-500">{{ play.year }} • ⭐ {{ play.rating }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content class="p-4">
          <p class="text-gray-800">{{ play.description }}</p>
          <p class="mt-4 text-gray-700"><strong>Creador:</strong> {{ play.creator }}</p>
          <p class="mt-2 text-gray-700"><strong>Personatges:</strong></p>
          <ul class="list-disc ml-6 text-gray-700">
            <li v-for="(character, index) in play.characters" :key="index">{{ character }}</li>
          </ul>
        </ion-card-content>
      </ion-card>

      <!-- Formulari de ressenya -->
      <ion-card class="p-6 mt-6 bg-white shadow-lg rounded-lg">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Escriu una ressenya</h3>

        <ion-item class="ion-margin-bottom">
          <ion-label position="stacked">Comentari</ion-label>
          <ion-textarea
            v-model="newReviewText"
            placeholder="Què t'ha semblat l'obra?"
            rows="5"
            class="rounded-md bg-gray-200 text-gray-800"
          ></ion-textarea>
        </ion-item>

        <!-- Valoració -->
        <ion-item class="ion-margin-bottom">
          <ion-label position="stacked">Valoració</ion-label>
          <div class="flex items-center">
            <ion-button
              v-for="n in 10"
              :key="n"
              @click="newReviewRating = n"
              :color="newReviewRating >= n ? 'warning' : 'medium'"
              class="star-rating-btn"
            >
              <ion-icon :icon="starOutline" />
            </ion-button>
            <span class="ml-2 text-gray-700 font-semibold">{{ newReviewRating }}/10</span>
          </div>
        </ion-item>

        <ion-button expand="block" class="mt-4 bg-green-500 text-white hover:bg-green-600 transition duration-300" @click="submitReview">
          Enviar ressenya
        </ion-button>
      </ion-card>

      <!-- Llista de ressenyes -->
      <ion-list>
        <ion-item v-for="(review, index) in play.reviews" :key="index">
          <ion-card class="p-4 w-full shadow-md mb-6 bg-white rounded-lg">
            <ion-card-header class="mb-2">
              <ion-card-title class="text-lg font-semibold text-gray-900">
                {{ review.user }} - ⭐ {{ review.rating }}/10
              </ion-card-title>
            </ion-card-header>
            <ion-card-content class="text-gray-700">
              <p>{{ review.text }}</p>
              <ion-button
                fill="clear"
                color="danger"
                @click="deleteReview(index)"
                class="mt-2 text-sm font-semibold text-red-500"
              >
                Eliminar
              </ion-button>
            </ion-card-content>
          </ion-card>
        </ion-item>
      </ion-list>

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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonTextarea,
  IonLabel,
  IonItem,
  IonList,
  IonIcon
} from '@ionic/vue';
import { ref } from 'vue';
import { filmOutline, personOutline, starOutline } from 'ionicons/icons';

const newReviewText = ref('');
const newReviewRating = ref<number | null>(null);
const userName = ref('Usuari Exemple');

const play = ref({
  title: 'Hamlet',
  year: '1603',
  rating: '9.2',
  description: 'Una de les tragèdies més famoses de William Shakespeare, que narra la història del príncep Hamlet i la seva recerca de venjança pel seu pare assassinat.',
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Hamlet_Q1_Frontispiece_1603.jpg/800px-Hamlet_Q1_Frontispiece_1603.jpg',
  creator: 'William Shakespeare',
  characters: [
    'Hamlet – interpretat originalment per Richard Burbage',
    'Claudius – el rei usurpador',
    'Gertrude – mare d’Hamlet',
    'Ophelia – amor d’Hamlet',
    'Polonius – conseller del rei'
  ],
  reviews: [] as { text: string; rating: number; user: string }[]
});

function submitReview() {
  if (!newReviewText.value || newReviewRating.value === null) {
    alert('Omple tots els camps!');
    return;
  }

  if (newReviewRating.value < 0 || newReviewRating.value > 10) {
    alert('La valoració ha de ser entre 0 i 10.');
    return;
  }

  play.value.reviews.push({
    text: newReviewText.value,
    rating: newReviewRating.value,
    user: userName.value
  });

  newReviewText.value = '';
  newReviewRating.value = null;
}

function deleteReview(index: number) {
  play.value.reviews.splice(index, 1);
}
</script>

<style scoped>
.movie-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 0.5rem;
}

.star-rating-btn {
  margin-right: 4px;
  --ion-icon-size: 24px;
}

.ion-button {
  font-weight: bold;
  transition: all 0.3s;
}

.ion-button:hover {
  transform: scale(1.05);
}

.ion-list {
  padding: 0 16px;
}

.ion-card-title {
  font-size: 1.25rem;
}

.ion-card-content p {
  font-size: 1rem;
  line-height: 1.5;
}
</style>
