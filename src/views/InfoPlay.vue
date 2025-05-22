<script setup lang="ts">
// Importacions dels components d'Ionic Vue que s'utilitzen en aquesta vista.
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonTextarea, IonLabel, IonItem,
  IonIcon, IonSpinner
} from '@ionic/vue';
// Importacions de funcions de Vue per a la reactivitat i el cicle de vida del component.
import { ref, onMounted, computed } from 'vue';
// Importacions de funcions de vue-router per accedir a la ruta actual i per a la navegació.
import { useRoute, useRouter } from 'vue-router';
// Importació de la instància de Supabase client creada en un altre fitxer.
import supabase from '@/supabaseClient';
// Importació d'icones d'Ionicons que s'utilitzen en la interfície d'usuari.
import { filmOutline, starOutline, personOutline, heartOutline, heartDislikeOutline } from 'ionicons/icons';
// Importació de l'estat de l'usuari des de la botiga d'autenticació.
import { user } from '@/authStore';

// Obtenció de la instància de la ruta actual. Això permet accedir als paràmetres de la URL.
const route = useRoute();
// Obtenció de la instància del router per a la navegació programàtica. Això permet canviar de ruta des del codi.
const router = useRouter();

// Ref per emmagatzemar l'ID de l'obra que es visualitza. Inicialment és null, ja que no s'ha carregat cap obra.
const playId = ref<string | null>(null);
// Ref per emmagatzemar l'ID de l'usuari actual. Inicialment és null, ja que l'usuari pot no estar loguejat.
const userId = ref<string | null>(null);
// Ref per indicar si l'usuari actual és administrador. Inicialment és false.
const isAdmin = ref(false);
// Ref per indicar si la informació de l'usuari s'ha carregat. Inicialment és false per controlar el flux de dades.
const userLoaded = ref(false);

// Ref per emmagatzemar la informació de l'obra carregada des de la base de dades. Inicialment és null.
const play = ref<any>(null);
// Ref per indicar si s'estan carregant dades. Inicialment és true per mostrar un indicador de càrrega.
const isLoading = ref(true);
// Ref per emmagatzemar un missatge d'error en cas de fallada en la càrrega de dades. Inicialment està buit.
const errorMessage = ref('');
// Ref per emmagatzemar la llista de ressenyes de l'obra. Inicialment és un array buit.
const reviews = ref<any[]>([]);
// Ref per indicar si l'obra actual està a la llista de favorits de l'usuari. Inicialment és false.
const isFavorite = ref(false);

// Ref per emmagatzemar el text de la nova ressenya que l'usuari vol enviar. Inicialment està buit.
const newReviewText = ref('');
// Ref per emmagatzemar la valoració de la nova ressenya. Inicialment és null.
const newReviewRating = ref<number | null>(null);

// Computed property per determinar si l'usuari està autenticat basant-se en si userId té un valor.
const isLoggedIn = computed(() => !!userId.value);

// Hook onMounted que s'executa quan el component es munta.
onMounted(() => {
  // Obté el paràmetre 'id' de la query de la ruta actual. Aquest ID s'utilitza per carregar la informació de l'obra específica.
  const idParam = route.query.id;
  // Assigna el valor del paràmetre 'id' a la variable reactiva playId. Si no és una cadena, s'assigna null.
  playId.value = typeof idParam === 'string' ? idParam : null;

  // Obté el paràmetre 'userId' de la query de la ruta actual. Aquest ID s'utilitza per identificar l'usuari loguejat.
  const userParam = route.query.userId;
  // Assigna el valor del paràmetre 'userId' a la variable reactiva userId.
  // Només s'assigna si és una cadena i no és explícitament 'null' o 'undefined'.
  userId.value = (typeof userParam === 'string' && userParam !== 'null' && userParam !== 'undefined') ? userParam : null;

  // Crida a les funcions asíncrones per carregar la informació de l'usuari, l'obra i les seves ressenyes.
  loadUser();
  loadPlay();
  loadReviews();
});

// Funció asíncrona per carregar la informació de l'usuari des de la base de dades.
async function loadUser() {
  // Si no hi ha un userId (l'usuari no està loguejat), marca que la càrrega de l'usuari ha acabat i retorna.
  if (!userId.value) {
    userLoaded.value = true;
    return;
  }
  try {
    // Fa una consulta a la taula 'usuarios' de Supabase per obtenir el camp 'is_admin' de l'usuari amb l'ID corresponent.
    const { data, error } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('user_id', userId.value)
      .single(); // Utilitza .single() perquè s'espera un únic resultat.

    // Si no hi ha error i es troben dades, assigna el valor de 'is_admin' a la variable reactiva isAdmin.
    if (!error && data) {
      isAdmin.value = data.is_admin;
    } else {
      // Si hi ha un error o no es troben dades, assumeix que l'usuari no és administrador.
      isAdmin.value = false;
    }
  } catch {
    // En cas d'error durant la consulta, assumeix que l'usuari no és administrador.
    isAdmin.value = false;
  }
  // Si hi ha un playId (s'està visualitzant una obra), comprova si aquesta obra està a la llista de favorits de l'usuari.
  if (playId.value) {
    await checkIfFavorite();
  }
  // Marca que la informació de l'usuari s'ha carregat, independentment de si s'ha trobat o no.
  userLoaded.value = true;
}

