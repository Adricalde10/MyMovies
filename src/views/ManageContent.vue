<script setup lang="ts">
// Importem components d'Ionic per construir la UI
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

// Importem utilitats de Vue i icones d'Ionicons
import { ref, onMounted, onUpdated } from 'vue';
import { trashOutline, createOutline, addOutline, personOutline } from 'ionicons/icons';

// Importem la configuració de Supabase i eines de routing de Vue Router
import supabase from '@/supabaseClient'
import { useRoute, useRouter } from 'vue-router';

// Inicialitzem router i route per a la navegació i accés als paràmetres de la URL
const router = useRouter();
const route = useRoute();

// Agafem el userId passat com a paràmetre a la query de la ruta
const userId = route.query.userId as string | undefined;

// Estat reactiu per indicar si està carregant dades
const isLoading = ref(true);

// Missatge d'error en cas que alguna operació falli
const errorMessage = ref('');

// Llista reactiva d'obres carregades de la base de dades
const plays = ref<{ id: number; title: string; year: string }[]>([]);

// Funció per carregar totes les obres des de la taula 'play'
const loadPlays = async () => {
  isLoading.value = true; // Marquem que comença la càrrega

  // Consulta a Supabase per obtenir totes les obres ordenades per id ascendent
  const { data, error } = await supabase.from('play').select('*').order('id', { ascending: true });

  if (error) {
    // En cas d'error guardem el missatge i el mostrem per consola
    errorMessage.value = 'No es poden carregar les obres.';
    console.error(error);
  } else {
    // Assignem les dades obtingudes a la llista d'obres
    plays.value = data;
  }

  isLoading.value = false; // Finalitza la càrrega
};

// Funció per eliminar una obra segons el seu id
const deletePlay = async (id: number) => {
  // Executa la consulta per eliminar la fila amb l'id especificat
  const { error } = await supabase.from('play').delete().eq('id', id);

  if (error) {
    // Si hi ha error, el mostrem per consola
    console.error('Error eliminant obra:', error.message);
  } else {
    // Si s'elimina bé, actualitzem la llista filtrant l'obra eliminada
    plays.value = plays.value.filter(play => play.id !== id);
  }
};

// Funció per navegar a la pàgina d'edició d'una obra, passant l'id i userId per query
const editPlay = (idPlay: number) => {
  router.push({ path: `/EditPlay?userId=${userId}`, query: { id: idPlay.toString() } });
};

// Funció per navegar a la pàgina de creació d'una nova obra, passant el userId
const goToCreatePlay = () => {
  router.push(`/CreatePlay?userId=${userId}`);
};

// Quan el component està muntat, carreguem les obres
onMounted(() => {
  loadPlays();
});

/* 
// Aquesta part està comentada, però si es descomenta, la càrrega d'obres es farà també cada vegada que el component s'actualitzi.
// Pot ser útil si les dades canvien sovint i volem refrescar-les automàticament.
// onUpdated(() => {
//   loadPlays();
// }); 
*/
</script>


<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title>Gestionar Obres</ion-title>

        <ion-buttons slot="end">
          <ion-button @click="goToCreatePlay()">
            <ion-icon :icon="addOutline" color="light" />
            <span class="ml-2 text-white">Nova Obra</span>
          </ion-button>
          <ion-button :href="`/Principal?userId=${userId}`">
            <span class="text-white text-sm">Inici</span>
          </ion-button>
          <ion-button :href="`/infoUser?userId=${userId}`">
            <ion-icon :icon="personOutline" color="light" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding bg-gray-100">
      <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">Llistat d'obres</h2>

      <ion-list v-if="!isLoading && plays.length">
        <ion-item
          v-for="play in plays"
          :key="play.id"
          class="mb-4 bg-white rounded-lg shadow-sm"
        >
          <ion-label class="flex items-center gap-2">
            <img
            v-if="play.page"
              :src="play.page"
              alt="Imatge de l'obra"
              style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"
            />
            <div>
              <span class="text-base font-medium text-gray-900">{{ play.title }}</span><br />
              <span class="text-xs text-gray-600">{{ play.year }}</span>
            </div>
          </ion-label>




          <ion-buttons slot="end">
            <ion-button color="primary" @click="editPlay(play.id)">
              <ion-icon :icon="createOutline" />
            </ion-button>
            <ion-button color="danger" @click="deletePlay(play.id)">
              <ion-icon :icon="trashOutline" />
            </ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>

      <div v-else-if="isLoading" class="text-center text-gray-600 mt-12">
        Carregant obres...
      </div>
      <div v-else class="text-center text-gray-600 mt-12">
        No hi ha obres disponibles.
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-item {
  --padding-start: 16px;
  --inner-padding-end: 12px;
  border-radius: 12px;
}
</style>
