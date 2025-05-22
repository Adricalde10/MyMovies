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
} from '@ionic/vue'; // Importa els components d'Ionic necessaris per a la interfície d'usuari
import { ref, onMounted } from 'vue'; // Importa 'ref' per a variables reactives i 'onMounted' per a funcions que s'executen quan el component es munta
import { useRoute, useRouter } from 'vue-router'; // Importa 'useRoute' per accedir a la informació de la ruta actual i 'useRouter' per a la navegació
import { trashOutline, filmOutline, personOutline } from 'ionicons/icons'; // Importa les icones de Ionicons que s'utilitzaran en la plantilla
import { supabase } from '../supabaseClient'; // Importa la instància configurada del client de Supabase des del fitxer '../supabaseClient.ts'

interface Play { // Defineix una interfície per tipar les dades d'una obra
  id_play: number; // Assegura't que la propietat sigui 'id_play'
  title: string;
  year: string;
  page?: string | null; // La portada pot ser una cadena (URL) o null
}

interface FavouritePlay { // Defineix una interfície per tipar les obres favorites amb la seva informació
  id_play: number;
  play: Play; // Conté les dades de l'obra favorita
}

const route = useRoute(); // Obté l'objecte de la ruta actual
const router = useRouter(); // Obté l'objecte del router per a la navegació
const userId = route.query.userId as string; // Obté l'ID de l'usuari dels paràmetres de la query i l'assegura com a string

const isLoading = ref(true); // Variable reactiva per indicar si les dades estan sent carregades
const favouritesWithPage = ref<FavouritePlay[]>([]); // Variable reactiva per emmagatzemar la llista d'obres favorites amb la seva informació de portada
const isAdmin = ref(false); // Variable reactiva per indicar si l'usuari actual és administrador

const loadUserData = async () => { // Funció asíncrona per carregar la informació de l'usuari (si és admin)
  if (!userId) return; // Si no hi ha un ID d'usuari, no fa res
  try {
    const { data, error } = await supabase
      .from('usuarios') // Consulta la taula 'usuarios'
      .select('is_admin') // Selecciona la columna 'is_admin'
      .eq('user_id', userId) // Filtra per l'ID de l'usuari actual
      .single(); // Espera un únic resultat

    if (error) throw error; // Si hi ha un error en la consulta, el llança

    if (data) { // Si s'han trobat dades de l'usuari
      isAdmin.value = data.is_admin || false; // Estableix el valor de 'isAdmin' segons la resposta (o false si no hi és)
    }
  } catch (error) {
    console.error('Error al cargar datos usuario:', error);
  }
};

const loadFavourites = async () => { // Funció asíncrona per carregar la llista d'obres favorites de l'usuari
  if (!userId) return; // Si no hi ha un ID d'usuari, no fa res

  isLoading.value = true; // Indica que la càrrega de favorits està en curs

  const { data, error } = await supabase
    .from('Favorite_play') // Consulta la taula 'Favorite_play' (assumint que té els favorits)
    .select('id_play, play(id_play, title, year, page)') // Selecciona l'ID del favorit i les dades de l'obra (incloent l'ID)
    .eq('id_user', userId); // Filtra per l'ID de l'usuari actual

  if (error) {
    console.error('Error carregant favorits:', error.message);
  } else {
    favouritesWithPage.value = data || []; // Assigna les dades a la variable reactiva (o un array buit si no hi ha dades)
    console.log('Favorits carregats:', favouritesWithPage.value);
  }

  isLoading.value = false; // Indica que la càrrega de favorits ha finalitzat
};

const deleteFavourite = async (playId: number) => { // Funció asíncrona per eliminar una obra dels favorits
  console.log('Intentando borrar favorito:', { userId, playId });

  if (!userId || !playId) { // Verifica que l'ID d'usuari i l'ID de l'obra siguin vàlids
    console.warn('userId o playId no válidos');
    return;
  }

  const { error } = await supabase
    .from('Favorite_play') // Consulta la taula 'Favorite_play'
    .delete() // Realitza una operació d'eliminació
    .eq('id_user', userId) // Filtra per l'ID de l'usuari
    .eq('id_play', playId); // Filtra per l'ID de l'obra a eliminar

  if (error) {
    console.error('Error eliminant favorit:', error.message);
  } else {
    alert('Obra eliminada dels favorits');
    favouritesWithPage.value = favouritesWithPage.value.filter(fav => fav.id_play !== playId); // Actualitza la llista de favorits eliminant l'obra
    console.log(`Obra ${playId} eliminada dels favorits.`);
  }
};

const goToPlay = (play: Play) => { // Funció per navegar a la pàgina d'informació d'una obra
  router.push({ path: '/infoPlay', query: { id: play.id_play.toString(), userId } }); // Navega a '/infoPlay' passant l'ID de l'obra i l'ID de l'usuari com a paràmetres de la query
};

onMounted(async () => { // Funció que s'executa quan el component es munta
  await loadUserData(); // Carrega la informació de l'usuari
  await loadFavourites(); // Carrega la llista d'obres favorites
});
</script>

<style scoped>
ion-item {
  --padding-start: 16px;
  --inner-padding-end: 12px;
  border-radius: 12px;
}
</style>
