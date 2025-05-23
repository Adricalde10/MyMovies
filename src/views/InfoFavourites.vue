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
// Importació de components d'Ionic necessaris per a la UI
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
// Importació de funcions de Vue
import { ref, onMounted } from 'vue';
// Importació del sistema de rutes de Vue Router
import { useRoute, useRouter } from 'vue-router';
// Importació d'icones d'Ionic
import { trashOutline, filmOutline, personOutline } from 'ionicons/icons';
// Importació del client de Supabase per accedir a la base de dades
import { supabase } from '../supabaseClient';

// Definició de la interfície per a una obra de teatre
interface Play {
  id_play: number; // Asegúrate que la propiedad sea 'id_play'
  title: string;
  year: string;
  page?: string | null;
}

// Interfície per a una obra marcada com a favorita
interface FavouritePlay {
  id_play: number;
  play: Play;
}

// Obtenir informació de la ruta actual i instància del router
const route = useRoute();
const router = useRouter();
// Obtenir el userId des de la query string de la URL
const userId = route.query.userId as string;

// Variables reactives
const isLoading = ref(true); // Indica si s’està carregant
const favouritesWithPage = ref<FavouritePlay[]>([]); // Llista de favorits amb informació completa de l’obra
const isAdmin = ref(false); // Indica si l’usuari és administrador

// Funció per carregar si l’usuari és admin
const loadUserData = async () => {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('is_admin') // Només volem saber si és admin
      .eq('user_id', userId)
      .single(); // Esperem només una fila

    if (error) throw error;

    if (data) {
      isAdmin.value = data.is_admin || false; // Assignem el valor obtingut
    }
  } catch (error) {
    console.error('Error al cargar datos usuario:', error);
  }
};

// Funció per carregar les obres favorites de l’usuari
const loadFavourites = async () => {
  if (!userId) return;

  isLoading.value = true; // Comença la càrrega

  const { data, error } = await supabase
    .from('Favorite_play')
    .select('id_play, play(id_play, title, year, page)') // S’uneix amb la taula play per obtenir dades detallades
    .eq('id_user', userId); // Filtra per l’usuari

  if (error) {
    console.error('Error carregant favorits:', error.message);
  } else {
    favouritesWithPage.value = data || []; // Guarda les dades
    console.log('Favorits carregats:', favouritesWithPage.value);
  }

  isLoading.value = false; // Finalitza la càrrega
};

// Funció per eliminar una obra de la llista de favorits
const deleteFavourite = async (playId: number) => {
  console.log('Intentando borrar favorito:', { userId, playId });

  if (!userId || !playId) {
    console.warn('userId o playId no válidos');
    return;
  }

  const { error } = await supabase
    .from('Favorite_play')
    .delete() // Elimina la fila corresponent
    .eq('id_user', userId)
    .eq('id_play', playId);

  if (error) {
    console.error('Error eliminant favorit:', error.message);
  } else {
    alert('Obra eliminada dels favorits');
    favouritesWithPage.value = favouritesWithPage.value.filter(fav => fav.id_play !== playId); // Actualitza la llista a nivell local
    console.log(`Obra ${playId} eliminada dels favorits.`);
  }
};

// Funció per navegar a la pàgina de detall de l’obra
const goToPlay = (play: Play) => {
  router.push({ path: '/infoPlay', query: { id: play.id_play.toString(), userId } }); // Navega a infoPlay amb l’ID de l’obra
};

// Quan es munta el component, carrega les dades de l’usuari i els favorits
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