// Funció asíncrona per carregar la informació de l'obra des de la base de dades.
async function loadPlay() {
  // Si no hi ha un playId vàlid, assigna un missatge d'error i marca que la càrrega ha acabat.
  if (!playId.value) {
    errorMessage.value = 'No s\'ha proporcionat un ID vàlid de l\'obra.';
    isLoading.value = false;
    return;
  }
  try {
    // Fa una consulta a la taula 'play' de Supabase per obtenir tota la informació de l'obra amb l'ID corresponent.
    const { data, error } = await supabase
      .from('play')
      .select('*') // Selecciona totes les columnes de la taula 'play'.
      .eq('id_play', playId.value)
      .single(); // Utilitza .single() perquè s'espera una única obra amb aquest ID.

    // Si hi ha un error durant la consulta, llença l'error per ser capturat pel bloc catch.
    if (error) throw error;

    // Assigna les dades de l'obra a la variable reactiva play.
    play.value = data;

    // Si hi ha un userId (l'usuari està loguejat), comprova si l'obra actual està a la seva llista de favorits.
    if (userId.value) {
      await checkIfFavorite();
    }
  } catch {
    // En cas d'error durant la consulta, assigna un missatge d'error per mostrar-lo a l'usuari.
    errorMessage.value = 'No s\'ha pogut carregar la informació de l\'obra.';
  } finally {
    // Marca que la càrrega ha acabat, independentment de si hi ha hagut èxit o error.
    isLoading.value = false;
  }
}

// Funció asíncrona per carregar les ressenyes de l'obra des de la base de dades.
async function loadReviews() {
  // Si no hi ha un playId, no es pot carregar les ressenyes, així que la funció retorna.
  if (!playId.value) return;

  // Fa una consulta a la taula 'review' de Supabase per obtenir les ressenyes de l'obra amb l'ID corresponent.
  const { data, error } = await supabase
    .from('review')
    .select('id, opinion, qualification, id_user, created_at') // Selecciona els camps necessaris de la taula 'review'.
    .eq('id_play', playId.value) // Filtra les ressenyes per l'ID de l'obra actual.
    .order('created_at', { ascending: false }); // Ordena les ressenyes per data de creació de manera descendent (les més recents primer).

  // Si no hi ha error i s'han trobat dades (ressenyes).
  if (!error && data) {
    // Crea un nou Set amb els IDs d'usuari de totes les ressenyes. Això elimina duplicats i permet obtenir una llista d'usuaris únics.
    const userIds = [...new Set(data.map(r => r.id_user))];

    // Fa una consulta a la taula 'usuarios' per obtenir els noms dels usuaris corresponents als IDs trobats a les ressenyes.
    const { data: usersData, error: usersError } = await supabase
      .from('usuarios')
      .select('user_id, name') // Selecciona l'ID d'usuari i el nom de la taula 'usuarios'.
      .in('user_id', userIds); // Filtra els usuaris on l'ID d'usuari estigui dins de la llista d'IDs únics de les ressenyes.

    // Si hi ha un error en la càrrega dels usuaris, mostra un missatge d'error a la consola.
    if (usersError) {
      console.error('Error al cargar usuarios:', usersError);
    }

    // Log dels datos de usuarios para depuración.
    console.log('Datos de usuarios:', usersData);

    // Crea un nou Map on la clau és l'ID de l'usuari i el valor és el seu nom. Això facilita la cerca del nom d'usuari per cada ressenya.
    const usersMap = new Map(
      (usersData || []).map(u => [u.user_id, u.name]) // Mapeja l'array d'usuaris a un array de parells [ID d'usuari, nom].
    );

    // Log del mapa de usuarios para depuración.
    console.log('Mapa de usuarios:', Array.from(usersMap.entries()));

    // Mapeja l'array de ressenyes per incloure el nom de l'usuari que va fer la ressenya.
    reviews.value = data.map(r => ({
      id: r.id,
      text: r.opinion,
      rating: r.qualification,
      user: usersMap.get(r.id_user) || 'Usuari desconegut', // Obté el nom de l'usuari del mapa. Si no es troba, mostra 'Usuari desconegut'.
      userId: r.id_user
    }));
  } else {
    // Si hi ha un error en la càrrega de les ressenyes, mostra un missatge d'error a la consola.
    console.error('Error al cargar reseñas:', error);
  }
}

// Funció asíncrona per comprovar si l'obra actual està a la llista de favorits de l'usuari.
async function checkIfFavorite() {
  // Si no hi ha un userId o un playId, no es pot comprovar si és favorit, així que la funció retorna.
  if (!userId.value || !playId.value) return;
  // Fa una consulta a la taula 'Favorite_play' per veure si hi ha una entrada amb l'ID de l'usuari i l'ID de l'obra actual.
  const { data, error } = await supabase
    .from('Favorite_play')
    .select('id') // Només necessitem un camp per comprovar si existeix la relació.
    .eq('id_user', userId.value) // Filtra per l'ID de l'usuari actual.
    .eq('id_play', playId.value) // Filtra per l'ID de l'obra actual.
    .single(); // Utilitza .single() perquè s'espera com a màxim una entrada.

  // Assigna true a isFavorite si es troba una entrada (és a dir, l'obra és favorita), i false en cas contrari (data serà null).
  isFavorite.value = !!data;
}

