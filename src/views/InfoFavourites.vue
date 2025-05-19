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
          <ion-buttons v-if="isAdmin" slot="end" class="space-x-2">
            <ion-button :href="`/ManageContent?userId=${userId}`">
              <span class="text-white text-sm">Gestionar continguts</span>
            </ion-button>
          </ion-buttons>
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

      <ion-list v-if="!isLoading && favouritesWithPage.length > 0">
        <ion-item
          v-for="fav in favouritesWithPage"
          :key="fav.id_play"
          button
          @click="goToPlay(fav.play)"
          class="mb-4 bg-white rounded-lg shadow-sm"
        >
          <ion-label class="flex items-center gap-2">
            <img
              v-if="fav.play.page"
              :src="fav.play.page"
              alt="Imatge de l'obra"
              style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"
            />
            <div>
              <span class="text-base font-medium text-gray-900">{{ fav.play.title }}</span><br />
              <span class="text-xs text-gray-600">{{ fav.play.year }}</span>
            </div>
          </ion-label>
          <ion-button
            slot="end"
            fill="clear"
            color="danger"
            @click.stop="deleteFavourite(fav.id_play)"
          >
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </ion-item>
      </ion-list>

      <div v-else-if="isLoading" class="text-center text-gray-600 mt-12">
        Carregant obres favorites...
      </div>
      <div v-else class="text-center text-gray-600 mt-12">
        Encara no has afegit cap obra a favorits.
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
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonButtons
} from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { trashOutline, filmOutline, personOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

interface Play {
  id: number;
  title: string;
  year: string;
  page?: string | null;
}

interface FavouritePlay {
  id_play: number;
  play: Play;
}

const route = useRoute();
const router = useRouter();
const userId = route.query.userId as string;

const isLoading = ref(true);
const favouritesWithPage = ref<FavouritePlay[]>([]);
const isAdmin = ref(false);

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

const loadFavourites = async () => {
  if (!userId) return;

  isLoading.value = true;

  const { data, error } = await supabase
    .from('Favorite_play')
    .select('id_play, play(id, title, year, page)')
    .eq('id_user', userId);

  if (error) {
    console.error('Error carregant favorits:', error.message);
  } else {
    favouritesWithPage.value = data || [];
    console.log('Favorits carregats:', favouritesWithPage.value);
  }

  isLoading.value = false;
};

const deleteFavourite = async (playId: number) => {
  console.log('Intentando borrar favorito:', { userId, playId });

  if (!userId || !playId) {
    console.warn('userId o playId no válidos');
    return;
  }

  const { error } = await supabase
    .from('Favorite_play')
    .delete()
    .eq('id_user', userId)
    .eq('id_play', playId);

  if (error) {
    console.error('Error eliminant favorit:', error.message);
  } else {
    alert('Obra eliminada dels favorits');
    favouritesWithPage.value = favouritesWithPage.value.filter(fav => fav.id_play !== playId);
    console.log(`Obra ${playId} eliminada dels favorits.`);
  }
};

const goToPlay = (play: Play) => {
  router.push({ path: '/infoPlay', query: { id: play.id.toString(), userId } });
};

onMounted(async () => {
  await loadUserData();
  await loadFavourites();
});
</script>

<style scoped>
ion-item {
  --padding-start: 16px;
  --inner-padding-end: 12px;
  border-radius: 12px;
}
</style>
