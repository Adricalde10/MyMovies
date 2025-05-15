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

          <ion-button href="/Principal">
            <span class="text-white text-sm">Inici</span>
          </ion-button>

          <ion-button href="/infoUser">
            <ion-icon :icon="personOutline" color="light" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding bg-gray-100">
      <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">Llistat d'obres</h2>

      <ion-list>
        <ion-item
          v-for="(play, index) in plays"
          :key="index"
          class="mb-4 bg-white rounded-lg shadow-sm"
        >
          <ion-label class="flex flex-col">
            <span class="text-lg font-semibold text-gray-900">{{ play.title }}</span>
            <span class="text-sm text-gray-600">{{ play.year }}</span>
          </ion-label>

          <ion-buttons slot="end">
            <ion-button color="primary" @click="editPlay(play)">
              <ion-icon :icon="createOutline" />
            </ion-button>
            <ion-button color="danger" @click="deletePlay(index)">
              <ion-icon :icon="trashOutline" />
            </ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>

      <div v-if="plays.length === 0" class="text-center text-gray-600 mt-12">
        No hi ha obres disponibles.
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { trashOutline, createOutline, addOutline, personOutline } from 'ionicons/icons';

const router = useRouter();

const plays = ref([
  { title: 'Romeo i Julieta', year: '1597' },
  { title: 'Hamlet', year: '1603' },
  { title: 'Macbeth', year: '1606' }
]);

function deletePlay(index: number) {
  plays.value.splice(index, 1);
}

function editPlay(play: { title: string }) {
  router.push({ path: '/editPlay', query: { title: play.title } });
}

function goToCreatePlay() {
  router.push('/createPlay');
}
</script>

<style scoped>
ion-item {
  --padding-start: 16px;
  --inner-padding-end: 12px;
  border-radius: 12px;
}
</style>
