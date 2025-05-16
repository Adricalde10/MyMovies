<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="flex items-center space-x-2">
          <ion-icon :icon="filmOutline" class="text-green-400 w-5 h-5"></ion-icon>
          <span class="text-green-400">Butaca1</span>
        </ion-title>

        <ion-buttons slot="end" class="space-x-2">
          <ion-button href="/Principal">
            <span class="text-white text-sm">Inici</span>
          </ion-button>
          <ion-button href="/infoFavourites">
            <span class="text-white text-sm">Favorits</span>
          </ion-button>
          <ion-button href="/manageContent">
            <span class="text-white text-sm">Gestionar continguts</span>
          </ion-button>
        </ion-buttons>

        <ion-buttons slot="end">
          <ion-button href="/infoUser">
            <ion-icon :icon="personOutline" class="text-white w-5 h-5" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding bg-gray-100 text-gray-900">
      <div v-if="isLoading" class="ion-text-center">
        <ion-spinner name="crescent" />
      </div>
      <div v-else-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>
      <div v-else-if="play">
        <ion-card class="rounded-lg overflow-hidden shadow-xl bg-white mb-6">
          <img :src="play.page" :alt="play.title" class="movie-image rounded-t-lg"/>
          <ion-card-header class="p-4">
            <ion-card-title class="text-3xl font-bold text-gray-900">{{ play.title }}</ion-card-title>
            <ion-card-subtitle class="text-gray-500">{{ play.year }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content class="p-4">
  <p class="text-gray-800">{{ play.description }}</p>
  <p class="mt-4 text-gray-700"><strong>Creador:</strong> {{ play.creator }}</p>
  <p class="mt-2 text-gray-700"><strong>Personatges:</strong> {{ play.characters }}</p>
</ion-card-content>
        </ion-card>

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
  IonIcon,
  IonSpinner
} from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '@/supabaseClient';
import { filmOutline, personOutline, starOutline } from 'ionicons/icons';

const route = useRoute();
const playId = ref(route.query.id as string | undefined);
const play = ref<any>(null);
const isLoading = ref(true);
const errorMessage = ref('');

const newReviewText = ref('');
const newReviewRating = ref<number | null>(null);
const userName = ref('Usuari Exemple'); // Aquí hauries de tenir la lògica per obtenir el nom d'usuari real

const loadPlay = async () => {
  if (!playId.value) {
    errorMessage.value = 'No s\'ha proporcionat l\'ID de l\'obra.';
    isLoading.value = false;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('play')
      .select('*')
      .eq('id', playId.value)
      .single();

    if (error) throw error;

    if (data) {
      play.value = data;
    } else {
      errorMessage.value = 'No s\'ha trobat l\'obra.';
    }
  } catch (error: any) {
    errorMessage.value = 'No s\'ha pogut carregar la informació de l\'obra.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadPlay);

function submitReview() {
  if (!newReviewText.value || newReviewRating.value === null) {
    alert('Omple tots els camps!');
    return;
  }

  if (newReviewRating.value < 0 || newReviewRating.value > 10) {
    alert('La valoració ha de ser entre 0 i 10.');
    return;
  }

  // Aquí hauries d'enviar la ressenya a la teva base de dades
  // amb l'ID de l'obra (playId.value), el text (newReviewText.value),
  // la valoració (newReviewRating.value) i l'usuari (userName.value).
  // Després de guardar-la, hauries de tornar a carregar les ressenyes de l'obra.

  if (play.value && play.value.reviews) {
    play.value.reviews.push({
      text: newReviewText.value,
      rating: newReviewRating.value,
      user: userName.value
    });
  }

  newReviewText.value = '';
  newReviewRating.value = null;
}

function deleteReview(index: number) {
  // Aquí hauries d'implementar la lògica per eliminar la ressenya de la base de dades.
  // Després d'eliminar-la, hauries de tornar a carregar les ressenyes de l'obra.
  if (play.value && play.value.reviews) {
    play.value.reviews.splice(index, 1);
  }
}
</script>

<style scoped>

.character-item {
  display: inline-block;
  margin-right: 0.5em;
}

.movie-image {
  width: 100%;
  height: 250px; /* Ajusta aquest valor segons vulguis */
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
