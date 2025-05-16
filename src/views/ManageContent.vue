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
import { trashOutline, createOutline, addOutline, personOutline } from 'ionicons/icons';
import supabase from '@/supabaseClient'
import { useRoute,useRouter } from 'vue-router';


const router = useRouter();
const route = useRoute();

// Usuario desde query
const userId = route.query.userId as string | undefined;


const isLoading = ref(true);
const errorMessage = ref('');
const plays = ref<{ id: number; title: string; year: string }[]>([]);
// Carregar obres
const loadPlays = async () => {
  isLoading.value = true;
  const { data, error } = await supabase.from('play').select('*').order('id', { ascending: true });

  if (error) {
    errorMessage.value = 'No es poden carregar les obres.';
    console.error(error);
  } else {
    plays.value = data;
  }

  isLoading.value = false;
};

// Eliminar obra
const deletePlay = async (id: number) => {
  const { error } = await supabase.from('play').delete().eq('id', id);

  if (error) {
    console.error('Error eliminant obra:', error.message);
  } else {
    plays.value = plays.value.filter(play => play.id !== id);
  }
};

// Navegar
const editPlay = (play: { id: number }) => {
  router.push({ path: `/editPlay?userId=${userId}`, query: { id: play.id.toString() } });
};
const goToCreatePlay = () => {
  router.push(`/CreatePlay?userId=${userId}`);
};

// Inicialització
onMounted(() => {
  loadPlays();
});
</script>

<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title>Gestionar Obres</ion-title>

        <ion-buttons slot="end">
          <ion-button @click="goToCreatePlay">
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
            <ion-button color="primary" @click="editPlay(play)">
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
