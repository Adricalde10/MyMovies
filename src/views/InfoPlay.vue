<script setup lang="ts">
// Importem components de la interfície d'usuari d'Ionic
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonTextarea, IonLabel, IonItem,
  IonIcon, IonSpinner
} from '@ionic/vue';

// Importem funcionalitats de Vue i de navegació
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Importem el client de Supabase i icones d'Ionic
import supabase from '@/supabaseClient';
import { filmOutline, starOutline, personOutline, heartOutline, heartDislikeOutline } from 'ionicons/icons';

// Inicialitzem router i ruta actual
const route = useRoute();
const router = useRouter();

// Variables reactives per emmagatzemar dades de l'obra i de l'usuari
const playId = ref<string | null>(null);
const userId = ref<string | null>(null);
const isAdmin = ref(false); // Determina si l'usuari és administrador
const userLoaded = ref(false); // Controla si l'usuari ja s'ha carregat

// Dades de l'obra, estat de càrrega, missatge d'error i llista de ressenyes
const play = ref<any>(null);
const isLoading = ref(true);
const errorMessage = ref('');
const reviews = ref<any[]>([]);
const isFavorite = ref(false); // Indica si l'obra està als favorits

// Per nova ressenya: text i qualificació
const newReviewText = ref('');
const newReviewRating = ref<number | null>(null);

// Comprovació si l'usuari està loguejat
const isLoggedIn = computed(() => !!userId.value);

// Quan es munta el component, carreguem dades de l'obra, usuari i ressenyes
onMounted(() => {
  const idParam = route.query.id;
  playId.value = typeof idParam === 'string' ? idParam : null;
  const userParam = route.query.userId;
  userId.value = typeof userParam === 'string' ? userParam : null;

  loadUser(); // Carrega dades de l'usuari
  loadPlay(); // Carrega dades de l'obra
  loadReviews(); // Carrega ressenyes de l'obra
});

// Carrega informació de si l'usuari és admin i si l'obra és favorita
async function loadUser() {
  if (!userId.value) {
    userLoaded.value = true;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('user_id', userId.value)
      .single();

    if (!error && data) {
      isAdmin.value = data.is_admin;
    } else {
      isAdmin.value = false;
    }
  } catch {
    isAdmin.value = false;
  }
  if (playId.value) {
    await checkIfFavorite(); // Comprova si està afegit als favorits
  }
  userLoaded.value = true;
}

// Carrega dades detallades de l'obra
async function loadPlay() {
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

    if (userId.value) {
      await checkIfFavorite(); // Torna a comprovar si és favorita
    }
  } catch {
    errorMessage.value = 'No s\'ha pogut carregar la informació de l\'obra.';
  } finally {
    isLoading.value = false;
  }
}

// Carrega totes les ressenyes associades a l'obra
async function loadReviews() {
  if (!playId.value) return;
  const { data, error } = await supabase
    .from('review')
    .select('id, opinion, qualification, id_user, created_at')
    .eq('id_play', playId.value)
    .order('created_at', { ascending: false });

  if (!error && data) {
    // Obtenim els noms dels usuaris que han fet ressenyes
    const userIds = [...new Set(data.map(r => r.id_user))];
    const { data: usersData } = await supabase
      .from('usuarios')
      .select('user_id, name')
      .in('user_id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.user_id, u.name]));

    reviews.value = data.map(r => ({
      id: r.id,
      text: r.opinion,
      rating: r.qualification,
      user: usersMap.get(r.id_user) || 'Usuari desconegut',
      userId: r.id_user
    }));
  }
}

// Comprova si l'obra està als favorits de l'usuari
async function checkIfFavorite() {
  if (!userId.value || !playId.value) return;
  const { data, error } = await supabase
    .from('Favorite_play')
    .select('id')
    .eq('id_user', userId.value)
    .eq('id_play', playId.value)
    .single();

  isFavorite.value = !!data;
}

// Afegeix l'obra als favorits
async function addToFavorites() {
  if (!userId.value || !playId.value) {
    alert('Cal iniciar sessió per afegir a favorits.');
    return;
  }
  const { error } = await supabase
    .from('Favorite_play')
    .insert([{ id_user: userId.value, id_play: playId.value }]);

  if (error) {
    alert('Error al afegir a favorits: ' + error.message);
  } else {
    isFavorite.value = true;
  }
}

// Treu l'obra dels favorits
async function removeFromFavorites() {
  if (!userId.value || !playId.value) return;

  const { error } = await supabase
    .from('Favorite_play')
    .delete()
    .eq('id_user', userId.value)
    .eq('id_play', playId.value);

  if (error) {
    alert('Error al treure de favorits: ' + error.message);
  } else {
    isFavorite.value = false;
  }
}

// Afegeix una nova ressenya a l'obra
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

  // Neteja camps i recarrega ressenyes
  newReviewText.value = '';
  newReviewRating.value = null;
  await loadReviews();
}

