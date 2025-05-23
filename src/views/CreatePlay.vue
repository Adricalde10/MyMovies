<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Nova obra</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding bg-gray-100">
      <form @submit.prevent="submitForm">
        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="stacked" class="label-grande">Títol</ion-label>
          <ion-input v-model="formData.title" type="text" required></ion-input>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="stacked" class="label-grande">Portada</ion-label>
          <input type="file" accept="image/*" @change="handleFileChange" class="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500">
          <div v-if="coverPreview" class="mt-2">
            <img :src="coverPreview" alt="Vista prèvia de la portada" class="max-w-full h-auto rounded-md shadow-sm">
          </div>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="stacked" class="label-grande">Creador/Autoria</ion-label>
          <ion-input v-model="formData.creator" type="text"></ion-input>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="stacked" class="label-grande">Personatges</ion-label>
          <ion-textarea v-model="formData.characters"></ion-textarea>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="stacked" class="label-grande">Any de Creació</ion-label>
          <ion-input v-model="formData.year" type="number"></ion-input>
        </ion-item>

        <ion-item class="mb-6 rounded-lg bg-white shadow-md">
          <ion-label position="stacked" class="label-grande">Descripció</ion-label>
          <ion-textarea v-model="formData.description"></ion-textarea>
        </ion-item>

        <ion-button type="submit" expand="full" color="primary" class="rounded-lg">
          Guardar canvis
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// Importació dels components d'Ionic per a la construcció de la interfície d'usuari.
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonTextarea } from '@ionic/vue';
// Importació de funcions de Vue per a la reactivitat i el cicle de vida.
import { ref, onMounted } from 'vue';
// Importació de Vue Router per gestionar la navegació.
import { useRouter, useRoute } from 'vue-router';
// Importació de la instància de Supabase prèviament configurada.
import supabase from '@/supabaseClient';

// Obtenim la ruta actual per llegir els paràmetres de la URL.
const route = useRoute();
// Obtenim l'userId des dels paràmetres de la query.
const userId = route.query.userId as string | undefined;

// Instància del router per fer redireccions programàtiques.
const router = useRouter();

// Objecte reactiu per emmagatzemar les dades del formulari.
const formData = ref({
  title: '',                       // Títol de l’obra
  coverFile: null as File | null, // Fitxer de portada seleccionat
  creator: '',                    // Autor o creador
  characters: '',                 // Personatges
  year: null,                     // Any
  description: '',                // Descripció
});

// Estat de càrrega per evitar múltiples enviaments.
const isLoading = ref(false);
// Missatge d'error si alguna operació falla.
const errorMessage = ref<string | null>(null);
// Previsualització de la portada seleccionada.
const coverPreview = ref<string | null>(null);

// Funció per gestionar el canvi de fitxer (imatge de portada).
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    formData.value.coverFile = target.files[0]; // Assignem el fitxer seleccionat
    coverPreview.value = URL.createObjectURL(target.files[0]); // Previsualització
  } else {
    formData.value.coverFile = null;
    coverPreview.value = null;
  }
};

// Funció asíncrona per enviar el formulari
const submitForm = async () => {
  console.log('Dades del formulari:', formData.value);
  if (isLoading.value) return; // Evitem dobles clics
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const { title, creator, characters, year, description, coverFile } = formData.value;

    let coverUrl: string | null = null;

    if (coverFile) {
      // Generem un nom únic per evitar col·lisions
      const fileName = `cover-${Date.now()}-${coverFile.name}`;

      // Pugem el fitxer al bucket 'butaca1' de Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('butaca1')
        .upload(fileName, coverFile, {
          cacheControl: '3600', // Control de caché (opcional)
          upsert: false,        // No sobreescriure fitxers existents
        });

      if (storageError) {
        console.error('Error al subir la portada:', storageError);
        errorMessage.value = `Error al subir la portada: ${storageError.message}`;
        isLoading.value = false;
        return;
      }

      // Obtenim la URL pública de la imatge
      coverUrl = supabase.storage.from('butaca1').getPublicUrl(storageData.path).data.publicUrl;
    }

    // Inserim les dades a la taula 'play'
    const { data: dbData, error: dbError } = await supabase
      .from('play')
      .insert([
        {
          title,
          creator,
          characters: characters,
          year: year ? year : null,
          description,
          page: coverUrl, // URL de la portada
        },
      ])
      .select(); // Retorna les dades creades

    if (dbError) {
      console.error('Error al insertar en la base de datos:', dbError);
      errorMessage.value = `Error al guardar la obra: ${dbError.message}`;
      isLoading.value = false;
      return;
    }

    console.log('Obra creada correctamente:', dbData);

  } catch (error: any) {
    console.error('Error inesperado:', error);
    errorMessage.value = `Error inesperado: ${error.message}`;
  } finally {
    isLoading.value = false; // Restablim estat de càrrega
  }

  // Redirigim a la pàgina de gestió de contingut
  router.push({
    path: '/ManageContent',
    query: {
      userId: userId,
    }
  });
};
</script>

<style scoped>
ion-item {
  --padding-start: 16px;        /* Espai al començament de l’element */
  --inner-padding-end: 16px;    /* Espai al final de l’interior de l’element */
}

ion-label {
  color: var(--ion-color-gray-700); /* Color del text de les etiquetes */
}

ion-input,
ion-textarea {
  --padding-top: 8px;
  --padding-bottom: 8px;
  color: var(--ion-color-dark);     /* Color del text dins del camp */
}

/* Estil per fer la lletra de la label més gran */
.label-grande {
  font-size: 1.2em;   /* Mida de lletra més gran */
  font-weight: bold;  /* Text en negreta */
}
</style>
