<template>
  <ion-page>
    <ion-content class="ion-padding bg-gray-100">

      <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">Obres Favorites</h2>

      <ion-list v-if="favourites.length > 0">
        <ion-item
          v-for="(play, index) in favourites"
          :key="index"
          button
          @click="goToPlay(play)"
          class="mb-4 rounded-lg bg-white shadow-md hover:bg-gray-50 transition"
        >
          <ion-label class="flex flex-col">
            <span class="text-lg font-semibold text-gray-900">{{ play.title }}</span>
            <span class="text-sm text-gray-600">{{ play.year }}</span>
          </ion-label>
          <ion-button
            fill="clear"
            color="danger"
            @click.stop="removeFromFavourites(index)"
          >
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </ion-item>
      </ion-list>

      <div v-else class="text-center text-gray-600 mt-12">
        Encara no has afegit cap obra a favorits.
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon
} from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { trashOutline } from 'ionicons/icons';

// Simulació de dades favorites
const favourites = ref([
  {
    title: 'Hamlet',
    year: '1603',
  },
  {
    title: 'Macbeth',
    year: '1606',
  }
]);

const router = useRouter();

function removeFromFavourites(index: number) {
  favourites.value.splice(index, 1);
}

function goToPlay(play: { title: string }) {
  router.push({ path: '/tab2', query: { title: play.title } });
}
</script>

<style scoped>
ion-item {
  --padding-start: 16px;
  --inner-padding-end: 12px;
  border-radius: 12px;
}
</style>