// Elimina una ressenya si l'usuari és admin o el seu autor
async function deleteReview(id: string, reviewUserId: string) {
  if (!userId.value) return;

  // Comprovació de permisos
  if (!isAdmin.value && userId.value !== reviewUserId) {
    alert('No tens permisos per eliminar aquesta ressenya.');
    return;
  }

  const { error } = await supabase
    .from('review')
    .delete()
    .eq('id', id);

  if (!error) await loadReviews();
}
</script>


<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="flex items-center space-x-2 text-green-400">
          <ion-icon :icon="filmOutline" class="w-5 h-5" />
          <span>Butaca1</span>
        </ion-title>

        <ion-buttons slot="end" class="space-x-2">
          <ion-button :href="isLoggedIn ? `/Principal?userId=${userId}` : '/Principal'">
            <span class="text-white text-sm">Inici</span>
          </ion-button>


          <ion-button v-if="isLoggedIn" :href="`/infoFavourites?userId=${userId}`">
            <span class="text-white text-sm">Favorits</span>
          </ion-button>

          <ion-button v-if="userLoaded && isAdmin" :href="`/manageContent?userId=${userId}`">
            <span class="text-white text-sm">Gestionar continguts</span>
          </ion-button>
        </ion-buttons>

        <ion-buttons slot="end">
          <template v-if="userLoaded">
            <template v-if="isLoggedIn">
              <ion-button :href="`/infoUser?userId=${userId}`">
                <ion-icon :icon="personOutline" class="text-white w-5 h-5" />
              </ion-button>
            </template>
            <template v-else>
              <ion-button href="/login">
                <span class="text-white text-sm">Iniciar Sesión</span>
              </ion-button>
              <ion-button href="/Register">
                <span class="text-white text-sm">Registre</span>
              </ion-button>
            </template>
          </template>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding bg-gray-100 text-gray-900">
      <div v-if="isLoading" class="ion-text-center">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="errorMessage" class="ion-padding ion-text-center ion-color-danger">
        {{ errorMessage }}
      </div>

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
            <ion-button
              v-if="isLoggedIn"
              expand="block"
              :fill="isFavorite ? 'solid' : 'outline'"
              :color="isFavorite ? 'danger' : 'primary'"
              @click="isFavorite ? removeFromFavorites() : addToFavorites()"
              class="mt-4"
            >
              <ion-icon :icon="isFavorite ? heartDislikeOutline : heartOutline" slot="start" />
              {{ isFavorite ? 'Treure de favorits' : 'Afegir a favorits' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-card class="p-6 bg-white rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Escriu una ressenya</h3>

          <ion-item>
            <ion-label position="stacked">Comentari</ion-label>
            <ion-textarea v-model="newReviewText" :disabled="!isLoggedIn" placeholder="Què t'ha semblat l'obra?" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Valoració</ion-label>
            <div class="flex items-center">
              <ion-button
                v-for="n in 10"
                :key="n"
                @click="newReviewRating = n"
                :color="newReviewRating >= n ? 'warning' : 'medium'"
                :disabled="!isLoggedIn"
              >
                <ion-icon :icon="starOutline" />
              </ion-button>
              <span class="ml-2 font-semibold">{{ newReviewRating || 0 }}/10</span>
            </div>
          </ion-item>

          <ion-button
            expand="block"
            color="success"
            :disabled="!isLoggedIn || !newReviewText || newReviewRating === null"
            @click="submitReview"
            class="mt-4"
          >
            Enviar ressenya
          </ion-button>
        </ion-card>

        <ion-card class="mt-6 bg-white rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Ressenyes</h3>
          <div v-if="reviews.length === 0">Encara no hi ha ressenyes.</div>

          <div v-for="review in reviews" :key="review.id" class="mb-4 p-4 border rounded">
            <div class="flex justify-between items-center mb-1">
              <strong>{{ review.user }}</strong>
              <div>
                <span class="mr-2 font-semibold">{{ review.rating }}/10</span>
                <ion-button
                  v-if="isAdmin || userId === review.userId"
                  fill="clear"
                  color="danger"
                  size="small"
                  @click="deleteReview(review.id, review.userId)"
                >
                  Eliminar
                </ion-button>
              </div>
            </div>
            <p>{{ review.text }}</p>
          </div>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.movie-image {
  width: 100%;
  height: 250px; /* Estableix l'alçada desitjada */
  object-fit: cover;
  border-radius: 0.5rem;
}
</style>