async function addToFavorites() {
  // Funció asíncrona per afegir l'obra actual a la llista de favorits de l'usuari.
  if (!userId.value || !playId.value) {
    // Si no hi ha ID d'usuari o ID d'obra, mostra una alerta i deté l'execució.
    alert('Cal iniciar sessió per afegir a favorits.');
    return;
  }
  // Intenta inserir una nova entrada a la taula 'Favorite_play' amb l'ID d'usuari i l'ID d'obra actuals.
  const { error } = await supabase
    .from('Favorite_play')
    .insert([{ id_user: userId.value, id_play: playId.value }]);

  // Comprova si hi ha hagut algun error durant la inserció.
  if (error) {
    // Si hi ha un error, mostra una alerta amb el missatge d'error.
    alert('Error al afegir a favorits: ' + error.message);
  } else {
    // Si la inserció ha estat exitosa, actualitza la variable 'isFavorite' a true.
    isFavorite.value = true;
  }
}

async function removeFromFavorites() {
  // Funció asíncrona per eliminar l'obra actual de la llista de favorits de l'usuari.
  if (!userId.value || !playId.value) return;
  // Si no hi ha ID d'usuari o ID d'obra, deté l'execució.

  // Intenta eliminar l'entrada de la taula 'Favorite_play' que correspon a l'ID d'usuari i l'ID d'obra actuals.
  const { error } = await supabase
    .from('Favorite_play')
    .delete()
    .eq('id_user', userId.value)
    .eq('id_play', playId.value);

  // Comprova si hi ha hagut algun error durant l'eliminació.
  if (error) {
    // Si hi ha un error, mostra una alerta amb el missatge d'error.
    alert('Error al treure de favorits: ' + error.message);
  } else {
    // Si l'eliminació ha estat exitosa, actualitza la variable 'isFavorite' a false.
    isFavorite.value = false;
  }
}

async function submitReview() {
  // Funció asíncrona per enviar una nova ressenya per a l'obra actual.
  if (!userId.value) {
    // Si no hi ha ID d'usuari, mostra una alerta i deté l'execució.
    alert('Cal iniciar sessió per enviar una ressenya.');
    return;
  }
  // Comprova si el text de la ressenya està buit o si la valoració és null.
  if (!newReviewText.value || newReviewRating.value === null) {
    // Si algun dels camps està buit, mostra una alerta i deté l'execució.
    alert('Omple tots els camps!');
    return;
  }
  // Comprova si la valoració està fora del rang vàlid (0-10).
  if (newReviewRating.value < 0 || newReviewRating.value > 10) {
    // Si la valoració no és vàlida, mostra una alerta i deté l'execució.
    alert('La valoració ha de ser entre 0 i 10.');
    return;
  }
  // Comprova si hi ha un ID d'obra vàlid.
  if (!playId.value) {
    // Si no hi ha ID d'obra, mostra una alerta i deté l'execució.
    alert('Error: L\'ID de l\'obra no és vàlid.');
    return;
  }

  // Intenta inserir una nova ressenya a la taula 'review' amb les dades proporcionades.
  const { error } = await supabase
    .from('review')
    .insert([{
      id_user: userId.value,
      id_play: playId.value,
      opinion: newReviewText.value,
      qualification: newReviewRating.value
    }]);

  // Comprova si hi ha hagut algun error durant la inserció.
  if (error) {
    // Si hi ha un error, mostra una alerta amb el missatge d'error i deté l'execució.
    alert('Error al guardar la ressenya: ' + error.message);
    return;
  }

  // Si la inserció ha estat exitosa, reinicia els camps de la ressenya.
  newReviewText.value = '';
  newReviewRating.value = null;
  // Torna a carregar les ressenyes per mostrar la nova ressenya.
  await loadReviews();
}

async function deleteReview(id: string, reviewUserId: string) {
  // Funció asíncrona per eliminar una ressenya específica.
  if (!userId.value) return;
  // Si no hi ha ID d'usuari, deté l'execució.

  // Comprova si l'usuari actual és administrador o l'autor de la ressenya.
  if (!isAdmin.value && userId.value !== reviewUserId) {
    // Si no té permisos, mostra una alerta i deté l'execució.
    alert('No tens permisos per eliminar aquesta ressenya.');
    return;
  }

  // Intenta eliminar la ressenya de la taula 'review' amb l'ID proporcionat.
  const { error } = await supabase
    .from('review')
    .delete()
    .eq('id', id);

  // Si no hi ha hagut cap error durant l'eliminació, torna a carregar les ressenyes.
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
    <ion-button :href="`/Principal?userId=${userId}`">
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
          <span class="text-white text-sm">Registro</span>
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
