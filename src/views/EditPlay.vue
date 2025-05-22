<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"> </ion-back-button>
        </ion-buttons>
        <ion-title>Editar obra</ion-title> </ion-toolbar>
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
            <ion-label position="stacked" class="label-grande">Títol</ion-label>
            <ion-input v-model="formData.title" type="text" required :value="play.title"></ion-input>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="stacked" class="label-grande">Portada</ion-label>
            <input type="file" accept="image/*" @change="handleFileChange" class="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500">
            <div v-if="coverPreview || play.page" class="mt-2">
              <img v-if="coverPreview" :src="coverPreview" alt="Vista prèvia de la portada" class="max-w-full h-auto rounded-md shadow-sm">
              <img v-else-if="play.page" :src="play.page" alt="Portada actual" class="max-w-full h-auto rounded-md shadow-sm">
            </div>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="stacked" class="label-grande">Creador/Autoria</ion-label>
            <ion-input v-model="formData.creator" type="text" :value="play.creator"></ion-input>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="stacked" class="label-grande">Personatges (separats per comes)</ion-label>
            <ion-textarea v-model="formData.characters" :value="play.characters"></ion-textarea>
          </ion-item>

          <ion-item class="mb-4 rounded-lg bg-white shadow-md">
            <ion-label position="stacked" class="label-grande">Any de Creació</ion-label>
            <ion-input v-model="formData.year" type="number" :value="play.year"></ion-input>
          </ion-item>

          <ion-item class="mb-6 rounded-lg bg-white shadow-md">
            <ion-label position="stacked" class="label-grande">Descripció</ion-label>
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
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonTextarea, IonSpinner } from '@ionic/vue'; // Importa els components d'Ionic necessaris
import { ref, onMounted, watch } from 'vue'; // Importa 'ref' per a variables reactives, 'onMounted' per a accions al muntar i 'watch' per observar canvis
import { useRouter, useRoute } from 'vue-router'; // Importa 'useRouter' per la navegació i 'useRoute' per accedir a la ruta actual
import supabase from '@/supabaseClient'; // Importa la instància configurada de Supabase

const route = useRoute(); // Obté l'objecte de la ruta actual
const router = useRouter(); // Obté l'objecte del router per a la navegació
const playId = ref(route.query.id as string | undefined); // Obté l'ID de l'obra de la query, tipat com a string o undefined, i el fa reactiu
const play = ref<any>(null); // Defineix una variable reactiva per emmagatzemar les dades de l'obra a editar, inicialment null i de tipus 'any'
const userId = route.query.userId as string | undefined; // Obté l'ID de l'usuari de la query, tipat com a string o undefined

const formData = ref({ // Defineix un objecte reactiu per emmagatzemar les dades del formulari d'edició
  title: '',
  coverFile: null as File | null, // Permet un objecte File o null per al nou fitxer de portada
  creator: '',
  characters: '',
  year: null as number | null, // Permet un número o null per l'any
  description: '',
});
const isLoading = ref(false); // Variable reactiva per controlar si s'està carregant o guardant dades
const errorMessage = ref<string | null>(null); // Variable reactiva per emmagatzemar missatges d'error
const coverPreview = ref<string | null>(null); // Variable reactiva per emmagatzemar la URL de la previsualització de la nova portada

const loadPlay = async () => { // Funció asíncrona per carregar les dades de l'obra a editar
  isLoading.value = true; // Indica que la càrrega està en curs
  errorMessage.value = null; // Reinicia qualsevol missatge d'error anterior
  if (!playId.value) { // Si no s'ha proporcionat un ID de l'obra
    errorMessage.value = 'No s\'ha proporcionat l\'ID de l\'obra.';
    isLoading.value = false;
    return;
  }
  try {
    const { data, error } = await supabase
      .from('play') // Consulta la taula 'play'
      .select('*') // Selecciona totes les columnes
      .eq('id', playId.value) // Filtra per l'ID de l'obra
      .single(); // Espera un únic resultat

    if (error) throw error; // Si hi ha un error en la consulta, el llança

    if (data) { // Si s'han trobat dades de l'obra
      play.value = data; // Assigna les dades a la variable reactiva 'play'
      // Inicialitza formData amb los datos de la obra cargada
      formData.value.title = data.title;
      formData.value.creator = data.creator;
      formData.value.characters = data.characters;
      formData.value.year = data.year;
      formData.value.description = data.description;
      // Si hay una imagen cargada, la mostramos directamente
      if (data.page) {
        coverPreview.value = null; // Aseguramos que no se muestre la previsualización del nuevo archivo
      }
    } else { // Si no s'ha trobat l'obra amb l'ID proporcionat
      errorMessage.value = 'No s\'ha trobat l\'obra.';
    }
  } catch (error: any) { // Captura qualsevol error durant la càrrega
    errorMessage.value = 'No s\'ha pogut carregar la informació de l\'obra.';
  } finally {
    isLoading.value = false; // Indica que la càrrega ha finalitzat
    console.debug('Datos de la obra cargados:', play.value);
  }
};

