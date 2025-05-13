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
  IonSpinner
} from '@ionic/vue';

import { ref, onMounted } from 'vue';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://fpfhlrgmxkswobvvpiwz.supabase.co';  // Reemplaza con tu URL de Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZmhscmdteGtzd29idnZwaXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNjM5MjMsImV4cCI6MjA2MjYzOTkyM30.XYbpK011ReKhVYs8df7fu6KDtd4lBoJoWDkYDZ061os';  // Reemplaza con tu clave anónima de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

const movies = ref<{ id: number; title: string; year: number }[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Cargar las películas desde Supabase
const loadMovies = async () => {
  try {
    const { data, error } = await supabase
      .from('movies')  // Reemplaza con el nombre de tu tabla en Supabase
      .select('*')
      .order('id', { ascending: true });  // Opcional: Ordenar por ID

    if (error) {
      throw new Error(error.message);
    }

    // Mapear los resultados
    movies.value = data.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.year
    }));

    isLoading.value = false;
  } catch (error) {
    console.error('Error al cargar las películas:', error);
    errorMessage.value = 'No se pudo cargar las películas.';
    isLoading.value = false;
  }
};

onMounted(() => {
  loadMovies();
});
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis Películas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Mostrar un Spinner mientras se cargan los datos -->
      <div v-if="isLoading">
        <IonSpinner name="crescent" />
      </div>

      <!-- Si hay un error -->
      <div v-else-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Si se cargan películas -->
      <ion-list v-else>
        <ion-item v-for="movie in movies" :key="movie.id">
          <ion-label>
            <h2>{{ movie.title }}</h2>
            <p>{{ movie.year }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
