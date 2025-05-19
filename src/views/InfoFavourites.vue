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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { trashOutline, filmOutline, personOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient'; // Ajusta la ruta según tu estructura

interface Play {
  title: string;
  year: string;
}

interface FavouritePlay {
  id_play: number;
  play: Play;
}

const favouriteRelations = ref<FavouritePlay[]>([]);
const favourites = ref<Play[]>([]);

const route = useRoute();
const userId = route.query.userId as string | undefined;

const router = useRouter();

async function loadFavourites() {
  if (!userId) return;

  const { data, error } = await supabase
    .from<FavouritePlay>('Favorite_play')
    .select('id_play, play(title, year)')
    .eq('id_user', userId);

  if (error) {
    console.error('Error loading favourites:', error);
  } else if (data) {
    favouriteRelations.value = data;
    favourites.value = data.map(fav => fav.play);
  }
}

async function removeFromFavourites(index: number) {
  if (!userId) return;

  const favRelation = favouriteRelations.value[index];

  const { error } = await supabase
    .from('Favorite_play')
    .delete()
    .eq('id_user', userId)
    .eq('id_play', favRelation.id_play);

  if (error) {
    console.error('Error deleting favourite:', error);
  } else {
    favouriteRelations.value.splice(index, 1);
    favourites.value.splice(index, 1);
  }
}

function goToPlay(play: Play) {
  router.push({ path: '/infoPlay', query: { title: play.title } });
}

onMounted(() => {
  loadFavourites();
});
</script>

<style scoped>
ion-item {
  --padding-start: 16px;
  --inner-padding-end: 12px;
  border-radius: 12px;
}
</style>
