<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"> </ion-back-button>
        </ion-buttons>
        <ion-title>Nova obra</ion-title> </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding bg-gray-100"> <form @submit.prevent="submitForm"> <ion-item class="mb-4 rounded-lg bg-white shadow-md"> <ion-label position="stacked" class="label-grande">Títol</ion-label> <ion-input v-model="formData.title" type="text" required></ion-input> </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md"> <ion-label position="stacked" class="label-grande">Portada</ion-label> <input type="file" accept="image/*" @change="handleFileChange" class="w-full py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500">
          <div v-if="coverPreview" class="mt-2"> <img :src="coverPreview" alt="Vista prèvia de la portada" class="max-w-full h-auto rounded-md shadow-sm">
          </div>
        </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md"> <ion-label position="stacked" class="label-grande">Creador/Autoria</ion-label> <ion-input v-model="formData.creator" type="text"></ion-input> </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md"> <ion-label position="stacked" class="label-grande">Personatges</ion-label> <ion-textarea v-model="formData.characters"></ion-textarea> </ion-item>

        <ion-item class="mb-4 rounded-lg bg-white shadow-md"> <ion-label position="stacked" class="label-grande">Any de Creació</ion-label> <ion-input v-model="formData.year" type="number"></ion-input> </ion-item>

        <ion-item class="mb-6 rounded-lg bg-white shadow-md"> <ion-label position="stacked" class="label-grande">Descripció</ion-label> <ion-textarea v-model="formData.description"></ion-textarea> </ion-item>

        <ion-button type="submit" expand="full" color="primary" class="rounded-lg"> Guardar canvis
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonTextarea } from '@ionic/vue'; // Importació dels components d'Ionic necessaris
import { ref, onMounted } from 'vue'; // Importació de 'ref' per a variables reactives i 'onMounted' per a accions al muntar el component
import { useRouter, useRoute } from 'vue-router'; // Importació de 'useRouter' per la navegació i 'useRoute' per accedir a la ruta actual
import supabase from '@/supabaseClient'; // Importació de la instància de Supabase

const route = useRoute(); // Obté l'objecte de la ruta actual
const userId = route.query.userId as string | undefined; // Obté el 'userId' dels paràmetres de la query, amb tipus string o undefined

const router = useRouter(); // Obté l'objecte del router per a la navegació


const formData = ref({ // Defineix un objecte reactiu per emmagatzemar les dades del formulari
  title: '',
  coverFile: null as File | null, // Permet un objecte File o null per al fitxer de portada
  creator: '',
  characters: '',
  year: null,
  description: '',
});

const isLoading = ref(false); // Variable reactiva per controlar si s'està processant l'enviament del formulari
const errorMessage = ref<string | null>(null); // Variable reactiva per emmagatzemar missatges d'error
const coverPreview = ref<string | null>(null); // Variable reactiva per emmagatzemar la URL de la previsualització de la portada

 const handleFileChange = (event: Event) => { // Funció que es crida quan canvia el fitxer seleccionat
  const target = event.target as HTMLInputElement; // Casteja l'event target a un input de tipus fitxer
  if (target.files && target.files.length > 0) { // Verifica si hi ha algun fitxer seleccionat
    formData.value.coverFile = target.files[0]; // Assigna el primer fitxer seleccionat a 'formData.coverFile'
    // Crear una URL per a la previsualització de la imatge
    coverPreview.value = URL.createObjectURL(target.files[0]); // Crea una URL local per previsualitzar la imatge seleccionada
  } else {
    formData.value.coverFile = null; // Si no hi ha fitxers, neteja 'formData.coverFile'
    coverPreview.value = null; // I neteja la URL de la previsualització
  }
};

const submitForm = async () => { // Funció asíncrona que s'executa al enviar el formulari
  console.log('Dades del formulari:', formData.value); // Mostra les dades del formulari a la consola
  if (isLoading.value) return; // Si ja s'està carregant, evita enviaments múltiples
  isLoading.value = true; // Estableix l'estat de càrrega a true
  errorMessage.value = null; // Reinicia el missatge d'error

  try {
    const { title, creator, characters, year, description, coverFile } = formData.value; // Desestructura les dades del formulari

    let coverUrl: string | null = null; // Inicialitza la variable per la URL de la portada
    if (coverFile) { // Si hi ha un fitxer de portada seleccionat
      // 1. Subir la imagen a Supabase Storage
      const fileName = `cover-${Date.now()}-${coverFile.name}`; // Genera un nom de fitxer únic
      const { data: storageData, error: storageError } = await supabase.storage
        .from('butaca1') // Especifica el bucket de Supabase Storage ('butaca1')
        .upload(fileName, coverFile, { // Puja el fitxer
          cacheControl: '3600', // Opcional: Control de caché
          upsert: false,
        });

      if (storageError) { // Si hi ha un error al pujar la portada
        console.error('Error al subir la portada:', storageError);
        errorMessage.value = `Error al subir la portada: ${storageError.message}`;
        isLoading.value = false;
        return; // Importante: Detener el proceso si falla la subida
      }
      coverUrl = supabase.storage.from('butaca1').getPublicUrl(storageData.path).data.publicUrl; // Obté la URL pública de la imatge pujada
    }

    // 2. Guardar los datos en la tabla 'play' de Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('play') // Especifica la taula de Supabase ('play')
      .insert([ // Insereix una nova fila amb les dades del formulari
        {
          title,
          creator,
          characters: characters, // Guarda la string tal cual
          year: year ? year : null,
          description,
          page: coverUrl, // Guarda la URL de la portada
        },
      ])
      .select(); // Para que devuelva los datos insertados

    if (dbError) { // Si hi ha un error al inserir les dades a la base de dades
      console.error('Error al insertar en la base de datos:', dbError);
      errorMessage.value = `Error al guardar la obra: ${dbError.message}`;
      isLoading.value = false;
      return;
    }

    console.log('Obra creada correctamente:', dbData); // Mostra les dades de la obra creada a la consola

  } catch (error: any) { // Captura qualsevol error inesperat
    console.error('Error inesperado:', error);
    errorMessage.value = `Error inesperado: ${error.message}`;
  } finally {
    isLoading.value = false; // Asegura que el estado de carga se restablezca
  }

  router.push({ // Redirigeix a la ruta '/ManageContent'
    path: '/ManageContent',
    query: { // Passa el 'userId' com a paràmetre de la query
      userId: userId,
    }
  });
};
</script>

<style scoped>
ion-item {
  --padding-start: 16px; /* Defineix el padding a l'inici dels items de la llista */
  --inner-padding-end: 16px; /* Defineix el padding al final dels items de la llista */
}

ion-label {
  color: var(--ion-color-gray-700); /* Estableix el color de les etiquetes a un gris */
}

ion-input,
ion-textarea {
  --padding-top: 8px; /* Defineix el padding superior dels camps d'entrada i àrees de text */
  --padding-bottom: 8px; /* Defineix el padding inferior dels camps d'entrada i àrees de text */
  color: var(--ion-color-dark); /* Estableix el color del text dels camps d'entrada i àrees de text a negre */
}

/* Estil per fer la lletra de la label més gran */
.label-grande {
  font-size: 1.2em; /* Augmenta la mida de la font de les etiquetes amb aquesta classe */
  font-weight: bold; /* Posa en negreta les etiquetes amb aquesta classe */
}
</style>
