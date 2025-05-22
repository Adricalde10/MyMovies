<script setup lang="ts">
import { ref, onMounted } from 'vue'; // Importem funcions de Vue per reactivitat i cicle de vida
import { useRouter, useRoute } from 'vue-router'; // Per obtenir la ruta actual i navegar entre pàgines
import supabase from '@/supabaseClient'; // Importem el client de Supabase

const route = useRoute(); // Accedim a la ruta actual
const router = useRouter(); // Obtenim l'objecte per navegar entre rutes

const userId = route.query.userId as string; // Obtenim el userId de la query string

// Variables reactives per desar la informació de l'usuari
const userName = ref('');
const userEmail = ref('');
const newPassword = ref('');
const profilePictureUrl = ref<string | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const fileInput = ref<HTMLInputElement | null>(null); // Referència al camp input de fitxer

// Funció per carregar les dades de l'usuari des de Supabase
const loadUserData = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    // Consultem la taula 'usuarios' per l'usuari amb l'user_id concret
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (data) {
      // Assignem les dades obtingudes a les variables reactives
      userName.value = data.name || '';
      userEmail.value = data.email || '';
      profilePictureUrl.value = data.photo || null;
    } else {
      errorMessage.value = 'No se encontró información del usuario.';
    }
  } catch (error: any) {
    errorMessage.value = 'Error al cargar datos del usuario: ' + error.message;
  } finally {
    loading.value = false;
  }
};

// Carreguem les dades quan es munta el component
onMounted(loadUserData);

// Funció per guardar els canvis realitzats a l'usuari
const saveChanges = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    // Actualitzem l'email també a l'autenticació de Supabase
    const { error: authError } = await supabase.auth.updateUser({
      email: userEmail.value,
    });
    if (authError) throw authError;

    // Preparem l'objecte amb les dades a actualitzar
    const updates = {
      name: userName.value,
      email: userEmail.value,
      photo: profilePictureUrl.value,
    };

    // Actualitzem la taula 'usuarios'
    const { error: dbError } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    alert('Cambios guardados!');
    newPassword.value = '';
  } catch (error: any) {
    errorMessage.value = 'Error al guardar: ' + error.message;
    alert(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

// Funció per simular el clic sobre el camp de fitxer
function triggerFileInput() {
  fileInput.value?.click();
}

// Funció que es dispara quan l'usuari selecciona un fitxer
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const fileExt = file.name.split('.').pop(); // Extensió del fitxer
    const filePath = `butaca1/${userId}-${Date.now()}.${fileExt}`; // Ruta al bucket

    // 1. Pugem el fitxer al bucket de Supabase
    const { error: uploadError } = await supabase.storage
      .from('butaca1')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. Obtenim la URL pública del fitxer
    const { data } = supabase.storage
      .from('butaca1')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;
    if (!publicUrl) throw new Error('No se pudo obtener la URL pública');

    // 3. Actualitzem la URL de la foto a la base de dades
    const { error: dbError } = await supabase
      .from('usuarios')
      .update({ photo: publicUrl })
      .eq('user_id', userId);

    if (dbError) throw dbError;

    // 4. Assignem la nova URL a la variable reactiva
    profilePictureUrl.value = publicUrl;
    alert('Foto de perfil actualizada!');
  } catch (error: any) {
    errorMessage.value = 'Error al actualizar la foto: ' + error.message;
    alert(errorMessage.value);
  } finally {
    loading.value = false;
    if (fileInput.value) fileInput.value.value = ''; // Netegem l'input
  }
};

// Funció placeholder per eliminar el compte
function deleteAccount() {
  alert("Cuenta eliminada.");
}

// Funció per tancar sessió
function logout() {
  alert("Sesión cerrada.");
  router.push('/Principal');
}

// Funció per tancar la pantalla d'informació de l'usuari
function closeInfoUser() {
  router.push(`/Principal?userId=${userId}`);
}
</script>


<template>
  <div class="container py-5 position-relative" style="max-width: 480px;">
    <!-- Botón cerrar -->
    <button
      type="button"
      class="btn-close position-absolute top-0 end-0 m-3"
      aria-label="Close"
      @click="closeInfoUser"
    ></button>

    <div class="card shadow-sm p-4">
      <div class="text-center mb-4">
        <template v-if="profilePictureUrl">
          <img
            :src="profilePictureUrl"
            alt="Foto perfil"
            class="rounded-circle img-thumbnail"
            style="width: 120px; height: 120px; object-fit: cover;"
          />
        </template>
        <template v-else>
          <img
            src="https://via.placeholder.com/120?text=Usuari"
            alt="Usuari"
            class="rounded-circle img-thumbnail"
            style="width: 120px; height: 120px; object-fit: cover;"
          />
        </template>

        <input
          type="file"
          accept="image/*"
          ref="fileInput"
          @change="handleFileChange"
          style="display: none;"
        />

        <button
          class="btn btn-outline-primary d-block mx-auto mt-3"
          @click="triggerFileInput"
          type="button"
        >
          Canviar foto
        </button>
      </div>

      <div v-if="loading" class="d-flex justify-content-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregant...</span>
        </div>
      </div>

      <div v-else>
        <div class="mb-3">
          <label for="username" class="form-label">Nom d'usuari</label>
          <input
            id="username"
            type="text"
            class="form-control"
            v-model="userName"
            placeholder="Nombre de usuario"
          />
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Correu electronic</label>
          <input
            id="email"
            type="email"
            class="form-control"
            v-model="userEmail"
            placeholder="Correo electrónico"
          />
        </div>

        <a
          :href="`/infoFavourites?userId=${userId}`"
          class="btn btn-primary w-100 mb-3"
          role="button"
        >
          Veure continguts favorits
        </a>

        <button
           class="btn btn-primary w-100 mb-3"
           @click="saveChanges"
          :disabled="loading"
          type="button"
          >
          Guardar canvis
        </button>

        <button
          class="btn btn-danger w-100 mb-3"
          @click="deleteAccount"
          type="button"
        >
          Eliminar compte
        </button>

        <button
          class="btn btn-secondary w-100"
          @click="logout"
          type="button"
        >
          Tancar sessió
        </button>

        <p v-if="errorMessage" class="text-danger mt-3 text-center">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Bootstrap ya gestiona la mayoría de estilos */
</style>
