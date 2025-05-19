<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="flex items-center space-x-2">
          <ion-icon :icon="filmOutline" class="text-green-400 w-5 h-5"></ion-icon>
          <span class="text-green-400">Butaca1</span>
        </ion-title>

        <ion-buttons slot="end" class="space-x-2">
          <ion-button :href="`/Principal?userId=${userId}`">
            <span class="text-white text-sm">Inici</span>
          </ion-button>
          <ion-button :href="`/ManageContent?userId=${userId}`">
            <span class="text-white text-sm">Gestionar continguts</span>
          </ion-button>
        </ion-buttons>

        <ion-buttons slot="end">
          <ion-button :href="`/InfoUser?userId=${userId}`">
            <ion-icon :icon="personOutline" class="text-white w-5 h-5" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

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
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from '@ionic/vue';
import { ref } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import { trashOutline, filmOutline, personOutline } from 'ionicons/icons';

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

const route = useRoute();
const userId = route.query.userId as string | undefined;

const router = useRouter();

function removeFromFavourites(index: number) {
  favourites.value.splice(index, 1);
}

function goToPlay(play: { title: string }) {
  router.push({ path: '/infoPlay', query: { title: play.title } });
}
</script>

<style scoped>
ion-item {
  --padding-start: 16px;
  --inner-padding-end: 12px;
  border-radius: 12px;
}
</style>
