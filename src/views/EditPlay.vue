<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Editar obra</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding bg-gray-100">
      <div v-if="isLoading" class="ion-text-center">
        <ion-spinner name="crescent" />
      </div>
      <div v-else-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>
      <div v-else-if="play">
        <form @submit.prevent="submitForm">
          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="floating">Títol</ion-label>
            <ion-input v-model="formData.title" type="text" required :value="play.title"></ion-input>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="stacked">Portada</ion-label>
            <input type="file" accept="image/*" @change="handleFileChange" class="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500">
            <div v-if="coverPreview || play.page" class="mt-2">
              <img v-if="coverPreview" :src="coverPreview" alt="Vista prèvia de la portada" class="max-w-full h-auto rounded-md shadow-sm">
              <img v-else-if="play.page" :src="play.page" alt="Portada actual" class="max-w-full h-auto rounded-md shadow-sm">
            </div>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="floating">Creador/Autoria</ion-label>
            <ion-input v-model="formData.creator" type="text" :value="play.creator"></ion-input>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="floating">Personatges (separats per comes)</ion-label>
            <ion-textarea v-model="formData.characters" :value="play.characters"></ion-textarea>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="floating">Any de Creació</ion-label>
            <ion-input v-model="formData.year" type="number" :value="play.year"></ion-input>
          </ion-item>

          <ion-item class="mb-6 rounded-lg bg-white shadow-md">
            <ion-label position="floating">Descripció</ion-label>
            <ion-textarea v-model="formData.description" :value="play.description"></ion-textarea>
          </ion-item>

          <ion-button type="submit" expand="full" color="primary" class="rounded-lg" :disabled="isLoading">
            <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
            <span v-else>Guardar canvis</span>
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonTextarea, IonSpinner } from '@ionic/vue';
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import supabase from '@/supabaseClient';

const route = useRoute();
const router = useRouter();
const playId = ref(route.query.id as string | undefined);
const play = ref<any>(null);
const userId = route.query.userId as string | undefined;

const formData = ref({
  title: '',
  coverFile: null as File | null,
  creator: '',
  characters: '',
  year: null as number | null,
  description: '',
});
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const coverPreview = ref<string | null>(null);

const loadPlay = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  if (!playId.value) {
    errorMessage.value = 'No s\'ha proporcionat l\'ID de l\'obra.';
    isLoading.value = false;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('play')
      .select('*')
      .eq('id', playId.value)
      .single();

    if (error) throw error;

    if (data) {
      play.value = data;
      // Inicializa formData con los datos de la obra cargada
      formData.value.title = data.title;
      formData.value.creator = data.creator;
      formData.value.characters = data.characters;
      formData.value.year = data.year;
      formData.value.description = data.description;
      // Si hay una imagen cargada, la mostramos directamente
      if (data.page) {
        coverPreview.value = null; // Aseguramos que no se muestre la previsualización del nuevo archivo
      }
    } else {
      errorMessage.value = 'No s\'ha trobat l\'obra.';
    }
  } catch (error: any) {
    errorMessage.value = 'No s\'ha pogut carregar la informació de l\'obra.';
  } finally {
    isLoading.value = false;
    console.debug('Datos de la obra cargados:', play.value);
  }
};

onMounted(loadPlay);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    formData.value.coverFile = target.files[0];
    coverPreview.value = URL.createObjectURL(target.files[0]);
  } else {
    formData.value.coverFile = null;
    coverPreview.value = null;
  }
};

const submitForm = async () => {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const updates: any = {
      title: formData.value.title,
      creator: formData.value.creator,
      characters: formData.value.characters,
      year: formData.value.year,
      description: formData.value.description,
    };

    if (formData.value.coverFile) {
      // Subir la nueva imagen
      const file = formData.value.coverFile;
      const filePath = `covers/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('your_bucket_name') // Reemplaza 'your_bucket_name' con el nombre de tu bucket de almacenamiento
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Error al subir la portada: ${uploadError.message}`);
      }

      const { data: publicUrl } = supabase.storage
        .from('your_bucket_name') // Reemplaza 'your_bucket_name' con el nombre de tu bucket de almacenamiento
        .getPublicUrl(filePath);

      updates.page = publicUrl.publicUrl;
    }

    // Actualizar la base de datos
    const { error: updateError } = await supabase
      .from('play')
      .update(updates)
      .eq('id', playId.value);

    if (updateError) {
      throw new Error(`Error al actualizar la obra: ${updateError.message}`);
    }

    console.log('Obra actualizada correctamente');
    router.push({
      path: '/ManageContent',
      query: {
        userId: userId,
      },
    });
  } catch (error: any) {
    errorMessage.value = error.message;
    console.error('Error al guardar los cambios:', error);
  } finally {
    isLoading.value = false;
  }
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
