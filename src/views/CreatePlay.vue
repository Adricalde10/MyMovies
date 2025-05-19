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
          <ion-label position="floating">Títol</ion-label>
          <ion-input v-model="formData.title" type="text" required></ion-input>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="stacked">Portada</ion-label>
          <input type="file" accept="image/*" @change="handleFileChange" class="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500">
          <div v-if="coverPreview" class="mt-2">
            <img :src="coverPreview" alt="Vista prèvia de la portada" class="max-w-full h-auto rounded-md shadow-sm">
          </div>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="floating">Creador/Autoria</ion-label>
          <ion-input v-model="formData.creator" type="text"></ion-input>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="floating">Personatges (separats per comes)</ion-label>
          <ion-textarea v-model="formData.characters"></ion-textarea>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md">
          <ion-label position="floating">Any de Creació</ion-label>
          <ion-input v-model="formData.year" type="number"></ion-input>
        </ion-item>

        <ion-item class="mb-6 rounded-lg bg-white shadow-md">
          <ion-label position="floating">Descripció</ion-label>
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
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonTextarea } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import supabase from '@/supabaseClient';

const route = useRoute();
const userId = route.query.userId as string | undefined;

const router = useRouter();


const formData = ref({
  title: '',
  coverFile: null as File | null, // Permite File o null
  creator: '',
  characters: '',
  year: null,
  description: '',
});

const isLoading = ref(false); // Para controlar el estado de carga del botón
const errorMessage = ref<string | null>(null);
const coverPreview = ref<string | null>(null);

 const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    formData.value.coverFile = target.files[0];
    // Crear una URL per a la previsualització de la imatge
    coverPreview.value = URL.createObjectURL(target.files[0]);
  } else {
    formData.value.coverFile = null;
    coverPreview.value = null;
  }
}; 

const submitForm = async () => {
  console.log('Dades del formulari:', formData.value);
  if (isLoading.value) return; // Evita envíos múltiples
  isLoading.value = true;
  errorMessage.value = null;



    try {
    const { title, creator, characters, year, description, coverFile } = formData.value;

    let coverUrl: string | null = null;
    if (coverFile) {
      // 1. Subir la imagen a Supabase Storage
      const fileName = `cover-${Date.now()}-${coverFile.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('butaca1') // Asegúrate de que tienes un bucket llamado 'covers'
        .upload(fileName, coverFile, {
          cacheControl: '3600', // Opcional: Control de caché
          upsert: false,
        });

      if (storageError) {
        console.error('Error al subir la portada:', storageError);
        errorMessage.value = `Error al subir la portada: ${storageError.message}`;
        isLoading.value = false;
        return; // Importante: Detener el proceso si falla la subida
      }
      coverUrl = supabase.storage.from('butaca1').getPublicUrl(storageData.path).data.publicUrl;
    }

    // 2. Guardar los datos en la tabla 'play' de Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('play')
      .insert([
        {
          title,
          creator,
          characters: characters.split(',').map((c) => c.trim()),
          year: year ? year : null,
          description,
          page: coverUrl, // Guarda la URL de la portada
        },
      ])
      .select(); //Para que devuelva los datos insertados

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
    isLoading.value = false; // Asegura que el estado de carga se restablezca
  }


  // Aquí hauries d'implementar la lògica per guardar la nova obra,
  // incloent l'enviament del fitxer de la imatge si n'hi ha.
  // Això normalment implica utilitzar FormData per enviar fitxers
  // en una petició HTTP.

  // Exemple d'ús de FormData per enviar el fitxer (a adaptar a la teva API):
  // const uploadData = new FormData();
  // uploadData.append('title', formData.value.title);
  // if (formData.value.coverFile) {
  //   uploadData.append('cover', formData.value.coverFile);
  // }
  // uploadData.append('creator', formData.value.creator);
  // uploadData.append('characters', formData.value.characters);
  // uploadData.append('year', formData.value.year ? formData.value.year.toString() : '');
  // uploadData.append('description', formData.value.description);
  //
  // // Fes la petició HTTP amb uploadData
  // fetch('/api/obres', {
  //   method: 'POST',
  //   body: uploadData,
  // })
  // .then(response => response.json())
  // .then(data => {
  //   console.log('Obra creada:', data);
  //   router.push({ path: '/' });
  // })
  // .catch(error => {
  //   console.error('Error al crear l\'obra:', error);
  // });

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
  --padding-start: 16px;
  --inner-padding-end: 16px;
}

ion-label {
  color: var(--ion-color-gray-700);
}

ion-input,
ion-textarea {
  --padding-top: 8px;
  --padding-bottom: 8px;
  color: var(--ion-color-dark);
}
</style>