onMounted(loadPlay); // Crida la funció 'loadPlay' quan el component es munta

const handleFileChange = (event: Event) => { // Funció que es crida quan l'usuari selecciona un nou fitxer de portada
  const target = event.target as HTMLInputElement; // Casteja l'event target a un input de tipus fitxer
  if (target.files && target.files.length > 0) { // Si s'ha seleccionat almenys un fitxer
    formData.value.coverFile = target.files[0]; // Assigna el primer fitxer a 'formData.coverFile'
    coverPreview.value = URL.createObjectURL(target.files[0]); // Crea una URL local per previsualitzar la nova imatge
  } else { // Si no s'ha seleccionat cap fitxer
    formData.value.coverFile = null; // Neteja el fitxer de portada en 'formData'
    coverPreview.value = null; // Neteja la URL de la previsualització
  }
};

const submitForm = async () => { // Funció asíncrona per enviar el formulari d'edició
  isLoading.value = true; // Indica que la guardada està en curs
  errorMessage.value = null; // Reinicia qualsevol missatge d'error anterior

  try {
    const updates: any = { // Defineix un objecte per contenir els camps a actualitzar
      title: formData.value.title,
      creator: formData.value.creator,
      characters: formData.value.characters,
      year: formData.value.year,
      description: formData.value.description,
    };

    if (formData.value.coverFile) { // Si s'ha seleccionat un nou fitxer de portada
      // Subir la nueva imagen
      const file = formData.value.coverFile;
      const filePath = `covers/${Date.now()}-${file.name}`; // Genera una nova ruta de fitxer única
      const { error: uploadError } = await supabase.storage
        .from('butaca1') // Especifica el bucket de Supabase Storage
        .upload(filePath, file, { // Puja el nou fitxer
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) { // Si hi ha un error en la pujada
        throw new Error(`Error al subir la portada: ${uploadError.message}`);
      }

      const { data: publicUrl } = supabase.storage
        .from('butaca1') // Especifica el bucket de Supabase Storage
        .getPublicUrl(filePath); // Obté la URL pública del nou fitxer pujat

      updates.page = publicUrl.publicUrl; // Assigna la nova URL de la portada a l'objecte d'actualitzacions
    }

    // Actualitzar la base de datos
    const { error: updateError } = await supabase
      .from('play') // Consulta la taula 'play'
      .update(updates) // Actualitza les columnes amb els valors de 'updates'
      .eq('id', playId.value); // Filtra per l'ID de l'obra a editar

    if (updateError) { // Si hi ha un error en l'actualització de la base de dades
      throw new Error(`Error al actualizar la obra: ${updateError.message}`);
    }

    console.log('Obra actualizada correctamente');
    router.push({ // Redirigeix a la pàgina de gestió de contingut
      path: '/ManageContent',
      query: {
        userId: userId,
      },
    });
  } catch (error: any) { // Captura qualsevol error durant el procés de guardat
    errorMessage.value = error.message;
    console.error('Error al guardar los cambios:', error);
  } finally {
    isLoading.value = false; // Indica que la guardada ha finalitzat
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

/* Estil per fer la lletra de la label més gran */
.label-grande {
  font-size: 1.2em; /* Ajusta la mida segons vulguis */
  font-weight: bold; /* Opcional: posar en negreta */
}
</style>
