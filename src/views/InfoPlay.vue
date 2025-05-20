<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonTextarea, IonLabel, IonItem,
  IonIcon, IonSpinner
} from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '@/supabaseClient';
import { filmOutline, starOutline, personOutline } from 'ionicons/icons';

const route = useRoute();
const playId = ref<string | null>(null);
const userId = ref<string | null>(null);
const userName = ref<string>('Usuari');

const play = ref<any>(null);
const isLoading = ref(true);
const errorMessage = ref('');
const isAdmin = ref(false);
const reviews = ref<any[]>([]);

const newReviewText = ref('');
const newReviewRating = ref<number | null>(null);

onMounted(() => {
  const idParam = route.query.id;
  playId.value = typeof idParam === 'string' ? idParam : null;
});

const loadPlay = async () => {
  if (!playId.value) {
    errorMessage.value = 'No s\'ha proporcionat un ID vàlid de l\'obra.';
    isLoading.value = false;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('play')
      .select('*')
      .eq('id_play', playId.value)
      .single();

    if (error) throw error;

    play.value = data;
  } catch (error: any) {
    errorMessage.value = 'No s\'ha pogut carregar la informació de l\'obra.';
  } finally {
    isLoading.value = false;
  }
};

const loadUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return;

  userId.value = data.user.id;

  const { data: userData } = await supabase
    .from('usuarios')
    .select('name, is_admin')
    .eq('user_id', userId.value)
    .single();

  userName.value = userData?.name || 'Usuari';
  isAdmin.value = userData?.is_admin || false;
};

const loadReviews = async () => {
  if (!playId.value) return;
  const { data, error } = await supabase
    .from('review')
    .select('id, opinion, qualification, id_user, created_at')
    .eq('id_play', playId.value)
    .order('created_at', { ascending: false });

  if (!error && data) {
    const userIds = [...new Set(data.map(r => r.id_user))];
    const { data: usersData } = await supabase
      .from('usuarios')
      .select('user_id, username')
      .in('user_id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.user_id, u.username]));

    reviews.value = data.map(r => ({
      id: r.id,
      text: r.opinion,
      rating: r.qualification,
      user: usersMap.get(r.id_user) || 'Usuari desconegut'
    }));
  }
};

async function submitReview() {
  if (!userId.value) {
    alert('Cal iniciar sessió per enviar una ressenya.');
    return;
  }
  if (!newReviewText.value || newReviewRating.value === null) {
    alert('Omple tots els camps!');
    return;
  }
  if (newReviewRating.value < 0 || newReviewRating.value > 10) {
    alert('La valoració ha de ser entre 0 i 10.');
    return;
  }

  if (!playId.value) {
    alert('Error: L\'ID de l\'obra no és vàlid.');
    return;
  }

  const { error } = await supabase
    .from('review')
    .insert([{
      id_user: userId.value,
      id_play: playId.value,
      opinion: newReviewText.value,
      qualification: newReviewRating.value
    }]);

  if (error) {
    alert('Error al guardar la ressenya: ' + error.message);
    return;
  }

  newReviewText.value = '';
  newReviewRating.value = null;
  await loadReviews();
}

async function deleteReview(id: string) {
  if (!userId.value) return;

  const { error } = await supabase
    .from('review')
    .delete()
    .eq('id', id);

  if (!error) await loadReviews();
}

onMounted(async () => {
  await loadUser();
  await loadPlay();
  await loadReviews();
});
</script>

<template>
  <ion-page>
    <!-- ✅ Nuevo encabezado con navegación -->
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="flex items-center space-x-2">
          <ion-icon :icon="filmOutline" class="text-green-400 w-5 h-5"></ion-icon>
          <span class="text-green-400">Butaca1</span>
        </ion-title>

        <ion-buttons slot="end" class="space-x-2">
          <ion-button :href="`/Principal${userId ? '?userId=' + userId : ''}`">
            <span class="text-white text-sm">Inici</span>
          </ion-button>

          <ion-button v-if="userId" :href="`/infoFavourites?userId=${userId}`">
            <span class="text-white text-sm">Favorits</span>
          </ion-button>

          <ion-button v-if="isAdmin" :href="`/manageContent?userId=${userId}`">
            <span class="text-white text-sm">Gestionar continguts</span>
          </ion-button>
        </ion-buttons>

        <ion-buttons slot="end">
          <template v-if="userId">
            <ion-button :href="`/infoUser?userId=${userId}`">
              <ion-icon :icon="personOutline" class="text-white w-5 h-5" />
            </ion-button>
          </template>
          <template v-else>
            <ion-button href="/login">
              <span class="text-white text-sm">Iniciar Sesión</span>
            </ion-button>
            <ion-button href="/Register">
              <span class="text-white text-sm">Registro</span>
            </ion-button>
          </template>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding bg-gray-100 text-gray-900">
      <div v-if="isLoading" class="ion-text-center">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="errorMessage">{{ errorMessage }}</div>

      <div v-else-if="play">
        <ion-card class="mb-6 bg-white rounded-lg shadow-md">
          <img :src="play.page" :alt="play.title" class="movie-image" />
          <ion-card-header>
            <ion-card-title>{{ play.title }}</ion-card-title>
            <ion-card-subtitle>{{ play.year }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p>{{ play.description }}</p>
            <p><strong>Creador:</strong> {{ play.creator }}</p>
            <p><strong>Personatges:</strong> {{ play.characters }}</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="p-6 bg-white rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Escriu una ressenya</h3>

          <ion-item>
            <ion-label position="stacked">Comentari</ion-label>
            <ion-textarea v-model="newReviewText" :disabled="!userId" placeholder="Què t'ha semblat l'obra?" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Valoració</ion-label>
            <div class="flex items-center">
              <ion-button
                v-for="n in 10"
                :key="n"
                @click="newReviewRating = n"
                :color="newReviewRating >= n ? 'warning' : 'medium'"
                :disabled="!userId"
              >
                <ion-icon :icon="starOutline" />
              </ion-button>
              <span class="ml-2 font-semibold">{{ newReviewRating || 0 }}/10</span>
            </div>
          </ion-item>

          <ion-button expand="block" class="mt-4" @click="submitReview" :disabled="!userId">
            Enviar ressenya
          </ion-button>
        </ion-card>

        <!-- ✅ Sección de reseñas -->
        <div class="mt-6 space-y-4">
          <ion-card
            v-for="review in reviews"
            :key="review.id"
            class="w-full p-4 bg-white rounded-md shadow"
          >
            <ion-card-header>
              <ion-card-title>{{ review.user }} - ⭐ {{ review.rating }}/10</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ review.text }}</p>
              <ion-button
                v-if="userId"
                fill="clear"
                color="danger"
                size="small"
                @click="deleteReview(review.id)"
              >
                Eliminar
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.movie-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 0.5rem;
}
</style>
